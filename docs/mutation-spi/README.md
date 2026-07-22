# Mutation Operator SPI & EMF.cloud Split

> **Status:** Phase 2.1 complete (SPI retargeted; Henshin is default adapter).  
> See [STATUS.md](STATUS.md).

This folder is the **single source of truth** for decoupling MOMoT from Henshin and preparing EMF.cloud integration.

## Decisions (locked)

1. **TypeScript** owns the cloud tool surface (EMF.cloud / Theia / VS Code / MCP UX).
2. The **evolutionary engine stays a separate service** (today: Java REST runner; later still a service, language optional).
3. Transformation languages plug in via a **Mutation Operator SPI**. Henshin is the first adapter, not the core type system.
4. Implement in **phases** with parity on `test-suite/` before adding a second backend.

## Document map

| Doc | Purpose |
|---|---|
| [00-goals-and-non-goals.md](00-goals-and-non-goals.md) | Why, success criteria, explicit non-goals |
| [01-target-architecture.md](01-target-architecture.md) | Runtime topology (TS surface ↔ engine ↔ adapters) |
| [02-spi-contract.md](02-spi-contract.md) | Concrete SPI types, invariants, error model |
| [03-henshin-adapter-plan.md](03-henshin-adapter-plan.md) | How current Henshin maps 1:1 onto the SPI |
| [04-engine-retargeting.md](04-engine-retargeting.md) | Which `momot.core` classes must stop depending on Henshin |
| [05-dsl-and-job-protocol.md](05-dsl-and-job-protocol.md) | `.momot` / ZIP / REST evolution (backward compatible) |
| [06-typescript-cloud-surface.md](06-typescript-cloud-surface.md) | EMF.cloud-facing TS layer (out of Java engine) |
| [07-implementation-phases.md](07-implementation-phases.md) | Ordered work packages + exit criteria |
| [08-acceptance-criteria.md](08-acceptance-criteria.md) | Definition of done per phase |
| [09-agent-checklist.md](09-agent-checklist.md) | Copy-paste checklist for implementing agents |
| [10-import-allowlist.md](10-import-allowlist.md) | Comprehensive allowlist of Henshin imports in core plugin |

## Code

Java SPI contracts and the Henshin adapter live under:

```
plugins/at.ac.tuwien.big.momot.core/src/at/ac/tuwien/big/momot/spi/mutation/
plugins/at.ac.tuwien.big.momot.core/src/at/ac/tuwien/big/momot/spi/mutation/henshin/
```

Phase 2 retargeted the search engine onto `MutationOperatorEngine`; Henshin is the default registered adapter. See [STATUS.md](STATUS.md).

## Agent entry point

Point an implementing agent at:

- Prompt: [`agents/prompts/mutation-spi-implement.prompt.md`](../../agents/prompts/mutation-spi-implement.prompt.md)
- Cursor rule: [`.cursor/rules/mutation-spi.mdc`](../../.cursor/rules/mutation-spi.mdc)
- This README + phases 0→N in [`07-implementation-phases.md`](07-implementation-phases.md)

## Related existing docs

- Architecture today: [../00-architecture-overview.md](../00-architecture-overview.md)
- Henshin ↔ MOMoT: [../henshin/06-momot-integration.md](../henshin/06-momot-integration.md)
- Custom MOEA mutations (escape hatch): [../java-helpers/02-custom-operators.md](../java-helpers/02-custom-operators.md)
