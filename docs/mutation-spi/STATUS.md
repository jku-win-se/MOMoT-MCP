# Mutation SPI — STATUS

| Field | Value |
|---|---|
| Branch | `feat/mutation-operator-spi` |
| Phase completed | **1 — Henshin adapter implementation** |
| Next phase | **2 — Retarget search engine to SPI** |
| Production search path | Still Henshin-direct (unchanged) |
| Agent prompt | `agents/prompts/mutation-spi-implement.prompt.md` |

## Notes

- The root `pom.xml`'s `<module>tests</module>` has been enabled to compile and run the E2E Tycho integration/unit test suite (`at.ac.tuwien.big.momot.core.tests`) directly from the maven build, ensuring continuous verification of SPI adapter implementations and target platform sanity.
