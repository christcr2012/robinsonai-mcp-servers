#!/usr/bin/env node

/**
 * Phase 4 Comprehensive Test Runner
 * Tests all 14 components of the Robinson AI MCP system
 */

import { spawn } from 'child_process';

const tests = [
  {
    id: 1,
    name: 'FREE Agent - Code Generation',
    component: 'Free Agent MCP',
    tool: 'delegate_code_generation',
    package: '@robinson_ai_systems/free-agent-mcp@^0.2.0',
    args: {
      task: 'Create a TypeScript debounce function that delays function execution',
      context: 'TypeScript, strict mode, no external dependencies',
      complexity: 'simple'
    },
    expectations: ['function', 'debounce', 'typescript', 'delay']
  },
  {
    id: 2,
    name: 'FREE Agent - Code Analysis',
    component: 'Free Agent MCP',
    tool: 'delegate_code_analysis',
    package: '@robinson_ai_systems/free-agent-mcp@^0.2.0',
    args: {
      code: 'function processData(data) { const result = []; for (let i = 0; i < data.length; i++) { result.push(data[i] * 2); } return result; } const password = "admin123"; console.log(password);',
      question: 'Find security issues, performance problems, and code quality issues'
    },
    expectations: ['security', 'password', 'hardcoded', 'performance']
  },
  {
    id: 3,
    name: 'PAID Agent - Complex Code Generation',
    component: 'Paid Agent MCP',
    tool: 'execute_versatile_task_paid-agent-mcp',
    package: '@robinson_ai_systems/paid-agent-mcp@^0.3.0',
    args: {
      task: 'Generate an LRU Cache implementation with O(1) get/set operations',
      taskType: 'code_generation',
      taskComplexity: 'complex'
    },
    expectations: ['cache', 'lru', 'map', 'class']
  },
  {
    id: 4,
    name: 'PAID Agent - Quality Gates',
    component: 'Paid Agent MCP',
    tool: 'execute_versatile_task_paid-agent-mcp',
    package: '@robinson_ai_systems/paid-agent-mcp@^0.3.0',
    args: {
      task: 'Create a user authentication function with JWT token generation',
      taskType: 'code_generation',
      minQuality: 'premium'
    },
    expectations: ['jwt', 'token', 'auth', 'function']
  },
  {
    id: 5,
    name: 'Credit Optimizer - Tool Discovery',
    component: 'Credit Optimizer MCP',
    tool: 'discover_tools',
    package: '@robinson_ai_systems/credit-optimizer-mcp@^0.3.0',
    args: {
      query: 'code generation',
      limit: 10
    },
    expectations: ['tool', 'result']
  },
  {
    id: 6,
    name: 'Robinson Toolkit - GitHub Integration',
    component: 'Robinson Toolkit MCP',
    tool: 'toolkit_list_tools',
    package: '@robinson_ai_systems/robinsons-toolkit-mcp@^1.1.0',
    args: {
      category: 'github',
      limit: 20
    },
    expectations: ['github', 'tool', 'repo']
  },
  {
    id: 7,
    name: 'Robinson Toolkit - Vercel Integration',
    component: 'Robinson Toolkit MCP',
    tool: 'toolkit_list_tools',
    package: '@robinson_ai_systems/robinsons-toolkit-mcp@^1.1.0',
    args: {
      category: 'vercel',
      limit: 20
    },
    expectations: ['vercel', 'tool', 'deploy']
  },
  {
    id: 8,
    name: 'Thinking Tools - SWOT Analysis',
    component: 'Thinking Tools MCP',
    tool: 'swot_analysis',
    package: '@robinson_ai_systems/thinking-tools-mcp@^1.19.0',
    args: {
      subject: 'Robinson AI MCP Servers',
      perspective: 'technical'
    },
    expectations: ['strength', 'weakness', 'opportunity', 'threat']
  },
  {
    id: 9,
    name: 'Thinking Tools - Sequential Thinking',
    component: 'Thinking Tools MCP',
    tool: 'sequential_thinking',
    package: '@robinson_ai_systems/thinking-tools-mcp@^1.19.0',
    args: {
      thought: 'How can we improve MCP server performance?',
      nextThoughtNeeded: false,
      thoughtNumber: 1,
      totalThoughts: 1
    },
    expectations: ['thought', 'result']
  }
];

async function runTest(test) {
  return new Promise((resolve) => {
    console.log(`\n🧪 Test ${test.id}: ${test.name}`);
    
    const server = spawn('npx', ['-y', test.package], {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true,
      timeout: 30000
    });

    let output = '';
    let passed = false;

    server.stdout.on('data', (data) => {
      output += data.toString();
    });

    // Initialize
    setTimeout(() => {
      const init = JSON.stringify({
        jsonrpc: '2.0',
        id: 0,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'test', version: '1.0' }
        }
      }) + '\n';
      server.stdin.write(init);
    }, 500);

    // Call tool
    setTimeout(() => {
      const call = JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
          name: test.tool,
          arguments: test.args
        }
      }) + '\n';
      server.stdin.write(call);
    }, 1500);

    // Check results
    setTimeout(() => {
      server.kill();
      
      const hasResponse = output.includes('"jsonrpc"');
      const hasResult = output.includes('"result"');
      const hasError = output.includes('"isError":true') || output.includes('Unknown tool');
      
      const hasExpected = test.expectations.some(exp =>
        output.toLowerCase().includes(exp.toLowerCase())
      );

      if (hasResponse && hasResult && !hasError && hasExpected) {
        passed = true;
        console.log(`   ✅ PASS`);
      } else if (hasError) {
        console.log(`   ❌ FAIL - Error returned`);
      } else if (!hasResponse) {
        console.log(`   ❌ FAIL - No response`);
      } else {
        console.log(`   ⚠️  PARTIAL - Response but missing expected data`);
      }

      resolve({
        id: test.id,
        name: test.name,
        passed,
        hasResponse,
        hasError
      });
    }, 15000);
  });
}

async function runAllTests() {
  console.log('🔬 PHASE 4 COMPREHENSIVE TESTING\n');
  console.log('='.repeat(70));

  const results = [];
  
  for (const test of tests) {
    const result = await runTest(test);
    results.push(result);
  }

  console.log('\n' + '='.repeat(70));
  console.log('\n📊 PHASE 4 TEST RESULTS:\n');

  let passed = 0;
  let failed = 0;

  results.forEach(r => {
    const icon = r.passed ? '✅' : '❌';
    console.log(`${icon} Test ${r.id}: ${r.name.padEnd(45)} - ${r.passed ? 'PASS' : 'FAIL'}`);
    if (r.passed) passed++;
    else failed++;
  });

  console.log(`\n📈 Results: ${passed}/${tests.length} PASS, ${failed}/${tests.length} FAIL`);
  console.log(`Success Rate: ${Math.round(passed / tests.length * 100)}%\n`);
}

runAllTests().catch(console.error);

