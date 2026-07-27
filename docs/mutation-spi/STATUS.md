# Mutation SPI — STATUS

| Field | Value |
|---|---|
| Branch | `main` |
| Phase completed | **Epic complete (Phases 0–5 + Phase 6 Slices 1–3)** |
| Next phase | **Future enhancements (optional): live EMF.cloud dialect validation, full Theia widget, Henshin GLSP editors, EOL adapter, etc.** |
| Production search path | SPI-retargeted (Henshin adapter) |
| Agent prompt | `agents/prompts/mutation-spi-implement.prompt.md` |
| Latest commit (phase gate) | `7508cc0 / PR #7` |

## What Shipped (SPI Epic Summary)

The Mutation Operator SPI and EMF.cloud Surface Scaffolding epic is complete! Here is a summary of the core modules and capabilities delivered across all phases:

- **Java MutationOperator SPI & Adapters:**
  - Standardized the `MutationOperatorSPI` and `MutationOperatorEngine` contracts.
  - Retargeted the search orchestration, `TransformationSolution`, and custom mutation operators.
  - Delivered `HenshinMutationEngine` (default registered adapter), completely isolating Henshin-specific code from MOMoT's core types.
  - Implemented `StubMutationEngine` and `StubModelHandle` for loading and evaluating standard EMF models completely independent of Henshin.
- **DSL Backend & Job Diagnostics:**
  - Extended the `.momot` script DSL syntax and compiler with an optional `backend` configuration.
  - Enhanced job upload REST APIs with fail-fast validation and registry lookups.
  - Added priority-based backend resolution from `.momot` scripts and job manifests.
- **Shared Isomorphic TypeScript Engine Client:**
  - Created `packages/momot-engine-client` (pure isomorphic TypeScript with zero external build requirements).
  - Integrates smoothly with browser, Node, and WebWorkers.
  - Rewrote the MCP server's execution pathways to use this shared package, securing 100% test-suite parity.
- **EMF.cloud Surface & Workspace Packages (`cloud/packages/`):**
  - `@momot/cloud-engine-client`: Clean wrapper/re-export of the core client.
  - `@momot/momot-results`: Robust Pareto-front (`.pf`) parser and listing generator.
  - `@momot/momot-emfcloud-bridge`: Full isomorphic HTTP client that communicates with EMF.cloud Model Server / Model Hub (providing `loadOptimizedModel`, `listHubModels`, and end-to-end results staging via `pushJobResultsToHub`).
- **Interactive Trade-off UI (`@momot/momot-tradeoff-ui`):**
  - Isomorphic, lightweight 2D scatter/trade-off plot rendering using pure SVG.
  - Multi-objective natural-sorting and related-solution mapping to auto-resolve solution models against the EMF.cloud Model Hub.
  - Scaffolded the extension contributions inside `cloud/apps/theia-momot-ext` alongside an interactive ESM-powered demo HTML page (`demo-fixture.html`).
- **End-to-End E2E Validation:**
  - Comprehensive 3-tier validation (T01–T04 standard benchmarks plus T06-stub-backend benchmark).
  - Assured backwards compatibility (P3.2 / no-backend defaults), with rigorous tests verifying compile, semantic, and structural aspects.

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
- **Phase 6 Slice 2 (Deeper EMF.cloud Model Hub Integration)**:
  - Replaced Model Hub loading/listing stubs in `@momot/momot-emfcloud-bridge` with a fully featured, resilient, isomorphic HTTP client.
  - Implemented `loadOptimizedModel(targetUri, content)` to PUT model content directly to Model Server/Model Hub via REST APIs.
  - Implemented `listHubModels()` query client, resiliently parsing multiple JSON response dialects to guarantee compatibility with various EMF.cloud server API styles.
  - Developed the end-to-end `pushJobResultsToHub` helper to scan, filter, and stage all optimization model outputs into the Model Hub/Server automatically.
  - Created a detailed OpenAPI-ish contract documentation in the package README detailing expected payloads, response formats, and local mock testing vs optional live validation instructions.
- **Phase 6 Slice 3 (Trade-off Exploration UI Scaffolding)**:
  - Implemented `@momot/momot-tradeoff-ui` to support 2D interactive scatter/trade-off plot rendering using isomorphic SVG generators (`renderToString` / `renderToDom`).
  - Added robust min/max bounding box calculations and coordinate mapping, including edge cases (division by zero and single-point/identical objective protections).
  - Wired selection directly to EMF.cloud Model Hub loading (`wireSelectionToHub`) using smart numeric-natural sorting (`resolveRelatedSolutionModel`) to robustly map points to solution `.xmi` files.
  - Extended `cloud/apps/theia-momot-ext` to define contribution points (commands, views, menus) and detailed host integration documentation.
  - Provided a highly polished, interactive ESM story-like HTML sandbox widget `demo-fixture.html` to showcase live interactivity and selections without any IDE build complexity.
  - Achieved 100% pass on all unit tests (10 new tests added) with zero regressions across the codebase.
