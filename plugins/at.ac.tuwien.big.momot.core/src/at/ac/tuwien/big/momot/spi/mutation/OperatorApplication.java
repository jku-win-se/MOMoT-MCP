package at.ac.tuwien.big.momot.spi.mutation;

import java.util.Objects;

/**
 * One gene slot: which operator to apply and with which bindings.
 *
 * <p>Replaces Henshin {@code UnitApplication}-backed variables in the search chromosome
 * once Phase 2 lands.
 */
public final class OperatorApplication {

   private final String operatorId;
   private final ParameterBinding bindings;
   private final boolean placeholder;

   public OperatorApplication(
         final String operatorId,
         final ParameterBinding bindings,
         final boolean placeholder) {
      this.operatorId = Objects.requireNonNull(operatorId, "operatorId");
      this.bindings = bindings != null ? bindings.copy() : new ParameterBinding();
      this.placeholder = placeholder;
   }

   public static OperatorApplication placeholder(final String operatorId) {
      return new OperatorApplication(operatorId != null ? operatorId : "", new ParameterBinding(), true);
   }

   public String getOperatorId() {
      return operatorId;
   }

   public ParameterBinding getBindings() {
      return bindings;
   }

   public boolean isPlaceholder() {
      return placeholder;
   }

   public OperatorApplication copy() {
      return new OperatorApplication(operatorId, bindings.copy(), placeholder);
   }

   @Override
   public String toString() {
      return placeholder ? ("∅:" + operatorId) : (operatorId + bindings);
   }
}
