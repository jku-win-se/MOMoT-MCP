import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import JSZip from 'jszip';

// Export new Smart Agent utilities
export { detectArtifacts } from './lib/detectArtifacts.js';
export { generateEcore } from './lib/generateEcore.js';
export { generateXmi } from './lib/generateXmi.js';
export { generateHenshin } from './lib/generateHenshin.js';
export { generateMomot } from './lib/generateMomot.js';
export { validateEcore } from './lib/validateEcore.js';
export { validateXmi } from './lib/validateXmi.js';
export { validateJavaHelper } from './lib/validateJavaHelper.js';
export { generateJavaHelper } from './lib/generateJavaHelper.js';
export { ArtifactStateMachine, checkForVagueInput } from './lib/hitlHandler.js';

const DEFAULT_REST_BASE_URL = 'http://localhost:8080';
const DEFAULT_RETRY_COUNT = 2;
const DEFAULT_RETRY_DELAY_MS = 500;
const DEFAULT_REQUEST_TIMEOUT_MS = 120000;
const DEFAULT_LOG_TAIL_LINES = 40;

export async function executeMomotJob(input) {
  const restBaseUrl = normalizeBaseUrl(input.restBaseUrl || process.env.MOMOT_REST_BASE_URL || DEFAULT_REST_BASE_URL);
  const scriptPath = normalizeZipPath(input.scriptPath);
  const requestTimeoutMs = ensureInt(input.requestTimeoutMs, DEFAULT_REQUEST_TIMEOUT_MS);
  const retries = ensureInt(input.retries, DEFAULT_RETRY_COUNT);
  const retryDelayMs = ensureInt(input.retryDelayMs, DEFAULT_RETRY_DELAY_MS);
  const logTailLines = ensureInt(input.logTailLines, DEFAULT_LOG_TAIL_LINES);

  const filesBase64 = { ...(input.filesBase64 || {}) };
  if (!filesBase64[scriptPath]) {
    throw new Error(`Missing required script file in filesBase64: ${scriptPath}`);
  }

  const zipPayload = await buildJobZip(filesBase64);
  const diagnostics = {};
  const health = await checkRestHealth({ restBaseUrl, requestTimeoutMs, retries, retryDelayMs });
  diagnostics.health = health;

  if (!health.ok) {
    return {
      success: false,
      exitCode: -1,
      scriptPath,
      generatedFiles: Object.keys(filesBase64).sort(),
      warnings: [],
      summary: `REST endpoint unavailable at ${restBaseUrl}`,
      logTail: '',
      outputs: [],
      diagnostics: {
        ...diagnostics,
        rootCauseHint: 'REST unavailability. Start container and verify /health endpoint.'
      }
    };
  }

  const runResult = await postRunZip({ restBaseUrl, scriptPath, zipPayload, requestTimeoutMs, retries, retryDelayMs });
  const parsed = await parseResponseZip(runResult.responseZip, logTailLines);

  const rootCauseHint = deriveRootCauseHint(parsed);

  return {
    success: parsed.exitCode === 0,
    exitCode: parsed.exitCode,
    scriptPath,
    generatedFiles: Object.keys(filesBase64).sort(),
    warnings: parsed.warnings,
    summary: parsed.exitCode === 0
      ? `Execution succeeded with ${parsed.outputs.length} output artifact(s).`
      : `Execution failed with exit code ${parsed.exitCode}.`,
    logTail: parsed.logTail,
    outputs: parsed.outputs,
    responseZip: runResult.responseZip,
    diagnostics: {
      ...diagnostics,
      requestUrl: runResult.requestUrl,
      statusCode: runResult.statusCode,
      request: parsed.request,
      rootCauseHint
    }
  };
}

export async function buildJobZip(filesBase64) {
  const zip = new JSZip();
  for (const entryPath of Object.keys(filesBase64).sort()) {
    const normalized = normalizeZipPath(entryPath);
    const data = Buffer.from(filesBase64[entryPath], 'base64');
    zip.file(normalized, data, { binary: true });
  }
  return zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  });
}

export async function parseResponseZip(responseBuffer, logTailLines = DEFAULT_LOG_TAIL_LINES) {
  const zip = await JSZip.loadAsync(responseBuffer);
  const entries = Object.keys(zip.files).filter((name) => !zip.files[name].dir).sort();
  const getText = async (name) => {
    if (!zip.files[name]) {
      return null;
    }
    return zip.files[name].async('text');
  };

  const exitCodeRaw = await getText('runner/exit_code.txt');
  const requestRaw = await getText('runner/request.json');
  const runnerLog = await getText('runner/runner.log');
  const compileLog = await getText('runner/compile.log');

  const parsedRequest = safeParseJson(requestRaw);
  const exitCode = Number.isFinite(Number(exitCodeRaw)) ? Number(exitCodeRaw) : -1;
  const outputs = entries.filter((entry) => entry.startsWith('out/'));
  const warnings = [];
  if (!entries.includes('runner/exit_code.txt')) {
    warnings.push('Response zip is missing runner/exit_code.txt.');
  }
  if (!entries.includes('runner/runner.log')) {
    warnings.push('Response zip is missing runner/runner.log.');
  }

  const mergedLog = [compileLog || '', runnerLog || ''].filter(Boolean).join('\n');
  return {
    exitCode,
    request: parsedRequest,
    outputs,
    warnings,
    logTail: tailLines(mergedLog, logTailLines),
    allEntries: entries
  };
}

export function normalizeZipPath(entryPath) {
  if (typeof entryPath !== 'string' || entryPath.trim().length === 0) {
    throw new Error('Zip entry path must be a non-empty string.');
  }
  let normalized = entryPath.replace(/\\/g, '/').replace(/^\/+/, '');
  normalized = path.posix.normalize(normalized);
  if (normalized === '.' || normalized.startsWith('../') || normalized.includes('/../')) {
    throw new Error(`Path traversal is not allowed: ${entryPath}`);
  }
  if (normalized.includes(':')) {
    throw new Error(`Drive letters are not allowed in zip entry paths: ${entryPath}`);
  }
  return normalized;
}

async function checkRestHealth({ restBaseUrl, requestTimeoutMs, retries, retryDelayMs }) {
  const healthUrl = `${restBaseUrl}/health`;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetchWithTimeout(healthUrl, { method: 'GET' }, requestTimeoutMs);
      if (response.ok) {
        return { ok: true, statusCode: response.status };
      }
      if (attempt === retries) {
        return { ok: false, statusCode: response.status, body: await response.text() };
      }
    } catch (error) {
      if (attempt === retries) {
        return { ok: false, error: String(error) };
      }
    }
    await delay(retryDelayMs);
  }
  return { ok: false, error: 'Unknown health check failure.' };
}

async function postRunZip({ restBaseUrl, scriptPath, zipPayload, requestTimeoutMs, retries, retryDelayMs }) {
  const requestUrl = `${restBaseUrl}/run?script=${encodeURIComponent(scriptPath)}`;
  let lastError = null;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetchWithTimeout(
        requestUrl,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/zip' },
          body: zipPayload
        },
        requestTimeoutMs
      );
      if (!response.ok) {
        const bodyText = await response.text();
        lastError = new Error(`REST /run failed with status ${response.status}: ${bodyText}`);
        if (attempt === retries) {
          throw lastError;
        }
      } else {
        const arrayBuffer = await response.arrayBuffer();
        return {
          requestUrl,
          statusCode: response.status,
          responseZip: Buffer.from(arrayBuffer)
        };
      }
    } catch (error) {
      lastError = error;
      if (attempt === retries) {
        throw error;
      }
    }
    await delay(retryDelayMs);
  }
  throw lastError || new Error('REST /run request failed.');
}

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
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

function normalizeBaseUrl(baseUrl) {
  return String(baseUrl).replace(/\/+$/, '');
}

function ensureInt(value, fallback) {
  if (value == null) {
    return fallback;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }
  return Math.floor(parsed);
}

function tailLines(text, lineCount) {
  const lines = String(text || '').split(/\r?\n/);
  return lines.slice(Math.max(0, lines.length - lineCount)).join('\n').trim();
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

/**
 * Validate a Henshin file using the local CLI validator (no Docker required).
 *
 * Modes:
 *   structure — XMI parse + Henshin meta-conformance check; no metamodel needed.
 *   semantic  — type reference resolution against the provided Ecore metamodel.
 *   apply     — execute a named rule against a model instance.
 *
 * All paths must be absolute or relative to the current working directory of the process.
 */
export async function validateMomot({ momotPath, mode = 'structure', projectRoot }) {
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const validatorScript = path.join(repoRoot, 'tools', 'momot-validator', 'validate.mjs');

  if (!fs.existsSync(validatorScript)) {
    return { success: false, error: `Validator not found at ${validatorScript}. Run 'npm run setup' in tools/momot-validator/.` };
  }

  const args = [];
  if (mode === 'structure') {
    args.push('--validate-structure', momotPath);
  } else if (mode === 'semantic') {
    args.push('--validate-semantic', momotPath);
    if (projectRoot) args.push('--project-root', projectRoot);
  } else if (mode === 'compile') {
    args.push('--compile', momotPath);
    if (projectRoot) args.push('--project-root', projectRoot);
  } else {
    return { success: false, error: `Unknown mode "${mode}". Use "structure", "semantic", or "compile".` };
  }

  return new Promise((resolve) => {
    const proc = spawn('node', [validatorScript, ...args]);
    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', (d) => { stdout += d; });
    proc.stderr.on('data', (d) => { stderr += d; });
    proc.on('close', (exitCode) => {
      let result = null;
      try { result = JSON.parse(stdout.trim()); } catch { result = { raw: stdout.trim() }; }
      resolve({
        success: exitCode === 0,
        exitCode,
        result,
        ...(stderr.trim() ? { stderr: stderr.trim() } : {})
      });
    });
    proc.on('error', (err) => resolve({ success: false, error: String(err) }));
  });
}

export async function validateHenshin({ henshinPath, mode = 'structure', metamodelPath, modelPath, ruleName, parameters = {} }) {
  const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const validatorScript = path.join(repoRoot, 'tools', 'henshin-validator', 'validate.mjs');

  if (!fs.existsSync(validatorScript)) {
    return { success: false, error: `Validator not found at ${validatorScript}. Run 'npm install && npm run setup' in tools/henshin-validator/.` };
  }

  const args = [];
  if (mode === 'structure') {
    args.push('--validate-structure', henshinPath);
  } else if (mode === 'semantic') {
    if (!metamodelPath) return { success: false, error: 'metamodelPath is required for mode=semantic.' };
    args.push('--validate-semantic', henshinPath, '--metamodel', metamodelPath);
  } else if (mode === 'apply') {
    if (!metamodelPath) return { success: false, error: 'metamodelPath is required for mode=apply.' };
    if (!modelPath)     return { success: false, error: 'modelPath is required for mode=apply.' };
    if (!ruleName)      return { success: false, error: 'ruleName is required for mode=apply.' };
    args.push('--apply', henshinPath, '--metamodel', metamodelPath, '--model', modelPath, '--rule', ruleName);
    for (const [k, v] of Object.entries(parameters)) {
      args.push(`-P${k}=${v}`);
    }
  } else {
    return { success: false, error: `Unknown mode "${mode}". Use "structure", "semantic", or "apply".` };
  }

  return new Promise((resolve) => {
    const proc = spawn('node', [validatorScript, ...args]);
    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', (d) => { stdout += d; });
    proc.stderr.on('data', (d) => { stderr += d; });
    proc.on('close', (exitCode) => {
      let result = null;
      try { result = JSON.parse(stdout.trim()); } catch { result = { raw: stdout.trim() }; }
      resolve({
        success: exitCode === 0,
        exitCode,
        result,
        ...(stderr.trim() ? { stderr: stderr.trim() } : {})
      });
    });
    proc.on('error', (err) => resolve({ success: false, error: String(err) }));
  });
}

export async function buildKnownGoodStackFixture() {
  throw new Error("No pre-existing known-good stack fixture is available in this clean workspace.");
}
