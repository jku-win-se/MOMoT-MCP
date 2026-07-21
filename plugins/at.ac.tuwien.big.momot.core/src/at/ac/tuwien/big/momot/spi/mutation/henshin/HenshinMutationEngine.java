package at.ac.tuwien.big.momot.spi.mutation.henshin;

import at.ac.tuwien.big.momot.spi.mutation.ApplyResult;
import at.ac.tuwien.big.momot.spi.mutation.ModelHandle;
import at.ac.tuwien.big.momot.spi.mutation.MutationBackendId;
import at.ac.tuwien.big.momot.spi.mutation.MutationEngineConfig;
import at.ac.tuwien.big.momot.spi.mutation.MutationEngineException;
import at.ac.tuwien.big.momot.spi.mutation.MutationOperator;
import at.ac.tuwien.big.momot.spi.mutation.MutationOperatorEngine;
import at.ac.tuwien.big.momot.spi.mutation.OperatorApplication;
import at.ac.tuwien.big.momot.spi.mutation.ParameterBinding;

import java.util.Collections;
import java.util.List;
import java.util.Random;

/**
 * Henshin adapter — <b>scaffold only</b>.
 *
 * <p>Phase 1 implementation checklist:
 * <ul>
 *   <li>Wrap {@code ModuleManager} / Henshin {@code Engine}</li>
 *   <li>Map units → {@link MutationOperator}</li>
 *   <li>Implement {@link #tryApply} via findMatches + execute</li>
 *   <li>Bridge {@link ModelHandle} ↔ {@code EGraph} (prefer storing EGraph — plan option A)</li>
 *   <li>Register with {@link at.ac.tuwien.big.momot.spi.mutation.MutationEngineRegistry}</li>
 * </ul>
 *
 * @see docs/mutation-spi/03-henshin-adapter-plan.md
 */
public final class HenshinMutationEngine implements MutationOperatorEngine {

   @Override
   public String backendId() {
      return MutationBackendId.HENSHIN;
   }

   @Override
   public void load(final MutationEngineConfig config) throws MutationEngineException {
      throw new MutationEngineException(
            "HenshinMutationEngine.load not implemented yet (Phase 1). "
                  + "See docs/mutation-spi/03-henshin-adapter-plan.md");
   }

   @Override
   public List<MutationOperator> listOperators() {
      return Collections.emptyList();
   }

   @Override
   public ParameterBinding sampleParameters(final MutationOperator op, final Random rng) {
      throw new UnsupportedOperationException(
            "HenshinMutationEngine.sampleParameters not implemented yet (Phase 1)");
   }

   @Override
   public ApplyResult tryApply(final ModelHandle model, final OperatorApplication gene) {
      throw new UnsupportedOperationException(
            "HenshinMutationEngine.tryApply not implemented yet (Phase 1)");
   }

   @Override
   public ModelHandle loadInitialModel(final String modelPath) throws MutationEngineException {
      throw new MutationEngineException(
            "HenshinMutationEngine.loadInitialModel not implemented yet (Phase 1). path=" + modelPath);
   }

   @Override
   public void close() {
      // no-op until Phase 1 holds Henshin resources
   }
}
