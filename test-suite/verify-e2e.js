import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { executeMomotJob } from '../mcp/lib.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Helper to walk a directory recursively and gather all files
function walk(dir) {
  let results = [];
  if (!fs.existsSync(dir)) {
    return results;
  }
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(filePath));
    } else {
      results.push(filePath);
    }
  }
  return results;
}

// Find files recursively in a directory and map them to base64
function loadFolder(folderPath, relativeTo) {
  const files = walk(folderPath);
  const map = {};
  for (const file of files) {
    const relPath = path.relative(relativeTo, file).replace(/\\/g, '/');
    const content = fs.readFileSync(file);
    map[relPath] = content.toString('base64');
  }
  return map;
}

function runHenshinValidator(args) {
  const validatorPath = path.resolve(__dirname, '../tools/henshin-validator/validate.mjs');
  const res = spawnSync('node', [validatorPath, ...args], { stdio: 'pipe', encoding: 'utf-8' });
  if (res.status !== 0) {
    console.error(`Henshin validator failed with status ${res.status}`);
    console.error(`stdout:\n${res.stdout}`);
    console.error(`stderr:\n${res.stderr}`);
    return false;
  }
  return true;
}

async function runBenchmark(name, folderName, momotPath, validatorArgs) {
  console.log(`\n==================================================`);
  console.log(`E2E Benchmark: ${name}`);
  console.log(`==================================================`);

  const benchmarkDir = path.resolve(__dirname, folderName);

  // ----------------------------------------
  // TIER 1: Henshin Validation
  // ----------------------------------------
  console.log(`[Tier 1] Running Henshin validators (structure, semantic, apply)...`);
  for (const set of validatorArgs) {
    const ok = runHenshinValidator(set);
    if (!ok) {
      throw new Error(`[Tier 1] Henshin validation failed for args: ${set.join(' ')}`);
    }
  }
  console.log(`[Tier 1] Henshin validation PASSED successfully.`);

  // ----------------------------------------
  // TIER 2: MOMoT REST Job Execution
  // ----------------------------------------
  console.log(`[Tier 2] Packaging ZIP and submitting MOMoT search job to REST server...`);
  const filesBase64 = {
    ...loadFolder(path.join(benchmarkDir, 'model'), benchmarkDir),
    ...loadFolder(path.join(benchmarkDir, 'src'), benchmarkDir)
  };

  const result = await executeMomotJob({
    restBaseUrl: 'http://127.0.0.1:8080',
    scriptPath: momotPath,
    filesBase64,
    requestTimeoutMs: 600000,
    retries: 0,
    logTailLines: 50
  });

  console.log(`Success: ${result.success}`);
  console.log(`Exit Code: ${result.exitCode}`);
  console.log(`Summary: ${result.summary}`);

  const objPath = result.outputs.find(o => o.endsWith('overall_objectives.pf'));
  if (!result.success || result.exitCode !== 0 || !objPath) {
    if (result.logTail) {
      console.log(`Log Tail:\n${result.logTail}`);
    }
    throw new Error(`[Tier 2] MOMoT search execution failed.`);
  }
  console.log(`[Tier 2] Execution PASSED successfully.`);

  // ----------------------------------------
  // TIER 3: Pareto Front Epsilon Dominance Check
  // ----------------------------------------
  console.log(`[Tier 3] Running epsilon-dominance check against reference Pareto front...`);
  
  const zipPayload = result.responseZip;
  const zip = await import('jszip').then(m => m.default.loadAsync(zipPayload));
  const pfEntry = zip.file('out/objectives/overall_objectives.pf') || zip.file('out/objectives/moea_objectives.pf') || zip.file(Object.keys(zip.files).find(k => k.endsWith('overall_objectives.pf')));
  if (!pfEntry) {
    console.log("Zip entries found:", Object.keys(zip.files));
    throw new Error("Could not find overall_objectives.pf in zip!");
  }
  const pfContent = await pfEntry.async('text');
  
  console.log(`Found Pareto Front Points:\n${pfContent.trim()}`);

  const lines = pfContent.trim().split('\n').filter(l => l.trim().length > 0 && !l.startsWith('#'));
  const expectedJson = JSON.parse(fs.readFileSync(path.join(benchmarkDir, 'expected/pareto-front.json'), 'utf-8'));
  const objNames = expectedJson.objectives.map(o => o.name);

  const foundPoints = lines.map(line => {
    const parts = line.trim().split(/\s+/).map(Number);
    const pt = {};
    objNames.forEach((name, idx) => {
      pt[name] = parts[idx];
    });
    return pt;
  });

  let allMatched = true;
  const epsilon = name === 'T01-stack-balancing' ? 2.0 : 1.0;

  for (const refPt of expectedJson.reference_front) {
    const matched = foundPoints.some(foundPt => {
      return expectedJson.objectives.every(obj => {
        const name = obj.name;
        // Minimization: foundPt must be <= refPt + epsilon
        return foundPt[name] <= refPt[name] + epsilon;
      });
    });
    if (matched) {
      console.log(`  - [PASS] Expected point ${JSON.stringify(refPt)} was covered within ε=${epsilon}`);
    } else {
      console.log(`  - [FAIL] Expected point ${JSON.stringify(refPt)} was NOT covered within ε=${epsilon}!`);
      allMatched = false;
    }
  }

  if (!allMatched) {
    throw new Error(`[Tier 3] Epsilon-dominance check FAILED! Not all reference front points were covered.`);
  }
  console.log(`[Tier 3] Epsilon-dominance check PASSED successfully.`);
  console.log(`Benchmark ${name} is 100% GREEN across Tiers 1, 2, and 3!\n`);
}

async function main() {
  try {
    // Structure and setup henshin-validator
    console.log('Setting up HenshinValidator...');
    const setupValidatorPath = path.resolve(__dirname, '../tools/henshin-validator/validate.mjs');
    spawnSync('node', [setupValidatorPath, '--setup'], { stdio: 'inherit' });

    await runBenchmark(
      'T01-stack-balancing',
      'T01-stack-balancing',
      'src/at/ac/tuwien/big/momot/examples/stack/StackSearchExample.momot',
      [
        ['--validate-structure', 'test-suite/T01-stack-balancing/model/stack.henshin'],
        ['--validate-semantic', 'test-suite/T01-stack-balancing/model/stack.henshin', '--metamodel', 'test-suite/T01-stack-balancing/model/stack.ecore'],
        ['--apply', 'test-suite/T01-stack-balancing/model/stack.henshin', '--model', 'test-suite/T01-stack-balancing/model/input/model/model_five_stacks.xmi', '--rule', 'shiftLeft', '-PfromId=stack4', '-PtoId=stack3', '-Pamount=1', '--metamodel', 'test-suite/T01-stack-balancing/model/stack.ecore']
      ]
    );

    await runBenchmark(
      'T02-cra',
      'T02-cra',
      'src/at/ac/tuwien/big/momot/examples/cra/CRASearchExample.momot',
      [
        ['--validate-structure', 'test-suite/T02-cra/model/cra.henshin'],
        ['--validate-semantic', 'test-suite/T02-cra/model/cra.henshin', '--metamodel', 'test-suite/T02-cra/model/cra.ecore'],
        ['--apply', 'test-suite/T02-cra/model/cra.henshin', '--model', 'test-suite/T02-cra/model/input/model_cra_small.xmi', '--rule', 'assignFeature', '--metamodel', 'test-suite/T02-cra/model/cra.ecore']
      ]
    );

    await runBenchmark(
      'T03-tree-depth',
      'T03-tree-depth',
      'src/at/ac/tuwien/big/momot/examples/tree/TreeSearchExample.momot',
      [
        ['--validate-structure', 'test-suite/T03-tree-depth/model/tree.henshin'],
        ['--validate-semantic', 'test-suite/T03-tree-depth/model/tree.henshin', '--metamodel', 'test-suite/T03-tree-depth/model/tree.ecore'],
        ['--apply', 'test-suite/T03-tree-depth/model/tree.henshin', '--model', 'test-suite/T03-tree-depth/model/input/model_skewed_tree.xmi', '--rule', 'reparentNode', '--metamodel', 'test-suite/T03-tree-depth/model/tree.ecore']
      ]
    );

    await runBenchmark(
      'T04-task-scheduling',
      'T04-task-scheduling',
      'src/at/ac/tuwien/big/momot/examples/schedule/ScheduleSearchExample.momot',
      [
        ['--validate-structure', 'test-suite/T04-task-scheduling/model/schedule.henshin'],
        ['--validate-semantic', 'test-suite/T04-task-scheduling/model/schedule.henshin', '--metamodel', 'test-suite/T04-task-scheduling/model/schedule.ecore'],
        ['--apply', 'test-suite/T04-task-scheduling/model/schedule.henshin', '--model', 'test-suite/T04-task-scheduling/model/input/model_four_tasks.xmi', '--rule', 'reassignTask', '--metamodel', 'test-suite/T04-task-scheduling/model/schedule.ecore']
      ]
    );

    await runBenchmark(
      'T06-stub-backend',
      'T06-stub-backend',
      'src/at/ac/tuwien/big/momot/examples/stack/StackSearchExample.momot',
      []
    );

    console.log('\n==================================================');
    console.log('ALL E2E BENCHMARKS T01-T04 VERIFIED & 100% GREEN!');
    console.log('==================================================');

    console.log('\n==================================================');
    console.log('Automated Check: Unknown Backend Fail-Fast (P3.2)');
    console.log('==================================================');
    const filesBase64 = {
      ...loadFolder(path.join(path.resolve(__dirname, 'T01-stack-balancing'), 'model'), path.resolve(__dirname, 'T01-stack-balancing')),
      ...loadFolder(path.join(path.resolve(__dirname, 'T01-stack-balancing'), 'src'), path.resolve(__dirname, 'T01-stack-balancing'))
    };
    filesBase64["job/manifest.json"] = Buffer.from(JSON.stringify({
      mutationBackend: "not-a-backend",
      engineApiVersion: 1
    })).toString("base64");

    const failResult = await executeMomotJob({
      restBaseUrl: 'http://127.0.0.1:8080',
      scriptPath: 'src/at/ac/tuwien/big/momot/examples/stack/StackSearchExample.momot',
      filesBase64,
      requestTimeoutMs: 30000,
      logTailLines: 50
    });

    console.log(`P3.2 Exit Code: ${failResult.exitCode}`);
    console.log(`P3.2 Log Tail:\n${failResult.logTail}`);

    if (failResult.success || failResult.exitCode === 0) {
      throw new Error('[P3.2 Check FAILED] Job with unknown backend succeeded or exit code was 0.');
    }
    if (!failResult.logTail || !failResult.logTail.includes('Unknown mutation backend')) {
      throw new Error('[P3.2 Check FAILED] logTail does not contain expected error message "Unknown mutation backend".');
    }
    console.log('[PASS] P3.2 Unknown Backend Fail-Fast check passed successfully.');

    process.exit(0);
  } catch (err) {
    console.error(`\nE2E Verification Failed: ${err.message}`);
    process.exit(1);
  }
}

main();
