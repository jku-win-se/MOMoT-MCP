package at.ac.tuwien.big.momot.spi.mutation;

/**
 * Checked failure during engine load or catastrophic apply setup.
 */
public class MutationEngineException extends Exception {

   private static final long serialVersionUID = 1L;

   public MutationEngineException(final String message) {
      super(message);
   }

   public MutationEngineException(final String message, final Throwable cause) {
      super(message, cause);
   }
}
