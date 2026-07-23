package at.ac.tuwien.big.momot.spi.mutation;

import org.eclipse.emf.ecore.EObject;
import org.eclipse.emf.ecore.util.EcoreUtil;

/**
 * A standard EMF model handle that does not reference any Henshin types.
 */
public final class StubModelHandle implements ModelHandle {

   private final EObject root;

   public StubModelHandle(final EObject root) {
      this.root = root;
   }

   @Override
   public ModelHandle copy() {
      return new StubModelHandle(EcoreUtil.copy(root));
   }

   @Override
   public Object unwrap() {
      return root;
   }

   public EObject getRoot() {
      return root;
   }
}
