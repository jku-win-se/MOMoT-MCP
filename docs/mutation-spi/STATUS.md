# Mutation SPI — STATUS

| Field | Value |
|---|---|
| Branch | `feat/mutation-spi-phase3` |
| Phase completed | **3 — DSL / protocol niceties** |
| Next phase | **Phase 4 — Stub second backend** |
| Production search path | SPI-retargeted (Henshin adapter) |
| Agent prompt | `agents/prompts/mutation-spi-implement.prompt.md` |
| Latest commit (phase gate) | `feat(spi): implement prioritized backend resolution, JVM properties, fail-fast checking and diagnostics (Phase 3)` |

## Notes

- Root `pom.xml` `<module>tests</module>` enabled for Tycho SPI tests.
- `HenshinMutationEngine` reuses the orchestration `ModuleManager` (preserves `ignoreUnits` / `parameterValues` / `ignoreParameters`).
- Henshin import allowlist: [`10-import-allowlist.md`](10-import-allowlist.md).
- E2E harness: `test-suite/verify-e2e.js` (Tier 1–3).
- Optional `backend = "henshin"` support implemented in MOMoT.xtext, compiled, and wired to the orchestrator.
- Fail-fast validation with registry lookup implemented on job upload.
- Priority-based backend resolution from `job/manifest.json` and `.momot` script implemented.
