# Mutation SPI — STATUS

| Field | Value |
|---|---|
| Branch | `feat/mutation-operator-spi` |
| Phase completed | **2.1 — Cleanup** |
| Next phase | **Stop for PR** (Phase 3+ optional) |
| Production search path | SPI-retargeted (Henshin adapter) |
| Agent prompt | `agents/prompts/mutation-spi-implement.prompt.md` |
| Latest commit (phase gate) | `c338821` (+ Copilot review fixes) |

## Notes

- Root `pom.xml` `<module>tests</module>` enabled for Tycho SPI tests.
- `HenshinMutationEngine` reuses the orchestration `ModuleManager` (preserves `ignoreUnits` / `parameterValues` / `ignoreParameters`).
- Henshin import allowlist: [`10-import-allowlist.md`](10-import-allowlist.md).
- E2E harness: `test-suite/verify-e2e.js` (Tier 1–3).
