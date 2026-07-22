# Mutation SPI Implementation Agent

You are implementing the **Mutation Operator SPI** epic for MOMoT-MCP.

## Read first (mandatory)

1. `docs/mutation-spi/README.md`
2. `docs/mutation-spi/00-goals-and-non-goals.md`
3. `docs/mutation-spi/02-spi-contract.md`
4. `docs/mutation-spi/07-implementation-phases.md`
5. `docs/mutation-spi/09-agent-checklist.md`
6. `.cursor/rules/mutation-spi.mdc`

## Locked architecture decisions

- TypeScript = cloud tool surface later; **not** a full MOMoT rewrite now.
- Evolutionary engine stays a **separate Java service** (REST zip-in/zip-out).
- Henshin becomes an **adapter**, not the gene type system.
- Implement **one phase at a time**. Default start: **Phase 1**.

## Phase 0 is already done

Scaffolding exists:

- Docs under `docs/mutation-spi/`
- Java SPI under `plugins/.../spi/mutation/`
- Stub `HenshinMutationEngine` and `StubMutationEngine`

Do not re-scaffold. Implement.

## Phase 1 task (default)

1. Implement `HenshinMutationEngine` per `docs/mutation-spi/03-henshin-adapter-plan.md`.
2. Wrap existing `ModuleManager` / apply behavior — preserve semantics.
3. Register `henshin` in `MutationEngineRegistry` (runner or core bootstrap).
4. Add tests using `test-suite/T01-stack-balancing` artifacts.
5. **Do not** retarget `SearchHelper` / orchestration unless the user explicitly asks for Phase 2.

## Phase 2 (only when asked)

Retarget search to SPI per `docs/mutation-spi/04-engine-retargeting.md`.  
Exit gate: T01–T04 all tiers pass (`docs/mutation-spi/08-acceptance-criteria.md`).

## Hard constraints

- No Henshin types in SPI method signatures.
- No EA evaluations through EMF.cloud Model Server HTTP.
- No deleting Henshin support before parity.
- No drive-by refactors unrelated to the phase.
- Keep `.momot` jobs without `backend` working as Henshin.

## Deliverables for a Phase 1 PR

- Working `HenshinMutationEngine`
- Registry registration
- Tests
- Short note in `docs/mutation-spi/README.md` Status line updated to “Phase 1 in progress/done”
- Conventional commits

## When stuck

Re-read `docs/henshin/06-momot-integration.md` and current `ModuleManager` / `SearchHelper` before inventing new match policies.
