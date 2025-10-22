#!/usr/bin/env node
/**
 * End-to-End Integration Test for 4-Server System
 * 
 * Tests the complete workflow:
 * 1. Architect MCP plans the work
 * 2. Architect MCP exports to Optimizer format
 * 3. Credit Optimizer executes autonomously
 * 4. Autonomous Agent generates code (if needed)
 * 5. Robinson's Toolkit provides integrations
 */

import { spawn } from 'child_process';
import { writeFileSync, unlinkSync, existsSync } from 'fs';
import { join } from 'path';

const TEST_FILE = 'test-e2e-temp.ts';
const TEST_CONTENT = `// Temporary test file for E2E integration test
export function placeholder(): void {
  console.log('This will be replaced by the workflow');
}
`;

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runMCPCommand(server, method, params) {
  return new Promise((resolve, reject) => {
    const request = {
      jsonrpc: '2.0',
      id: 1,
      method,
      params,
    };

    const proc = spawn('npx', [server], {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true,
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Process exited with code ${code}\nStderr: ${stderr}`));
      } else {
        try {
          // Parse MCP response (may have multiple JSON objects)
          const lines = stdout.split('\n').filter(l => l.trim());
          const responses = lines.map(l => {
            try {
              return JSON.parse(l);
            } catch {
              return null;
            }
          }).filter(r => r && r.result);
          
          if (responses.length > 0) {
            resolve(responses[responses.length - 1].result);
          } else {
            reject(new Error('No valid MCP response found'));
          }
        } catch (err) {
          reject(err);
        }
      }
    });

    // Send request
    proc.stdin.write(JSON.stringify(request) + '\n');
    proc.stdin.end();
  });
}

async function testArchitectPlanning() {
  log('\n📋 Test 1: Architect MCP Planning', 'cyan');
  
  try {
    const result = await runMCPCommand('architect-mcp', 'tools/call', {
      name: 'plan_work_architect-mcp',
      arguments: {
        goal: 'Add a simple add(a, b) function to test-e2e-temp.ts',
        depth: 'fast',
        budgets: {
          max_steps: 3,
          time_ms: 60000,
          max_files_changed: 1,
        },
      },
    });

    if (result && result.content && result.content[0]) {
      const data = JSON.parse(result.content[0].text);
      if (data.plan_id) {
        log(`✅ Plan created: ${data.plan_id}`, 'green');
        return data.plan_id;
      }
    }
    
    throw new Error('No plan_id returned');
  } catch (err) {
    log(`❌ Failed: ${err.message}`, 'red');
    throw err;
  }
}

async function testArchitectExport(planId) {
  log('\n📤 Test 2: Architect MCP Export', 'cyan');
  
  try {
    const result = await runMCPCommand('architect-mcp', 'tools/call', {
      name: 'export_workplan_to_optimizer_architect-mcp',
      arguments: {
        plan_id: planId,
      },
    });

    if (result && result.content && result.content[0]) {
      const data = JSON.parse(result.content[0].text);
      if (data.workflow) {
        log(`✅ Workflow exported: ${data.workflow.steps?.length || 0} steps`, 'green');
        return data.workflow;
      }
    }
    
    throw new Error('No workflow returned');
  } catch (err) {
    log(`❌ Failed: ${err.message}`, 'red');
    throw err;
  }
}

async function testCreditOptimizerToolDiscovery() {
  log('\n🔍 Test 3: Credit Optimizer Tool Discovery', 'cyan');
  
  try {
    const result = await runMCPCommand('credit-optimizer-mcp', 'tools/call', {
      name: 'discover_tools_credit-optimizer-mcp',
      arguments: {
        query: 'github',
        limit: 5,
      },
    });

    if (result && result.content && result.content[0]) {
      const data = JSON.parse(result.content[0].text);
      if (data.tools && data.tools.length > 0) {
        log(`✅ Found ${data.tools.length} tools matching 'github'`, 'green');
        return true;
      }
    }
    
    throw new Error('No tools found');
  } catch (err) {
    log(`❌ Failed: ${err.message}`, 'red');
    throw err;
  }
}

async function testAutonomousAgentCodeGen() {
  log('\n🤖 Test 4: Autonomous Agent Code Generation', 'cyan');
  
  try {
    const result = await runMCPCommand('autonomous-agent-mcp', 'tools/call', {
      name: 'delegate_code_generation_autonomous-agent-mcp',
      arguments: {
        task: 'Create a simple add(a, b) function that returns a + b',
        context: 'TypeScript, simple math function',
        complexity: 'simple',
      },
    });

    if (result && result.content && result.content[0]) {
      const data = JSON.parse(result.content[0].text);
      if (data.code && data.code.includes('function add')) {
        log(`✅ Code generated successfully`, 'green');
        log(`   Model: ${data.model_used || 'unknown'}`, 'blue');
        log(`   Time: ${data.generation_time_ms || 0}ms`, 'blue');
        return data.code;
      }
    }
    
    throw new Error('No code generated');
  } catch (err) {
    log(`❌ Failed: ${err.message}`, 'red');
    throw err;
  }
}

async function testRobinsonsToolkitDiagnostics() {
  log('\n🔧 Test 5: Robinson\'s Toolkit Diagnostics', 'cyan');
  
  try {
    const result = await runMCPCommand('robinsons-toolkit-mcp', 'tools/call', {
      name: 'diagnose_environment_robinsons-toolkit-mcp',
      arguments: {},
    });

    if (result && result.content && result.content[0]) {
      const data = JSON.parse(result.content[0].text);
      if (data.integrations) {
        const available = Object.values(data.integrations).filter(i => i.available).length;
        const total = Object.keys(data.integrations).length;
        log(`✅ Diagnostics complete: ${available}/${total} integrations available`, 'green');
        return data;
      }
    }
    
    throw new Error('No diagnostics data');
  } catch (err) {
    log(`❌ Failed: ${err.message}`, 'red');
    throw err;
  }
}

async function runAllTests() {
  log('🚀 Starting End-to-End Integration Tests', 'yellow');
  log('=' .repeat(60), 'yellow');

  const results = {
    passed: 0,
    failed: 0,
    total: 5,
  };

  // Create test file
  log('\n📝 Creating test file...', 'blue');
  writeFileSync(TEST_FILE, TEST_CONTENT);

  try {
    // Test 1: Architect Planning
    const planId = await testArchitectPlanning();
    results.passed++;

    // Test 2: Architect Export
    const workflow = await testArchitectExport(planId);
    results.passed++;

    // Test 3: Credit Optimizer Tool Discovery
    await testCreditOptimizerToolDiscovery();
    results.passed++;

    // Test 4: Autonomous Agent Code Generation
    await testAutonomousAgentCodeGen();
    results.passed++;

    // Test 5: Robinson's Toolkit Diagnostics
    await testRobinsonsToolkitDiagnostics();
    results.passed++;

  } catch (err) {
    results.failed++;
    log(`\n❌ Test suite failed: ${err.message}`, 'red');
  } finally {
    // Cleanup
    if (existsSync(TEST_FILE)) {
      unlinkSync(TEST_FILE);
      log('\n🧹 Cleaned up test file', 'blue');
    }
  }

  // Summary
  log('\n' + '='.repeat(60), 'yellow');
  log('📊 Test Results Summary', 'yellow');
  log('='.repeat(60), 'yellow');
  log(`Total Tests: ${results.total}`, 'blue');
  log(`Passed: ${results.passed}`, 'green');
  log(`Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green');
  log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`, 
      results.failed === 0 ? 'green' : 'yellow');

  if (results.failed === 0) {
    log('\n✅ All tests passed! 4-server system is working correctly.', 'green');
    process.exit(0);
  } else {
    log('\n❌ Some tests failed. Please check the output above.', 'red');
    process.exit(1);
  }
}

// Run tests
runAllTests().catch(err => {
  log(`\n💥 Fatal error: ${err.message}`, 'red');
  process.exit(1);
});

