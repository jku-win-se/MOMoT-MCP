package at.ac.tuwien.big.momot.spi.mutation;

/**
 * Stable backend identifier used by {@link MutationEngineRegistry}.
 *
 * <p>Well-known values: {@link #HENSHIN}, {@link #STUB}, {@link #EPSILON_EOL},
 * {@link #EMF_COMMANDS}.
 */
public final class MutationBackendId {

   public static final String HENSHIN = "henshin";
   public static final String STUB = "stub";
   /** Reserved — not implemented in Phase 0–2. */
   public static final String EPSILON_EOL = "epsilon-eol";
   /** Reserved — Model Server-style command operators. */
   public static final String EMF_COMMANDS = "emf-commands";

   private MutationBackendId() {}
}
