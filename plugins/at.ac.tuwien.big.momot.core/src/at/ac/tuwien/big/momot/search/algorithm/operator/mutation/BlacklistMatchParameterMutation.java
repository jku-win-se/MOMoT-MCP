package at.ac.tuwien.big.momot.search.algorithm.operator.mutation;

import at.ac.tuwien.big.moea.problem.solution.variable.IPlaceholderVariable;
import at.ac.tuwien.big.moea.util.CollectionUtil;
import at.ac.tuwien.big.momot.ModuleManager;
import at.ac.tuwien.big.momot.problem.solution.TransformationSolution;
import at.ac.tuwien.big.momot.problem.solution.variable.ITransformationVariable;
import at.ac.tuwien.big.momot.spi.mutation.MutationOperator;
import at.ac.tuwien.big.momot.spi.mutation.MutationOperatorEngine;
import at.ac.tuwien.big.momot.spi.mutation.OperatorParameter;
import at.ac.tuwien.big.momot.spi.mutation.ParameterBinding;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;

public class BlacklistMatchParameterMutation extends AbstractTransformationMutation {

   private final ModuleManager moduleManager;
   private final List<String> blackList = new ArrayList<>();

   public BlacklistMatchParameterMutation(final double probability, final ModuleManager moduleManager) {
      super(probability);
      this.moduleManager = moduleManager;
   }

   public BlacklistMatchParameterMutation(final ModuleManager moduleManager) {
      super();
      this.moduleManager = moduleManager;
   }

   public BlacklistMatchParameterMutation addToBlacklist(final String qualifiedParameterName) {
      blackList.add(qualifiedParameterName);
      return this;
   }

   public BlacklistMatchParameterMutation addToBlacklist(final String ruleName, final String parameterName) {
      blackList.add(ruleName + "::" + parameterName);
      return this;
   }

   public ModuleManager getModuleManager() {
      return moduleManager;
   }

   @Override
   protected TransformationSolution mutate(final TransformationSolution mutant) {
      ITransformationVariable randomMatch = CollectionUtil.getRandomElement(mutant.getVariables());
      int nrTries = 0;
      while(randomMatch instanceof IPlaceholderVariable) {
         if(++nrTries == 3) {
            return mutant;
         }
         randomMatch = CollectionUtil.getRandomElement(mutant.getVariables());
      }

      if (randomMatch != null && randomMatch.getOperatorApplication() != null) {
         final String opId = randomMatch.getOperatorApplication().getOperatorId();
         final MutationOperatorEngine engine = mutant.getMutationEngine();
         MutationOperator chosenOp = null;
         for (final MutationOperator op : engine.listOperators()) {
            if (op.getId().equals(opId)) {
               chosenOp = op;
               break;
            }
         }

         if (chosenOp != null) {
            for (final OperatorParameter param : chosenOp.getParameters()) {
               if (param.isSearchable()) {
                  final String paramName = param.getName();
                  if (blackList.contains(paramName)
                        || blackList.contains(opId + "::" + paramName)
                        || blackList.contains(opId.replace("::", "::") + "::" + paramName)) {
                     continue;
                  }

                  final ParameterBinding sampled = engine.sampleParameters(chosenOp, new Random());
                  final Object nextValue = sampled.get(paramName);
                  if (nextValue != null) {
                     randomMatch.getOperatorApplication().getBindings().put(paramName, nextValue);
                     mutant.setDirty();
                     break;
                  }
               }
            }
         }
      }
      return mutant;
   }
}
