import JSZip from 'jszip';

const DEFAULT_REQUEST_TIMEOUT_MS = 120000;
const DEFAULT_LOG_TAIL_LINES = 40;
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export class DefaultMomotEngineClient {
  constructor(config = {}) {
    this.restBaseUrl = String(config.restBaseUrl || 'http://localhost:8080').replace(/\/+$/, '');
    this.retries = config.retries ?? 0;
    this.retryDelayMs = config.retryDelayMs ?? 500;
  }

  async health() {
    const healthUrl = `${this.restBaseUrl}/health`;
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000); // 5s timeout for health check
      const response = await fetch(healthUrl, { method: 'GET', signal: controller.signal });
      clearTimeout(timer);
      return { ok: response.ok };
    } catch {
      return { ok: false };
    }
  }

  async runJob(args) {
    const { scriptPath, files, timeoutMs = DEFAULT_REQUEST_TIMEOUT_MS } = args;
    const requestTimeoutMs = timeoutMs;
    const normalizedScriptPath = normalizeZipPath(scriptPath);

    // Build Zip payload
    const zip = new JSZip();
    for (const [entryPath, content] of Object.entries(files)) {
      const normalized = normalizeZipPath(entryPath);
      const data = typeof content === 'string'
        ? new TextEncoder().encode(content)
        : content;
      
      zip.file(normalized, data, { binary: true });
    }

    const zipPayload = await zip.generateAsync({
      type: 'uint8array',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    });

    const requestUrl = `${this.restBaseUrl}/run?script=${encodeURIComponent(normalizedScriptPath)}`;
    let response;
    let lastError = null;

    for (let attempt = 0; attempt <= this.retries; attempt += 1) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), requestTimeoutMs);
      try {
        response = await fetch(requestUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/zip' },
          body: zipPayload,
          signal: controller.signal
        });
        clearTimeout(timer);
        if (!response.ok) {
          const bodyText = await response.text();
          lastError = new Error(`REST /run failed with status ${response.status}: ${bodyText}`);
          if (attempt === this.retries) {
            throw lastError;
          }
        } else {
          break;
        }
      } catch (error) {
        clearTimeout(timer);
        lastError = error;
        if (attempt === this.retries) {
          throw error;
        }
      }
      if (attempt < this.retries) {
        await delay(this.retryDelayMs);
      }
    }

    const arrayBuffer = await response.arrayBuffer();
    const responseZip = new Uint8Array(arrayBuffer);

    // Parse Response Zip
    const responseZipObj = await JSZip.loadAsync(responseZip);
    const entries = Object.keys(responseZipObj.files).filter((name) => !responseZipObj.files[name].dir).sort();

    const getText = async (name) => {
      if (!responseZipObj.files[name]) {
        return null;
      }
      return responseZipObj.files[name].async('text');
    };

    const exitCodeRaw = await getText('runner/exit_code.txt');
    const requestRaw = await getText('runner/request.json');
    const runnerLog = await getText('runner/runner.log');
    const compileLog = await getText('runner/compile.log');

    const parsedRequest = safeParseJson(requestRaw);
    const exitCodeNum = Number.isFinite(Number(exitCodeRaw)) ? Number(exitCodeRaw) : -1;
    const exitCodeStr = exitCodeNum.toString();

    const outputs = {};
    for (const entry of entries) {
      if (entry.startsWith('out/')) {
        const data = await responseZipObj.files[entry].async('uint8array');
        outputs[entry] = data;
      }
    }

    const mergedLog = [compileLog || '', runnerLog || ''].filter(Boolean).join('\n');
    const logTail = tailLines(mergedLog, DEFAULT_LOG_TAIL_LINES);

    const backend = parsedRequest?.mutationBackend || 'henshin';
    const rootCauseHint = deriveRootCauseHint({ exitCode: exitCodeNum, logTail });

    return {
      exitCode: exitCodeStr,
      logTail,
      outputs,
      diagnostics: {
        mutationBackend: backend,
        rootCauseHint
      },
      responseZip // expose for backward-compatible/raw access
    };
  }
}

function normalizePath(p) {
  let normalized = p.replace(/\\/g, '/');
  normalized = normalized.replace(/\/+/g, '/');
  const segments = normalized.split('/');
  const result = [];
  for (const segment of segments) {
    if (segment === '.' || segment === '') {
      continue;
    }
    if (segment === '..') {
      if (result.length > 0 && result[result.length - 1] !== '..') {
        result.pop();
      } else {
        result.push('..');
      }
    } else {
      result.push(segment);
    }
  }
  let out = result.join('/');
  if (normalized.startsWith('/') && !out.startsWith('/')) {
    out = '/' + out;
  }
  return out || '.';
}

export function normalizeZipPath(entryPath) {
  if (typeof entryPath !== 'string' || entryPath.trim().length === 0) {
    throw new Error('Zip entry path must be a non-empty string.');
  }
  let normalized = entryPath.replace(/\\/g, '/').replace(/^\/+/, '');
  normalized = normalizePath(normalized);
  if (normalized === '.' || normalized.startsWith('../') || normalized.includes('/../')) {
    throw new Error(`Path traversal is not allowed: ${entryPath}`);
  }
  if (normalized.includes(':')) {
    throw new Error(`Drive letters are not allowed in zip entry paths: ${entryPath}`);
  }
  return normalized;
}

function safeParseJson(value) {
  if (!value) {
    return null;
  }
  try {
    return JSON.parse(value);
  } catch {
    return { raw: value };
  }
}

function tailLines(text, lineCount) {
  const lines = String(text || '').split(/\r?\n/);
  return lines.slice(Math.max(0, lines.length - lineCount)).join('\n').trim();
}

function deriveRootCauseHint(parsed) {
  const log = (parsed.logTail || '').toLowerCase();
  if (parsed.exitCode === 0) {
    return 'Execution succeeded.';
  }
  if (log.includes('script not found in uploaded archive')) {
    return 'Payload and script query mismatch. Ensure script path equals zip entry path.';
  }
  if (log.includes('compilation') || log.includes('error:')) {
    return 'Generated MOMoT/Java compile issue. Inspect compile.log and script syntax.';
  }
  if (log.includes('noclassdeffounderror') || log.includes('classnotfoundexception')) {
    return 'Runtime classpath gap. Verify Docker image dependencies.';
  }
  if (log.includes('epackage') || log.includes('nsuri') || log.includes('cannot create resource')) {
    return 'Metamodel or model URI mismatch. Verify Ecore nsURI and model references.';
  }
  return 'Algorithm/runtime semantic issue. Inspect runner.log for failing phase.';
}
