/**
 * Isomorphic trade-off plot component for MOMoT Pareto fronts.
 */
export class MomotTradeoffPlot {
  constructor(points, options = {}) {
    this.points = points || [];
    this.options = {
      width: 600,
      height: 400,
      padding: 50,
      xIndex: 0,
      yIndex: 1,
      onSelect: null,
      selectedPointIndex: -1,
      xLabel: 'Objective X',
      yLabel: 'Objective Y',
      ...options
    };
    this.selectedIndex = this.options.selectedPointIndex;
    this._computeBounds();
  }

  _computeBounds() {
    const { xIndex, yIndex } = this.options;
    const xValues = this.points.map(p => p.objectives[xIndex] ?? 0);
    const yValues = this.points.map(p => p.objectives[yIndex] ?? 0);

    this.xMin = xValues.length ? Math.min(...xValues) : 0;
    this.xMax = xValues.length ? Math.max(...xValues) : 1;
    this.yMin = yValues.length ? Math.min(...yValues) : 0;
    this.yMax = yValues.length ? Math.max(...yValues) : 1;

    // Avoid division by zero if all values are equal
    if (this.xMax === this.xMin) {
      this.xMax = this.xMin + 1;
    }
    if (this.yMax === this.yMin) {
      this.yMax = this.yMin + 1;
    }
  }

  /**
   * Translates point objective coordinates into SVG pixel coordinates.
   * 
   * @param {object} point - A Pareto point { objectives: number[] }
   * @returns {{ cx: number, cy: number }} Pixel coordinates
   */
  getCoordinates(point) {
    const { width, height, padding, xIndex, yIndex } = this.options;
    const xVal = point.objectives[xIndex] ?? 0;
    const yVal = point.objectives[yIndex] ?? 0;

    const plotWidth = width - 2 * padding;
    const plotHeight = height - 2 * padding;

    const cx = padding + ((xVal - this.xMin) / (this.xMax - this.xMin)) * plotWidth;
    const cy = height - padding - ((yVal - this.yMin) / (this.yMax - this.yMin)) * plotHeight;

    return { cx, cy };
  }

  /**
   * Generates interactive SVG markup as string (isomorphic).
   * 
   * @returns {string} SVG markup
   */
  renderToString() {
    const { width, height, padding, xLabel, yLabel } = this.options;
    const pointsMarkup = this.points.map((point, index) => {
      const { cx, cy } = this.getCoordinates(point);
      const isSelected = index === this.selectedIndex;
      const fill = isSelected ? '#ff4d4f' : '#1890ff';
      const stroke = isSelected ? '#333' : '#fff';
      const r = isSelected ? 8 : 6;
      return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="2" class="plot-point ${isSelected ? 'selected' : ''}" data-index="${index}" style="cursor: pointer;" />`;
    }).join('\n');

    const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="font-family: sans-serif; background: #fff;">
  <!-- Grid & Axes -->
  <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" stroke="#ccc" stroke-width="1.5" />
  <line x1="${padding}" y1="${padding}" x2="${padding}" y2="${height - padding}" stroke="#ccc" stroke-width="1.5" />
  
  <!-- Axis labels -->
  <text x="${width / 2}" y="${height - 10}" text-anchor="middle" font-size="12" fill="#555">${xLabel}</text>
  <text x="15" y="${height / 2}" transform="rotate(-90 15 ${height / 2})" text-anchor="middle" font-size="12" fill="#555">${yLabel}</text>
  
  <!-- Min/max labels -->
  <text x="${padding}" y="${height - padding + 15}" font-size="10" fill="#888" text-anchor="middle">${this.xMin.toFixed(2)}</text>
  <text x="${width - padding}" y="${height - padding + 15}" font-size="10" fill="#888" text-anchor="middle">${this.xMax.toFixed(2)}</text>
  <text x="${padding - 5}" y="${height - padding}" font-size="10" fill="#888" text-anchor="end" dominant-baseline="middle">${this.yMin.toFixed(2)}</text>
  <text x="${padding - 5}" y="${padding}" font-size="10" fill="#888" text-anchor="end" dominant-baseline="middle">${this.yMax.toFixed(2)}</text>

  <!-- Points -->
  ${pointsMarkup}
</svg>
    `.trim();
    return svg;
  }

  /**
   * Generates a native DOM SVG element if document is present.
   * 
   * @returns {SVGElement | null} SVG Element, or null if document is undefined
   */
  renderToDom() {
    if (typeof globalThis.document === 'undefined') {
      return null;
    }
    const parser = new globalThis.DOMParser();
    const svgString = this.renderToString();
    const doc = parser.parseFromString(svgString, 'image/svg+xml');
    const svgElement = doc.documentElement;

    // Re-bind click event handlers to circles
    const circles = svgElement.querySelectorAll('.plot-point');
    circles.forEach(circle => {
      circle.addEventListener('click', () => {
        const index = parseInt(circle.getAttribute('data-index') || '0', 10);
        this.selectPoint(index, svgElement);
      });
    });

    return svgElement;
  }

  /**
   * Updates selection index, updates DOM element attributes if provided, and emits callback.
   * 
   * @param {number} index - Index of point to select
   * @param {SVGElement} [svgElement] - Optional live SVG element to visually update
   */
  selectPoint(index, svgElement = null) {
    if (index < 0 || index >= this.points.length) {
      return;
    }
    this.selectedIndex = index;
    const selectedPoint = this.points[index];

    if (svgElement) {
      const circles = svgElement.querySelectorAll('.plot-point');
      circles.forEach(circle => {
        const idx = parseInt(circle.getAttribute('data-index') || '0', 10);
        const isSel = idx === index;
        circle.setAttribute('r', isSel ? '8' : '6');
        circle.setAttribute('fill', isSel ? '#ff4d4f' : '#1890ff');
        circle.setAttribute('stroke', isSel ? '#333' : '#fff');
        if (isSel) {
          circle.classList.add('selected');
        } else {
          circle.classList.remove('selected');
        }
      });
    }

    if (this.options.onSelect) {
      this.options.onSelect(selectedPoint, index);
    }
  }
}

/**
 * Best-effort resolution of the solution model corresponding to a selected point index.
 * It filters the outputs of a MomotJobResult for XMI files, sorts them, and retrieves
 * the path matching the selected index.
 * 
 * @param {number} index - The index of the selected Pareto front point
 * @param {object} jobResult - The MomotJobResult
 * @returns {string | null} Resolves XMI path if found, or null
 */
export function resolveRelatedSolutionModel(index, jobResult) {
  if (!jobResult || !jobResult.outputs) {
    return null;
  }

  // Filter all XMI output paths
  const xmiPaths = Object.keys(jobResult.outputs).filter(path => 
    path.toLowerCase().endsWith('.xmi') && path.startsWith('out/')
  );

  if (xmiPaths.length === 0) {
    return null;
  }

  // Smart natural sorting of paths (so solution_10.xmi comes after solution_2.xmi)
  const sortedXmiPaths = xmiPaths.sort((a, b) => {
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
  });

  // Return best match (by index, or fallback to the first XMI file)
  if (index >= 0 && index < sortedXmiPaths.length) {
    return sortedXmiPaths[index];
  }
  return sortedXmiPaths[0];
}

/**
 * Higher-level workflow helper: connects a point selection to EMF.cloud Model Hub loading.
 * 
 * @param {number} index - Selected point index
 * @param {object} jobResult - MomotJobResult containing execution outputs
 * @param {object} bridge - The bridge instance implementing loadOptimizedModel
 * @param {object} [options] - Options
 * @param {string} [options.targetUriPrefix] - Target URI prefix in the hub (default: "hub://models/")
 * @returns {Promise<{ success: boolean, path?: string, targetUri?: string, message?: string }>}
 */
export async function wireSelectionToHub(index, jobResult, bridge, options = {}) {
  const targetUriPrefix = options.targetUriPrefix || 'hub://models/';

  const path = resolveRelatedSolutionModel(index, jobResult);
  if (!path) {
    return {
      success: false,
      message: 'No associated solution XMI model output found in job results.'
    };
  }

  const content = jobResult.outputs[path];
  const filename = path.substring(path.lastIndexOf('/') + 1);
  const targetUri = `${targetUriPrefix}${filename}`;

  const res = await bridge.loadOptimizedModel(targetUri, content);
  return {
    success: res.success,
    path,
    targetUri,
    message: res.message
  };
}
