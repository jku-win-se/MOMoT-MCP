# Imports and Henshin Modules

Imports and module declarations connect script logic to runtime classes and transformation assets.

## Import guidance

- Import only types actually used in objectives or helper expressions.
- Prefer stable API types from MOMoT runtime packages.
- Keep imports explicit to simplify generated-code debugging.

Example:

```text
import at.ac.tuwien.big.momot.search.fitness.dimension.TransformationLengthDimension
```

## Henshin module declaration

```text
transformations = {
	modules = [ "transformations/rules.henshin" ]
}
```

For multiple modules:

```text
transformations = {
	modules = [
		"transformations/base.henshin",
		"transformations/extensions.henshin"
	]
}
```

## Ordering and consistency

- Keep module list order deterministic.
- Avoid duplicate module entries.
- Ensure referenced transformations match metamodel expectations.

## Common failure patterns

- Module file exists but references unavailable metamodel URIs.
- Import points to class not present in runtime classpath.
- Script compiles but runtime fails due to transformation preconditions not met.

## Validation checklist

- Every import resolves in the headless runtime classpath.
- Every module path is present in zip and readable.
- Module rules are compatible with the uploaded model instance.

---

## Pluggable Search Backend (SPI)
MOMoT 2.0 uses a pluggable **Mutation Operator SPI** under the hood. The modules listed in the `transformations` block are loaded and executed abstractly via `MutationOperatorEngine`. Henshin is the default backend adapter, but alternative backends can be dynamically registered in `MutationEngineRegistry` (such as the proof-of-concept `stub` engine).

You can explicitly configure the mutation backend inside the `transformations` block:

```text
transformations = {
	backend = "henshin" // optional; default "henshin"
	modules = [ "transformations/rules.henshin" ]
}
```

If the specified backend is not registered, the system will fail-fast at load-time and list the currently registered backend adapters (e.g. `[henshin, stub]`).
