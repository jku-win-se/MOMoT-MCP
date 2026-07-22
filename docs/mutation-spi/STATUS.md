# Mutation SPI — STATUS

| Field | Value |
|---|---|
| Branch | `feat/mutation-operator-spi` |
| Phase completed | **2.1 — Cleanup** |
| Next phase | **3 — DSL / protocol niceties (or stop for PR)** |
| Production search path | SPI-retargeted (Henshin adapter) |
| Agent prompt | `agents/prompts/mutation-spi-implement.prompt.md` |

## Notes

- The root `pom.xml`'s `<module>tests</module>` has been enabled to compile and run the E2E Tycho integration/unit test suite (`at.ac.tuwien.big.momot.core.tests`) directly from the maven build, ensuring continuous verification of SPI adapter implementations and target platform sanity.
- **ModuleManager Reuse/Wiring Fix:** Wire `HenshinMutationEngine` to receive and reuse the orchestration's pre-configured `ModuleManager` instance rather than creating a fresh one. This fully preserves all generated rules/units, ignored operators (`ignoreUnits`), ignored parameters, and custom parameter values/injectors, maintaining exact behavioral parity.
