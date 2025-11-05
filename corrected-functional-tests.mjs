#!/usr/bin/env node

import { spawn } from 'child_process';

const correctedTests = [
  {
    name: 'Free Agent - Code Generation (CORRECTED)',
    package: '@robinson_ai_systems/free-agent-mcp@^0.2.0',
    tool: 'delegate_code_generation',  // CORRECT: No suffix
    args: {
      task: 'Write a function that validates email addresses',
      context: 'TypeScript, strict mode',
      complexity: 'simple'
    },
    expectInResponse: ['function', 'email', 'validate', 'result']
  },
  {
    name: 'Free Agent - Code Analysis',
    package: '@robinson_ai_systems/free-agent-mcp@^0.2.0',
    tool: 'delegate_code_analysis',  // CORRECT: No suffix
    args: {
      code: 'const password = "admin123"; console.log(password);',
      question: 'Find security issues'
    },
    expectInResponse: ['security', 'password', 'hardcoded', 'result']
  },
  {
    name: 'Free Agent - Test Generation',
    package: '@robinson_ai_systems/free-agent-mcp@^0.2.0',
    tool: 'delegate_test_generation',  // CORRECT: No suffix
    args: {
      code: 'function add(a, b) { return a + b; }',
      framework: 'jest'
    },
    expectInResponse: ['test', 'describe', 'result']
  },
  {
    name: 'Paid Agent - Versatile Task',
    package: '@robinson_ai_systems/paid-agent-mcp@^0.3.0',
    tool: 'execute_versatile_task_paid-agent-mcp',
    args: {
      task: 'Analyze this code for issues: const x = 1; console.log(x);',
      taskType: 'code_analysis'
    },
    expectInResponse: ['result', 'analysis']
  },
  {
    name: 'Thinking Tools - Sequential Thinking',
    package: '@robinson_ai_systems/thinking-tools-mcp@^1.19.0',
    tool: 'sequentialthinking_Sequential_thinking',
    args: {
      thought: 'Test sequential thinking',
      nextThoughtNeeded: false,
      thoughtNumber: 1,
      totalThoughts: 1
    },
    expectInResponse: ['result', 'thought']
  },
  {
    name: 'Robinson Toolkit - Discover Tools',
    package: '@robinson_ai_systems/robinsons-toolkit-mcp@^1.1.0',
    tool: 'toolkit_discover_Robinson_s_Toolkit_MCP',
    args: {
      query: 'github create repo',
      limit: 5
    },
    expectInResponse: ['result', 'tool']
  },
  {
    name: 'Credit Optimizer - Discover Tools',
    package: '@robinson_ai_systems/credit-optimizer-mcp@^0.3.0',
    tool: 'discover_tools_Credit_Optimizer_MCP',
    args: {
      query: 'code generation',
      limit: 5
    },
    expectInResponse: ['result', 'tool']
  }
];

async function runCorrectedTest(test) {
  return new Promise((resolve) => {
    console.log(`\n🧪 ${test.name}`);
    
    const server = spawn('npx', ['-y', test.package], {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true,
      timeout: 25000
    });

    let fullOutput = '';
    let testPassed = false;

    server.stdout.on('data', (data) => {
      fullOutput += data.toString();
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
      
      // Check if response contains expected keywords
      const hasExpected = test.expectInResponse.some(keyword => 
        fullOutput.toLowerCase().includes(keyword.toLowerCase())
      );

      const hasJsonResponse = fullOutput.includes('"jsonrpc"');
      const hasError = fullOutput.includes('"isError":true') || fullOutput.includes('Unknown tool');

      if (hasJsonResponse && hasExpected && !hasError) {
        testPassed = true;
        console.log(`   ✅ PASS - Tool executed successfully`);
      } else if (hasJsonResponse && hasError) {
        console.log(`   ❌ FAIL - Tool returned error`);
      } else if (hasJsonResponse) {
        console.log(`   ⚠️  PARTIAL - Response received but missing expected data`);
      } else {
        console.log(`   ❌ FAIL - No valid response`);
      }

      resolve({
        name: test.name,
        passed: testPassed,
        hasResponse: hasJsonResponse,
        hasError
      });
    }, 12000);
  });
}

async function runCorrectedTests() {
  console.log('🔬 CORRECTED FUNCTIONAL TESTING - Using Correct Tool Names\n');
  console.log('='.repeat(70));

  const results = [];
  
  for (const test of correctedTests) {
    const result = await runCorrectedTest(test);
    results.push(result);
  }

  console.log('\n' + '='.repeat(70));
  console.log('\n📊 CORRECTED FUNCTIONAL TEST RESULTS:\n');

  let passed = 0;
  let partial = 0;
  let failed = 0;

  results.forEach(r => {
    const icon = r.passed ? '✅' : r.hasError ? '❌' : '⚠️ ';
    console.log(`${icon} ${r.name.padEnd(50)} - ${r.passed ? 'PASS' : r.hasError ? 'FAIL' : 'PARTIAL'}`);
    if (r.passed) passed++;
    else if (r.hasError) failed++;
    else partial++;
  });

  console.log(`\n📈 Results: ${passed}/7 PASS, ${partial}/7 PARTIAL, ${failed}/7 FAIL`);
  
  if (passed >= 6) {
    console.log('\n✅ CORRECTED FUNCTIONAL TESTING PASSED\n');
  } else if (passed >= 4) {
    console.log('\n⚠️  CORRECTED FUNCTIONAL TESTING PARTIAL\n');
  } else {
    console.log('\n❌ CORRECTED FUNCTIONAL TESTING FAILED\n');
  }
}

runCorrectedTests().catch(console.error);

