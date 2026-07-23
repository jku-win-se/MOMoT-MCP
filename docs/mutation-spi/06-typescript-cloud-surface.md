# 06 — TypeScript Cloud Surface

The TS cloud surface is implemented as part of Phase 6 — Slice 1, providing scaffolding and isomorphic packages that can be consumed by Theia or an EMF.cloud extension.

## Role

EMF.cloud / IDE-facing UX that:

1. Helps authors assemble optimization jobs
2. Calls the **evolutionary engine service** (REST)
3. Displays models and Pareto results via Model Hub / editors

It does **not** run NSGA-II in the browser and does **not** load Henshin.

## Scaffolded Package Layout

The cloud surface has been structured under the `cloud/` directory as highly modular packages:

```text
cloud/
  packages/
    momot-engine-client/        # Re-exports the isomorphic client (for /health, /run)
    momot-results/              # Parses overall_objectives.pf, lists out/ output artifacts
    momot-emfcloud-bridge/      # Stubs loadOptimizedModel and Model Hub integration points
  apps/
    theia-momot-ext/            # Optional thin README/skeleton for future extension
```

### Browser and WebWorker Isomorphism
The core client library `packages/momot-engine-client` has been polished to remove all Node-only APIs (like `Buffer` or `node:path`) from the hot path:
- Uses `TextEncoder` / `TextDecoder` for encoding/decoding string content.
- Uses `JSZip` generating a `uint8array` instead of a Node `Buffer`.
- Does not import Node's `node:path` core module.
This allows it to run interchangeably in Node.js (for the MCP server) and browser environments.

## Client API (engine service)

Minimum TypeScript surface:

```ts
interface MomotEngineClient {
  health(): Promise<{ ok: boolean }>;
  runJob(args: {
    scriptPath: string;
    files: Record<string, Uint8Array | string>; // path → content
    timeoutMs?: number;
  }): Promise<MomotJobResult>;
}

interface MomotJobResult {
  exitCode: string;
  logTail: string;
  outputs: Record<string, Uint8Array>;
  diagnostics?: {
    mutationBackend?: string;
    rootCauseHint?: string;
  };
}
```

Map onto existing MCP `execute_momot_job` semantics so MCP and EMF.cloud share one client library.

## EMF.cloud integration points

| Concern | Approach |
|---|---|
| Edit initial model | Model Hub / Model Server (JSON or EMF Java backend) |
| Show optimized model | Import engine output XMI/JSON into Model Hub |
| Author operators | Phase later: textual ops UI; Henshin files as opaque artifacts initially |
| Undo while searching | **Do not** use Model Server command stack for EA steps |

## Operator authoring (roadmap)

1. **Now:** ship `.henshin` / future `.eol` as job files; engine adapter interprets.
2. **Next:** TS forms that edit a JSON operator catalog compiled to backend modules.
3. **Later:** GLSP visualization for graph rules (optional; Henshin-specific).

## Non-goals for TS surface v1

- Reimplementing fitness OCL in TypeScript
- Browser-side Henshin interpreter
- Replacing Docker engine service
