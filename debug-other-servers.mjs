#!/usr/bin/env node

import { spawn } from 'child_process';

const debugTests = [
  {
    name: 'Thinking Tools - List Tools',
    package: '@robinson_ai_systems/thinking-tools-mcp@^1.19.0'
  },
  {
    name: 'Robinson Toolkit - List Tools',
    package: '@robinson_ai_systems/robinsons-toolkit-mcp@^1.1.0'
  },
  {
    name: 'Credit Optimizer - List Tools',
    package: '@robinson_ai_systems/credit-optimizer-mcp@^0.3.0'
  }
];

async function debugServer(test) {
  return new Promise((resolve) => {
    console.log(`\n🔍 ${test.name}\n`);
    
    const server = spawn('npx', ['-y', test.package], {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true,
      timeout: 20000
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
    }, 500);

    // List tools
    setTimeout(() => {
      const tools = JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list',
        params: {}
      }) + '\n';
      server.stdin.write(tools);
    }, 1500);

    // Show output
    setTimeout(() => {
      server.kill();
      
      console.log('OUTPUT (first 500 chars):');
      console.log(output.substring(0, 500));
      console.log('\n---\n');
      
      // Extract tool names
      const toolMatches = output.match(/"name":"([^"]+)"/g);
      if (toolMatches) {
        console.log(`Found ${toolMatches.length} tools:`);
        toolMatches.slice(0, 5).forEach(m => {
          const name = m.match(/"name":"([^"]+)"/)[1];
          console.log(`  - ${name}`);
        });
      }
      
      resolve();
    }, 8000);
  });
}

async function runDebug() {
  console.log('🔍 DEBUGGING OTHER SERVERS - Checking Tool Names\n');
  console.log('='.repeat(70));

  for (const test of debugTests) {
    await debugServer(test);
  }

  console.log('='.repeat(70));
}

runDebug().catch(console.error);

