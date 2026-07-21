package at.ac.tuwien.big.momot.problem.solution.variable;

import at.ac.tuwien.big.moea.util.CastUtil;

import org.eclipse.emf.henshin.interpreter.Assignment;
import org.eclipse.emf.henshin.interpreter.Change;
import org.eclipse.emf.henshin.interpreter.EGraph;
import org.eclipse.emf.henshin.interpreter.Engine;
import org.eclipse.emf.henshin.interpreter.impl.AssignmentImpl;
import org.eclipse.emf.henshin.interpreter.impl.MatchImpl;
import org.eclipse.emf.henshin.interpreter.impl.RuleApplicationImpl;
import org.eclipse.emf.henshin.model.Parameter;
import org.eclipse.emf.henshin.model.Rule;

public class RuleApplicationVariable extends RuleApplicationImpl implements IRuleApplicationVariable {

   private static final long serialVersionUID = 5601540634156998449L;

   public RuleApplicationVariable(final Engine engine, final EGraph graph, final Rule rule,
         final Assignment partialMatch) {
      super(engine, graph, rule, partialMatch);
   }

   public RuleApplicationVariable(final RuleApplicationVariable variable) {
      this(variable.getEngine(), variable.getEGraph(), variable.getRule(),
            new AssignmentImpl(variable.getAssignment(), false));
   }

   public int compareTo(final RuleApplicationVariable other) {
      return Integer.compare(this.hashCode(), other.hashCode());
   }

   public RuleApplicationVariable copy() {
      return new RuleApplicationVariable(this);
   }

   public boolean execute() {
      return execute(true);
   }

   public boolean execute(final boolean reexecute) {
      if(isExecuted && !reexecute) {
         return isExecuted;
      }
      return execute(null);
   }

   public Change getChange() {
      return change;
   }

   public Engine getEngine() {
      return engine;
   }

   protected Parameter getParameter(final String parameterName) {
      if(unit == null) {
         throw new RuntimeException("Transformation unit not set");
      }
      final Parameter param = unit.getParameter(parameterName);
      if(param == null) {
         throw new RuntimeException(
               "No parameter \"" + parameterName + "\" in transformation unit \"" + unit.getName() + "\" found.");
      }
      return param;
   }

   public Object getParameterValue(final Parameter parameter) {
      if(partialMatch == null) {
         return null;
      }
      if(parameter == null) {
         throw new IllegalArgumentException("Null parameter.");
      }
      if(parameter.getUnit() != unit) {
         throw new RuntimeException("Parameter unit invalid.");
      }

      return partialMatch.getParameterValue(parameter);
   }

   public <T> T getParameterValue(final Parameter parameter, final Class<T> valueClass) {
      return CastUtil.asClass(getParameterValue(parameter), valueClass);
   }

   public Object getParameterValue(final String parameterName) {
      return getParameterValue(getParameter(parameterName));
   }

   public <T> T getParameterValue(final String parameterName, final Class<T> valueClass) {
      return CastUtil.asClass(getParameterValue(parameterName), valueClass);
   }

   public Object getResultParameterValue(final Parameter parameter) {
      if(parameter == null) {
         throw new RuntimeException("Null parameter.");
      }
      if(parameter.getUnit() != unit) {
         throw new RuntimeException("Incorrect parameter unit.");
      }
      if(resultMatch == null) {
         return null;
      }

      return resultMatch.getParameterValue(parameter);
   }

   public <T> T getResultParameterValue(final Parameter parameter, final Class<T> valueClass) {
      return CastUtil.asClass(getResultParameterValue(parameter.getName()), valueClass);
   }

   public Object getResultParameterValue(final String parameterName) {
      return getResultParameterValue(getParameter(parameterName));
   }

   public <T> T getResultParameterValue(final String parameterName, final Class<T> resultClass) {
      return getResultParameterValue(getParameter(parameterName), resultClass);
   }

   public boolean isExecuted() {
      return isExecuted;
   }

   public boolean isUndone() {
      return isUndone;
   }

   public void randomize() {
      throw new IllegalAccessError("Should not be called. Is taken care of by an IPopulationGenerator.");
   }

   public void setParameterValue(final Parameter parameter, final Object value) {
      if(parameter == null) {
         throw new RuntimeException("Null parameter.");
      }
      if(parameter.getUnit() != unit) {
         throw new RuntimeException("Parameter unit invalid.");
      }

      if(partialMatch == null) {
         partialMatch = new MatchImpl((Rule) unit);
      }

      partialMatch.setParameterValue(parameter, value);
      completeMatch = null;
      isCompleteMatchDerived = false;
   }

   public void setParameterValue(final String paramName, final Object value) {
      setParameterValue(getParameter(paramName), value);
   }

   @Override
   public String toString() {
      return getAssignment().toString();
   }
}
