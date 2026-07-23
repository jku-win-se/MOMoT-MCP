# Mutation SPI — STATUS

| Field | Value |
|---|---|
| Branch | `feat/mutation-spi-phase6-cloud-surface` |
| Phase completed | **6 (Slice 1) — EMF.cloud surface scaffolding + isomorphic client** |
| Next phase | **6 (Slice 2) — Deeper EMF.cloud Model Hub integration** |
| Production search path | SPI-retargeted (Henshin adapter) |
| Agent prompt | `agents/prompts/mutation-spi-implement.prompt.md` |
| Latest commit (phase gate) | `feat(cloud): scaffold cloud packages, results parser, and browser isomorphic engine client (Phase 6 Slice 1)` |

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
- **P5.1 (Shared TypeScript Engine Client)**: Extracted `DefaultMomotEngineClient` and definitions matching `06-typescript-cloud-surface.md` into `packages/momot-engine-client`. This shared client has zero external build requirements, includes full TypeScript interfaces (`MomotEngineClient`, `MomotJobResult`), and is easily used by EMF.cloud/Theia or any other cloud IDE front-end.
- **P5.2 (MCP Retargeting)**: Rewrote MCP's execution pathway (`executeMomotJob` in `mcp/lib.js`) to import and delegate directly to the shared `momot-engine-client` package, achieving 100% test-suite parity.
- **Phase 6 Slice 1 (Isomorphic Client & Cloud Surface Scaffolding)**:
  - Polished `packages/momot-engine-client` to be 100% isomorphic (fully runs in browser/WebWorkers) by removing all Node-only APIs (`Buffer`, `node:path`) from the hot paths.
  - Scaffolded the `cloud/packages/` structure containing `@momot/cloud-engine-client` (re-exports the core client), `@momot/momot-results` (parses `.pf` files and listings), and `@momot/momot-emfcloud-bridge` (stub APIs for Model Hub loading).
  - Scaffolded `cloud/apps/theia-momot-ext` to establish the future extension placeholder.
  - Implemented unit tests for all new cloud packages and verified E2E and MCP compatibility.
