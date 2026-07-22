package at.ac.tuwien.big.momot.problem.solution.variable;

import at.ac.tuwien.big.moea.problem.solution.variable.IPlaceholderVariable;
import at.ac.tuwien.big.moea.problem.solution.variable.PlaceholderVariable;
import at.ac.tuwien.big.momot.spi.mutation.ModelHandle;
import at.ac.tuwien.big.momot.spi.mutation.MutationOperatorEngine;
import at.ac.tuwien.big.momot.spi.mutation.OperatorApplication;

/**
 * Placeholder variable implementing the Henshin-free ITransformationVariable contract.
 */
public class TransformationPlaceholderVariable extends PlaceholderVariable
      implements ITransformationVariable, IPlaceholderVariable {

   private static final long serialVersionUID = 1L;

   @Override
   public int compareTo(final ITransformationVariable other) {
      if(other instanceof TransformationPlaceholderVariable) {
         return 0;
      }
      return -1;
   }

   @Override
   public TransformationPlaceholderVariable copy() {
      return new TransformationPlaceholderVariable();
   }

   @Override
   public OperatorApplication getOperatorApplication() {
      return OperatorApplication.placeholder("");
   }

   @Override
   public boolean execute(final ModelHandle model, final MutationOperatorEngine engine) {
      return true;
   }

   @Override
   public boolean isExecuted() {
      return true;
   }

   @Override
   public boolean isPlaceholder() {
      return true;
   }

   @Override
   public String toString() {
      return "-Placeholder-\n";
   }
}
