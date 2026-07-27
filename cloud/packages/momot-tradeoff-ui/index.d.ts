export interface ParetoPoint {
  objectives: number[];
}

export interface MomotJobResult {
  exitCode: string;
  logTail: string;
  outputs: Record<string, Uint8Array | string>;
  diagnostics?: {
    mutationBackend?: string;
    rootCauseHint?: string;
  };
}

export interface MomotTradeoffPlotOptions {
  width?: number;
  height?: number;
  padding?: number;
  xIndex?: number;
  yIndex?: number;
  onSelect?: (point: ParetoPoint, index: number) => void;
  selectedPointIndex?: number;
  xLabel?: string;
  yLabel?: string;
}

export class MomotTradeoffPlot {
  points: ParetoPoint[];
  options: Required<MomotTradeoffPlotOptions>;
  selectedIndex: number;
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;

  constructor(points: ParetoPoint[], options?: MomotTradeoffPlotOptions);
  getCoordinates(point: ParetoPoint): { cx: number; cy: number };
  renderToString(): string;
  renderToDom(): SVGElement | null;
  selectPoint(index: number, svgElement?: SVGElement | null): void;
}

export function resolveRelatedSolutionModel(index: number, jobResult: MomotJobResult): string | null;

export interface WireSelectionOptions {
  targetUriPrefix?: string;
}

export interface WireSelectionResult {
  success: boolean;
  path?: string;
  targetUri?: string;
  message?: string;
}

export function wireSelectionToHub(
  index: number,
  jobResult: MomotJobResult,
  bridge: { loadOptimizedModel(targetUri: string, content: Uint8Array | string): Promise<{ success: boolean; message?: string }> },
  options?: WireSelectionOptions
): Promise<WireSelectionResult>;
