# MOMoT MCP Server Usage

This MCP server exposes tools for artifact generation and REST execution through the existing MOMoT runner endpoint.

## Release status (v2.0.0)

All 12 tools in the exposed tool surface form the fully validated and supported functional subset covered by automated tests.

### Tool surface overview

| Tool | Group | Tested |
|------|-------|--------|
| `detect_artifacts` | Validated | Unit |
| `generate_ecore` | Validated | Unit |
| `generate_xmi` | Validated | Unit |
| `generate_henshin` | Validated | Unit |
| `generate_momot` | Validated | Unit |
| `validate_ecore` | Validated | Unit |
| `validate_xmi` | Validated | Unit |
| `validate_henshin` | Validated | Unit |
| `validate_momot` | Validated | Unit |
| `validate_java_helper` | Validated | Unit |
| `generate_java_helper` | Validated | Unit |
| `execute_momot_job` | Validated | Unit + integration + stdio |

## Tools (validated functional subset)

### detect_artifacts
Scans workspace directory recursively and parses user natural-language prompt to determine what files already exist and which need to be generated/repaired, producing an ordered Generation Plan.

### generate_ecore
Generates a structurally and semantically valid `.ecore` metamodel from a natural-language description using a selected metamodel template pattern.

### generate_xmi
Generates a valid initial `.xmi` model instance matching the specified Ecore metamodel and initial worst-case "bad start" sizing requirements.

### generate_henshin
Generates a well-formed, syntactically and semantically valid `.henshin` transformation rule file from an Ecore metamodel and natural-language description.

### generate_momot
Generates a well-formed, declarative `.momot` search script that references the specified Ecore, model XMI, and Henshin rule modules, alongside objective hints.

### validate_ecore
Validates a `.ecore` metamodel using the Ecore CLI validator at structural and semantic validation tiers.

### validate_xmi
Validates a `.xmi` model instance file at structural, semantic, and programmatic EMF load tiers.

### generate_java_helper
Generates a custom Java helper class extending `AbstractEGraphFitness` for advanced fitness objectives using one of three canonical shapes (graph-metric, external-data, or cached).

### execute_momot_job
Input schema highlights:
- scriptPath (required)
- filesBase64 (required)
- restBaseUrl (optional, default http://localhost:8080)
- requestTimeoutMs, retries, retryDelayMs, logTailLines (optional)

Output envelope:
- success
- exitCode
- scriptPath
- generatedFiles
- warnings
- summary
- logTail
- outputs
- diagnostics

### validate_henshin
Wraps `tools/henshin-validator/validate.mjs` for local Henshin rule validation.

Input schema highlights:
- henshinPath (required)
- mode: `structure` | `semantic` | `apply` (default `structure`)
- metamodelPath (required for `semantic` and `apply`)
- modelPath, ruleName (required for `apply`)
- parameters (optional string map for rule parameters)

### validate_momot
Wraps `tools/momot-validator/validate.mjs` for local `.momot` script validation.

Input schema highlights:
- momotPath (required)
- mode: `structure` | `semantic` | `compile` (default `structure`)
- projectRoot (recommended for `semantic` and `compile` when script paths are job-relative)

Output envelope:
- success
- exitCode
- result (parsed JSON from validator stdout)
- stderr (optional)

### validate_java_helper
Performs static conformance and structural analysis of a custom Java helper class to verify package structures, class definitions, inheritance from AbstractEGraphFitness, and correct override signatures.

## Example MCP Request Payloads

Execution:

{
  "restBaseUrl": "http://localhost:8080",
  "scriptPath": "src/at/ac/tuwien/big/momot/examples/stack/StackSearchExample.momot",
  "filesBase64": {
    "src/at/ac/tuwien/big/momot/examples/stack/StackSearchExample.momot": "<base64>",
    "model/stack.ecore": "<base64>",
    "model/stack.henshin": "<base64>",
    "model/input/model/model_five_stacks.xmi": "<base64>"
  }
}

## Example Successful Response Shape

{
  "success": true,
  "exitCode": 0,
  "scriptPath": "src/at/ac/tuwien/big/momot/examples/stack/StackSearchExample.momot",
  "generatedFiles": [
    "model/input/model/model_five_stacks.xmi",
    "model/stack.ecore",
    "model/stack.henshin",
    "src/at/ac/tuwien/big/momot/examples/stack/StackSearchExample.momot"
  ],
  "warnings": [],
  "summary": "Execution succeeded with 18 output artifact(s).",
  "logTail": "...",
  "outputs": [],
  "diagnostics": {
    "health": { "ok": true, "statusCode": 200 },
    "requestUrl": "http://localhost:8080/run?script=...",
    "statusCode": 200,
    "request": { "script": "..." },
    "rootCauseHint": "Execution succeeded."
  }
}

## Shared TypeScript Engine Client (`momot-engine-client`)

To facilitate sharing the engine communication layer between this MCP server and modern cloud/IDE surfaces (such as **EMF.cloud**, **Theia**, or other VS Code extensions), a shared TypeScript/JavaScript client is provided in `packages/momot-engine-client`.

### How to use `momot-engine-client`

Any Node.js or TypeScript client can import and use the shared client as follows:

```typescript
import { DefaultMomotEngineClient } from 'momot-engine-client';
import * as fs from 'fs';

// 1. Instantiate the client pointing to the Java REST runner endpoint
const client = new DefaultMomotEngineClient({
  restBaseUrl: 'http://localhost:8080',
  retries: 2,
  retryDelayMs: 500
});

// 2. Check health of the REST engine
const health = await client.health();
if (health.ok) {
  console.log('MOMoT REST runner is online!');
}

// 3. Assemble and execute an optimization job
const result = await client.runJob({
  scriptPath: 'src/Search.momot',
  files: {
    'src/Search.momot': fs.readFileSync('src/Search.momot', 'utf-8'),
    'model/stack.ecore': fs.readFileSync('model/stack.ecore'), // Binary buffers or Uint8Arrays work perfectly too
    'model/input.xmi': fs.readFileSync('model/input.xmi')
  }
});

console.log(`Execution status exitCode: ${result.exitCode}`);
console.log(`Log output tail:\n${result.logTail}`);

// 4. Handle output models and Pareto fronts
for (const [filePath, fileContent] of Object.entries(result.outputs)) {
  console.log(`Received output file: ${filePath} (${fileContent.byteLength} bytes)`);
  // Process output XMI or Pareto Front points
}
```

## Troubleshooting

- REST unavailable:
  - Verify container is running.
  - Check http://localhost:8080/health returns ok.
- Script not found in archive:
  - Ensure scriptPath exactly matches zip entry path.
  - Use forward slashes only.
- Compile failures:
  - Inspect diagnostics.logTail for compile section.
  - Validate generated script imports and objective blocks.
- Model/metamodel mismatches:
  - Check Ecore nsURI and model root compatibility.
- Non-zero exit code:
  - Use diagnostics.rootCauseHint and logTail for triage.

Note:
- outputs is always returned as a list and may be empty when the executed MOMoT script does not emit artifacts under out/.

## Verification Commands

From mcp directory:

npm install
npm test

With REST container running (integration tests):

$env:RUN_INTEGRATION_TESTS='1'
$env:MOMOT_REST_BASE_URL='http://localhost:8080'
npm run test:integration

With REST container running (MCP stdio protocol tests):

$env:RUN_MCP_STDIO_TESTS='1'
$env:MOMOT_REST_BASE_URL='http://localhost:8080'
npm run test:stdio

