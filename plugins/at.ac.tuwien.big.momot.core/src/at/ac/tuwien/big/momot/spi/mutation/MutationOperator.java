package at.ac.tuwien.big.momot.spi.mutation;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;

/**
 * A searchable mutation operator exposed by a {@link MutationOperatorEngine}.
 */
public final class MutationOperator {

   private final String id;
   private final String displayName;
   private final List<OperatorParameter> parameters;
   private final Set<String> tags;

   public MutationOperator(
         final String id,
         final String displayName,
         final List<OperatorParameter> parameters,
         final Set<String> tags) {
      this.id = Objects.requireNonNull(id, "id");
      this.displayName = displayName != null ? displayName : id;
      this.parameters = Collections.unmodifiableList(new ArrayList<>(
            Objects.requireNonNull(parameters, "parameters")));
      this.tags = Collections.unmodifiableSet(new LinkedHashSet<>(
            tags != null ? tags : Collections.emptySet()));
   }

   public String getId() {
      return id;
   }

   public String getDisplayName() {
      return displayName;
   }

   public List<OperatorParameter> getParameters() {
      return parameters;
   }

   public Set<String> getTags() {
      return tags;
   }

   @Override
   public String toString() {
      return id;
   }
}
