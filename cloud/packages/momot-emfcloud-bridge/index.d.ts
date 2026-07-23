export interface MomotEmfcloudBridgeConfig {
  modelServerUrl?: string;
  modelHubUrl?: string;
}

export interface BridgeResult {
  success: boolean;
  message?: string;
}

export interface MomotEmfcloudBridge {
  loadOptimizedModel(targetUri: string, content: Uint8Array | string): Promise<BridgeResult>;
  listHubModels(): Promise<string[]>;
}

export class DefaultMomotEmfcloudBridge implements MomotEmfcloudBridge {
  constructor(config?: MomotEmfcloudBridgeConfig);
  loadOptimizedModel(targetUri: string, content: Uint8Array | string): Promise<BridgeResult>;
  listHubModels(): Promise<string[]>;
}

export interface PushJobResultsOptions {
  targetUriPrefix?: string;
  keepRelativePath?: boolean;
}

export interface PushJobResultItem {
  path: string;
  targetUri: string;
  result: BridgeResult;
}

export function pushJobResultsToHub(
  jobResult: { outputs?: Record<string, Uint8Array> },
  bridge: MomotEmfcloudBridge,
  options?: PushJobResultsOptions
): Promise<PushJobResultItem[]>;
