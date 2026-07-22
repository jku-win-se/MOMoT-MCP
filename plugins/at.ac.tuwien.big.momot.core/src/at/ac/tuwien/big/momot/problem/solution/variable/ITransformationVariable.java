package at.ac.tuwien.big.momot.problem.solution.variable;

import at.ac.tuwien.big.momot.spi.mutation.ModelHandle;
import at.ac.tuwien.big.momot.spi.mutation.MutationOperatorEngine;
import at.ac.tuwien.big.momot.spi.mutation.OperatorApplication;
import org.moeaframework.core.Variable;

/**
 * Public search/gene API representing one slot in the transformation solution.
 * Completely free of Henshin types.
 */
public interface ITransformationVariable extends Variable, Comparable<ITransformationVariable> {

   @Override
   ITransformationVariable copy();

   /**
    * @return the underlying SPI gene slot
    */
   OperatorApplication getOperatorApplication();

   /**
    * Executes the operator application on the model.
    */
   boolean execute(ModelHandle model, MutationOperatorEngine engine);

   /**
    * @return true if the execution was successful
    */
   boolean isExecuted();

   /**
    * @return true if this slot is a failed/empty placeholder
    */
   boolean isPlaceholder();
}
