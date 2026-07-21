# 06 — TypeScript Cloud Surface

This layer is **planned**, not scaffolded as a full app in this branch. Implement after SPI + Henshin parity (see phases).

## Role

EMF.cloud / IDE-facing UX that:

1. Helps authors assemble optimization jobs
2. Calls the **evolutionary engine service** (REST)
3. Displays models and Pareto results via Model Hub / editors

It does **not** run NSGA-II in the browser and does **not** load Henshin.

## Suggested package layout (future)

```text
cloud/                          # or mcp/cloud-extension/
  packages/
    momot-engine-client/        # typed client for /health, /run
    momot-results/              # parse overall_objectives.pf, outputs ZIP
    momot-emfcloud-bridge/      # Model Hub commands: load result XMI/JSON
  apps/
    theia-momot-ext/            # optional later
```

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
