import test from 'node:test';
import assert from 'node:assert/strict';
import { DefaultMomotEmfcloudBridge, pushJobResultsToHub } from './index.js';

// Setup and teardown helper for global fetch mocking
const mockFetchHelper = {
  setup(mockFn) {
    this.originalFetch = globalThis.fetch;
    globalThis.fetch = mockFn;
  },
  teardown() {
    globalThis.fetch = this.originalFetch;
  }
};

test('loadOptimizedModel - success path', async () => {
  let calledUrl = null;
  let calledOptions = null;

  mockFetchHelper.setup(async (url, options) => {
    calledUrl = url;
    calledOptions = options;
    return {
      ok: true,
      status: 204,
      statusText: 'No Content'
    };
  });

  try {
    const bridge = new DefaultMomotEmfcloudBridge({
      modelServerUrl: 'http://test-server:8080/ms'
    });
    const res = await bridge.loadOptimizedModel('hub://solution.xmi', '<xml></xml>');

    assert.equal(res.success, true);
    assert.match(res.message, /Model successfully loaded to Model Hub/);
    assert.equal(calledUrl, 'http://test-server:8080/ms/api/v1/models?uri=hub%3A%2F%2Fsolution.xmi');
    assert.equal(calledOptions.method, 'PUT');
    assert.equal(calledOptions.headers['Content-Type'], 'application/xml');
    assert.equal(calledOptions.body, '<xml></xml>');
  } finally {
    mockFetchHelper.teardown();
  }
});

test('loadOptimizedModel - non-ok response failure', async () => {
  mockFetchHelper.setup(async () => {
    return {
      ok: false,
      status: 500,
      statusText: 'Internal Server Error'
    };
  });

  try {
    const bridge = new DefaultMomotEmfcloudBridge();
    const res = await bridge.loadOptimizedModel('hub://solution.xmi', '<xml></xml>');

    assert.equal(res.success, false);
    assert.match(res.message, /Failed to load model to Model Hub/);
    assert.match(res.message, /500/);
  } finally {
    mockFetchHelper.teardown();
  }
});

test('loadOptimizedModel - network exception path', async () => {
  mockFetchHelper.setup(async () => {
    throw new Error('DNS resolution failed');
  });

  try {
    const bridge = new DefaultMomotEmfcloudBridge();
    const res = await bridge.loadOptimizedModel('hub://solution.xmi', '<xml></xml>');

    assert.equal(res.success, false);
    assert.match(res.message, /DNS resolution failed/);
  } finally {
    mockFetchHelper.teardown();
  }
});

test('listHubModels - success paths with various JSON dialects', async () => {
  const testDialects = [
    {
      responsePayload: ['hub://models/model1.xmi', 'hub://models/model2.xmi'],
      expected: ['hub://models/model1.xmi', 'hub://models/model2.xmi']
    },
    {
      responsePayload: { models: ['hub://models/modelA.xmi'] },
      expected: ['hub://models/modelA.xmi']
    },
    {
      responsePayload: { uris: ['hub://models/modelB.xmi'] },
      expected: ['hub://models/modelB.xmi']
    },
    {
      responsePayload: [
        { uri: 'hub://models/object1.xmi' },
        { id: 'hub://models/object2.xmi' }
      ],
      expected: ['hub://models/object1.xmi', 'hub://models/object2.xmi']
    },
    {
      responsePayload: {
        models: [
          { uri: 'hub://models/nested1.xmi' }
        ]
      },
      expected: ['hub://models/nested1.xmi']
    }
  ];

  for (const dialect of testDialects) {
    mockFetchHelper.setup(async () => {
      return {
        ok: true,
        json: async () => dialect.responsePayload
      };
    });

    try {
      const bridge = new DefaultMomotEmfcloudBridge();
      const list = await bridge.listHubModels();
      assert.deepEqual(list, dialect.expected);
    } finally {
      mockFetchHelper.teardown();
    }
  }
});

test('listHubModels - network failure', async () => {
  mockFetchHelper.setup(async () => {
    return {
      ok: false,
      status: 404,
      statusText: 'Not Found'
    };
  });

  try {
    const bridge = new DefaultMomotEmfcloudBridge();
    await assert.rejects(async () => {
      await bridge.listHubModels();
    }, /Failed to list models from Model Hub: 404 Not Found/);
  } finally {
    mockFetchHelper.teardown();
  }
});

test('pushJobResultsToHub - push multiple XMI artifacts from MomotJobResult', async () => {
  const pushedList = [];

  const mockBridge = {
    async loadOptimizedModel(targetUri, content) {
      pushedList.push({ targetUri, content });
      return { success: true, message: `Loaded ${targetUri}` };
    },
    async listHubModels() {
      return [];
    }
  };

  const encoder = new TextEncoder();
  const mockJobResult = {
    exitCode: '0',
    logTail: '',
    outputs: {
      'out/models/solution_0.xmi': encoder.encode('<model-0 />'),
      'out/models/solution_1.XMI': encoder.encode('<model-1 />'),
      'out/objectives/overall_objectives.pf': encoder.encode('0.0 1.0'), // Should be ignored
      'not_out/models/ignored.xmi': encoder.encode('<ignored />') // Should be ignored (not under out/)
    }
  };

  // Test 1: Default behavior (filename only, prefix = hub://models/)
  const res1 = await pushJobResultsToHub(mockJobResult, mockBridge);
  assert.equal(res1.length, 2);
  assert.equal(res1[0].path, 'out/models/solution_0.xmi');
  assert.equal(res1[0].targetUri, 'hub://models/solution_0.xmi');
  assert.equal(res1[0].result.success, true);

  assert.equal(res1[1].path, 'out/models/solution_1.XMI');
  assert.equal(res1[1].targetUri, 'hub://models/solution_1.XMI');

  assert.equal(pushedList.length, 2);
  assert.equal(new TextDecoder().decode(pushedList[0].content), '<model-0 />');

  // Test 2: keepRelativePath and custom prefix
  pushedList.length = 0;
  const res2 = await pushJobResultsToHub(mockJobResult, mockBridge, {
    targetUriPrefix: 'http://my-hub/repo/',
    keepRelativePath: true
  });

  assert.equal(res2.length, 2);
  assert.equal(res2[0].targetUri, 'http://my-hub/repo/models/solution_0.xmi');
  assert.equal(res2[1].targetUri, 'http://my-hub/repo/models/solution_1.XMI');
});

test('pushJobResultsToHub - empty result or missing outputs safety', async () => {
  const mockBridge = {};
  const resNull = await pushJobResultsToHub(null, mockBridge);
  assert.deepEqual(resNull, []);

  const resEmpty = await pushJobResultsToHub({ exitCode: '0', logTail: '', outputs: {} }, mockBridge);
  assert.deepEqual(resEmpty, []);
});
