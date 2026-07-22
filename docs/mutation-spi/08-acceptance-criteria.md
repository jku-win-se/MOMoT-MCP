# 08 — Acceptance Criteria

## Phase 1

| # | Criterion |
|---|---|
| P1.1 | `HenshinMutationEngine.load` loads T01 module without Exception |
| P1.2 | `listOperators` includes shiftLeft and shiftRight (names per id scheme) |
| P1.3 | `tryApply` on valid shift changes model; invalid returns `success=false` |
| P1.4 | No production search path change yet (or feature-flagged) |

## Phase 2

| # | Criterion |
|---|---|
| P2.1 | T01–T04: Henshin structure/semantic/apply validators still pass |
| P2.2 | T01–T04: REST/`execute_momot_job` `exitCode=0` with objectives present |
| P2.3 | T01–T04: ε-dominance vs `expected/pareto-front.json` |
| P2.4 | `rg` Henshin imports confined to allowlist |
| P2.5 | Genes in debugger/logs show operator ids, not Henshin Match dumps only |

## Phase 3

| # | Criterion |
|---|---|
| P3.1 | Scripts without `backend` behave as Henshin |
| P3.2 | Invalid `backend` fails fast with actionable message |

## Phase 4

| # | Criterion |
|---|---|
| P4.1 | Stub backend runs without Henshin JARs **or** documents why JARs still required on classpath |
| P4.2 | Registry resolves `stub` and `henshin` |

## Phase 5

| # | Criterion |
|---|---|
| P5.1 | MCP execute path uses shared TS client |
| P5.2 | Client types match [06-typescript-cloud-surface.md](06-typescript-cloud-surface.md) |

## Initiative done (SPI epic)

Phases **0–2** complete (3–5 strongly recommended). Phase 6 is a separate product epic.
