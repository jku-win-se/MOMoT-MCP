package at.ac.tuwien.big.momot.spi.mutation.henshin;

import at.ac.tuwien.big.momot.spi.mutation.ModelHandle;
import at.ac.tuwien.big.momot.util.MomotUtil;
import org.eclipse.emf.henshin.interpreter.EGraph;

/**
 * Henshin-specific ModelHandle implementation storing EGraph directly.
 */
public final class HenshinModelHandle implements ModelHandle {

   private final EGraph eGraph;

   public HenshinModelHandle(final EGraph eGraph) {
      this.eGraph = eGraph;
   }

   @Override
   public ModelHandle copy() {
      return new HenshinModelHandle(MomotUtil.copy(eGraph));
   }

   @Override
   public Object unwrap() {
      return eGraph;
   }

   public EGraph getEGraph() {
      return eGraph;
   }
}
