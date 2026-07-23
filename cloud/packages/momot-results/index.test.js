import test from 'node:test';
import assert from 'node:assert/strict';
import { parseParetoFront, listOutputArtifacts, getOutputContent } from './index.js';

test('parseParetoFront parses overall_objectives.pf correctly', () => {
  const samplePf = `
# This is a comment
0.0 1.0 2.5
0.1 0.9 2.4
  `;

  const points = parseParetoFront(samplePf);
  assert.equal(points.length, 2);
  assert.deepEqual(points[0].objectives, [0.0, 1.0, 2.5]);
  assert.deepEqual(points[1].objectives, [0.1, 0.9, 2.4]);

  // Test passing Uint8Array
  const encoded = new TextEncoder().encode('0.5 0.5');
  const pointsBinary = parseParetoFront(encoded);
  assert.equal(pointsBinary.length, 1);
  assert.deepEqual(pointsBinary[0].objectives, [0.5, 0.5]);
});

test('listOutputArtifacts and getOutputContent works with mock MomotJobResult', () => {
  const encoder = new TextEncoder();
  const mockResult = {
    exitCode: '0',
    logTail: 'Successful',
    outputs: {
      'out/objectives/overall_objectives.pf': encoder.encode('0.0 1.0\n0.5 0.5'),
      'out/models/solution_0.xmi': encoder.encode('<model></model>')
    }
  };

  const artifacts = listOutputArtifacts(mockResult);
  assert.deepEqual(artifacts, [
    'out/objectives/overall_objectives.pf',
    'out/models/solution_0.xmi'
  ]);

  const xmiText = getOutputContent(mockResult, 'out/models/solution_0.xmi');
  assert.equal(xmiText, '<model></model>');

  const nonExistent = getOutputContent(mockResult, 'out/non-existent.txt');
  assert.equal(nonExistent, null);

  const xmiBinary = getOutputContent(mockResult, 'out/models/solution_0.xmi', false);
  assert.ok(xmiBinary instanceof Uint8Array);
});
