package at.ac.tuwien.big.momot.spi.mutation;

/**
 * Result of {@link MutationOperatorEngine#tryApply}.
 */
public final class ApplyResult {

   private final boolean success;
   private final String message;
   private final ParameterBinding outBindings;

   public ApplyResult(final boolean success, final String message, final ParameterBinding outBindings) {
      this.success = success;
      this.message = message;
      this.outBindings = outBindings != null ? outBindings : new ParameterBinding();
   }

   public static ApplyResult ok() {
      return new ApplyResult(true, null, null);
   }

   public static ApplyResult ok(final ParameterBinding outBindings) {
      return new ApplyResult(true, null, outBindings);
   }

   public static ApplyResult failure(final String message) {
      return new ApplyResult(false, message, null);
   }

   public boolean isSuccess() {
      return success;
   }

   public String getMessage() {
      return message;
   }

   public ParameterBinding getOutBindings() {
      return outBindings;
   }
}
