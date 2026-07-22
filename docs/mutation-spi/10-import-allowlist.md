# 10 — Henshin Import Allowlist

Strict allowlist of `org.eclipse.emf.henshin` imports permitted inside
`plugins/at.ac.tuwien.big.momot.core/src/`. Public gene/search contracts
(`ITransformationVariable`, `OperatorApplicationVariable`, SPI DTOs) must stay Henshin-free.

## Auditing

```bash
rg "org.eclipse.emf.henshin" plugins/at.ac.tuwien.big.momot.core/src
```

Every hit must match a row below.

## Complete allowlist

| Permitted import | File(s) | Justification | Status |
|---|---|---|---|
| `at.ac.tuwien.big.momot.spi.mutation.henshin.**` | All under that package | Henshin adapter: `HenshinMutationEngine`, `HenshinModelHandle`, `RuleApplicationVariable`, `UnitApplicationVariable`, `RuleApplicationMonitor` | **Permanent** |
| `org.eclipse.emf.henshin.interpreter.EGraph` | `TransformationSearchOrchestration.java`, `TransformationSolution.java`, `TransformationResultManager.java`, `ITransformationSolutionPrinter.java`, `GenericTransformationSolutionPrinter.java`, `TransformationVariableMutation.java`, `SearchHelper.java`, `OCLQueryDimension.java`, `MomotEngine.java`, `ModuleManager.java`, `MomotUtil.java` | Option A transitional model representation; exchanged at `ModelHandle.unwrap()` | **Transitional** |
| `org.eclipse.emf.henshin.interpreter.Engine` | `SearchHelper.java`, `ModuleManager.java`, `MomotEngine.java` | Transitional engine handle (SearchHelper `#getEngine()` deprecated) | **Transitional** |
| `org.eclipse.emf.henshin.interpreter.impl.ChangeImpl` | `TransformationSearchOrchestration.java` | Disables legacy change-print warnings at startup | **Permanent** |
| `org.eclipse.emf.henshin.interpreter.Assignment`, `RuleApplication`, `UnitApplication` | `ModuleManager.java` | Private module-manager apply helpers | **Transitional** |
| `org.eclipse.emf.henshin.model.Module`, `Parameter`, `ParameterKind`, `Rule`, `Unit` | `ModuleManager.java`, `ParameterComparator.java`, `FixValue.java`, `NullValue.java` | Metamodel / parameter typing for module load and injectors | **Transitional (core)** / used by adapter |
| `org.eclipse.emf.henshin.model.resource.HenshinResourceSet` | `ModuleManager.java`, `MomotUtil.java` | Load `.henshin` / graphs relative to job base dir | **Transitional** |
| `org.eclipse.emf.henshin.interpreter.impl.EGraphImpl` | `MomotUtil.java` | Instantiates transitional `EGraph` | **Transitional** |
| `org.eclipse.emf.henshin.interpreter.Change.CompoundChange`, `Match`, `impl.EngineImpl` | `MomotEngine.java` | Henshin engine subclass details | **Transitional** (engine shared with adapter) |
| `org.eclipse.emf.henshin.model.util.ScriptEngineWrapper` | `DispatcherScriptEngine.java`, `DispatcherScriptEngineWrapper.java` | Script dispatch used by Henshin attribute/JS conditions | **Transitional** |
| `org.eclipse.emf.henshin.interpreter.*` (Match, RuleApplication, UnitApplication, monitors, impls) | `RuleApplicationVariable.java`, `UnitApplicationVariable.java`, `RuleApplicationMonitor.java`, `IRuleApplicationVariable.java`, `IUnitApplicationVariable.java` (legacy locations if present) | Prefer types under `spi.mutation.henshin`; any remaining old-package copies are adapter-internal only | **Permanent (adapter)** / migrate leftovers into `spi.mutation.henshin` |

## Not allowed

- Henshin types in `ITransformationVariable`, `OperatorApplicationVariable`, SPI DTOs (`OperatorApplication`, `MutationOperator`, …), or MOEA mutation public signatures.
- New call sites of `ModelHandle.unwrap()` (deprecated).

## Notes

- `ModuleManager` remains in core as shared job bootstrap (`.momot` still configures it); long-term it should move behind the Henshin adapter.
- Phase 2.1 documents this allowlist; full relocation of every transitional core hit is incremental and must not break T01–T04 parity.
