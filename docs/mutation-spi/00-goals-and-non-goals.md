# 00 — Goals and Non-Goals

## Problem

MOMoT encodes evolutionary genes as Henshin unit applications. Core types inherit Henshin APIs (`ITransformationVariable extends UnitApplication`). That locks:

- the search engine to one transformation language,
- EMF.cloud integration to Henshin’s Eclipse-era authoring story,
- future backends (Epsilon EOL, Model Server commands, …) behind a rewrite.

## Goals

| ID | Goal |
|---|---|
| G1 | Introduce a **language-agnostic Mutation Operator SPI** that the evolutionary engine depends on exclusively. |
| G2 | Provide a **Henshin adapter** that preserves current behavior (T01–T04 parity). |
| G3 | Keep the **evolutionary engine as a separate service** (zip-in/zip-out REST runner remains the execution boundary). |
| G4 | Define a **TypeScript cloud tool surface** plan for EMF.cloud (authoring, launch, results) that never embeds Henshin. |
| G5 | Make a **second adapter** possible without touching MOEA/search orchestration (prove SPI with a stub or EOL pilot later). |
| G6 | Evolve `.momot` / job metadata so `transformations` can declare a **backend id** while defaulting to Henshin for compatibility. |

## Non-goals (this initiative)

| ID | Non-goal |
|---|---|
| NG1 | Full rewrite of MOMoT in TypeScript or Python. |
| NG2 | Replacing Henshin for all users in phase 1. |
| NG3 | Implementing Epsilon / ATL / VIATRA adapters in the first implementation pass. |
| NG4 | Pushing NSGA-II evaluations through EMF.cloud Model Server HTTP (too slow; wrong layer). |
| NG5 | Redesigning OCL/Java fitness (stays model-centric, backend-agnostic). |
| NG6 | Shipping a production EMF.cloud Theia product in this branch’s first phases. |
| NG7 | Changing MOEA Framework or algorithm semantics. |

## Success (initiative-level)

1. `momot.core` search path compiles and runs **without** Henshin imports outside `spi.mutation.henshin` (and unavoidable resource utilities explicitly listed).
2. Existing test-suite cases pass tiers 1–3 unchanged when using the Henshin adapter.
3. A documented second-backend path exists (even if only a no-op/stub adapter in-tree).
4. TS surface docs specify APIs the cloud layer will call on the engine service.

## Principles

- **Behavior first:** Henshin adapter must be a faithful lift, not a redesign of rules.
- **Thin SPI:** Prefer boring DTOs + a small engine interface over a second framework.
- **Adapter isolation:** Henshin types never leak into genes, crossover, or fitness orchestration.
- **Service boundary:** Cloud UI and search engine communicate over job/REST contracts, not shared JVM classloaders with the browser.
