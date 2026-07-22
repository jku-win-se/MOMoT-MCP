# 03 — Henshin Adapter Plan

Package: `at.ac.tuwien.big.momot.spi.mutation.henshin`  
Backend id: `henshin`

## Responsibility

Faithful wrap of current Henshin execution so search behavior matches pre-SPI MOMoT.

## Source → SPI mapping

| Today | SPI |
|---|---|
| `Module` / `Unit` / `Rule` | `MutationOperator` |
| `Parameter` + `ParameterKind` | `OperatorParameter` + `ParamDirection` |
| `UnitApplication` / `RuleApplication` | `OperatorApplication` + adapter-internal state |
| `Engine.findMatches` + execute | `tryApply` |
| `ModuleManager` | Inside `HenshinMutationEngine` (or private collaborator) |
| `HenshinResourceSet` / `EGraph` | Adapter-private; convert at `ModelHandle` boundary |
| `ignoreUnits` | `MutationEngineConfig.ignoreOperatorIds` |
| FQN param keys `file::Module::rule::param` | Preserve in `.momot` parameter injection; resolve in adapter |

## Operator id scheme

Recommended stable id:

```text
{moduleName}::{unitName}
```

If collisions exist across files, include file stem:

```text
{fileStem}::{moduleName}::{unitName}
```

Document the chosen scheme in adapter Javadoc and stick to it (breaks logs if changed later).

## `tryApply` algorithm (match current SearchHelper)

For rules:

1. Resolve operator → Henshin `Rule`/`Unit`.
2. Bind IN/INOUT from `OperatorApplication.bindings`.
3. Find matches; pick one (same random/first policy as today — **preserve**).
4. Execute; return success/failure.

For composite units: execute via existing unit application path.

## `ModelHandle` bridging

Options (pick one in phase 1; document choice in adapter README comment):

**A (preferred for parity):** `ModelHandle` stores `EGraph`; Henshin adapter uses it directly; fitness transitional `unwrap()` returns `EGraph`.

**B:** `ModelHandle` stores `Resource`/`EObject`; adapter builds `EGraph` per apply (costlier).

Start with **A** to minimize behavior drift; note migration toward **B** when Henshin leaves the fitness path.

## Classes to extract / wrap (not delete yet)

From `momot.core`:

- `ModuleManager` → move logic into adapter or wrap as `HenshinModuleFacade`
- `RuleApplicationVariable` / `UnitApplicationVariable` → adapter-internal only
- `SearchHelper` Henshin calls → call SPI instead
- Mutation operators that import `org.eclipse.emf.henshin.model.Parameter` → use `OperatorParameter`

## Out of adapter scope

- MOEA crossover
- OCL objectives
- `.momot` parsing (except reading backend id / module list)

## Verification

- Unit: load T01 henshin module → `listOperators` contains `shiftLeft` / `shiftRight`
- Apply: T01 model + `shiftLeft` with valid params → `success=true` and model changes
- Parity: full T01–T04 tiers after engine retargeting
