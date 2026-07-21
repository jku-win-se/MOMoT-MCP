import fs from 'node:fs';
import path from 'node:path';
import { executeMomotJob } from './mcp/lib.js';

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

async function runBenchmark(name, folder, momotPath) {
  console.log(`\n========================================`);
  console.log(`Running E2E Benchmark: ${name}`);
  console.log(`========================================`);

  const benchmarkDir = path.resolve(folder);
  const filesBase64 = {
    ...loadFolder(path.join(benchmarkDir, 'model'), benchmarkDir),
    ...loadFolder(path.join(benchmarkDir, 'src'), benchmarkDir)
  };

  const result = await executeMomotJob({
    restBaseUrl: 'http://localhost:8080',
    scriptPath: momotPath,
    filesBase64,
    requestTimeoutMs: 240000,
    logTailLines: 50
  });

  console.log(`Success: ${result.success}`);
  console.log(`Exit Code: ${result.exitCode}`);
  console.log(`Summary: ${result.summary}`);
  if (result.logTail) {
    console.log(`Log Tail:\n${result.logTail}`);
  }

  const objectivesPresent = result.outputs.some(o => o.endsWith('overall_objectives.pf'));
  console.log(`Objectives Present: ${objectivesPresent}`);

  if (!result.success || result.exitCode !== 0 || !objectivesPresent) {
    throw new Error(`Benchmark ${name} FAILED!`);
  }
  console.log(`Benchmark ${name} PASSED!`);
}

async function main() {
  try {
    await runBenchmark(
      'T01-stack-balancing',
      'test-suite/T01-stack-balancing',
      'src/at/ac/tuwien/big/momot/examples/stack/StackSearchExample.momot'
    );
    await runBenchmark(
      'T02-cra',
      'test-suite/T02-cra',
      'src/at/ac/tuwien/big/momot/examples/cra/CRASearchExample.momot'
    );
    await runBenchmark(
      'T03-tree-depth',
      'test-suite/T03-tree-depth',
      'src/at/ac/tuwien/big/momot/examples/tree/TreeSearchExample.momot'
    );
    await runBenchmark(
      'T04-task-scheduling',
      'test-suite/T04-task-scheduling',
      'src/at/ac/tuwien/big/momot/examples/schedule/ScheduleSearchExample.momot'
    );
    console.log('\n========================================');
    console.log('ALL T01-T04 BENCHMARKS PASSED SUCCESSFULLY!');
    console.log('========================================');
    process.exit(0);
  } catch (err) {
    console.error(`\nE2E Verification Failed: ${err.message}`);
    process.exit(1);
  }
}

main();
