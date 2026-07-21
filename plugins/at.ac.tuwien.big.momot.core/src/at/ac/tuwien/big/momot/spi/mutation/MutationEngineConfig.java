package at.ac.tuwien.big.momot.spi.mutation;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

/**
 * Configuration passed to {@link MutationOperatorEngine#load}.
 *
 * @see docs/mutation-spi/02-spi-contract.md
 */
public final class MutationEngineConfig {

   private final String backendId;
   private final String baseDirectory;
   private final List<String> modulePaths;
   private final List<String> ignoreOperatorIds;
   private final Map<String, String> options;

   public MutationEngineConfig(
         final String backendId,
         final String baseDirectory,
         final List<String> modulePaths,
         final List<String> ignoreOperatorIds,
         final Map<String, String> options) {
      this.backendId = Objects.requireNonNull(backendId, "backendId");
      this.baseDirectory = baseDirectory;
      this.modulePaths = immutableList(modulePaths);
      this.ignoreOperatorIds = immutableList(ignoreOperatorIds);
      this.options = options != null
            ? Collections.unmodifiableMap(new LinkedHashMap<>(options))
            : Collections.emptyMap();
   }

   public String getBackendId() {
      return backendId;
   }

   public String getBaseDirectory() {
      return baseDirectory;
   }

   public List<String> getModulePaths() {
      return modulePaths;
   }

   public List<String> getIgnoreOperatorIds() {
      return ignoreOperatorIds;
   }

   public Map<String, String> getOptions() {
      return options;
   }

   private static List<String> immutableList(final List<String> in) {
      if (in == null || in.isEmpty()) {
         return Collections.emptyList();
      }
      return Collections.unmodifiableList(new ArrayList<>(in));
   }
}
