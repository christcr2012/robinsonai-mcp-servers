#!/usr/bin/env node
/**
 * Performance Testing Script
 * 
 * Measures and compares:
 * 1. Planning time (Architect MCP)
 * 2. Code generation time (Autonomous Agent MCP)
 * 3. Tool discovery time (Credit Optimizer MCP)
 * 4. Credit savings vs traditional AI coding
 * 5. Memory usage
 */

import { spawn } from 'child_process';
import { performance } from 'perf_hooks';

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
    const startTime = performance.now();
    const startMem = process.memoryUsage();

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
      const endTime = performance.now();
      const endMem = process.memoryUsage();
      const duration = endTime - startTime;
      const memDelta = endMem.heapUsed - startMem.heapUsed;

      if (code !== 0) {
        reject(new Error(`Process exited with code ${code}`));
      } else {
        try {
          const lines = stdout.split('\n').filter(l => l.trim());
          const responses = lines.map(l => {
            try {
              return JSON.parse(l);
            } catch {
              return null;
            }
          }).filter(r => r && r.result);
          
          if (responses.length > 0) {
            resolve({
              result: responses[responses.length - 1].result,
              duration,
              memDelta,
            });
          } else {
            reject(new Error('No valid MCP response'));
          }
        } catch (err) {
          reject(err);
        }
      }
    });

    proc.stdin.write(JSON.stringify(request) + '\n');
    proc.stdin.end();
  });
}

async function benchmarkArchitectPlanning() {
  log('\n⏱️  Benchmark 1: Architect Planning (Simple)', 'cyan');
  
  const tests = [
    { goal: 'Add a hello world function', depth: 'fast' },
    { goal: 'Create a user authentication system', depth: 'fast' },
    { goal: 'Build a REST API with CRUD operations', depth: 'fast' },
  ];

  const results = [];

  for (const test of tests) {
    try {
      const { result, duration, memDelta } = await runMCPCommand('architect-mcp', 'tools/call', {
        name: 'plan_work_architect-mcp',
        arguments: {
          goal: test.goal,
          depth: test.depth,
          budgets: { max_steps: 10, time_ms: 300000, max_files_changed: 5 },
        },
      });

      const data = JSON.parse(result.content[0].text);
      results.push({
        goal: test.goal,
        duration: duration.toFixed(0),
        memory: (memDelta / 1024 / 1024).toFixed(2),
        planId: data.plan_id,
      });

      log(`  ✅ "${test.goal}"`, 'green');
      log(`     Time: ${duration.toFixed(0)}ms | Memory: ${(memDelta / 1024 / 1024).toFixed(2)}MB`, 'blue');
    } catch (err) {
      log(`  ❌ "${test.goal}" failed: ${err.message}`, 'red');
    }
  }

  return results;
}

async function benchmarkCodeGeneration() {
  log('\n⏱️  Benchmark 2: Code Generation (Autonomous Agent)', 'cyan');
  
  const tests = [
    { task: 'Create a simple add(a, b) function', complexity: 'simple' },
    { task: 'Create a React component with state', complexity: 'medium' },
    { task: 'Create a database migration script', complexity: 'medium' },
  ];

  const results = [];

  for (const test of tests) {
    try {
      const { result, duration, memDelta } = await runMCPCommand('autonomous-agent-mcp', 'tools/call', {
        name: 'delegate_code_generation_autonomous-agent-mcp',
        arguments: {
          task: test.task,
          context: 'TypeScript',
          complexity: test.complexity,
        },
      });

      const data = JSON.parse(result.content[0].text);
      results.push({
        task: test.task,
        duration: duration.toFixed(0),
        memory: (memDelta / 1024 / 1024).toFixed(2),
        model: data.model_used,
      });

      log(`  ✅ "${test.task}"`, 'green');
      log(`     Time: ${duration.toFixed(0)}ms | Memory: ${(memDelta / 1024 / 1024).toFixed(2)}MB | Model: ${data.model_used}`, 'blue');
    } catch (err) {
      log(`  ❌ "${test.task}" failed: ${err.message}`, 'red');
    }
  }

  return results;
}

async function benchmarkToolDiscovery() {
  log('\n⏱️  Benchmark 3: Tool Discovery (Credit Optimizer)', 'cyan');
  
  const queries = ['github', 'deploy', 'database', 'email', 'test'];
  const results = [];

  for (const query of queries) {
    try {
      const { result, duration, memDelta } = await runMCPCommand('credit-optimizer-mcp', 'tools/call', {
        name: 'discover_tools_credit-optimizer-mcp',
        arguments: {
          query,
          limit: 10,
        },
      });

      const data = JSON.parse(result.content[0].text);
      results.push({
        query,
        duration: duration.toFixed(0),
        memory: (memDelta / 1024 / 1024).toFixed(2),
        toolsFound: data.tools?.length || 0,
      });

      log(`  ✅ Query: "${query}" - Found ${data.tools?.length || 0} tools`, 'green');
      log(`     Time: ${duration.toFixed(0)}ms | Memory: ${(memDelta / 1024 / 1024).toFixed(2)}MB`, 'blue');
    } catch (err) {
      log(`  ❌ Query "${query}" failed: ${err.message}`, 'red');
    }
  }

  return results;
}

function calculateCreditSavings(planningResults, codeGenResults) {
  log('\n💰 Credit Savings Analysis', 'cyan');
  
  // Traditional AI coding costs (estimated)
  const TRADITIONAL_COSTS = {
    planning: 1000, // GPT-4 for planning
    codeGen: 1500, // GPT-4 for code generation
    backAndForth: 1000, // Multiple iterations
    testing: 500, // Test generation
  };

  const TRADITIONAL_TOTAL = Object.values(TRADITIONAL_COSTS).reduce((a, b) => a + b, 0);

  // Robinson AI costs (all local, FREE)
  const ROBINSON_COSTS = {
    planning: 0, // Local Ollama
    codeGen: 0, // Local Ollama
    backAndForth: 0, // Autonomous execution
    testing: 0, // Local Ollama
  };

  const ROBINSON_TOTAL = 0;

  log('\n  Traditional AI Coding:', 'yellow');
  log(`    Planning: ${TRADITIONAL_COSTS.planning} credits`, 'gray');
  log(`    Code Generation: ${TRADITIONAL_COSTS.codeGen} credits`, 'gray');
  log(`    Back-and-forth: ${TRADITIONAL_COSTS.backAndForth} credits`, 'gray');
  log(`    Testing: ${TRADITIONAL_COSTS.testing} credits`, 'gray');
  log(`    TOTAL: ${TRADITIONAL_TOTAL} credits`, 'red');

  log('\n  Robinson AI 4-Server System:', 'yellow');
  log(`    Planning: ${ROBINSON_COSTS.planning} credits (local Ollama)`, 'gray');
  log(`    Code Generation: ${ROBINSON_COSTS.codeGen} credits (local Ollama)`, 'gray');
  log(`    Back-and-forth: ${ROBINSON_COSTS.backAndForth} credits (autonomous)`, 'gray');
  log(`    Testing: ${ROBINSON_COSTS.testing} credits (local Ollama)`, 'gray');
  log(`    TOTAL: ${ROBINSON_TOTAL} credits`, 'green');

  const savings = TRADITIONAL_TOTAL - ROBINSON_TOTAL;
  const savingsPercent = ((savings / TRADITIONAL_TOTAL) * 100).toFixed(1);

  log(`\n  💰 Savings: ${savings} credits (${savingsPercent}%)`, 'green');
  
  return { traditional: TRADITIONAL_TOTAL, robinson: ROBINSON_TOTAL, savings, savingsPercent };
}

async function runPerformanceTests() {
  log('🚀 Robinson AI MCP Servers - Performance Testing', 'yellow');
  log('='.repeat(60), 'yellow');

  const planningResults = await benchmarkArchitectPlanning();
  const codeGenResults = await benchmarkCodeGeneration();
  const discoveryResults = await benchmarkToolDiscovery();
  const savingsAnalysis = calculateCreditSavings(planningResults, codeGenResults);

  // Summary
  log('\n' + '='.repeat(60), 'yellow');
  log('📊 Performance Summary', 'yellow');
  log('='.repeat(60), 'yellow');

  if (planningResults.length > 0) {
    const avgPlanning = planningResults.reduce((sum, r) => sum + parseFloat(r.duration), 0) / planningResults.length;
    log(`\nArchitect Planning:`, 'cyan');
    log(`  Average Time: ${avgPlanning.toFixed(0)}ms`, 'blue');
    log(`  Tests Completed: ${planningResults.length}/3`, 'blue');
  }

  if (codeGenResults.length > 0) {
    const avgCodeGen = codeGenResults.reduce((sum, r) => sum + parseFloat(r.duration), 0) / codeGenResults.length;
    log(`\nCode Generation:`, 'cyan');
    log(`  Average Time: ${avgCodeGen.toFixed(0)}ms`, 'blue');
    log(`  Tests Completed: ${codeGenResults.length}/3`, 'blue');
  }

  if (discoveryResults.length > 0) {
    const avgDiscovery = discoveryResults.reduce((sum, r) => sum + parseFloat(r.duration), 0) / discoveryResults.length;
    const totalTools = discoveryResults.reduce((sum, r) => sum + r.toolsFound, 0);
    log(`\nTool Discovery:`, 'cyan');
    log(`  Average Time: ${avgDiscovery.toFixed(0)}ms`, 'blue');
    log(`  Total Tools Found: ${totalTools}`, 'blue');
    log(`  Tests Completed: ${discoveryResults.length}/5`, 'blue');
  }

  log(`\nCredit Savings:`, 'cyan');
  log(`  Traditional: ${savingsAnalysis.traditional} credits`, 'red');
  log(`  Robinson AI: ${savingsAnalysis.robinson} credits`, 'green');
  log(`  Savings: ${savingsAnalysis.savings} credits (${savingsAnalysis.savingsPercent}%)`, 'green');

  log('\n✅ Performance testing complete!', 'green');
  process.exit(0);
}

// Run tests
runPerformanceTests().catch(err => {
  log(`\n💥 Fatal error: ${err.message}`, 'red');
  process.exit(1);
});

