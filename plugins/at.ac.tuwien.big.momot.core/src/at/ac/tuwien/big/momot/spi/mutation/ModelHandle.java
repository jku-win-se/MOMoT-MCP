package at.ac.tuwien.big.momot.spi.mutation;

/**
 * Opaque handle to a model instance used during search evaluation.
 *
 * <p>Adapters must not leak backend-specific types through SPI method signatures.
 * Transitional fitness code may use {@link #unwrap()} until retargeted.
 *
 * @see docs/mutation-spi/02-spi-contract.md
 */
public interface ModelHandle {

   /**
    * Deep-enough copy for an independent evaluation (must not share mutable state
    * with the original in a way that races evaluations).
    */
   ModelHandle copy();

   /**
    * @deprecated Escape hatch for transitional code (e.g. today's {@code EGraph}-based fitness).
    * Prefer eliminating unwrap callers in Phase 2.1.
    */
   @Deprecated
   Object unwrap();
}
