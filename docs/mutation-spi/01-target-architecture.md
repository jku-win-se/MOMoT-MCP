# 01 — Target Architecture

## High-level topology

```text
┌──────────────────────────────────────────────────────────────┐
│  Cloud tool surface (TypeScript)                              │
│  EMF.cloud Model Hub / Theia / VS Code / MCP UX               │
│  - author / validate operators (future)                       │
│  - assemble jobs                                              │
│  - show Pareto fronts / models                                │
└────────────────────────────┬─────────────────────────────────┘
                             │ HTTP job API (zip-in / zip-out)
                             │ (existing /run, evolved metadata)
┌────────────────────────────▼─────────────────────────────────┐
│  Evolutionary engine service (Java today)                     │
│  MOEA + chromosome + fitness + .momot compile                    │
│                                                               │
│  depends ONLY on MutationOperatorEngine (SPI)                 │
└────────────────────────────┬─────────────────────────────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
       HenshinAdapter   EpsilonAdapter   CommandAdapter
       (phase 1)        (later)          (later / cloud)
```

## Responsibilities

| Component | Owns | Must not own |
|---|---|---|
| TS cloud surface | UX, Model Hub integration, job assembly, result viz | Pattern matching, NSGA loops, Henshin JARs |
| Engine service | Population, variation, evaluation, objectives | Language-specific rule editors |
| SPI | Operator discovery, param sample, apply/replay | Fitness formulas, UI |
| Henshin adapter | Module load, match/apply, Henshin params | MOEA operators |

## Evaluation path (unchanged conceptually)

```text
initial model → copy → replay(gene₁…geneₙ) → fitness(model') → objectives
```

Genes become SPI `OperatorApplication` records, not Henshin `UnitApplication` instances.

## Model handle

Search works on an opaque **`ModelHandle`** wrapping an EMF resource/root (implementation detail of the engine service). Adapters may cast to a backend-specific view **inside the adapter only**.

Henshin today uses `EGraph`; the adapter converts `ModelHandle` ↔ `EGraph` at the boundary.

## Deployment

Phase 1 keeps:

- Docker headless REST runner
- MCP `execute_momot_job` / `run_end_to_end`

Later (documented, not required for SPI Done):

- TS package(s) under something like `cloud/` or `mcp/` extensions for EMF.cloud
- Optional Model Server for **display/edit of result models**, not for inner EA loop

## Trust boundary

```text
Browser/IDE  --trusts-->  Engine service  --trusts-->  Adapter
                job ZIP              in-process SPI
```

Adapters run in-process with the engine for performance. Remote adapters are out of scope (NG).
