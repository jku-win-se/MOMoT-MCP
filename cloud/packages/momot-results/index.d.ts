export interface ParetoPoint {
  objectives: number[];
}

export interface MomotJobResultLike {
  exitCode: string;
  logTail: string;
  outputs: Record<string, Uint8Array>;
  diagnostics?: {
    mutationBackend?: string;
    rootCauseHint?: string;
  };
}

export function parseParetoFront(content: string | Uint8Array): ParetoPoint[];
export function listOutputArtifacts(jobResult: MomotJobResultLike): string[];
export function getOutputContent(jobResult: MomotJobResultLike, path: string, asString?: true): string | null;
export function getOutputContent(jobResult: MomotJobResultLike, path: string, asString: false): Uint8Array | null;
export function getOutputContent(jobResult: MomotJobResultLike, path: string, asString?: boolean): string | Uint8Array | null;
