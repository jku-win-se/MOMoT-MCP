# 07 — Implementation Phases

Execute in order. Do not skip parity gates.

## Phase 0 — Scaffolding (THIS BRANCH)

**Done when this branch lands.**

- [x] Goals, architecture, SPI docs
- [x] Java SPI stubs under `spi.mutation`
- [x] Henshin adapter stub class
- [x] Agent prompt + Cursor rule
- [x] Index pointers from docs / AGENTS

**No behavior change.**

## Phase 1 — SPI types + Henshin adapter (behavior behind facade)

- [x] 1. Flesh out SPI types (remove `UnsupportedOperationException` stubs).
- [x] 2. Implement `HenshinMutationEngine` by wrapping existing `ModuleManager` / apply logic.
- [x] 3. Add unit tests: listOperators + tryApply on T01 artifacts.
- [x] 4. Register backend `henshin` in `MutationEngineRegistry`.
- [x] 5. **Do not** switch search orchestration yet — optional dead-code path OK for tests.

**Exit:** Adapter tests green; production search still old path.

## Phase 2 — Retarget search engine to SPI

- [x] 1. Introduce `OperatorApplicationVariable` (MOEA `Variable`).
- [x] 2. Retarget `SearchHelper`, mutation operators, `TransformationSolution`.
- [x] 3. Wire orchestration to `MutationEngineRegistry` (default `henshin`).
- [x] 4. Remove Henshin extends from public `ITransformationVariable`.
- [x] 5. Allowlist Henshin imports (see [04-engine-retargeting.md](04-engine-retargeting.md)).

**Exit:** `test-suite` T01–T04 all tiers pass with no intentional behavior change.

## Phase 2.1 — Cleanup

1. Move leftover Henshin-only types into adapter package.
2. Deprecate transitional `unwrap()` fitness path or narrow it.
3. Update henshin wiki notes: “rules consume via SPI”.
4. Update `docs/03-imports-and-henshin-modules.md` for optional `backend`.

**Exit:** Import allowlist clean; docs updated.

## Phase 3 — DSL / protocol niceties

1. Optional `backend = "henshin"` in `.momot` (default preserved).
2. Diagnostics echo backend id.
3. Optional `job/manifest.json`.

**Exit:** Old scripts run unchanged; new field documented.

## Phase 4 — Stub second backend

1. Implement `stub` engine (one no-op or identity operator) for CI proof.
2. Or thin EOL adapter spike (optional stretch).

**Exit:** Job with `backend = "stub"` loads and runs a trivial search without Henshin modules.

## Phase 5 — TypeScript engine client

1. Extract shared client used by MCP.
2. Document EMF.cloud bridge package layout ([06](06-typescript-cloud-surface.md)).

**Exit:** MCP uses shared client; README shows how Theia would call the same API.

## Phase 6 — EMF.cloud surface (separate epic)

Out of core SPI Done. Track as follow-up project using phase 5 client.

---

## Parallelism notes

- Docs/agent prompts can improve anytime.
- Phase 4 can start after phase 2 exit.
- Phase 5 can overlap phase 3.
