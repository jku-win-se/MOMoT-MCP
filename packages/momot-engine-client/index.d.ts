export interface MomotEngineClient {
  health(): Promise<{ ok: boolean }>;
  runJob(args: {
    scriptPath: string;
    files: Record<string, Uint8Array | string>; // path → content
    timeoutMs?: number;
  }): Promise<MomotJobResult>;
}

export interface MomotJobResult {
  exitCode: string;
  logTail: string;
  outputs: Record<string, Uint8Array>;
  diagnostics?: {
    mutationBackend?: string;
    rootCauseHint?: string;
  };
  responseZip?: Uint8Array;
}

export interface DefaultMomotEngineClientConfig {
  restBaseUrl?: string;
  retries?: number;
  retryDelayMs?: number;
}

export class DefaultMomotEngineClient implements MomotEngineClient {
  constructor(config?: DefaultMomotEngineClientConfig);
  health(): Promise<{ ok: boolean }>;
  runJob(args: {
    scriptPath: string;
    files: Record<string, Uint8Array | string>;
    timeoutMs?: number;
  }): Promise<MomotJobResult>;
}

export function normalizeZipPath(entryPath: string): string;
