package at.ac.tuwien.big.momot;

import at.ac.tuwien.big.moea.AbstractSearchOrchestration;
import at.ac.tuwien.big.moea.print.ISolutionWriter;
import at.ac.tuwien.big.moea.search.fitness.IMultiDimensionalFitnessFunction;
import at.ac.tuwien.big.momot.print.ITransformationSolutionPrinter;
import at.ac.tuwien.big.momot.print.TransformationSolutionWriter;
import at.ac.tuwien.big.momot.problem.TransformationProblem;
import at.ac.tuwien.big.momot.problem.solution.TransformationSolution;
import at.ac.tuwien.big.momot.problem.unit.parameter.comparator.IEObjectEqualityHelper;
import at.ac.tuwien.big.momot.search.engine.MomotEngine;
import at.ac.tuwien.big.momot.search.fitness.EGraphMultiDimensionalFitnessFunction;
import at.ac.tuwien.big.momot.search.fitness.IEGraphMultiDimensionalFitnessFunction;
import at.ac.tuwien.big.momot.search.solution.executor.SearchHelper;
import at.ac.tuwien.big.momot.search.solution.generator.TransformationSolutionGenerator;
import at.ac.tuwien.big.momot.spi.mutation.MutationBackendId;
import at.ac.tuwien.big.momot.spi.mutation.MutationEngineConfig;
import at.ac.tuwien.big.momot.spi.mutation.MutationEngineRegistry;
import at.ac.tuwien.big.momot.spi.mutation.MutationOperatorEngine;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import org.eclipse.emf.henshin.interpreter.EGraph;
import org.eclipse.emf.henshin.interpreter.impl.ChangeImpl;
import org.eclipse.ocl.ecore.EcoreEnvironmentFactory;
import org.eclipse.ocl.ecore.OCL;
import org.eclipse.ocl.ecore.OCL.Helper;
import org.moeaframework.core.EpsilonBoxDominanceArchive;
import org.moeaframework.core.NondominatedPopulation;
import org.moeaframework.core.NondominatedSortingPopulation;
import org.moeaframework.core.comparator.ParetoDominanceComparator;

public class TransformationSearchOrchestration extends AbstractSearchOrchestration<TransformationSolution> {
   protected OCL ocl;

   protected ModuleManager moduleManager;
   protected EGraph problemGraph;
   protected SearchHelper searchHelper;

   protected boolean deterministic = false;
   protected List<String> globalJavaImports = new ArrayList<>();
   protected MomotEngine engine;

   protected transient MutationOperatorEngine mutationEngine;
   private IEObjectEqualityHelper equalityHelper;

   public TransformationSearchOrchestration() {
      super(TransformationSolution.class);
      ChangeImpl.PRINT_WARNINGS = false;
   }

   public TransformationSearchOrchestration(final ModuleManager moduleManager) {
      this();
      setModuleManager(moduleManager);
   }

   public TransformationSearchOrchestration(final ModuleManager henshinOrchestration, final EGraph problemGraph) {
      this(henshinOrchestration);
      setProblemGraph(problemGraph);
   }

   public TransformationSearchOrchestration(final ModuleManager henshinOrchestration, final EGraph problemGraph,
         final int solutionLength) {
      this(henshinOrchestration);
      setProblemGraph(problemGraph);
      setSolutionLength(solutionLength);
   }

   public TransformationSearchOrchestration(final ModuleManager henshinOrchestration, final int solutionLength) {
      this(henshinOrchestration);
      setSolutionLength(solutionLength);
   }

   public TransformationSearchOrchestration(final ModuleManager henshinOrchestration, final String problemGraphUri) {
      this(henshinOrchestration);
      setProblemGraph(problemGraphUri);
   }

   public TransformationSearchOrchestration(final ModuleManager henshinOrchestration, final String problemGraphUri,
         final int solutionLength) {
      this(henshinOrchestration);
      setProblemGraph(problemGraphUri);
      setSolutionLength(solutionLength);
   }

   public MutationOperatorEngine getMutationEngine() {
      if (mutationEngine == null) {
         mutationEngine = createMutationEngine();
      }
      return mutationEngine;
   }

   public void setMutationEngine(final MutationOperatorEngine mutationEngine) {
      this.mutationEngine = mutationEngine;
   }

   protected MutationOperatorEngine createMutationEngine() {
      try {
         final MutationEngineRegistry registry = MutationEngineRegistry.getInstance();
         final List<String> modulePaths = new ArrayList<>();
         for (final org.eclipse.emf.henshin.model.Module module : getModuleManager().getModules()) {
            if (module.eResource() != null) {
               modulePaths.add(module.eResource().getURI().toString());
            }
         }

         final MutationEngineConfig config = new MutationEngineConfig(
               MutationBackendId.HENSHIN,
               getModuleManager().getBaseDir(),
               modulePaths,
               Collections.emptyList(),
               null
         );
         return registry.createAndLoad(config);
      } catch (final Exception e) {
         throw new RuntimeException("Failed to create MutationOperatorEngine", e);
      }
   }

   public void addGlobalJavaImport(final String globalJavaImport) {
      getGlobalJavaImports().add(globalJavaImport);
   }

   public NondominatedPopulation createArchive(final double... epsilon) {
      if(epsilon == null || epsilon.length == 0) {
         return new NondominatedPopulation(new ParetoDominanceComparator());
      }
      return new EpsilonBoxDominanceArchive(epsilon);
   }

   protected MomotEngine createEngine() {
      return new MomotEngine(isDeterministic(), getGlobalJavaImports().toArray(new String[0]));
   }

   @Override
   public EpsilonBoxDominanceArchive createEpsilonBoxArchive(final double... epsilon) {
      if(epsilon == null || epsilon.length == 0) {
         return null;
      }
      return new EpsilonBoxDominanceArchive(epsilon);
   }

   @Override
   protected IMultiDimensionalFitnessFunction<TransformationSolution> createFitnessFunction() {
      return new EGraphMultiDimensionalFitnessFunction();
   }

   public Helper createOCLHelper() {
      final Helper helper = getOCL().createOCLHelper();
      helper.setContext(getProblemGraph().getRoots().get(0).eClass());
      return helper;
   }

   public NondominatedPopulation createPopulation() {
      return new NondominatedPopulation(new ParetoDominanceComparator());
   }

   @Override
   public TransformationProblem createProblem() {
      return new TransformationProblem(getFitnessFunction(), getSolutionGenerator());
   }

   protected SearchHelper createSearchHelper() {
      return new SearchHelper(this);
   }

   @Override
   protected TransformationSolutionGenerator createSolutionGenerator() {
      return new TransformationSolutionGenerator(createSearchHelper());
   }

   @Override
   public ISolutionWriter<TransformationSolution> createSolutionWriter() {
      return new TransformationSolutionWriter(getFitnessFunction());
   }

   @Override
   public NondominatedSortingPopulation createSortingPopulation() {
      return new NondominatedSortingPopulation(new ParetoDominanceComparator());
   }

   public MomotEngine getEngine() {
      if(engine == null) {
         engine = createEngine();
      }
      return engine;
   }

   public IEObjectEqualityHelper getEqualityHelper() {
      return equalityHelper;
   }

   @Override
   public IEGraphMultiDimensionalFitnessFunction getFitnessFunction() {
      return (IEGraphMultiDimensionalFitnessFunction) super.getFitnessFunction();
   }

   public List<String> getGlobalJavaImports() {
      return globalJavaImports;
   }

   public ModuleManager getModuleManager() {
      if(moduleManager == null) {
         moduleManager = new ModuleManager();
      }
      return moduleManager;
   }

   protected OCL getOCL() {
      if(ocl == null) {
         ocl = OCL.newInstance(EcoreEnvironmentFactory.INSTANCE);
      }
      return ocl;
   }

   @Override
   public TransformationProblem getProblem() {
      return (TransformationProblem) super.getProblem();
   }

   public EGraph getProblemGraph() {
      return problemGraph;
   }

   public SearchHelper getSearchHelper() {
      if(searchHelper == null) {
         searchHelper = createSearchHelper();
      }
      return searchHelper;
   }

   @Override
   public TransformationSolutionGenerator getSolutionGenerator() {
      return (TransformationSolutionGenerator) super.getSolutionGenerator();
   }

   @Override
   public ITransformationSolutionPrinter getSolutionPrinter() {
      return (ITransformationSolutionPrinter) super.getSolutionPrinter();
   }

   public boolean isDeterministic() {
      return deterministic;
   }

   public void setDeterministic(final boolean deterministic) {
      this.deterministic = deterministic;
   }

   public void setEqualityHelper(final IEObjectEqualityHelper equalityHelper) {
      this.equalityHelper = equalityHelper;
   }

   public void setGlobalJavaImports(final List<String> globalJavaImports) {
      this.globalJavaImports = globalJavaImports;
   }

   public void setModuleManager(final ModuleManager moduleManager) {
      this.moduleManager = moduleManager;
   }

   public void setProblemGraph(final EGraph problemGraph) {
      this.problemGraph = problemGraph;
   }

   public void setProblemGraph(final String problemGraphUri) {
      this.problemGraph = getModuleManager().loadGraph(problemGraphUri);
   }

   public String write(final EGraph graph) {
      return getSolutionPrinter().write(graph);
   }
}
