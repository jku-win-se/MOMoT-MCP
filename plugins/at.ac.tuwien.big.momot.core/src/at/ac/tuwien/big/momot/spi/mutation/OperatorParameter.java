package at.ac.tuwien.big.momot.spi.mutation;

import java.util.Objects;

/**
 * Description of a single operator parameter.
 */
public final class OperatorParameter {

   private final String name;
   private final ParamDirection direction;
   private final ParamValueType valueType;
   private final boolean searchable;

   public OperatorParameter(
         final String name,
         final ParamDirection direction,
         final ParamValueType valueType,
         final boolean searchable) {
      this.name = Objects.requireNonNull(name, "name");
      this.direction = Objects.requireNonNull(direction, "direction");
      this.valueType = Objects.requireNonNull(valueType, "valueType");
      this.searchable = searchable;
   }

   public String getName() {
      return name;
   }

   public ParamDirection getDirection() {
      return direction;
   }

   public ParamValueType getValueType() {
      return valueType;
   }

   /** If false, the evolutionary engine should not sample this parameter. */
   public boolean isSearchable() {
      return searchable;
   }

   @Override
   public String toString() {
      return name + ":" + direction + "/" + valueType + (searchable ? "" : "(fixed)");
   }
}
