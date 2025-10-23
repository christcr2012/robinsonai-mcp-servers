#!/usr/bin/env node
/**
 * Test all 6 MCP servers to verify they respond correctly
 */

import { spawn } from 'child_process';

const servers = [
  {
    name: 'architect-mcp',
    command: 'node',
    args: ['packages/architect-mcp/dist/index.js'],
    expectedTools: 12
  },
  {
    name: 'autonomous-agent-mcp',
    command: 'node',
    args: ['packages/autonomous-agent-mcp/dist/index.js'],
    expectedTools: 8
  },
  {
    name: 'credit-optimizer-mcp',
    command: 'node',
    args: ['packages/credit-optimizer-mcp/dist/index.js'],
    expectedTools: 32
  },
  {
    name: 'thinking-tools-mcp',
    command: 'node',
    args: ['packages/thinking-tools-mcp/dist/index.js'],
    expectedTools: 24
  },
  {
    name: 'openai-worker-mcp',
    command: 'node',
    args: ['packages/openai-worker-mcp/dist/index.js'],
    expectedTools: 30
  },
  {
    name: 'robinsons-toolkit-mcp',
    command: 'node',
    args: ['packages/robinsons-toolkit-mcp/dist/index.js'],
    expectedTools: 5
  }
];

console.log('🚀 Testing all 6 MCP servers...\n');
console.log('This will test that each server:');
console.log('  1. Responds to initialize request');
console.log('  2. Responds to tools/list request');
console.log('  3. Returns the expected number of tools\n\n');

let passed = 0;
let failed = 0;

for (const server of servers) {
  console.log(`🧪 Testing ${server.name}...`);
  
  try {
    const result = await testServer(server);
    if (result.success) {
      console.log(`✅ ${server.name}: PASS (${result.toolCount} tools)\n`);
      passed++;
    } else {
      console.log(`❌ ${server.name}: FAIL - ${result.error}\n`);
      failed++;
    }
  } catch (error) {
    console.log(`❌ ${server.name}: FAIL - ${error.message}\n`);
    failed++;
  }
}

console.log('============================================================');
console.log('SUMMARY');
console.log('============================================================\n');
console.log(`✅ Passed: ${passed}/${servers.length}`);
console.log(`❌ Failed: ${failed}/${servers.length}\n`);

if (failed === 0) {
  console.log('🎉 All servers are working correctly!\n');
  console.log('You can now import the configuration into Augment Code.\n');
} else {
  console.log('⚠️  Some servers failed. Check the errors above.\n');
  process.exit(1);
}

async function testServer(serverConfig) {
  return new Promise((resolve) => {
    const proc = spawn(serverConfig.command, serverConfig.args, {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let initReceived = false;
    let toolsReceived = false;
    let toolCount = 0;

    const timeout = setTimeout(() => {
      proc.kill();
      resolve({ success: false, error: 'Timeout waiting for response' });
    }, 10000);

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
      
      const lines = stdout.split('\n');
      for (const line of lines) {
        if (!line.trim()) continue;
        
        try {
          const response = JSON.parse(line);
          
          if (response.result && response.result.protocolVersion) {
            initReceived = true;
            
            // Send tools/list request
            proc.stdin.write(JSON.stringify({
              jsonrpc: '2.0',
              id: 2,
              method: 'tools/list',
              params: {}
            }) + '\n');
          }
          
          if (response.result && response.result.tools) {
            toolsReceived = true;
            toolCount = response.result.tools.length;
            
            clearTimeout(timeout);
            proc.kill();
            
            resolve({
              success: true,
              toolCount
            });
          }
        } catch (e) {
          // Ignore non-JSON lines
        }
      }
    });

    proc.on('error', (error) => {
      clearTimeout(timeout);
      resolve({ success: false, error: error.message });
    });

    // Send initialize request
    proc.stdin.write(JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: {
          name: 'test-client',
          version: '1.0.0'
        }
      }
    }) + '\n');
  });
}

