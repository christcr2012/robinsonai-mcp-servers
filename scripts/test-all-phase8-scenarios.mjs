#!/usr/bin/env node

/**
 * Run ALL 6 Phase 8 scenarios (3 scenarios × 2 agents)
 * Tests both Free Agent and Paid Agent with all 3 task types
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { spawnSync } from 'child_process';
import { writeFileSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const testRepo = join(rootDir, 'test-repos', 'agent-playground');

const scenarios = [
  {
    name: 'Scenario 1: Feature - Add Subtract Command',
    task: 'Add a subtract command to the calculator CLI. It should accept two numbers and return their difference.',
    kind: 'feature'
  },
  {
    name: 'Scenario 2: Refactor - Extract Command Registration',
    task: 'Extract the command registration logic into a separate registerCommand() function to reduce code duplication.',
    kind: 'refactor'
  },
  {
    name: 'Scenario 3: Bugfix - Fix Calculator.add()',
    task: 'Fix the Calculator.add() method - it currently returns the wrong result.',
    kind: 'bugfix'
  }
];

const results = [];

function resetRepo() {
  console.log('🔄 Resetting test repo...');
  const reset = spawnSync('git', ['reset', '--hard', '930e7ed'], {
    cwd: testRepo,
    stdio: 'pipe'
  });

  const clean = spawnSync('git', ['clean', '-fd'], {
    cwd: testRepo,
    stdio: 'pipe'
  });

  if (reset.status !== 0 || clean.status !== 0) {
    console.error('❌ Failed to reset test repo');
    process.exit(1);
  }

  // Create .free-agent/config.json for both agents
  const configDir = join(testRepo, '.free-agent');
  mkdirSync(configDir, { recursive: true });

  const config = {
    name: 'agent-playground',
    spec: {
      // Use published package export for testing
      generatorModule: '@robinson_ai_systems/free-agent-mcp/generators/ops'
    }
  };

  writeFileSync(join(configDir, 'config.json'), JSON.stringify(config, null, 2));

  console.log('✅ Test repo reset\n');
}

function runFreeAgent(scenario, scenarioNum) {
  console.log('='.repeat(80));
  console.log(`FREE AGENT - ${scenario.name}`);
  console.log('='.repeat(80));
  console.log();
  
  const result = spawnSync('node', [
    join(rootDir, 'packages', 'free-agent-mcp', 'dist', 'cli.js'),
    'run',
    '--repo', testRepo,
    '--task', scenario.task,
    '--kind', scenario.kind
  ], {
    cwd: rootDir,
    stdio: 'pipe',
    encoding: 'utf8',
    env: {
      ...process.env,
      OLLAMA_BASE_URL: 'http://localhost:11434',
      FREE_AGENT_QUALITY: 'balanced',
      FREE_AGENT_TIER: 'free'
    }
  });
  
  const logFile = join(testRepo, `free-agent-s${scenarioNum}-retest.log`);
  writeFileSync(logFile, result.stdout + '\n\n' + result.stderr);
  
  console.log(result.stdout);
  if (result.stderr) console.error(result.stderr);
  
  const success = result.status === 0;
  console.log();
  console.log(success ? '✅ FREE AGENT PASSED' : `❌ FREE AGENT FAILED (exit code: ${result.status})`);
  console.log(`📝 Log saved to: ${logFile}`);
  console.log();
  
  return {
    agent: 'Free Agent',
    scenario: scenario.name,
    success,
    exitCode: result.status,
    logFile
  };
}

function runPaidAgent(scenario, scenarioNum) {
  console.log('='.repeat(80));
  console.log(`PAID AGENT - ${scenario.name}`);
  console.log('='.repeat(80));
  console.log();
  
  const result = spawnSync('node', [
    join(rootDir, 'packages', 'paid-agent-mcp', 'dist', 'index.js'),
    'run',
    '--repo', testRepo,
    '--task', scenario.task,
    '--kind', scenario.kind
  ], {
    cwd: rootDir,
    stdio: 'pipe',
    encoding: 'utf8',
    env: {
      ...process.env,
      OLLAMA_BASE_URL: 'http://localhost:11434',
      FREE_AGENT_QUALITY: 'best',
      FREE_AGENT_TIER: 'paid',
      // Use published package export for testing (Paid Agent has its own bundled generators)
      FREE_AGENT_GENERATOR: '@robinson_ai_systems/paid-agent-mcp/generators/ops'
    }
  });
  
  const logFile = join(testRepo, `paid-agent-s${scenarioNum}-retest.log`);
  writeFileSync(logFile, result.stdout + '\n\n' + result.stderr);
  
  console.log(result.stdout);
  if (result.stderr) console.error(result.stderr);
  
  const success = result.status === 0;
  console.log();
  console.log(success ? '✅ PAID AGENT PASSED' : `❌ PAID AGENT FAILED (exit code: ${result.status})`);
  console.log(`📝 Log saved to: ${logFile}`);
  console.log();
  
  return {
    agent: 'Paid Agent',
    scenario: scenario.name,
    success,
    exitCode: result.status,
    logFile
  };
}

console.log('🧪 Phase 8 Complete Test Suite - ALL 6 Scenarios\n');
console.log('Testing: 3 scenarios × 2 agents = 6 total tests\n');

for (let i = 0; i < scenarios.length; i++) {
  const scenario = scenarios[i];
  const scenarioNum = i + 1;
  
  // Test Free Agent
  resetRepo();
  results.push(runFreeAgent(scenario, scenarioNum));
  
  // Test Paid Agent
  resetRepo();
  results.push(runPaidAgent(scenario, scenarioNum));
}

// Print summary
console.log('='.repeat(80));
console.log('FINAL SUMMARY');
console.log('='.repeat(80));
console.log();

const freeResults = results.filter(r => r.agent === 'Free Agent');
const paidResults = results.filter(r => r.agent === 'Paid Agent');

console.log(`Free Agent: ${freeResults.filter(r => r.success).length}/3 passed`);
freeResults.forEach(r => {
  console.log(`  ${r.success ? '✅' : '❌'} ${r.scenario}`);
});

console.log();
console.log(`Paid Agent: ${paidResults.filter(r => r.success).length}/3 passed`);
paidResults.forEach(r => {
  console.log(`  ${r.success ? '✅' : '❌'} ${r.scenario}`);
});

console.log();
console.log(`Total: ${results.filter(r => r.success).length}/6 passed`);
console.log();

// Save results to JSON
const resultsFile = join(rootDir, 'results', 'phase9-complete-test-results.json');
writeFileSync(resultsFile, JSON.stringify(results, null, 2));
console.log(`📊 Results saved to: ${resultsFile}`);

