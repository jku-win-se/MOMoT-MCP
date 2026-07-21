# 09 — Agent Checklist

Use when implementing on branch `feat/mutation-operator-spi` (or a follow-up branch from it).

## Before coding

1. Read [README.md](README.md), [00-goals-and-non-goals.md](00-goals-and-non-goals.md), [02-spi-contract.md](02-spi-contract.md).
2. Confirm which **phase** you are implementing ([07](07-implementation-phases.md)).
3. Do **not** implement later phases early.
4. Do **not** rewrite MOMoT in TypeScript/Python in this epic.

## Phase 1 checklist

- [ ] Complete Java types in `spi.mutation` (match contract doc)
- [ ] Implement `HenshinMutationEngine`
- [ ] Register in `MutationEngineRegistry`
- [ ] Tests against `test-suite/T01-stack-balancing` artifacts
- [ ] Leave orchestration on old path unless feature flag agreed

## Phase 2 checklist

- [ ] `OperatorApplicationVariable` + search retarget
- [ ] Strip Henshin from `ITransformationVariable`
- [ ] Move Henshin-only classes under `spi.mutation.henshin`
- [ ] Run T01–T04 tiers 1–3
- [ ] Update `test-suite/RESULTS.md` if process requires

## Phase 3+ checklist

- [ ] Follow respective docs (05 DSL, 06 TS)
- [ ] Keep backward compatibility

## Done criteria for a PR

- [ ] Acceptance criteria for the phase are met ([08](08-acceptance-criteria.md))
- [ ] No Henshin types in SPI signatures
- [ ] Docs updated if id scheme / DSL changed
- [ ] Conventional commit messages (`feat:`, `refactor:`, `test:`, `docs:`)

## Forbidden

- Pushing EA evaluate loops through Model Server
- Deleting Henshin support before parity
- Changing fitness semantics “while here”
- Large unrelated refactors
