package at.ac.tuwien.big.momot.problem.solution.variable;

import at.ac.tuwien.big.momot.spi.mutation.ApplyResult;
import at.ac.tuwien.big.momot.spi.mutation.ModelHandle;
import at.ac.tuwien.big.momot.spi.mutation.MutationOperatorEngine;
import at.ac.tuwien.big.momot.spi.mutation.OperatorApplication;

import java.util.Objects;

/**
 * MOEA variable wrapping a pluggable SPI OperatorApplication.
 */
public class OperatorApplicationVariable implements ITransformationVariable {

   private static final long serialVersionUID = 1L;

   private final OperatorApplication operatorApplication;
   private boolean executed;

   public OperatorApplicationVariable(final OperatorApplication operatorApplication) {
      this.operatorApplication = Objects.requireNonNull(operatorApplication, "operatorApplication");
   }

   @Override
   public OperatorApplication getOperatorApplication() {
      return operatorApplication;
   }

   @Override
   public boolean execute(final ModelHandle model, final MutationOperatorEngine engine) {
      if (operatorApplication.isPlaceholder()) {
         this.executed = false;
         return false;
      }
      final ApplyResult result = engine.tryApply(model, operatorApplication);
      this.executed = result.isSuccess();
      return this.executed;
   }

   @Override
   public boolean isExecuted() {
      return executed;
   }

   public void setExecuted(final boolean executed) {
      this.executed = executed;
   }

   @Override
   public boolean isPlaceholder() {
      return operatorApplication.isPlaceholder();
   }

   @Override
   public void randomize() {
      throw new IllegalAccessError("Should not be called. Is taken care of by an IPopulationGenerator.");
   }

   @Override
   public ITransformationVariable copy() {
      final OperatorApplicationVariable copy = new OperatorApplicationVariable(operatorApplication.copy());
      copy.executed = this.executed;
      return copy;
   }

   @Override
   public int compareTo(final ITransformationVariable other) {
      if (other == null) {
         return 1;
      }
      return Integer.compare(this.hashCode(), other.hashCode());
   }

   @Override
   public String toString() {
      return operatorApplication.toString();
   }
}
