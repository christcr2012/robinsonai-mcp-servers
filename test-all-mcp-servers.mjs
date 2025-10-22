#!/usr/bin/env node
/**
 * Test all 4 MCP servers to verify they respond correctly to initialize and tools/list
 */

import { spawn } from 'child_process';
import { setTimeout } from 'timers/promises';

const servers = [
  {
    name: 'architect-mcp',
    command: 'node',
    args: ['packages/architect-mcp/dist/index.js'],
    expectedTools: 6
  },
  {
    name: 'autonomous-agent-mcp',
    command: 'node',
    args: ['packages/autonomous-agent-mcp/dist/index.js'],
    expectedTools: 7
  },
  {
    name: 'credit-optimizer-mcp',
    command: 'node',
    args: ['packages/credit-optimizer-mcp/dist/index.js'],
    expectedTools: 32 // Actual count
  },
  {
    name: 'robinsons-toolkit-mcp',
    command: 'node',
    args: ['packages/robinsons-toolkit-mcp/dist/index.js'],
    expectedTools: 5
  }
];

async function testServer(serverConfig) {
  console.log(`\n🧪 Testing ${serverConfig.name}...`);
  
  return new Promise((resolve) => {
    const proc = spawn(serverConfig.command, serverConfig.args, {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';
    let stderr = '';
    let initResponse = null;
    let toolsResponse = null;

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
      
      // Parse JSON-RPC responses
      const lines = stdout.split('\n');
      for (const line of lines) {
        if (line.trim().startsWith('{')) {
          try {
            const json = JSON.parse(line);
            if (json.id === 1) initResponse = json;
            if (json.id === 2) toolsResponse = json;
          } catch (e) {
            // Not valid JSON yet
          }
        }
      }
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    // Send initialize request
    proc.stdin.write(JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'test', version: '1.0' }
      }
    }) + '\n');

    // Wait a bit then send tools/list
    setTimeout(1000).then(() => {
      proc.stdin.write(JSON.stringify({
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/list',
        params: {}
      }) + '\n');
    });

    // Wait for responses (longer for architect-mcp which warms models)
    setTimeout(35000).then(() => {
      proc.kill();
      
      const result = {
        name: serverConfig.name,
        success: false,
        initOk: false,
        toolsOk: false,
        toolCount: 0,
        errors: []
      };

      // Check initialize response
      if (initResponse && initResponse.result) {
        if (initResponse.result.protocolVersion === '2024-11-05' &&
            initResponse.result.serverInfo &&
            initResponse.result.capabilities) {
          result.initOk = true;
        } else {
          result.errors.push('Initialize response missing required fields');
        }
      } else {
        result.errors.push('No initialize response received');
      }

      // Check tools/list response
      if (toolsResponse && toolsResponse.result && toolsResponse.result.tools) {
        result.toolsOk = true;
        result.toolCount = toolsResponse.result.tools.length;
        
        if (result.toolCount < serverConfig.expectedTools * 0.8) {
          result.errors.push(`Expected ~${serverConfig.expectedTools} tools, got ${result.toolCount}`);
        }
      } else {
        result.errors.push('No tools/list response received');
      }

      result.success = result.initOk && result.toolsOk && result.errors.length === 0;

      // Print result
      if (result.success) {
        console.log(`✅ ${result.name}: PASS (${result.toolCount} tools)`);
      } else {
        console.log(`❌ ${result.name}: FAIL`);
        result.errors.forEach(err => console.log(`   - ${err}`));
      }

      resolve(result);
    });
  });
}

async function main() {
  console.log('🚀 Testing all MCP servers...\n');
  console.log('This will test that each server:');
  console.log('  1. Responds to initialize request');
  console.log('  2. Responds to tools/list request');
  console.log('  3. Returns the expected number of tools\n');

  const results = [];
  for (const server of servers) {
    const result = await testServer(server);
    results.push(result);
  }

  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`\n✅ Passed: ${passed}/${results.length}`);
  console.log(`❌ Failed: ${failed}/${results.length}\n`);

  if (failed > 0) {
    console.log('Failed servers:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.name}`);
      r.errors.forEach(err => console.log(`    • ${err}`));
    });
    process.exit(1);
  } else {
    console.log('🎉 All servers are working correctly!\n');
    console.log('You can now import the configuration into Augment Code.');
    process.exit(0);
  }
}

main().catch(console.error);

