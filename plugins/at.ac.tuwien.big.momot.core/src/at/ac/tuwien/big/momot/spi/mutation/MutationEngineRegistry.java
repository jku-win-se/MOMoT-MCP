package at.ac.tuwien.big.momot.spi.mutation;

import java.util.Map;
import java.util.Objects;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Registry of mutation backend factories.
 *
 * <p>Phase 1 should register {@link MutationBackendId#HENSHIN}.
 * Phase 4 may register {@link MutationBackendId#STUB}.
 */
public final class MutationEngineRegistry {

   private static final MutationEngineRegistry INSTANCE = new MutationEngineRegistry();

   private final Map<String, MutationEngineFactory> factories = new ConcurrentHashMap<>();

   public static MutationEngineRegistry getInstance() {
      return INSTANCE;
   }

   public void register(final String backendId, final MutationEngineFactory factory) {
      Objects.requireNonNull(backendId, "backendId");
      Objects.requireNonNull(factory, "factory");
      factories.put(backendId, factory);
   }

   public boolean isRegistered(final String backendId) {
      return factories.containsKey(backendId);
   }

   /**
    * Create an unloaded engine for {@code backendId}, then caller must {@link MutationOperatorEngine#load}.
    */
   public MutationOperatorEngine create(final String backendId) throws MutationEngineException {
      final MutationEngineFactory factory = factories.get(backendId);
      if (factory == null) {
         throw new MutationEngineException(
               "Unknown mutation backend '" + backendId + "'. Registered: " + factories.keySet());
      }
      return factory.create();
   }

   /**
    * Convenience: create + load.
    */
   public MutationOperatorEngine createAndLoad(final MutationEngineConfig config)
         throws MutationEngineException {
      final MutationOperatorEngine engine = create(config.getBackendId());
      engine.load(config);
      return engine;
   }

   /** Test helper — clears registrations. */
   public void clear() {
      factories.clear();
   }
}
