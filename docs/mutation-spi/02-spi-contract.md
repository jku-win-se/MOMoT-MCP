# 02 — SPI Contract

Canonical Java package:

`at.ac.tuwien.big.momot.spi.mutation`

Scaffold sources are under `plugins/at.ac.tuwien.big.momot.core/src/at/ac/tuwien/big/momot/spi/mutation/`.  
Until phase 1 lands, methods may throw `UnsupportedOperationException("SPI scaffold")`.

## Types

### `MutationBackendId`

Stable string id for registry lookup.

| Id | Meaning |
|---|---|
| `henshin` | Default; current behavior |
| `epsilon-eol` | Reserved (not implemented) |
| `emf-commands` | Reserved (Model Server-style commands) |
| `stub` | Test double / scaffolding proof |

### `ModelHandle`

Opaque handle to a mutable model instance used during one evaluation (or a copy thereof).

**Required operations (engine-facing):**

- `ModelHandle copy()` — deep enough for independent evaluation
- `Object unwrap()` — escape hatch for fitness code that today takes `EGraph` / `EObject` (transitional)
- Identity / equals: not required; treat as unique per copy

### `MutationOperator`

Describes one searchable operator.

| Field | Type | Notes |
|---|---|---|
| `id` | `String` | Stable within backend+module, e.g. `stack::shiftLeft` |
| `displayName` | `String` | Human label |
| `parameters` | `List<OperatorParameter>` | IN/INOUT searchable params only by default |
| `tags` | `Set<String>` | optional (`rule`, `unit`, `helper`) |

### `OperatorParameter`

| Field | Type | Notes |
|---|---|---|
| `name` | `String` | |
| `kind` | `ParamDirection` | `IN`, `INOUT`, `OUT`, `VAR` |
| `valueType` | `ParamValueType` | `STRING`, `INT`, `DOUBLE`, `BOOLEAN`, `OBJECT`, `UNKNOWN` |
| `searchable` | `boolean` | if false, engine does not sample (OUT/VAR typically false) |

### `ParameterBinding`

Map `paramName → Object` for one application attempt. Values are Java boxed primitives or strings unless the adapter documents otherwise.

### `OperatorApplication` (gene)

Serializable-enough gene slot:

| Field | Type | Notes |
|---|---|---|
| `operatorId` | `String` | |
| `bindings` | `ParameterBinding` | |
| `placeholder` | `boolean` | failed/empty slot (maps to today’s placeholder variables) |

Must support `copy()` for MOEA variable cloning.

### `ApplyResult`

| Field | Type | Notes |
|---|---|---|
| `success` | `boolean` | |
| `message` | `String` | optional diagnostic |
| `outBindings` | `ParameterBinding` | optional OUT/INOUT results |

### `MutationOperatorEngine`

Backend SPI. One instance per job (loaded modules + config).

```text
String backendId();

void load(MutationEngineConfig config);   // modules, ignore list, RNG seed hooks
void close();                             // release resources

List<MutationOperator> listOperators();   // after ignoreFilters

ParameterBinding sampleParameters(MutationOperator op, Random rng);

ApplyResult tryApply(ModelHandle model, OperatorApplication gene);

ApplyResult replay(ModelHandle model, List<OperatorApplication> genes);
  // default impl: sequential tryApply; stop or placeholder policy is engine-owned

ModelHandle loadInitialModel(URI/path);   // or supplied by orchestration
```

Exact method signatures live in the Java stubs. Docs win if a stub drifts — update both.

## Invariants

1. **No Henshin types** in SPI method signatures.
2. `tryApply` mutates the given `ModelHandle` only on success (or documents rollback — Henshin adapter should match today’s semantics).
3. Failed apply → search layer converts to placeholder / repair (existing policy), not adapter-thrown hard abort (unless catastrophic).
4. `listOperators` excludes ignored helpers (`ignoreUnits` equivalent).
5. Operator ids are stable across runs for the same modules (needed for logs/repro).

## Error model

| Case | Behavior |
|---|---|
| Unknown operator id | `ApplyResult.success=false` + message |
| Missing required IN param | fail apply |
| Backend load failure | throw checked/`MutationEngineException` at `load` |
| Model copy failure | throw — evaluation cannot proceed |

## Registry

`MutationEngineRegistry` maps `backendId → factory`.

```text
MutationOperatorEngine create(String backendId, MutationEngineConfig config);
```

Factories registered via ServiceLoader and/or explicit static register in runner bootstrap.

## Config (`MutationEngineConfig`)

Minimum fields:

- `backendId`
- `modulePaths` (list of strings relative to job root)
- `ignoreOperatorIds` / names
- `baseDirectory` / resource set root
- optional: engine options map (`Map<String,String>`) for backend-specific knobs

## Mapping from today’s Henshin concepts

See [03-henshin-adapter-plan.md](03-henshin-adapter-plan.md).
