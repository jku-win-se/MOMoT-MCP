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

import java.util.Random;

public class TransformationParameterMutation extends AbstractTransformationMutation {

   private ModuleManager moduleManager;

   public TransformationParameterMutation() {
      super();
   }

   public TransformationParameterMutation(final double probability, final ModuleManager moduleManager) {
      super(probability);
      this.moduleManager = moduleManager;
   }

   public TransformationParameterMutation(final ModuleManager moduleManager) {
      super();
      this.moduleManager = moduleManager;
   }

   public ModuleManager getModuleManager() {
      return moduleManager;
   }

   @Override
   protected TransformationSolution mutate(final TransformationSolution mutant) {
      ITransformationVariable randomVariable = CollectionUtil.getRandomElement(mutant.getVariables());
      int nrTries = 0;
      while(randomVariable instanceof IPlaceholderVariable) {
         if(++nrTries == 3) {
            return mutant;
         }
         randomVariable = CollectionUtil.getRandomElement(mutant.getVariables());
      }

      if (randomVariable != null && randomVariable.getOperatorApplication() != null) {
         final String opId = randomVariable.getOperatorApplication().getOperatorId();
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
                  final ParameterBinding sampled = engine.sampleParameters(chosenOp, new Random());
                  final Object nextValue = sampled.get(param.getName());
                  if (nextValue != null) {
                     randomVariable.getOperatorApplication().getBindings().put(param.getName(), nextValue);
                     mutant.setDirty();
                     break;
                  }
               }
            }
         }
      }
      return mutant;
   }

   public void setModuleManager(final ModuleManager moduleManager) {
      this.moduleManager = moduleManager;
   }
}
