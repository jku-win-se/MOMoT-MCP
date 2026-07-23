# @momot/momot-emfcloud-bridge

An isomorphic TypeScript/JavaScript library that bridges MOMoT optimization results to EMF.cloud Model Hub and Model Server REST APIs.

## Installation

```bash
npm install @momot/momot-emfcloud-bridge
```

## Features

- **Isomorphic**: Runs interchangeably in Node.js (MCP servers, background microservices) and browser/WebWorker environments (Theia extensions, web-based IDEs) via global `fetch`.
- **Model Loading (`loadOptimizedModel`)**: Stages optimized models (such as XMI files) directly into the Model Server.
- **Model Querying (`listHubModels`)**: Queries active model URIs registered in the Model Hub. Highly resilient to various Model Server response dialects.
- **Result Pipeline Helper (`pushJobResultsToHub`)**: Finds optimization artifacts (e.g. `.xmi` models) inside a `MomotJobResult` outputs block and pushes them all to the Model Hub with configurable URI prefixing.

---

## Assumed REST API Contract (OpenAPI Specification)

This package integrates with EMF.cloud Model Server/Model Hub over the following standard REST endpoints.

### 1. Load / Stage Model Artifact

Stages or loads a single model file into the EMF.cloud Model Server.

- **Endpoint**: `PUT {modelServerUrl}/api/v1/models`
- **Query Parameters**:
  - `uri` (string, required, url-encoded): The destination URI for the model (e.g., `hub://models/solution_0.xmi`).
- **Headers**:
  - `Content-Type`: `application/xml` (for string content) or `application/octet-stream` (for binary content).
- **Request Body**: Raw text (XMI XML) or binary buffer (`Uint8Array`).
- **Expected Responses**:
  - `200 OK` or `204 No Content`: Successful load.
  - `500 Internal Server Error`: Staging failed.

#### Alternative Dialect Support Note
If your EMF.cloud Model Server dialect requires standard JSON wrapping instead of raw binary bodies, e.g., `POST /api/v1/models` with `{ "uri": "...", "content": "..." }`, you can subclass `DefaultMomotEmfcloudBridge` or wrap it to translate the call.

### 2. List Registered Models

Queries the Model Hub for active model URIs.

- **Endpoint**: `GET {modelHubUrl}/api/v1/models`
- **Expected Responses**:
  - `200 OK`: Returns the list of registered models.
  - `404 Not Found`: Model Hub endpoint is unavailable.

To ensure compatibility across different EMF.cloud Model Server API variations, the parser resiliantly supports the following response dialects:

#### Dialect A: Flat Array of Strings (Default)
```json
[
  "hub://models/input_baseline.xmi",
  "hub://models/solution_0.xmi"
]
```

#### Dialect B: Nested Objects (Array of Objects with `uri` or `id`)
```json
[
  { "uri": "hub://models/input_baseline.xmi" },
  { "id": "hub://models/solution_0.xmi" }
]
```

#### Dialect C: Object with Array inside (key `models` or `uris`)
```json
{
  "models": [
    "hub://models/input_baseline.xmi",
    "hub://models/solution_0.xmi"
  ]
}
```

#### Dialect D: Object with Array of Objects
```json
{
  "models": [
    { "uri": "hub://models/input_baseline.xmi" },
    { "uri": "hub://models/solution_0.xmi" }
  ]
}
```

---

## Usage Examples

### 1. Direct Bridge Operations

```typescript
import { DefaultMomotEmfcloudBridge } from '@momot/momot-emfcloud-bridge';

const bridge = new DefaultMomotEmfcloudBridge({
  modelServerUrl: 'http://localhost:8081/modelserver',
  modelHubUrl: 'http://localhost:8081/modelhub'
});

// List all models currently on the hub
const models = await bridge.listHubModels();
console.log('Hub models:', models);

// Stage an optimized solution XMI file
const xmlContent = '<xmi:XMI xmi:version="2.0" ...>...</xmi:XMI>';
const res = await bridge.loadOptimizedModel('hub://models/optimized_solution.xmi', xmlContent);
if (res.success) {
  console.log('Success:', res.message);
} else {
  console.error('Failed:', res.message);
}
```

### 2. Result Pipeline Helper

Pushes all generated `.xmi` models from an execution job results block straight into the Model Hub:

```typescript
import { DefaultMomotEmfcloudBridge, pushJobResultsToHub } from '@momot/momot-emfcloud-bridge';
import { DefaultMomotEngineClient } from '@momot/momot-engine-client';

const client = new DefaultMomotEngineClient();
const bridge = new DefaultMomotEmfcloudBridge();

// Execute an optimization job
const jobResult = await client.runJob({
  scriptPath: 'src/stack.momot',
  files: {
    'src/stack.momot': '...',
    'model/stack.ecore': '...'
  }
});

if (jobResult.exitCode === '0') {
  // Push all XMI files under out/ to Model Hub
  const stageResults = await pushJobResultsToHub(jobResult, bridge, {
    targetUriPrefix: 'hub://models/optimized/',
    keepRelativePath: false // default false (stages directly to hub://models/optimized/solution_xx.xmi)
  });
  
  console.log('Pushed solution files:', stageResults);
}
```

---

## Local Verification and Mocking

### Unit Testing (Mocked Environment)

Unit tests in this package mock `globalThis.fetch` to assert success and failure pathways without requiring a live EMF.cloud Model Server instance. To run the tests:

```bash
npm install
npm test
```

### Manual Verification with a Live Model Server

If you have a live EMF.cloud Model Server Docker container running (e.g. listening on port `8081`), you can verify the integration using recorded fixtures.

#### Sample JSON Fixture for Listing (Model Hub Mock response):
Save the following as `mock-models.json`:
```json
[
  "hub://models/input_baseline.xmi",
  "hub://models/optimized_solution_0.xmi"
]
```

#### Verification Script:
Create a temporary `test-live.js` script:
```javascript
import { DefaultMomotEmfcloudBridge } from './index.js';

const bridge = new DefaultMomotEmfcloudBridge({
  modelServerUrl: 'http://localhost:8081/modelserver',
  modelHubUrl: 'http://localhost:8081/modelhub'
});

async function test() {
  console.log('--- Listing Models ---');
  try {
    const list = await bridge.listHubModels();
    console.log('Model list:', list);
  } catch (err) {
    console.error('List failed:', err.message);
  }

  console.log('\n--- Uploading Optimized Model ---');
  const result = await bridge.loadOptimizedModel(
    'hub://models/solution_manually_uploaded.xmi', 
    '<xml-root><content>optimized model</content></xml-root>'
  );
  console.log('Upload Result:', result);
}

test();
```

Execute with `node test-live.js`.
