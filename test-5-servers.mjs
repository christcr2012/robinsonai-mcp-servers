#!/usr/bin/env node
/**
 * Test all 5 MCP servers in the simplified architecture
 */

import { spawn } from 'child_process';
import { setTimeout as sleep } from 'timers/promises';

const servers = [
  {
    name: 'free-agent-mcp',
    package: '@robinsonai/free-agent-mcp',
    expectedTools: 17
  },
  {
    name: 'paid-agent-mcp',
    package: '@robinsonai/paid-agent-mcp',
    expectedTools: 17
  },
  {
    name: 'robinsons-toolkit-mcp',
    package: '@robinsonai/robinsons-toolkit-mcp',
    expectedTools: 5 // Broker tools
  },
  {
    name: 'thinking-tools-mcp',
    package: '@robinsonai/thinking-tools-mcp',
    expectedTools: 24
  },
  {
    name: 'credit-optimizer-mcp',
    package: '@robinsonai/credit-optimizer-mcp',
    expectedTools: 40 // Approximate
  }
];

async function testServer(server) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing: ${server.name}`);
  console.log(`Package: ${server.package}`);
  console.log(`${'='.repeat(60)}`);

  return new Promise((resolve) => {
    const proc = spawn('npx', ['-y', server.package], {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true
    });

    let output = '';
    let hasInitialized = false;
    let toolCount = 0;

    const timeout = setTimeout(() => {
      proc.kill();
      resolve({
        name: server.name,
        success: false,
        error: 'Timeout after 30 seconds'
      });
    }, 30000);

    proc.stdout.on('data', (data) => {
      output += data.toString();
    });

    proc.stderr.on('data', (data) => {
      const str = data.toString();
      if (str.includes('error') || str.includes('Error')) {
        console.error(`  ❌ Error: ${str.trim()}`);
      }
    });

    // Send initialize request
    (async () => {
      await sleep(1000);

      const initRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'test-client', version: '1.0.0' }
        }
      };
      proc.stdin.write(JSON.stringify(initRequest) + '\n');

      // Wait a bit then request tools list
      await sleep(2000);

      const toolsRequest = {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/list',
        params: {}
      };
      proc.stdin.write(JSON.stringify(toolsRequest) + '\n');

      // Wait for response
      await sleep(3000);
      proc.kill();
    })();

    proc.on('close', () => {
      clearTimeout(timeout);

      // Parse output for JSON-RPC responses
      const lines = output.split('\n');
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const json = JSON.parse(line);
          if (json.result && json.result.capabilities) {
            hasInitialized = true;
            console.log('  ✅ Server initialized successfully');
          }
          if (json.result && json.result.tools) {
            toolCount = json.result.tools.length;
            console.log(`  ✅ Tools list received: ${toolCount} tools`);
            
            // Show first 5 tools
            console.log('  📋 Sample tools:');
            json.result.tools.slice(0, 5).forEach(tool => {
              console.log(`     - ${tool.name}`);
            });
          }
        } catch (e) {
          // Not JSON, skip
        }
      }

      const success = hasInitialized && toolCount > 0;
      
      if (success) {
        console.log(`  ✅ ${server.name} is working! (${toolCount} tools)`);
      } else {
        console.log(`  ❌ ${server.name} failed`);
        if (!hasInitialized) console.log('     - Did not initialize');
        if (toolCount === 0) console.log('     - No tools found');
      }

      resolve({
        name: server.name,
        success,
        initialized: hasInitialized,
        toolCount,
        expectedTools: server.expectedTools
      });
    });
  });
}

async function main() {
  console.log('\n🧪 TESTING 5 MCP SERVERS (Simplified Architecture)\n');

  const results = [];
  for (const server of servers) {
    const result = await testServer(server);
    results.push(result);
    await sleep(1000); // Brief pause between tests
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));

  let allPassed = true;
  results.forEach(r => {
    const status = r.success ? '✅ PASS' : '❌ FAIL';
    const tools = r.toolCount ? `(${r.toolCount} tools)` : '(no tools)';
    console.log(`${status} ${r.name.padEnd(30)} ${tools}`);
    if (!r.success) allPassed = false;
  });

  console.log('\n' + '='.repeat(60));
  if (allPassed) {
    console.log('✅ ALL SERVERS WORKING!');
    console.log('\n🚀 Safe to restart VSCode and load the configuration!');
  } else {
    console.log('❌ SOME SERVERS FAILED');
    console.log('\n⚠️  Fix the failing servers before restarting VSCode');
  }
  console.log('='.repeat(60) + '\n');

  process.exit(allPassed ? 0 : 1);
}

main();

