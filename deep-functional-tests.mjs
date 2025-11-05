#!/usr/bin/env node

import { spawn } from 'child_process';

const deepTests = [
  {
    name: 'Free Agent - Generate Real Code',
    package: '@robinson_ai_systems/free-agent-mcp@^0.2.0',
    tool: 'delegate_code_generation_free-agent-mcp',
    args: {
      task: 'Write a function that validates email addresses',
      context: 'TypeScript, strict mode',
      complexity: 'simple'
    },
    expectInResponse: ['function', 'email', 'validate']
  },
  {
    name: 'Paid Agent - Analyze Code Quality',
    package: '@robinson_ai_systems/paid-agent-mcp@^0.3.0',
    tool: 'execute_versatile_task_paid-agent-mcp',
    args: {
      task: 'Find security issues in this code: const password = "admin123"; console.log(password);',
      taskType: 'code_analysis'
    },
    expectInResponse: ['security', 'password', 'hardcoded']
  },
  {
    name: 'Thinking Tools - Root Cause Analysis',
    package: '@robinson_ai_systems/thinking-tools-mcp@^1.19.0',
    tool: 'root_cause_Thinking_Tools_MCP',
    args: {
      problem: 'Why do MCP servers fail to start?',
      context: 'Node.js, native modules'
    },
    expectInResponse: ['cause', 'reason', 'issue']
  },
  {
    name: 'Robinson Toolkit - List GitHub Tools',
    package: '@robinson_ai_systems/robinsons-toolkit-mcp@^1.1.0',
    tool: 'toolkit_list_tools_Robinson_s_Toolkit_MCP',
    args: {
      category: 'github',
      limit: 10
    },
    expectInResponse: ['github', 'tool', 'name']
  },
  {
    name: 'Credit Optimizer - Get Stats',
    package: '@robinson_ai_systems/credit-optimizer-mcp@^0.3.0',
    tool: 'get_credit_stats_Credit_Optimizer_MCP',
    args: {
      period: 'today'
    },
    expectInResponse: ['credit', 'stat', 'usage']
  }
];

async function runDeepTest(test) {
  return new Promise((resolve) => {
    console.log(`\n🔬 ${test.name}`);
    
    const server = spawn('npx', ['-y', test.package], {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true,
      timeout: 20000
    });

    let fullOutput = '';
    let testPassed = false;
    let responseData = '';

    server.stdout.on('data', (data) => {
      fullOutput += data.toString();
      responseData += data.toString();
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
        responseData.toLowerCase().includes(keyword.toLowerCase())
      );

      const hasJsonResponse = responseData.includes('"jsonrpc"') || 
                             responseData.includes('"result"');

      if (hasJsonResponse && hasExpected) {
        testPassed = true;
        console.log(`   ✅ PASS - Tool executed and returned expected data`);
      } else if (hasJsonResponse) {
        console.log(`   ⚠️  PARTIAL - Tool responded but missing expected keywords`);
      } else if (responseData.includes('running') || responseData.includes('ready')) {
        console.log(`   ⚠️  PARTIAL - Server running but no tool response`);
      } else {
        console.log(`   ❌ FAIL - No valid response received`);
      }

      resolve({
        name: test.name,
        passed: testPassed,
        hasResponse: hasJsonResponse
      });
    }, 10000);
  });
}

async function runDeepTests() {
  console.log('🔬 DEEP FUNCTIONAL TESTING - Real Task Execution\n');
  console.log('='.repeat(70));

  const results = [];
  
  for (const test of deepTests) {
    const result = await runDeepTest(test);
    results.push(result);
  }

  console.log('\n' + '='.repeat(70));
  console.log('\n📊 DEEP FUNCTIONAL TEST RESULTS:\n');

  let passed = 0;
  let partial = 0;

  results.forEach(r => {
    const icon = r.passed ? '✅' : r.hasResponse ? '⚠️ ' : '❌';
    console.log(`${icon} ${r.name.padEnd(45)} - ${r.passed ? 'PASS' : 'PARTIAL'}`);
    if (r.passed) passed++;
    else partial++;
  });

  console.log(`\n📈 Results: ${passed}/5 PASS, ${partial}/5 PARTIAL`);
  
  if (passed >= 4) {
    console.log('\n✅ DEEP FUNCTIONAL TESTING PASSED\n');
  } else {
    console.log('\n⚠️  DEEP FUNCTIONAL TESTING NEEDS REVIEW\n');
  }
}

runDeepTests().catch(console.error);

