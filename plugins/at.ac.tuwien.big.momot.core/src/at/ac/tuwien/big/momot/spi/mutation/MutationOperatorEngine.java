package at.ac.tuwien.big.momot.spi.mutation;

import java.util.List;
import java.util.Random;

/**
 * Pluggable mutation / transformation backend used by the evolutionary engine.
 *
 * <p><b>Scaffold:</b> default methods throw until Phase 1 implementation.
 * Contract: {@code docs/mutation-spi/02-spi-contract.md}.
 *
 * <p>Implementations must not expose Henshin (or other MTL) types in this interface.
 */
public interface MutationOperatorEngine extends AutoCloseable {

   /** @return backend id, e.g. {@link MutationBackendId#HENSHIN} */
   String backendId();

   /**
    * Load modules and prepare for search. Called once per job.
    */
   void load(MutationEngineConfig config) throws MutationEngineException;

   /**
    * Operators available after applying ignore filters.
    */
   List<MutationOperator> listOperators();

   /**
    * Sample searchable IN/INOUT parameters for {@code op}.
    */
   ParameterBinding sampleParameters(MutationOperator op, Random rng);

   /**
    * Attempt a single operator application on {@code model}.
    * On failure return {@link ApplyResult#failure(String)} (search may placeholder/repair).
    */
   ApplyResult tryApply(ModelHandle model, OperatorApplication gene);

   /**
    * Replay a gene sequence for fitness evaluation.
    * Default strategy: sequential {@link #tryApply}; placeholders skipped.
    */
   default ApplyResult replay(final ModelHandle model, final List<OperatorApplication> genes) {
      ApplyResult last = ApplyResult.ok();
      if (genes == null) {
         return last;
      }
      for (final OperatorApplication gene : genes) {
         if (gene == null || gene.isPlaceholder()) {
            continue;
         }
         last = tryApply(model, gene);
         // Policy (preserve vs abort-on-fail) is finalized in Phase 2 to match SearchHelper.
      }
      return last;
   }

   /**
    * Load the initial model for this job as a {@link ModelHandle}.
    * Exact URI/path API may be refined in Phase 1; scaffold takes a path string.
    */
   ModelHandle loadInitialModel(String modelPath) throws MutationEngineException;

   @Override
   void close();
}
