# 04 — Engine Retargeting

Which `momot.core` pieces must stop depending on Henshin **outside** the adapter package.

## Hard rule

After phase 2 (engine on SPI):

```text
rg "org.eclipse.emf.henshin" plugins/at.ac.tuwien.big.momot.core/src
```

Must only hit:

- `at.ac.tuwien.big.momot.spi.mutation.henshin.**`
- Optionally a short allowlist of transitional util facades explicitly named in this doc

## Replace / retarget

| Class / area | Action |
|---|---|
| `ITransformationVariable` | Stop extending `UnitApplication`. Hold `OperatorApplication` (+ optional runtime handle). |
| `IRuleApplicationVariable` | Delete from public search API or demote to Henshin-internal. |
| `RuleApplicationVariable` / unit vars | Move under henshin adapter. |
| `SearchHelper` | Call `MutationOperatorEngine.sample` / `tryApply` / `replay`. |
| `TransformationVariableMutation` | Operate on `OperatorApplication` ids/bindings. |
| `TransformationParameterMutation` | Use `OperatorParameter`, not Henshin `Parameter`. |
| `TransformationPlaceholderMutation` | Set `placeholder=true` on gene. |
| `TransformationSolution` | Replay via SPI; store `ModelHandle`. |
| `TransformationSearchOrchestration` | Inject `MutationOperatorEngine` instead of raw Henshin engine. |
| `ModuleManager` | Move into henshin adapter; orchestration uses SPI only. |
| `MomotUtil` HenshinResourceSet helpers | Keep temporarily as util used by adapter + transitional fitness; mark `@Deprecated` for core callers. |
| Fitness `EGraph*` types | Transitional: accept `ModelHandle` and unwrap; follow-up issue to take `EObject`/`Resource`. |
| Monitors (`RuleApplicationMonitor`) | Backend-specific or SPI event listener (phase 2.1). |

## Gene / MOEA variable

Today: Henshin application implements MOEA `Variable`.

Target:

```text
OperatorApplicationVariable implements org.moeaframework.core.Variable
  - wraps OperatorApplication
  - copy() deep-copies bindings
  - no Henshin types
```

## Construction sequence (job start)

```text
1. Parse .momot → backendId (default henshin), modules, ignore, params, fitness, algorithms
2. registry.create(backendId, config) → MutationOperatorEngine
3. engine.load(config)
4. load initial ModelHandle
5. wire TransformationSearchOrchestration with engine + fitness
6. run MOEA
7. engine.close()
```

## Forbidden patterns after retarget

- `extends RuleApplicationImpl` in search package
- Importing `org.eclipse.emf.henshin.interpreter.*` from `search.**`
- Casting genes to Henshin matches in fitness

## Allowed transitional patterns

- Fitness dimensions that still take `EGraph` via `ModelHandle.unwrap()` with instanceof checks
- Docker still shipping Henshin JARs (required by henshin adapter)
