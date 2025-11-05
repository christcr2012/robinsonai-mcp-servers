#!/usr/bin/env node

import { spawn } from 'child_process';

async function listTools(name, pkg) {
  return new Promise((resolve) => {
    console.log(`\n📋 ${name}`);
    
    const server = spawn('npx', ['-y', pkg], {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true,
      timeout: 15000
    });

    let output = '';

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
    }, 300);

    // List tools
    setTimeout(() => {
      const tools = JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list',
        params: {}
      }) + '\n';
      server.stdin.write(tools);
    }, 800);

    // Show output
    setTimeout(() => {
      server.kill();
      
      // Extract tool names
      const toolMatches = output.match(/"name":"([^"]+)"/g);
      if (toolMatches) {
        const tools = toolMatches.map(m => m.match(/"name":"([^"]+)"/)[1]);
        console.log(`   Found ${tools.length} tools:`);
        tools.slice(0, 10).forEach(t => {
          console.log(`     - ${t}`);
        });
        if (tools.length > 10) {
          console.log(`     ... and ${tools.length - 10} more`);
        }
      }
      
      resolve();
    }, 6000);
  });
}

async function run() {
  console.log('📋 LISTING ALL TOOL NAMES FOR PHASE 4 TESTING\n');
  console.log('='.repeat(70));

  await listTools('FREE Agent MCP', '@robinson_ai_systems/free-agent-mcp@^0.2.0');
  await listTools('PAID Agent MCP', '@robinson_ai_systems/paid-agent-mcp@^0.3.0');
  await listTools('Thinking Tools MCP', '@robinson_ai_systems/thinking-tools-mcp@^1.19.0');
  await listTools('Robinson Toolkit MCP', '@robinson_ai_systems/robinsons-toolkit-mcp@^1.1.0');
  await listTools('Credit Optimizer MCP', '@robinson_ai_systems/credit-optimizer-mcp@^0.3.0');

  console.log('\n' + '='.repeat(70));
}

run().catch(console.error);

