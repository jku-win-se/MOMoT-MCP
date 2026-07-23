package at.ac.tuwien.big.momot.spi.mutation;

import java.util.Collections;
import java.util.List;
import java.util.Random;

import org.eclipse.emf.common.util.URI;
import org.eclipse.emf.ecore.resource.Resource;
import org.eclipse.emf.ecore.resource.ResourceSet;
import org.eclipse.emf.ecore.resource.impl.ResourceSetImpl;

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
      requireLoaded();
      try {
         final URI uri = URI.createURI(modelPath);
         final ResourceSet resourceSet = new ResourceSetImpl();
         final Resource resource = resourceSet.getResource(uri, true);
         if (resource != null && !resource.getContents().isEmpty()) {
            return new StubModelHandle(resource.getContents().get(0));
         }
         throw new MutationEngineException("Loaded model is empty: " + modelPath);
      } catch (final Exception e) {
         throw new MutationEngineException("Failed to load model from path: " + modelPath, e);
      }
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
