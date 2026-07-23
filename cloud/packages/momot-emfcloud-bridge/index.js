/**
 * Service to bridge MOMoT optimization results to EMF.cloud Model Hub and Model Server.
 */
export class DefaultMomotEmfcloudBridge {
  constructor(config = {}) {
    this.modelServerUrl = config.modelServerUrl || 'http://localhost:8081/modelserver';
    this.modelHubUrl = config.modelHubUrl || 'http://localhost:8081/modelhub';
  }

  /**
   * Loads an optimized model output (e.g. solution XMI) from MOMoT into the EMF.cloud Model Hub / Server.
   * Performs an HTTP PUT to stage the raw model content under the given URI.
   * 
   * @param {string} targetUri - The URI identifier for the model in the Model Hub (e.g. "hub://models/optimized_solution.xmi")
   * @param {Uint8Array | string} content - The XMI content of the optimized model
   * @returns {Promise<{ success: boolean, message?: string }>}
   */
  async loadOptimizedModel(targetUri, content) {
    try {
      const url = `${this.modelServerUrl}/api/v1/models?uri=${encodeURIComponent(targetUri)}`;
      const contentType = typeof content === 'string' ? 'application/xml' : 'application/octet-stream';

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': contentType,
        },
        body: content,
      });

      if (!response.ok) {
        return {
          success: false,
          message: `Failed to load model to Model Hub (status: ${response.status}): ${response.statusText}`
        };
      }

      return {
        success: true,
        message: `Model successfully loaded to Model Hub under ${targetUri}`
      };
    } catch (err) {
      return {
        success: false,
        message: `Network or unexpected error while staging model: ${err.message}`
      };
    }
  }

  /**
   * Queries active models currently registered on the Model Hub.
   * 
   * @returns {Promise<string[]>} List of registered model URIs
   */
  async listHubModels() {
    const url = `${this.modelHubUrl}/api/v1/models`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to list models from Model Hub: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();

    // Resilient parsing to support multiple common API variants:
    // 1. Array of strings: ["uri1", "uri2"]
    // 2. Object with list inside: { models: ["uri1"] } or { uris: ["uri1"] }
    // 3. Array of objects: [ { uri: "uri1" } ]
    // 4. Object with array of objects: { models: [ { uri: "uri1" } ] }
    let rawList = [];
    if (Array.isArray(data)) {
      rawList = data;
    } else if (data && typeof data === 'object') {
      if (Array.isArray(data.models)) {
        rawList = data.models;
      } else if (Array.isArray(data.uris)) {
        rawList = data.uris;
      }
    }

    const uris = [];
    for (const item of rawList) {
      if (typeof item === 'string') {
        uris.push(item);
      } else if (item && typeof item === 'object') {
        if (typeof item.uri === 'string') {
          uris.push(item.uri);
        } else if (typeof item.id === 'string') {
          uris.push(item.id);
        }
      }
    }
    return uris;
  }
}

/**
 * Result pipeline helper: given a MomotJobResult, find all solution model artifacts
 * under 'out/' (e.g., ending with '.xmi') and push them to the Model Hub/Server.
 *
 * @param {object} jobResult - The MomotJobResult containing execution outputs.
 * @param {object} bridge - The bridge instance implementing MomotEmfcloudBridge to use for uploading.
 * @param {object} [options] - Optional configuration.
 * @param {string} [options.targetUriPrefix] - Target URI prefix (default "hub://models/")
 * @param {boolean} [options.keepRelativePath] - If true, keeps the relative path after 'out/' (e.g. out/models/sol.xmi -> hub://models/models/sol.xmi). If false, uses filename only (e.g. out/models/sol.xmi -> hub://models/sol.xmi). Default false.
 * @returns {Promise<Array<{ path: string, targetUri: string, result: { success: boolean, message?: string } }>>}
 */
export async function pushJobResultsToHub(jobResult, bridge, options = {}) {
  const targetUriPrefix = options.targetUriPrefix || 'hub://models/';
  const keepRelativePath = !!options.keepRelativePath;

  if (!jobResult || !jobResult.outputs) {
    return [];
  }

  const xmiPaths = Object.keys(jobResult.outputs).filter(p => 
    p.toLowerCase().endsWith('.xmi') && p.startsWith('out/')
  );

  const results = [];
  for (const path of xmiPaths) {
    const content = jobResult.outputs[path];
    let subPath = path;
    if (path.startsWith('out/')) {
      subPath = path.substring(4); // remove 'out/'
    }

    const uriSuffix = keepRelativePath ? subPath : subPath.substring(subPath.lastIndexOf('/') + 1);
    const targetUri = `${targetUriPrefix}${uriSuffix}`;

    const result = await bridge.loadOptimizedModel(targetUri, content);
    results.push({
      path,
      targetUri,
      result
    });
  }

  return results;
}
