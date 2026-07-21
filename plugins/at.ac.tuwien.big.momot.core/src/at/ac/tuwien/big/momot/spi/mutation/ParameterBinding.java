package at.ac.tuwien.big.momot.spi.mutation;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Objects;

/**
 * Parameter name → value bindings for one operator application.
 */
public final class ParameterBinding {

   private final Map<String, Object> values;

   public ParameterBinding() {
      this.values = new LinkedHashMap<>();
   }

   public ParameterBinding(final Map<String, Object> values) {
      this.values = new LinkedHashMap<>(Objects.requireNonNull(values, "values"));
   }

   public Object get(final String name) {
      return values.get(name);
   }

   public void put(final String name, final Object value) {
      values.put(name, value);
   }

   public Map<String, Object> asMap() {
      return Collections.unmodifiableMap(values);
   }

   public ParameterBinding copy() {
      return new ParameterBinding(values);
   }

   @Override
   public String toString() {
      return "ParameterBinding" + values;
   }
}
