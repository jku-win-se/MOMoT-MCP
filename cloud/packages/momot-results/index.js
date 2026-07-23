/**
 * Parses the contents of a Pareto front (.pf) file.
 * Each non-empty non-comment line contains space-separated floating point values representing the objective coordinates of a solution.
 * 
 * @param {string | Uint8Array} content - The raw content of the .pf file.
 * @returns {Array<{ objectives: number[] }>} An array of parsed Pareto points.
 */
export function parseParetoFront(content) {
  const text = typeof content === 'string' ? content : new TextDecoder().decode(content);
  const lines = text.split(/\r?\n/);
  const points = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    const parts = trimmed.split(/\s+/).map((p) => {
      const val = Number(p);
      return Number.isNaN(val) ? 0 : val;
    });
    if (parts.length > 0 && parts.some(p => !Number.isNaN(p))) {
      points.push({ objectives: parts });
    }
  }
  return points;
}

/**
 * Lists the paths of all output artifacts located within the 'out/' folder from a MomotJobResult.
 * 
 * @param {object} jobResult - The MomotJobResult containing execution outputs.
 * @returns {string[]} An array of artifact file paths.
 */
export function listOutputArtifacts(jobResult) {
  if (!jobResult || !jobResult.outputs) {
    return [];
  }
  return Object.keys(jobResult.outputs);
}

/**
 * Retrieves the content of an output artifact from the MomotJobResult.
 * 
 * @param {object} jobResult - The MomotJobResult containing execution outputs.
 * @param {string} path - The specific path of the output artifact (e.g. 'out/objectives/overall_objectives.pf').
 * @param {boolean} [asString=true] - Whether to decode the content to string.
 * @returns {string | Uint8Array | null} The artifact content, or null if not found.
 */
export function getOutputContent(jobResult, path, asString = true) {
  const data = jobResult?.outputs?.[path];
  if (!data) {
    return null;
  }
  return asString ? new TextDecoder().decode(data) : data;
}
