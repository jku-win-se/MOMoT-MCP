package at.ac.tuwien.big.momot.search.solution.executor;

import at.ac.tuwien.big.moea.util.CollectionUtil;
import at.ac.tuwien.big.moea.problem.solution.variable.IPlaceholderVariable;
import at.ac.tuwien.big.momot.ModuleManager;
import at.ac.tuwien.big.momot.TransformationSearchOrchestration;
import at.ac.tuwien.big.momot.problem.solution.TransformationSolution;
import at.ac.tuwien.big.momot.problem.solution.variable.ITransformationVariable;
import at.ac.tuwien.big.momot.problem.solution.variable.TransformationPlaceholderVariable;
import at.ac.tuwien.big.momot.problem.solution.variable.OperatorApplicationVariable;
import at.ac.tuwien.big.momot.spi.mutation.ModelHandle;
import at.ac.tuwien.big.momot.spi.mutation.MutationOperator;
import at.ac.tuwien.big.momot.spi.mutation.MutationOperatorEngine;
import at.ac.tuwien.big.momot.spi.mutation.OperatorApplication;
import at.ac.tuwien.big.momot.spi.mutation.ParameterBinding;
import at.ac.tuwien.big.momot.spi.mutation.henshin.HenshinModelHandle;
import at.ac.tuwien.big.momot.util.MomotUtil;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Random;

import org.eclipse.emf.henshin.interpreter.EGraph;
import org.eclipse.emf.henshin.interpreter.Engine;

public class SearchHelper {
   public static final int UNLIMITED = -1;
   public static final int DEFAULT_NR_TRIES_PER_RULE = 5;

   protected TransformationSearchOrchestration searchOrchestration;
   protected int maxTriesPerUnit = DEFAULT_NR_TRIES_PER_RULE;

   public SearchHelper() {}

   public SearchHelper(final TransformationSearchOrchestration searchOrchestration) {
      this.searchOrchestration = searchOrchestration;
   }

   public TransformationSolution appendRandomVariables(final TransformationSolution solution, final int nrVariables) {
      final int newSolutionLength = solution.getNumberOfVariables() + nrVariables;
      final TransformationSolution extendedSolution = new TransformationSolution(solution.getSourceGraph(),
            newSolutionLength, solution.getNumberOfObjectives(), solution.getNumberOfConstraints());
      extendedSolution.setEqualityHelper(getSearchOrchestration().getEqualityHelper());
      extendedSolution.setMutationEngine(getSearchOrchestration().getMutationEngine());

      final EGraph searchGraph = solution.execute();

      final List<ITransformationVariable> variables = new ArrayList<>(Arrays.asList(solution.getVariables()));
      if(nrVariables >= 1) {
         ITransformationVariable var = findUnitApplication(searchGraph);
         while(var != null) {
            // execute it on the searchGraph
            final ModelHandle model = new HenshinModelHandle(searchGraph);
            var.execute(model, getSearchOrchestration().getMutationEngine());
            if(var.isExecuted()) {
               variables.add(var);
            }
            if(variables.size() >= nrVariables) {
               break;
            }
            var = findUnitApplication(searchGraph);
         }
      }

      extendedSolution.setTransformation(variables, searchGraph);
      return extendedSolution;
   }

   public TransformationSolution createEmptyTransformationSolution() {
      final TransformationSolution solution = new TransformationSolution(getSearchOrchestration());
      solution.setEqualityHelper(getSearchOrchestration().getEqualityHelper());
      return solution;
   }

   public TransformationSolution createEmptyTransformationSolution(final int solutionLength, final int nrObjectives,
         final int nrConstraints) {
      final TransformationSolution solution = new TransformationSolution(getSearchOrchestration().getProblemGraph(),
            solutionLength, nrObjectives, nrConstraints);
      for(int i = 0; i < solutionLength; i++) {
         solution.setVariable(i, new TransformationPlaceholderVariable());
      }
      solution.setEqualityHelper(getSearchOrchestration().getEqualityHelper());
      solution.setMutationEngine(getSearchOrchestration().getMutationEngine());
      return solution;
   }

   public TransformationSolution createRandomTransformationSolution() {
      return createRandomTransformationSolution(getSearchOrchestration().getSolutionLength(),
            getSearchOrchestration().getNumberOfObjectives(), getSearchOrchestration().getNumberOfConstraints());
   }

   public TransformationSolution createRandomTransformationSolution(final int solutionLength, final int nrObjectives,
         final int nrConstraints) {
      final EGraph searchGraph = MomotUtil.copy(getSearchOrchestration().getProblemGraph());
      final TransformationSolution solution = createEmptyTransformationSolution(solutionLength, nrObjectives,
            nrConstraints);

      final List<ITransformationVariable> variables = new ArrayList<>();

      if(solutionLength >= 1) {
         ITransformationVariable variable = findUnitApplication(searchGraph);
         while(variable != null) {
            final ModelHandle model = new HenshinModelHandle(searchGraph);
            variable.execute(model, getSearchOrchestration().getMutationEngine());
            if(variable.isExecuted()) {
               variables.add(variable);
            }
            if(variables.size() >= solutionLength) {
               break;
            }
            variable = findUnitApplication(searchGraph);
         }
      }
      solution.setTransformation(variables, searchGraph);
      return solution;
   }

   public TransformationSolution createTransformationSolution(final EGraph sourceGraph,
         final List<? extends ITransformationVariable> variables, final int numberOfObjectives) {
      final TransformationSolution solution = new TransformationSolution(sourceGraph, variables, numberOfObjectives);
      solution.setEqualityHelper(getSearchOrchestration().getEqualityHelper());
      solution.setMutationEngine(getSearchOrchestration().getMutationEngine());
      return solution;
   }

   public TransformationSolution createTransformationSolution(final EGraph sourceGraph,
         final List<? extends ITransformationVariable> variables, final int numberOfObjectives,
         final int numberOfConstraints) {
      final TransformationSolution solution = new TransformationSolution(sourceGraph, variables, numberOfObjectives,
            numberOfConstraints);
      solution.setEqualityHelper(getSearchOrchestration().getEqualityHelper());
      solution.setMutationEngine(getSearchOrchestration().getMutationEngine());
      return solution;
   }

   public ITransformationVariable findUnitApplication(final EGraph graph) {
      return findUnitApplication(graph, getMaxTriesPerUnit());
   }

   public ITransformationVariable findUnitApplication(final EGraph graph, final int maxTries) {
      final MutationOperatorEngine engine = getSearchOrchestration().getMutationEngine();
      final List<MutationOperator> ops = new ArrayList<>(engine.listOperators());
      MutationOperator chosenOp = CollectionUtil.getRandomElement(ops);

      int nrTries = maxTries;

      while(chosenOp != null) {
         final ParameterBinding bindings = engine.sampleParameters(chosenOp, new Random());
         final OperatorApplication gene = new OperatorApplication(chosenOp.getId(), bindings, false);

         // Apply once on the real graph. tryApply must leave the model unchanged on failure
         // (no-match or undo). On success, execute() merges outBindings into the gene for replay.
         final ModelHandle actualModel = new HenshinModelHandle(graph);
         final OperatorApplicationVariable var = new OperatorApplicationVariable(gene);
         if (var.execute(actualModel, engine)) {
            return var;
         }

         if (bindings.asMap().isEmpty()) {
            nrTries = 0;
         }

         if(--nrTries <= 0) {
            ops.remove(chosenOp);
            chosenOp = CollectionUtil.getRandomElement(ops);
            nrTries = maxTries;
         }
      }
      return null;
   }

   public List<ITransformationVariable> findUnitApplications(final EGraph graph) {
      return findUnitApplications(graph, getMaxTriesPerUnit());
   }

   private List<ITransformationVariable> findUnitApplications(final EGraph graph, final int maxTries) {
      final List<ITransformationVariable> variables = new ArrayList<>();
      final ITransformationVariable var = findUnitApplication(graph, maxTries);
      if (var != null) {
         variables.add(var);
      }
      return variables;
   }

   public int getMaxTriesPerUnit() {
      return maxTriesPerUnit;
   }

   public ModuleManager getModuleManager() {
      return getSearchOrchestration().getModuleManager();
   }

   public TransformationSearchOrchestration getSearchOrchestration() {
      return searchOrchestration;
   }

   public void setMaxTriesPerUnit(final int maxTriesPerUnit) {
      this.maxTriesPerUnit = maxTriesPerUnit;
   }

   public void setSearchOrchestration(final TransformationSearchOrchestration searchOrchestration) {
      this.searchOrchestration = searchOrchestration;
   }

   @Deprecated
   public Engine getEngine() {
      return getSearchOrchestration().getEngine();
   }
}
