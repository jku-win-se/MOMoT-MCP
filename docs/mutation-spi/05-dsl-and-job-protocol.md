# 05 — DSL and Job Protocol

Backward compatibility is mandatory for phase 1–2.

## `.momot` transformations block (today)

```text
transformations {
    modules = ["model/myRules.henshin"]
    ignoreUnits = ["helperRule"]
}
```

## Target (compatible)

```text
transformations {
    backend = "henshin"                    // optional; default "henshin"
    modules = ["model/myRules.henshin"]
    ignoreUnits = ["helperRule"]           // keep name for Henshin; SPI maps to ignoreOperatorIds
    // future:
    // options = { "henshin.engine.option": "value" }
}
```

### Rules

| Change | Compat |
|---|---|
| Omit `backend` | Defaults to `henshin` |
| `backend = "henshin"` + `.henshin` modules | Current behavior |
| Unknown backend | Fail at load with clear error |
| `ignoreUnits` | Henshin-only alias; other backends may accept `ignoreOperators` later |

## Parameter injection

Keep FQN keys working for Henshin:

```text
"model/stack.henshin::StackModule::shiftLeft::amount"
```

SPI resolution: Henshin adapter maps FQN → operator id + param name.  
Document mapping in adapter; do not invent a new key scheme until a second backend needs it.

## Job ZIP

Still contains metamodel, instance, transformation modules, `.momot`, optional Java helpers.

Add optional metadata file (phase 3+, non-breaking):

```text
job/manifest.json
{
  "mutationBackend": "henshin",
  "engineApiVersion": 1
}
```

If absent, infer from `.momot`.

## REST `/run`

No breaking change required for SPI phases 1–2.

Later optional response fields:

- `diagnostics.mutationBackend`
- `diagnostics.operatorCatalog` (ids listed at job start)

## MCP

`execute_momot_job` / `generate_*` remain valid.  
Generation tools that emit Henshin stay Henshin-specific until a multi-backend generator exists (out of scope for SPI core).

## Validation tools

- `validate_henshin` remains Henshin-specific.
- Future: `validate_mutation_module(backend, path)` — not in phase 1.
