package at.ac.tuwien.big.momot.core.tests;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNotEquals;
import static org.junit.Assert.assertTrue;

import at.ac.tuwien.big.momot.spi.mutation.ApplyResult;
import at.ac.tuwien.big.momot.spi.mutation.ModelHandle;
import at.ac.tuwien.big.momot.spi.mutation.MutationBackendId;
import at.ac.tuwien.big.momot.spi.mutation.MutationEngineConfig;
import at.ac.tuwien.big.momot.spi.mutation.MutationEngineRegistry;
import at.ac.tuwien.big.momot.spi.mutation.MutationOperator;
import at.ac.tuwien.big.momot.spi.mutation.MutationOperatorEngine;
import at.ac.tuwien.big.momot.spi.mutation.OperatorApplication;
import at.ac.tuwien.big.momot.spi.mutation.OperatorParameter;
import at.ac.tuwien.big.momot.spi.mutation.ParamDirection;
import at.ac.tuwien.big.momot.spi.mutation.ParamValueType;
import at.ac.tuwien.big.momot.spi.mutation.ParameterBinding;
import at.ac.tuwien.big.momot.spi.mutation.henshin.HenshinModelHandle;
import at.ac.tuwien.big.momot.spi.mutation.henshin.HenshinMutationEngine;

import java.io.File;
import java.util.Collections;
import java.util.List;
import java.util.Random;

import org.eclipse.emf.henshin.interpreter.EGraph;
import org.junit.Before;
import org.junit.Test;

public class HenshinMutationEngineTest {

   private File baseDir;

   @Before
   public void setUp() {
      baseDir = new File("test-suite/T01-stack-balancing");
      if (!baseDir.exists()) {
         baseDir = new File("../test-suite/T01-stack-balancing");
      }
      if (!baseDir.exists()) {
         baseDir = new File("../../test-suite/T01-stack-balancing");
      }
      assertTrue("Base directory T01 not found", baseDir.exists());
   }

   @Test
   public void testRegistryRegistration() throws Exception {
      final MutationEngineRegistry registry = MutationEngineRegistry.getInstance();
      assertTrue(registry.isRegistered(MutationBackendId.HENSHIN));
      assertTrue(registry.isRegistered(MutationBackendId.STUB));

      final MutationOperatorEngine engine = registry.create(MutationBackendId.HENSHIN);
      assertNotNull(engine);
      assertTrue(engine instanceof HenshinMutationEngine);
   }

   @Test
   public void testListOperatorsAndSampleParameters() throws Exception {
      final MutationEngineRegistry registry = MutationEngineRegistry.getInstance();
      final MutationEngineConfig config = new MutationEngineConfig(
            MutationBackendId.HENSHIN,
            baseDir.getAbsolutePath(),
            Collections.singletonList("model/stack.henshin"),
            Collections.emptyList(),
            null);

      final MutationOperatorEngine engine = registry.createAndLoad(config);
      assertNotNull(engine);

      final List<MutationOperator> ops = engine.listOperators();
      assertFalse(ops.isEmpty());

      MutationOperator shiftLeftOp = null;
      MutationOperator shiftRightOp = null;
      for (final MutationOperator op : ops) {
         if ("stack::Stack::shiftLeft".equals(op.getId())) {
            shiftLeftOp = op;
         } else if ("stack::Stack::shiftRight".equals(op.getId())) {
            shiftRightOp = op;
         }
      }
      assertNotNull("shiftLeft operator not found", shiftLeftOp);
      assertNotNull("shiftRight operator not found", shiftRightOp);
      assertEquals("shiftLeft", shiftLeftOp.getDisplayName());
      assertEquals("shiftRight", shiftRightOp.getDisplayName());

      boolean hasAmountParam = false;
      for (final OperatorParameter param : shiftLeftOp.getParameters()) {
         if ("amount".equals(param.getName())) {
            hasAmountParam = true;
            assertEquals(ParamDirection.IN, param.getDirection());
            assertEquals(ParamValueType.INT, param.getValueType());
            assertTrue(param.isSearchable());
         }
      }
      assertTrue("amount parameter not found", hasAmountParam);

      final ParameterBinding sampled = engine.sampleParameters(shiftLeftOp, new Random());
      assertNotNull(sampled);
      engine.close();
   }

   @Test
   public void testTryApplyMutatesModel() throws Exception {
      final MutationEngineRegistry registry = MutationEngineRegistry.getInstance();
      final MutationEngineConfig config = new MutationEngineConfig(
            MutationBackendId.HENSHIN,
            baseDir.getAbsolutePath(),
            Collections.singletonList("model/stack.henshin"),
            Collections.emptyList(),
            null);

      final MutationOperatorEngine engine = registry.createAndLoad(config);
      final ModelHandle model = engine.loadInitialModel("model/input/model/model_five_stacks.xmi");
      assertNotNull(model);
      assertTrue(model instanceof HenshinModelHandle);

      final EGraph initialGraph = ((HenshinModelHandle) model).getEGraph();
      assertNotNull(initialGraph);

      // We clone the model first to preserve the original
      final ModelHandle workingCopy = model.copy();

      // Create parameter bindings for shiftLeft
      final ParameterBinding bindings = new ParameterBinding();
      bindings.put("amount", 1);

      final OperatorApplication gene = new OperatorApplication("stack::Stack::shiftLeft", bindings, false);
      final ApplyResult result = engine.tryApply(workingCopy, gene);

      // Verify execution
      assertTrue("tryApply failed: " + result.getMessage(), result.isSuccess());

      engine.close();
   }

   @Test
   public void testTryApplyWithUnknownOperatorId() throws Exception {
      final MutationEngineRegistry registry = MutationEngineRegistry.getInstance();
      final MutationEngineConfig config = new MutationEngineConfig(
            MutationBackendId.HENSHIN,
            baseDir.getAbsolutePath(),
            Collections.singletonList("model/stack.henshin"),
            Collections.emptyList(),
            null);

      final MutationOperatorEngine engine = registry.createAndLoad(config);
      final ModelHandle model = engine.loadInitialModel("model/input/model/model_five_stacks.xmi");
      final OperatorApplication gene = new OperatorApplication("nonexistent::Operator", new ParameterBinding(), false);
      final ApplyResult result = engine.tryApply(model, gene);
      assertFalse(result.isSuccess());
      assertNotNull(result.getMessage());
      engine.close();
   }

   @Test
   public void testTryApplyCannotMatch() throws Exception {
      final MutationEngineRegistry registry = MutationEngineRegistry.getInstance();
      final MutationEngineConfig config = new MutationEngineConfig(
            MutationBackendId.HENSHIN,
            baseDir.getAbsolutePath(),
            Collections.singletonList("model/stack.henshin"),
            Collections.emptyList(),
            null);

      final MutationOperatorEngine engine = registry.createAndLoad(config);
      final ModelHandle model = engine.loadInitialModel("model/input/model/model_five_stacks.xmi");

      // Pass a nonexistent stack ID for fromId, which cannot be matched in the LHS of shiftLeft
      final ParameterBinding bindings = new ParameterBinding();
      bindings.put("fromId", "nonexistentStackId");
      bindings.put("amount", 1);

      final OperatorApplication gene = new OperatorApplication("stack::Stack::shiftLeft", bindings, false);
      final ApplyResult result = engine.tryApply(model, gene);
      assertFalse(result.isSuccess());
      engine.close();
   }

   @Test
   public void testModuleManagerConfigPreserved() throws Exception {
      final at.ac.tuwien.big.momot.ModuleManager moduleManager = new at.ac.tuwien.big.momot.ModuleManager();
      moduleManager.setBaseDir(baseDir.getAbsolutePath());
      moduleManager.addModule("model/stack.henshin");

      // Verify that createStack and connectStacks are present initially
      assertNotNull(moduleManager.getUnit("stack::Stack::createStack"));
      assertNotNull(moduleManager.getUnit("stack::Stack::connectStacks"));

      // Ignore createStack and connectStacks
      moduleManager.removeUnit("stack::Stack::createStack");
      moduleManager.removeUnit("stack::Stack::connectStacks");

      // Set parameter value generator for shiftLeft::amount to FixValue(42)
      final org.eclipse.emf.henshin.model.Unit shiftLeft = moduleManager.getUnit("stack::Stack::shiftLeft");
      final org.eclipse.emf.henshin.model.Parameter amountParam = shiftLeft.getParameter("amount");
      moduleManager.setParameterValue(amountParam, new at.ac.tuwien.big.momot.problem.unit.parameter.fix.FixValue<>(42));

      final MutationEngineRegistry registry = MutationEngineRegistry.getInstance();
      final MutationEngineConfig config = new MutationEngineConfig(
            MutationBackendId.HENSHIN,
            baseDir.getAbsolutePath(),
            Collections.singletonList("model/stack.henshin"),
            Collections.emptyList(),
            null);

      final HenshinMutationEngine engine = (HenshinMutationEngine) registry.create(config.getBackendId());
      engine.setModuleManager(moduleManager);
      engine.load(config);

      final List<MutationOperator> ops = engine.listOperators();
      
      // Asserts that createStack and connectStacks are ignored and not listed
      for (final MutationOperator op : ops) {
         assertNotEquals("stack::Stack::createStack", op.getId());
         assertNotEquals("stack::Stack::connectStacks", op.getId());
      }

      // Asserts that shiftLeft amount parameter is sampled as 42 per the FixValue config!
      MutationOperator shiftLeftOp = null;
      for (final MutationOperator op : ops) {
         if ("stack::Stack::shiftLeft".equals(op.getId())) {
            shiftLeftOp = op;
         }
      }
      assertNotNull(shiftLeftOp);
      final ParameterBinding sampled = engine.sampleParameters(shiftLeftOp, new Random());
      assertEquals(42, sampled.get("amount"));

      engine.close();
   }
}
