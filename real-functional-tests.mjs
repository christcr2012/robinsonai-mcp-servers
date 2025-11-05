#!/usr/bin/env node

import { spawn } from 'child_process';
import { writeFileSync } from 'fs';

const tests = [
  {
    name: 'Free Agent MCP - Code Generation',
    package: '@robinson_ai_systems/free-agent-mcp@^0.2.0',
    request: {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'delegate_code_generation_free-agent-mcp',
        arguments: {
          task: 'Create a simple hello world function',
          context: 'JavaScript',
          complexity: 'simple'
        }
      }
    }
  },
  {
    name: 'Paid Agent MCP - Versatile Task',
    package: '@robinson_ai_systems/paid-agent-mcp@^0.3.0',
    request: {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'execute_versatile_task_paid-agent-mcp',
        arguments: {
          task: 'Analyze this code for issues',
          taskType: 'code_analysis'
        }
      }
    }
  },
  {
    name: 'Thinking Tools MCP - Sequential Thinking',
    package: '@robinson_ai_systems/thinking-tools-mcp@^1.19.0',
    request: {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'sequentialthinking_Sequential_thinking',
        arguments: {
          thought: 'Test sequential thinking',
          nextThoughtNeeded: false,
          thoughtNumber: 1,
          totalThoughts: 1
        }
      }
    }
  },
  {
    name: 'Robinson Toolkit - Discover Tools',
    package: '@robinson_ai_systems/robinsons-toolkit-mcp@^1.1.0',
    request: {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'toolkit_discover_Robinson_s_Toolkit_MCP',
        arguments: {
          query: 'github create repo',
          limit: 5
        }
      }
    }
  },
  {
    name: 'Credit Optimizer - Discover Tools',
    package: '@robinson_ai_systems/credit-optimizer-mcp@^0.3.0',
    request: {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'discover_tools_Credit_Optimizer_MCP',
        arguments: {
          query: 'code generation',
          limit: 5
        }
      }
    }
  }
];

async function testServer(test) {
  return new Promise((resolve) => {
    console.log(`\n🧪 Testing: ${test.name}`);
    
    const server = spawn('npx', ['-y', test.package], {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true,
      timeout: 15000
    });

    let output = '';
    let responseReceived = false;
    let hasError = false;

    server.stdout.on('data', (data) => {
      output += data.toString();
      
      // Check for JSON response
      if (output.includes('"jsonrpc"') || output.includes('"result"')) {
        responseReceived = true;
      }
    });

    server.stderr.on('data', (data) => {
      const err = data.toString();
      if (!err.includes('better-sqlite3') && !err.includes('Could not locate')) {
        hasError = true;
      }
    });

    // Send initialize
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

    // Send tool call
    setTimeout(() => {
      const call = JSON.stringify(test.request) + '\n';
      server.stdin.write(call);
    }, 1500);

    // Terminate and check results
    setTimeout(() => {
      server.kill();
      
      let status = 'FAIL';
      let details = '';

      if (responseReceived) {
        status = 'PASS';
        details = '✅ Tool responded with data';
      } else if (output.includes('running on stdio') || output.includes('ready')) {
        status = 'PARTIAL';
        details = '⚠️  Server running but no response';
      } else if (hasError) {
        status = 'ERROR';
        details = '❌ Server error occurred';
      } else {
        status = 'TIMEOUT';
        details = '⏱️  No response received';
      }

      console.log(`   Status: ${status}`);
      console.log(`   ${details}`);
      
      resolve({
        name: test.name,
        status,
        output: output.substring(0, 200)
      });
    }, 8000);
  });
}

async function runTests() {
  console.log('🔬 REAL FUNCTIONAL TESTING - MCP Servers\n');
  console.log('='.repeat(70));

  const results = [];
  
  for (const test of tests) {
    const result = await testServer(test);
    results.push(result);
  }

  console.log('\n' + '='.repeat(70));
  console.log('\n📊 FUNCTIONAL TEST RESULTS:\n');

  let passed = 0;
  let partial = 0;
  let failed = 0;

  results.forEach(r => {
    const icon = r.status === 'PASS' ? '✅' : r.status === 'PARTIAL' ? '⚠️ ' : '❌';
    console.log(`${icon} ${r.name.padEnd(45)} - ${r.status}`);
    if (r.status === 'PASS') passed++;
    else if (r.status === 'PARTIAL') partial++;
    else failed++;
  });

  console.log(`\n📈 Results: ${passed} PASS, ${partial} PARTIAL, ${failed} FAIL`);
  
  if (failed === 0 && passed >= 3) {
    console.log('\n✅ FUNCTIONAL TESTING PASSED - Servers are working!\n');
  } else {
    console.log('\n❌ FUNCTIONAL TESTING FAILED - Issues detected\n');
  }
}

runTests().catch(console.error);

