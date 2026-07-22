package at.ac.tuwien.big.momot.spi.mutation;

import java.util.Collections;
import java.util.List;
import java.util.Random;

/**
 * Scaffold / CI proof backend. Phase 4 fleshes this out.
 *
 * <p>Registered optionally; not used by production jobs.
 */
public final class StubMutationEngine implements MutationOperatorEngine {

   private boolean loaded;

   @Override
   public String backendId() {
      return MutationBackendId.STUB;
   }

   @Override
   public void load(final MutationEngineConfig config) throws MutationEngineException {
      this.loaded = true;
   }

   @Override
   public List<MutationOperator> listOperators() {
      requireLoaded();
      return Collections.singletonList(
            new MutationOperator(
                  "stub::noop",
                  "noop",
                  Collections.emptyList(),
                  Collections.singleton("stub")));
   }

   @Override
   public ParameterBinding sampleParameters(final MutationOperator op, final Random rng) {
      return new ParameterBinding();
   }

   @Override
   public ApplyResult tryApply(final ModelHandle model, final OperatorApplication gene) {
      // Identity: success without mutating (Phase 4 may refine).
      return ApplyResult.ok();
   }

   @Override
   public ModelHandle loadInitialModel(final String modelPath) throws MutationEngineException {
      throw new MutationEngineException(
            "StubMutationEngine.loadInitialModel not implemented (Phase 4). path=" + modelPath);
   }

   @Override
   public void close() {
      loaded = false;
   }

   private void requireLoaded() {
      if (!loaded) {
         throw new IllegalStateException("StubMutationEngine not loaded");
      }
   }
}
