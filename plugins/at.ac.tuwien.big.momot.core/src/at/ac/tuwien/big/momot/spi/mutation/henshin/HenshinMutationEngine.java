package at.ac.tuwien.big.momot.spi.mutation.henshin;

import at.ac.tuwien.big.moea.util.CastUtil;
import at.ac.tuwien.big.momot.ModuleManager;
import at.ac.tuwien.big.momot.problem.solution.variable.RuleApplicationVariable;
import at.ac.tuwien.big.momot.problem.solution.variable.UnitApplicationVariable;
import at.ac.tuwien.big.momot.search.engine.MomotEngine;
import at.ac.tuwien.big.momot.spi.mutation.ApplyResult;
import at.ac.tuwien.big.momot.spi.mutation.ModelHandle;
import at.ac.tuwien.big.momot.spi.mutation.MutationBackendId;
import at.ac.tuwien.big.momot.spi.mutation.MutationEngineConfig;
import at.ac.tuwien.big.momot.spi.mutation.MutationEngineException;
import at.ac.tuwien.big.momot.spi.mutation.MutationOperator;
import at.ac.tuwien.big.momot.spi.mutation.MutationOperatorEngine;
import at.ac.tuwien.big.momot.spi.mutation.OperatorApplication;
import at.ac.tuwien.big.momot.spi.mutation.OperatorParameter;
import at.ac.tuwien.big.momot.spi.mutation.ParamDirection;
import at.ac.tuwien.big.momot.spi.mutation.ParamValueType;
import at.ac.tuwien.big.momot.spi.mutation.ParameterBinding;

import java.io.File;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Iterator;
import java.util.List;
import java.util.Random;

import org.eclipse.emf.common.util.URI;
import org.eclipse.emf.ecore.EObject;
import org.eclipse.emf.ecore.EPackage;
import org.eclipse.emf.ecore.resource.Resource;
import org.eclipse.emf.henshin.interpreter.Assignment;
import org.eclipse.emf.henshin.interpreter.EGraph;
import org.eclipse.emf.henshin.interpreter.Engine;
import org.eclipse.emf.henshin.interpreter.InterpreterFactory;
import org.eclipse.emf.henshin.interpreter.Match;
import org.eclipse.emf.henshin.model.Parameter;
import org.eclipse.emf.henshin.model.Rule;
import org.eclipse.emf.henshin.model.Unit;
import org.eclipse.emf.henshin.model.resource.HenshinResourceSet;

/**
 * Henshin adapter implementation.
 *
 * <p>Wraps ModuleManager and Henshin Engine to implement the mutation SPI.
 *
 * @see docs/mutation-spi/03-henshin-adapter-plan.md
 */
public final class HenshinMutationEngine implements MutationOperatorEngine {

   private ModuleManager moduleManager;
   private Engine engine;
   private List<MutationOperator> operators;

   public void setModuleManager(final ModuleManager moduleManager) {
      this.moduleManager = moduleManager;
   }

   @Override
   public String backendId() {
      return MutationBackendId.HENSHIN;
   }

   @Override
   public void load(final MutationEngineConfig config) throws MutationEngineException {
      try {
         if (this.moduleManager == null) {
            this.moduleManager = new ModuleManager();
            if (config.getBaseDirectory() != null) {
               moduleManager.setBaseDir(config.getBaseDirectory());
               registerEcores(config.getBaseDirectory(), moduleManager.getResourceSet());
            }

            for (final String modulePath : config.getModulePaths()) {
               moduleManager.addModule(modulePath);
            }
         } else {
            if (moduleManager.getBaseDir() != null) {
               registerEcores(moduleManager.getBaseDir(), moduleManager.getResourceSet());
            }
         }

         this.engine = new MomotEngine(false);
         this.operators = new ArrayList<>();

         for (final Unit unit : moduleManager.getUnits()) {
            final String operatorId = ModuleManager.getQualifiedName(unit);
            if (config.getIgnoreOperatorIds().contains(operatorId)) {
               continue;
            }

            final List<OperatorParameter> params = new ArrayList<>();
            for (final Parameter parameter : unit.getParameters()) {
               final ParamDirection direction = mapDirection(parameter.getKind());
               final ParamValueType valueType = mapValueType(parameter.getType() != null ? CastUtil.wrap(parameter.getType().getInstanceClass()) : null);
               final boolean searchable = direction == ParamDirection.IN || direction == ParamDirection.INOUT;
               params.add(new OperatorParameter(parameter.getName(), direction, valueType, searchable));
            }

            final java.util.Set<String> tags = new java.util.HashSet<>();
            if (unit instanceof Rule) {
               tags.add("rule");
            } else {
               tags.add("unit");
            }

            this.operators.add(new MutationOperator(operatorId, unit.getName(), params, tags));
         }
      } catch (final Exception e) {
         throw new MutationEngineException("Failed to load HenshinMutationEngine: " + e.getMessage(), e);
      }
   }

   @Override
   public List<MutationOperator> listOperators() {
      if (operators == null) {
         return Collections.emptyList();
      }
      return Collections.unmodifiableList(operators);
   }

   @Override
   public ParameterBinding sampleParameters(final MutationOperator op, final Random rng) {
      if (moduleManager == null) {
         return new ParameterBinding();
      }
      final Unit unit = moduleManager.getUnit(op.getId());
      if (unit == null) {
         return new ParameterBinding();
      }
      final Assignment assignment = InterpreterFactory.INSTANCE.createAssignment(unit, false);
      moduleManager.assignParameterValues(assignment);
      final ParameterBinding bindings = new ParameterBinding();
      for (final Parameter parameter : unit.getParameters()) {
         final Object val = assignment.getParameterValue(parameter);
         if (val != null) {
            bindings.put(parameter.getName(), val);
         }
      }
      return bindings;
   }

   @Override
   public ApplyResult tryApply(final ModelHandle model, final OperatorApplication gene) {
      if (gene.isPlaceholder()) {
         return ApplyResult.ok();
      }

      if (!(model instanceof HenshinModelHandle)) {
         return ApplyResult.failure("Model handle is not a HenshinModelHandle");
      }
      final EGraph graph = ((HenshinModelHandle) model).getEGraph();

      final Unit unit = moduleManager.getUnit(gene.getOperatorId());
      if (unit == null) {
         return ApplyResult.failure("Unknown operator '" + gene.getOperatorId() + "'");
      }

      if (unit instanceof Rule) {
         final Rule rule = (Rule) unit;
         final Match partialMatch = InterpreterFactory.INSTANCE.createMatch(rule, false);
         for (final Parameter parameter : rule.getParameters()) {
            Object val = gene.getBindings().get(parameter.getName());
            if (val == null) {
               val = gene.getBindings().get(ModuleManager.getQualifiedName(parameter));
            }
            if (val != null) {
               partialMatch.setParameterValue(parameter, val);
            }
         }

         final Iterable<Match> matches = engine.findMatches(rule, graph, partialMatch);
         final Iterator<Match> foundMatches = matches.iterator();
         if (foundMatches != null && foundMatches.hasNext()) {
            final Match match = foundMatches.next();
            final RuleApplicationVariable application = new RuleApplicationVariable(engine, graph, rule, match);
            if (application.execute(null)) {
               final ParameterBinding outBindings = new ParameterBinding();
               for (final Parameter parameter : rule.getParameters()) {
                  final Object outVal = application.getResultParameterValue(parameter);
                  if (outVal != null) {
                     outBindings.put(parameter.getName(), outVal);
                  }
               }
               return ApplyResult.ok(outBindings);
            } else {
               application.undo(null);
               return ApplyResult.failure("Rule execution failed");
            }
         } else {
            return ApplyResult.failure("No match found for rule " + rule.getName());
         }
      } else {
         final Assignment partialMatch = InterpreterFactory.INSTANCE.createAssignment(unit, false);
         for (final Parameter parameter : unit.getParameters()) {
            Object val = gene.getBindings().get(parameter.getName());
            if (val == null) {
               val = gene.getBindings().get(ModuleManager.getQualifiedName(parameter));
            }
            if (val != null) {
               partialMatch.setParameterValue(parameter, val);
            }
         }

         final UnitApplicationVariable application = new UnitApplicationVariable(engine, graph, unit, partialMatch);
         if (application.execute(null)) {
            final ParameterBinding outBindings = new ParameterBinding();
            for (final Parameter parameter : unit.getParameters()) {
               final Object outVal = application.getResultParameterValue(parameter);
               if (outVal != null) {
                  outBindings.put(parameter.getName(), outVal);
               }
            }
            return ApplyResult.ok(outBindings);
         } else {
            application.undo(null);
            return ApplyResult.failure("Unit execution failed");
         }
      }
   }

   @Override
   public ModelHandle loadInitialModel(final String modelPath) throws MutationEngineException {
      if (moduleManager == null) {
         throw new MutationEngineException("HenshinMutationEngine not loaded yet");
      }
      try {
         final EGraph graph = moduleManager.loadGraph(modelPath);
         return new HenshinModelHandle(graph);
      } catch (final Exception e) {
         throw new MutationEngineException("Failed to load model from path: " + modelPath, e);
      }
   }

   @Override
   public void close() {
      moduleManager = null;
      engine = null;
      operators = null;
   }

   private ParamValueType mapValueType(final Class<?> clazz) {
      if (clazz == null) {
         return ParamValueType.UNKNOWN;
      }
      if (clazz == String.class) {
         return ParamValueType.STRING;
      }
      if (clazz == Integer.class || clazz == int.class) {
         return ParamValueType.INT;
      }
      if (clazz == Double.class || clazz == double.class || clazz == Float.class || clazz == float.class) {
         return ParamValueType.DOUBLE;
      }
      if (clazz == Boolean.class || clazz == boolean.class) {
         return ParamValueType.BOOLEAN;
      }
      return ParamValueType.OBJECT;
   }

   private ParamDirection mapDirection(final org.eclipse.emf.henshin.model.ParameterKind kind) {
      if (kind == null) {
         return ParamDirection.IN;
      }
      switch (kind) {
         case IN:
            return ParamDirection.IN;
         case OUT:
            return ParamDirection.OUT;
         case INOUT:
            return ParamDirection.INOUT;
         case VAR:
            return ParamDirection.VAR;
         case UNKNOWN:
         default:
            return ParamDirection.IN;
      }
   }

   private void registerEcores(final String baseDir, final HenshinResourceSet resourceSet) {
      if (baseDir == null) {
         return;
      }
      final File dir = new File(baseDir);
      if (!dir.exists() || !dir.isDirectory()) {
         return;
      }
      scanAndRegisterEcores(dir, resourceSet);
   }

   private void scanAndRegisterEcores(final File dir, final HenshinResourceSet resourceSet) {
      final File[] files = dir.listFiles();
      if (files == null) {
         return;
      }
      for (final File file : files) {
         if (file.isDirectory()) {
            scanAndRegisterEcores(file, resourceSet);
         } else if (file.getName().endsWith(".ecore")) {
            try {
               final URI ecoreUri = URI.createFileURI(file.getAbsolutePath());
               final Resource resource = resourceSet.getResource(ecoreUri, true);
               for (final EObject obj : resource.getContents()) {
                  if (obj instanceof EPackage) {
                     final EPackage ePackage = (EPackage) obj;
                     resourceSet.getPackageRegistry().put(ePackage.getNsURI(), ePackage);
                     EPackage.Registry.INSTANCE.put(ePackage.getNsURI(), ePackage);
                  }
               }
            } catch (final Exception e) {
               // ignore
            }
         }
      }
   }
}
