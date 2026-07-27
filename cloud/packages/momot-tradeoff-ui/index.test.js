import test from 'node:test';
import assert from 'node:assert/strict';
import { 
  MomotTradeoffPlot, 
  resolveRelatedSolutionModel, 
  wireSelectionToHub 
} from './index.js';

test('MomotTradeoffPlot - bounds computation and default options', () => {
  const points = [
    { objectives: [10, 50] },
    { objectives: [20, 30] },
    { objectives: [30, 40] }
  ];

  const plot = new MomotTradeoffPlot(points);
  assert.equal(plot.xMin, 10);
  assert.equal(plot.xMax, 30);
  assert.equal(plot.yMin, 30);
  assert.equal(plot.yMax, 50);

  // Default dimensions
  assert.equal(plot.options.width, 600);
  assert.equal(plot.options.height, 400);
  assert.equal(plot.options.padding, 50);
});

test('MomotTradeoffPlot - division by zero bounds protection', () => {
  const points = [
    { objectives: [10, 50] }
  ];

  const plot = new MomotTradeoffPlot(points);
  assert.equal(plot.xMin, 10);
  assert.equal(plot.xMax, 11); // xMin + 1
  assert.equal(plot.yMin, 50);
  assert.equal(plot.yMax, 51); // yMin + 1
});

test('MomotTradeoffPlot - coordinate translation', () => {
  const points = [
    { objectives: [10, 100] },
    { objectives: [20, 200] }
  ];

  // padding=50, width=600, height=400
  // plot area: X in [50, 550], Y in [50, 350]
  const plot = new MomotTradeoffPlot(points, { width: 600, height: 400, padding: 50 });

  // For min point (10, 100) -> X mapped to left padding (50), Y mapped to bottom padding (350)
  const pMin = plot.getCoordinates(points[0]);
  assert.equal(pMin.cx, 50);
  assert.equal(pMin.cy, 350);

  // For max point (20, 200) -> X mapped to width-padding (550), Y mapped to top padding (50)
  const pMax = plot.getCoordinates(points[1]);
  assert.equal(pMax.cx, 550);
  assert.equal(pMax.cy, 50);
});

test('MomotTradeoffPlot - renderToString produces valid SVG string', () => {
  const points = [
    { objectives: [0.5, 1.5] },
    { objectives: [1.5, 2.5] }
  ];
  const plot = new MomotTradeoffPlot(points, {
    xLabel: 'Cost',
    yLabel: 'Quality',
    selectedPointIndex: 1
  });

  const svgStr = plot.renderToString();
  assert.ok(svgStr.startsWith('<svg'));
  assert.ok(svgStr.endsWith('</svg>'));
  assert.match(svgStr, /Cost/);
  assert.match(svgStr, /Quality/);
  assert.match(svgStr, /class="plot-point selected"/);
  assert.match(svgStr, /cx="50"/); // min point
  assert.match(svgStr, /cx="550"/); // max point
});

test('MomotTradeoffPlot - selectPoint triggers callback', () => {
  const points = [
    { objectives: [10, 20] },
    { objectives: [30, 40] }
  ];

  let selectedPoint = null;
  let selectedIdx = -1;

  const plot = new MomotTradeoffPlot(points, {
    onSelect: (point, idx) => {
      selectedPoint = point;
      selectedIdx = idx;
    }
  });

  plot.selectPoint(1);
  assert.equal(selectedIdx, 1);
  assert.deepEqual(selectedPoint, points[1]);
  assert.equal(plot.selectedIndex, 1);
});

test('MomotTradeoffPlot - renderToDom returns null when document is undefined', () => {
  const plot = new MomotTradeoffPlot([{ objectives: [1, 2] }]);
  const originalDocument = globalThis.document;
  delete globalThis.document;

  try {
    const el = plot.renderToDom();
    assert.equal(el, null);
  } finally {
    globalThis.document = originalDocument;
  }
});

test('MomotTradeoffPlot - renderToDom and visual update with mocked DOMParser', () => {
  const points = [
    { objectives: [1, 10] },
    { objectives: [2, 20] }
  ];

  let selectCalled = false;
  const plot = new MomotTradeoffPlot(points, {
    onSelect: () => { selectCalled = true; }
  });

  const mockCircles = [
    {
      listeners: {},
      attributes: { 'data-index': '0', 'r': '6', 'fill': '#1890ff', 'stroke': '#fff' },
      classList: {
        classes: [],
        add(c) { if (!this.classes.includes(c)) this.classes.push(c); },
        remove(c) { this.classes = this.classes.filter(cls => cls !== c); }
      },
      getAttribute(attr) { return this.attributes[attr]; },
      setAttribute(attr, val) { this.attributes[attr] = val; },
      addEventListener(event, callback) { this.listeners[event] = callback; }
    },
    {
      listeners: {},
      attributes: { 'data-index': '1', 'r': '6', 'fill': '#1890ff', 'stroke': '#fff' },
      classList: {
        classes: [],
        add(c) { if (!this.classes.includes(c)) this.classes.push(c); },
        remove(c) { this.classes = this.classes.filter(cls => cls !== c); }
      },
      getAttribute(attr) { return this.attributes[attr]; },
      setAttribute(attr, val) { this.attributes[attr] = val; },
      addEventListener(event, callback) { this.listeners[event] = callback; }
    }
  ];

  const mockSvgElement = {
    querySelectorAll(selector) {
      if (selector === '.plot-point') {
        return mockCircles;
      }
      return [];
    }
  };

  // Mock global DOM context
  globalThis.document = {};
  globalThis.DOMParser = class {
    parseFromString() {
      return {
        documentElement: mockSvgElement
      };
    }
  };

  try {
    const domEl = plot.renderToDom();
    assert.equal(domEl, mockSvgElement);

    // Verify listeners were added
    assert.ok(mockCircles[0].listeners['click']);
    assert.ok(mockCircles[1].listeners['click']);

    // Trigger visual selection click on second point
    mockCircles[1].listeners['click']();
    assert.equal(selectCalled, true);
    assert.equal(plot.selectedIndex, 1);

    // Verify visual update (attrs changed)
    assert.equal(mockCircles[1].attributes['r'], '8');
    assert.equal(mockCircles[1].attributes['fill'], '#ff4d4f');
    assert.equal(mockCircles[1].attributes['stroke'], '#333');
    assert.ok(mockCircles[1].classList.classes.includes('selected'));

    assert.equal(mockCircles[0].attributes['r'], '6');
    assert.equal(mockCircles[0].attributes['fill'], '#1890ff');
    assert.equal(mockCircles[0].attributes['stroke'], '#fff');
    assert.ok(!mockCircles[0].classList.classes.includes('selected'));

  } finally {
    delete globalThis.document;
    delete globalThis.DOMParser;
  }
});

test('resolveRelatedSolutionModel - maps indices correctly using natural sorting', () => {
  const encoder = new TextEncoder();
  const mockJobResult = {
    exitCode: '0',
    logTail: '',
    outputs: {
      'out/models/solution_2.xmi': encoder.encode('<m2 />'),
      'out/models/solution_10.xmi': encoder.encode('<m10 />'),
      'out/models/solution_1.xmi': encoder.encode('<m1 />'),
      'out/non-models/solution_0.xmi': encoder.encode('<m0_bad />'), // doesn't start with out/
      'out/models/not-xmi.txt': encoder.encode('not xmi') // doesn't end in .xmi
    }
  };

  // Natural sorting should produce:
  // 0: out/models/solution_1.xmi
  // 1: out/models/solution_2.xmi
  // 2: out/models/solution_10.xmi

  const r0 = resolveRelatedSolutionModel(0, mockJobResult);
  assert.equal(r0, 'out/models/solution_1.xmi');

  const r1 = resolveRelatedSolutionModel(1, mockJobResult);
  assert.equal(r1, 'out/models/solution_2.xmi');

  const r2 = resolveRelatedSolutionModel(2, mockJobResult);
  assert.equal(r2, 'out/models/solution_10.xmi');

  // Fallback to first if out of bounds
  const r99 = resolveRelatedSolutionModel(99, mockJobResult);
  assert.equal(r99, 'out/models/solution_1.xmi');

  // Edge cases
  assert.equal(resolveRelatedSolutionModel(0, null), null);
  assert.equal(resolveRelatedSolutionModel(0, { exitCode: '0', logTail: '' }), null);
});

test('wireSelectionToHub - selects point and loads model into hub via mock bridge', async () => {
  const encoder = new TextEncoder();
  const mockJobResult = {
    exitCode: '0',
    logTail: '',
    outputs: {
      'out/models/solution_0.xmi': encoder.encode('<model-content />')
    }
  };

  let loadedUri = null;
  let loadedContent = null;

  const mockBridge = {
    async loadOptimizedModel(uri, content) {
      loadedUri = uri;
      loadedContent = content;
      return { success: true, message: 'Loaded successfully' };
    }
  };

  const result = await wireSelectionToHub(0, mockJobResult, mockBridge, {
    targetUriPrefix: 'hub://custom/'
  });

  assert.equal(result.success, true);
  assert.equal(result.path, 'out/models/solution_0.xmi');
  assert.equal(result.targetUri, 'hub://custom/solution_0.xmi');
  assert.equal(result.message, 'Loaded successfully');

  assert.equal(loadedUri, 'hub://custom/solution_0.xmi');
  assert.deepEqual(loadedContent, encoder.encode('<model-content />'));
});

test('wireSelectionToHub - returns success=false if no solution model found', async () => {
  const mockJobResult = {
    exitCode: '0',
    logTail: '',
    outputs: {}
  };
  const mockBridge = {};

  const result = await wireSelectionToHub(0, mockJobResult, mockBridge);
  assert.equal(result.success, false);
  assert.match(result.message, /No associated solution XMI model output found/);
});
