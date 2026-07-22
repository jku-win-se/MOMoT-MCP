# 10 — Henshin Import Allowlist

This document defines the strict and complete allowlist of `org.eclipse.emf.henshin` imports permitted inside `plugins/at.ac.tuwien.big.momot.core/src/`. All public search/gene contracts, variables, and mutations remain 100% Henshin-free.

## Auditing Adherence

To audit the allowlist, run:
```bash
rg "org.eclipse.emf.henshin" plugins/at.ac.tuwien.big.momot.core/src
```
Every hit in the output must match one of the allowed paths below.

## Complete Import Allowlist

| Permitted Import | File(s) / Path(s) | Justification & Purpose | Status |
|---|---|---|---|
| `at.ac.tuwien.big.momot.spi.mutation.henshin.**` | All | Dedicated adapter package containing Henshin-specific implementation details (`HenshinMutationEngine`, `HenshinModelHandle`, `RuleApplicationVariable`, `UnitApplicationVariable`, `RuleApplicationMonitor`). | **Permanent** |
| `org.eclipse.emf.henshin.interpreter.EGraph` | `TransformationSearchOrchestration.java`<br>`TransformationSolution.java`<br>`TransformationResultManager.java`<br>`ITransformationSolutionPrinter.java`<br>`GenericTransformationSolutionPrinter.java`<br>`TransformationVariableMutation.java`<br>`SearchHelper.java`<br>`OCLQueryDimension.java`<br>`MomotEngine.java`<br>`ModuleManager.java` | Core transitionary model representation under **Option A** model handle design. Exchanged at the `ModelHandle.unwrap()` boundary. | **Transitional** |
| `org.eclipse.emf.henshin.interpreter.Engine` | `SearchHelper.java`<br>`ModuleManager.java`<br>`MomotEngine.java` | Transitionary internal engine representation for orchestrating modular rule applications. | **Transitional** |
| `org.eclipse.emf.henshin.interpreter.impl.ChangeImpl` | `TransformationSearchOrchestration.java` | Used only to disable legacy printing of warnings during startup. | **Permanent** |
| `org.eclipse.emf.henshin.interpreter.Assignment`<br>`org.eclipse.emf.henshin.interpreter.RuleApplication`<br>`org.eclipse.emf.henshin.interpreter.UnitApplication` | `ModuleManager.java` | Standard Henshin interpreter types used privately inside the module manager. | **Transitional** |
| `org.eclipse.emf.henshin.model.Module`<br>`org.eclipse.emf.henshin.model.Parameter`<br>`org.eclipse.emf.henshin.model.ParameterKind`<br>`org.eclipse.emf.henshin.model.Rule`<br>`org.eclipse.emf.henshin.model.Unit` | `ModuleManager.java`<br>`ParameterComparator.java`<br>`FixValue.java`<br>`NullValue.java` | Henshin metamodeling types used privately by ModuleManager and legacy comparators to parse `.henshin` files and match rules. | **Permanent (Adapter) / Transitional (Core)** |
| `org.eclipse.emf.henshin.model.resource.HenshinResourceSet` | `ModuleManager.java`<br>`MomotUtil.java` | Specialized EMF resource set used privately to resolve relative paths of `.henshin` files. | **Permanent (Adapter) / Transitional (Core)** |
| `org.eclipse.emf.henshin.interpreter.impl.EGraphImpl` | `MomotUtil.java` | Instantiates transitional EGraph. | **Transitional** |
| `org.eclipse.emf.henshin.interpreter.Change.CompoundChange`<br>`org.eclipse.emf.henshin.interpreter.Match`<br>`org.eclipse.emf.henshin.interpreter.impl.EngineImpl` | `MomotEngine.java` | Henshin engine implementation details utilized privately under the adapter execution boundary. | **Permanent (Adapter)** |
| `org.eclipse.emf.henshin.model.util.ScriptEngineWrapper` | `DispatcherScriptEngine.java`<br>`DispatcherScriptEngineWrapper.java` | Custom scripting engine dispatch utility. | **Permanent (Adapter)** |
