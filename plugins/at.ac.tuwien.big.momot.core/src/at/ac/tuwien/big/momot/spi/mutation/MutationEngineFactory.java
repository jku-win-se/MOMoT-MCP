package at.ac.tuwien.big.momot.spi.mutation;

/**
 * Creates a {@link MutationOperatorEngine} for a backend id.
 */
@FunctionalInterface
public interface MutationEngineFactory {

   MutationOperatorEngine create();
}
