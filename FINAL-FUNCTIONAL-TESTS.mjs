#!/usr/bin/env node

import { spawn } from 'child_process';

const finalTests = [
  {
    name: 'Free Agent - Code Generation',
    package: '@robinson_ai_systems/free-agent-mcp@^0.2.0',
    tool: 'delegate_code_generation',
    args: {
      task: 'Write a function that validates email addresses',
      context: 'TypeScript, strict mode',
      complexity: 'simple'
    }
  },
  {
    name: 'Free Agent - Code Analysis',
    package: '@robinson_ai_systems/free-agent-mcp@^0.2.0',
    tool: 'delegate_code_analysis',
    args: {
      code: 'const password = "admin123"; console.log(password);',
      question: 'Find security issues'
    }
  },
  {
    name: 'Free Agent - Test Generation',
    package: '@robinson_ai_systems/free-agent-mcp@^0.2.0',
    tool: 'delegate_test_generation',
    args: {
      code: 'function add(a, b) { return a + b; }',
      framework: 'jest'
    }
  },
  {
    name: 'Paid Agent - Versatile Task',
    package: '@robinson_ai_systems/paid-agent-mcp@^0.3.0',
    tool: 'execute_versatile_task_paid-agent-mcp',
    args: {
      task: 'Analyze this code for issues',
      taskType: 'code_analysis'
    }
  },
  {
    name: 'Thinking Tools - Context Index',
    package: '@robinson_ai_systems/thinking-tools-mcp@^1.19.0',
    tool: 'context_index_repo',
    args: { force: false }
  },
  {
    name: 'Robinson Toolkit - List Categories',
    package: '@robinson_ai_systems/robinsons-toolkit-mcp@^1.1.0',
    tool: 'toolkit_list_categories',
    args: {}
  },
  {
    name: 'Credit Optimizer - Discover Tools',
    package: '@robinson_ai_systems/credit-optimizer-mcp@^0.3.0',
    tool: 'discover_tools',
    args: {
      query: 'code generation',
      limit: 5
    }
  }
];

async function runFinalTest(test) {
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
      
      const hasJsonResponse = fullOutput.includes('"jsonrpc"');
      const hasError = fullOutput.includes('"isError":true') || fullOutput.includes('Unknown tool');
      const hasResult = fullOutput.includes('"result"');

      if (hasJsonResponse && hasResult && !hasError) {
        testPassed = true;
        console.log(`   ✅ PASS`);
      } else if (hasError) {
        console.log(`   ❌ FAIL - Error returned`);
      } else if (hasJsonResponse) {
        console.log(`   ⚠️  PARTIAL - Response but no result`);
      } else {
        console.log(`   ❌ FAIL - No response`);
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

async function runFinalTests() {
  console.log('🔬 FINAL FUNCTIONAL TESTING - All MCP Servers\n');
  console.log('='.repeat(70));

  const results = [];
  
  for (const test of finalTests) {
    const result = await runFinalTest(test);
    results.push(result);
  }

  console.log('\n' + '='.repeat(70));
  console.log('\n📊 FINAL FUNCTIONAL TEST RESULTS:\n');

  let passed = 0;
  let failed = 0;

  results.forEach(r => {
    const icon = r.passed ? '✅' : '❌';
    console.log(`${icon} ${r.name.padEnd(50)} - ${r.passed ? 'PASS' : 'FAIL'}`);
    if (r.passed) passed++;
    else failed++;
  });

  console.log(`\n📈 Results: ${passed}/7 PASS, ${failed}/7 FAIL`);
  
  if (passed === 7) {
    console.log('\n✅ ALL TESTS PASSED - PRODUCTION READY\n');
  } else if (passed >= 5) {
    console.log('\n⚠️  MOSTLY WORKING - Some issues to fix\n');
  } else {
    console.log('\n❌ SIGNIFICANT FAILURES - Not ready\n');
  }
}

runFinalTests().catch(console.error);

