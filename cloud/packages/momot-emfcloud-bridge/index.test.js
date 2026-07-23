import test from 'node:test';
import assert from 'node:assert/strict';
import { DefaultMomotEmfcloudBridge } from './index.js';

test('stub loadOptimizedModel and listHubModels', async () => {
  const bridge = new DefaultMomotEmfcloudBridge();
  const res = await bridge.loadOptimizedModel('hub://solution.xmi', '<xml></xml>');
  assert.equal(res.success, true);
  assert.ok(res.message.includes('solution.xmi'));

  const list = await bridge.listHubModels();
  assert.deepEqual(list, ['hub://models/input_baseline.xmi']);
});
