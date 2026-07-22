# 10 — Henshin Import Allowlist

This document defines the strict allowlist of `org.eclipse.emf.henshin` imports permitted inside the `plugins/at.ac.tuwien.big.momot.core/src/` folder. All other public search/gene contracts and optimization APIs must remain completely Henshin-free.

## Allowed Packages & Classes

| Path / Package | Permitted In | Justification / Purpose | Status |
|---|---|---|---|
| `at.ac.tuwien.big.momot.spi.mutation.henshin.**` | All | Dedicated adapter package bridging SPI contracts to Henshin transformation models. | Permanent |
| `org.eclipse.emf.henshin.interpreter.EGraph` | `TransformationSearchOrchestration`<br>`TransformationSolution`<br>`TransformationResultManager`<br>`ITransformationSolutionPrinter`<br>`GenericTransformationSolutionPrinter`<br>`OCLQueryDimension` | Core transitionary model representation under **Option A** model handle design. Exchanged at the `ModelHandle.unwrap()` boundary. | Transitional |
| `org.eclipse.emf.henshin.interpreter.Engine` | `SearchHelper`<br>`ModuleManager`<br>`MomotEngine` | Transitional/Internal engine representation for orchestrating modular rule applications. | Transitional |
| `org.eclipse.emf.henshin.model.**` | `ModuleManager`<br>`ParameterComparator`<br>`HenshinMutationEngine` | Henshin metamodeling types used privately by ModuleManager and Henshin adapter to parse `.henshin` models and match rules. | Permanent (Adapter) / Transitional (Core) |
| `org.eclipse.emf.henshin.interpreter.impl.ChangeImpl` | `TransformationSearchOrchestration` | Used only to disable legacy printing of warnings during startup. | Permanent |

## Verification Command

To audit adherence to this allowlist, run:
```bash
rg "org.eclipse.emf.henshin" plugins/at.ac.tuwien.big.momot.core/src
```
All hits must fall within the allowed paths above. Public `ITransformationVariable` and its mutations are 100% clean of Henshin.
