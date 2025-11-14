#!/usr/bin/env node

/**
 * Test Phase 8 fixes by running all 6 scenarios
 * Tests both Free Agent and Paid Agent with the -p1 fix
 */

import { spawn } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

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

async function resetTestRepo() {
  console.log('\n🔄 Resetting test repo to initial state...');
  const result = spawn('git', ['reset', '--hard', '930e7ed'], {
    cwd: testRepo,
    stdio: 'inherit'
  });
  
  return new Promise((resolve, reject) => {
    result.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Test repo reset complete\n');
        resolve();
      } else {
        reject(new Error(`git reset failed with code ${code}`));
      }
    });
  });
}

async function runFreeAgent(scenario, scenarioNum) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`FREE AGENT - ${scenario.name}`);
  console.log(`${'='.repeat(80)}\n`);
  
  const logFile = join(testRepo, `free-agent-s${scenarioNum}-retest.log`);
  const freeAgentPath = join(rootDir, 'packages', 'free-agent-mcp', 'dist', 'index.js');
  
  // Import and call free_agent_run directly
  const freeAgent = await import(`file:///${freeAgentPath.replace(/\\/g, '/')}`);
  const tools = freeAgent.default?.tools || [];
  const freeAgentRunTool = tools.find(t => t.name === 'free_agent_run');
  
  if (!freeAgentRunTool) {
    console.error('❌ free_agent_run tool not found!');
    return { success: false, error: 'Tool not found' };
  }
  
  try {
    const result = await freeAgentRunTool.handler({
      repo: testRepo,
      task: scenario.task,
      kind: scenario.kind
    });
    
    fs.writeFileSync(logFile, JSON.stringify(result, null, 2));
    console.log(`✅ Free Agent completed - log saved to ${logFile}`);
    return { success: true, result };
  } catch (error) {
    fs.writeFileSync(logFile, `ERROR: ${error.message}\n${error.stack}`);
    console.error(`❌ Free Agent failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runPaidAgent(scenario, scenarioNum) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`PAID AGENT - ${scenario.name}`);
  console.log(`${'='.repeat(80)}\n`);
  
  const logFile = join(testRepo, `paid-agent-s${scenarioNum}-retest.log`);
  const paidAgentPath = join(rootDir, 'packages', 'paid-agent-mcp', 'dist', 'index.js');
  
  // Import and call paid_agent_run_task directly
  const paidAgent = await import(`file:///${paidAgentPath.replace(/\\/g, '/')}`);
  const tools = paidAgent.default?.tools || [];
  const paidAgentRunTool = tools.find(t => t.name === 'paid_agent_run_task');
  
  if (!paidAgentRunTool) {
    console.error('❌ paid_agent_run_task tool not found!');
    return { success: false, error: 'Tool not found' };
  }
  
  try {
    const result = await paidAgentRunTool.handler({
      repo_path: testRepo,
      task: scenario.task,
      task_kind: scenario.kind
    });
    
    fs.writeFileSync(logFile, JSON.stringify(result, null, 2));
    console.log(`✅ Paid Agent completed - log saved to ${logFile}`);
    return { success: true, result };
  } catch (error) {
    fs.writeFileSync(logFile, `ERROR: ${error.message}\n${error.stack}`);
    console.error(`❌ Paid Agent failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('🧪 Phase 8 Fix Validation - Testing All 6 Scenarios\n');
  
  const results = [];
  
  for (let i = 0; i < scenarios.length; i++) {
    const scenario = scenarios[i];
    const scenarioNum = i + 1;
    
    // Reset repo before each scenario
    await resetTestRepo();
    
    // Run Free Agent
    const freeResult = await runFreeAgent(scenario, scenarioNum);
    results.push({ agent: 'Free', scenario: scenarioNum, ...freeResult });
    
    // Reset repo again
    await resetTestRepo();
    
    // Run Paid Agent
    const paidResult = await runPaidAgent(scenario, scenarioNum);
    results.push({ agent: 'Paid', scenario: scenarioNum, ...paidResult });
  }
  
  // Print summary
  console.log(`\n${'='.repeat(80)}`);
  console.log('SUMMARY');
  console.log(`${'='.repeat(80)}\n`);
  
  const freeResults = results.filter(r => r.agent === 'Free');
  const paidResults = results.filter(r => r.agent === 'Paid');
  
  console.log(`Free Agent: ${freeResults.filter(r => r.success).length}/3 passed`);
  console.log(`Paid Agent: ${paidResults.filter(r => r.success).length}/3 passed`);
  console.log(`\nTotal: ${results.filter(r => r.success).length}/6 passed\n`);
}

main().catch(console.error);

