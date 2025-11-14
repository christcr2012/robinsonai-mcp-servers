#!/usr/bin/env node

/**
 * Test PUBLISHED packages from npm (not workspace code)
 * This is what actually matters - can users use the published packages?
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
  
  console.log('✅ Test repo reset\n');
}

function runFreeAgent(scenario, scenarioNum) {
  console.log('='.repeat(80));
  console.log(`FREE AGENT (PUBLISHED) - ${scenario.name}`);
  console.log('='.repeat(80));
  console.log();
  
  const result = spawnSync('npx', [
    '-y',
    '@robinson_ai_systems/free-agent-mcp@0.14.3',
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
  
  const logFile = join(testRepo, `free-agent-published-s${scenarioNum}.log`);
  writeFileSync(logFile, result.stdout + '\n\n' + result.stderr);
  
  console.log(result.stdout);
  if (result.stderr) console.error(result.stderr);
  
  const success = result.status === 0;
  console.log();
  console.log(success ? '✅ FREE AGENT PASSED' : `❌ FREE AGENT FAILED (exit code: ${result.status})`);
  console.log(`📝 Log saved to: ${logFile}`);
  console.log();
  
  return {
    agent: 'Free Agent (Published)',
    scenario: scenario.name,
    success,
    exitCode: result.status,
    logFile
  };
}

function runPaidAgent(scenario, scenarioNum) {
  console.log('='.repeat(80));
  console.log(`PAID AGENT (PUBLISHED) - ${scenario.name}`);
  console.log('='.repeat(80));
  console.log();
  
  const result = spawnSync('npx', [
    '-y',
    '@robinson_ai_systems/paid-agent-mcp@0.12.6',
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
      FREE_AGENT_TIER: 'paid'
    }
  });
  
  const logFile = join(testRepo, `paid-agent-published-s${scenarioNum}.log`);
  writeFileSync(logFile, result.stdout + '\n\n' + result.stderr);
  
  console.log(result.stdout);
  if (result.stderr) console.error(result.stderr);
  
  const success = result.status === 0;
  console.log();
  console.log(success ? '✅ PAID AGENT PASSED' : `❌ PAID AGENT FAILED (exit code: ${result.status})`);
  console.log(`📝 Log saved to: ${logFile}`);
  console.log();
  
  return {
    agent: 'Paid Agent (Published)',
    scenario: scenario.name,
    success,
    exitCode: result.status,
    logFile
  };
}

console.log('🧪 Testing PUBLISHED Packages from npm\n');
console.log('Free Agent: @robinson_ai_systems/free-agent-mcp@0.14.3');
console.log('Paid Agent: @robinson_ai_systems/paid-agent-mcp@0.12.6\n');

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
console.log('FINAL SUMMARY - PUBLISHED PACKAGES');
console.log('='.repeat(80));
console.log();

const freeResults = results.filter(r => r.agent.includes('Free'));
const paidResults = results.filter(r => r.agent.includes('Paid'));

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

