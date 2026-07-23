import test from 'node:test';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import { DefaultMomotEngineClient, normalizeZipPath } from './index.js';

test('normalizeZipPath validates correctly', () => {
  assert.equal(normalizeZipPath('src/a.momot'), 'src/a.momot');
  assert.throws(() => normalizeZipPath('../evil.txt'));
  assert.throws(() => normalizeZipPath('C:/evil.txt'));
});

test('health() success and failure', async () => {
  const originalFetch = globalThis.fetch;
  let fetchedUrl = '';
  
  try {
    globalThis.fetch = async (url) => {
      fetchedUrl = url;
      return { ok: true };
    };

    const client = new DefaultMomotEngineClient({ restBaseUrl: 'http://my-endpoint' });
    const res = await client.health();
    assert.equal(res.ok, true);
    assert.equal(fetchedUrl, 'http://my-endpoint/health');

    // Simulate failure
    globalThis.fetch = async () => {
      throw new Error('Network error');
    };
    const resFail = await client.health();
    assert.equal(resFail.ok, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('runJob() constructs zip and parses response zip successfully', async () => {
  const originalFetch = globalThis.fetch;
  let postedUrl = '';
  let postedOptions = null;

  try {
    // Generate a valid mock response zip
    const responseZip = new JSZip();
    responseZip.file('runner/exit_code.txt', '0');
    responseZip.file('runner/request.json', JSON.stringify({ mutationBackend: 'stub' }));
    responseZip.file('runner/runner.log', 'Step 1\nStep 2\nFinished successfully.');
    responseZip.file('out/objectives/overall_objectives.pf', '0.0 1.0\n0.1 0.9');
    
    const responseZipBuffer = await responseZip.generateAsync({ type: 'nodebuffer' });

    globalThis.fetch = async (url, options) => {
      postedUrl = url;
      postedOptions = options;
      return {
        ok: true,
        arrayBuffer: async () => responseZipBuffer.buffer.slice(responseZipBuffer.byteOffset, responseZipBuffer.byteOffset + responseZipBuffer.byteLength)
      };
    };

    const client = new DefaultMomotEngineClient({ restBaseUrl: 'http://my-endpoint' });
    const result = await client.runJob({
      scriptPath: 'src/Search.momot',
      files: {
        'src/Search.momot': 'search = {}',
        'model/input.xmi': '<xmi/>'
      }
    });

    assert.equal(postedUrl, 'http://my-endpoint/run?script=src%2FSearch.momot');
    assert.equal(postedOptions.method, 'POST');
    assert.equal(postedOptions.headers['Content-Type'], 'application/zip');
    assert.ok(postedOptions.body instanceof Buffer);

    assert.equal(result.exitCode, '0');
    assert.equal(result.diagnostics.mutationBackend, 'stub');
    assert.equal(result.diagnostics.rootCauseHint, 'Execution succeeded.');
    assert.ok(result.outputs['out/objectives/overall_objectives.pf'] instanceof Uint8Array);
    
    const pfContent = Buffer.from(result.outputs['out/objectives/overall_objectives.pf']).toString('utf8');
    assert.ok(pfContent.includes('0.0 1.0'));
  } finally {
    globalThis.fetch = originalFetch;
  }
});
