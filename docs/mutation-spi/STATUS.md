# Mutation SPI — STATUS

| Field | Value |
|---|---|
| Branch | `feat/mutation-spi-phase4` |
| Phase completed | **4 — Stub second backend** |
| Next phase | **Phase 5 — TypeScript engine client** |
| Production search path | SPI-retargeted (Henshin adapter) |
| Agent prompt | `agents/prompts/mutation-spi-implement.prompt.md` |
| Latest commit (phase gate) | `feat(spi): implement StubMutationEngine, StubModelHandle and integrate T06 E2E validation (Phase 4)` |

## Notes

- Root `pom.xml` `<module>tests</module>` enabled for Tycho SPI tests.
- `HenshinMutationEngine` reuses the orchestration `ModuleManager` (preserves `ignoreUnits` / `parameterValues` / `ignoreParameters`).
- Henshin import allowlist: [`10-import-allowlist.md`](10-import-allowlist.md).
- E2E harness: `test-suite/verify-e2e.js` (Tier 1–3) with default Henshin benchmarks (T01–T04) and new `T06-stub-backend` benchmark.
- Optional `backend = "henshin"` / `backend = "stub"` support implemented in MOMoT.xtext, compiled, and wired to the orchestrator.
- Fail-fast validation with registry lookup implemented on job upload.
- Priority-based backend resolution from `job/manifest.json` and `.momot` script implemented.
- `StubMutationEngine` fully implemented with resource-loading and `StubModelHandle` to load and evaluate standard EMF models without Henshin.
- **P4.1 (Henshin Classpath Independence)**: While `StubMutationEngine` and `StubModelHandle` have **no Henshin imports or dependencies**, the runner JVM classpath still statically requires Henshin JARs. This is because the Java class dynamically generated and compiled from the `.momot` script, along with the orchestrator, statically references Henshin's `org.eclipse.emf.henshin.interpreter.EGraph` and `HenshinResourceSet`. Completely removing Henshin from the classpath would cause a `NoClassDefFoundError` upon classloading of the search class.
