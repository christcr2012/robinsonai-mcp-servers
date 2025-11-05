#!/usr/bin/env node

import { spawn } from 'child_process';

async function debugServer(name, pkg, tool, args) {
  return new Promise((resolve) => {
    console.log(`\n🔍 Debugging: ${name}`);
    console.log(`   Package: ${pkg}`);
    console.log(`   Tool: ${tool}`);
    
    const server = spawn('npx', ['-y', pkg], {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true,
      timeout: 20000
    });

    let output = '';
    let stderr = '';

    server.stdout.on('data', (data) => {
      output += data.toString();
    });

    server.stderr.on('data', (data) => {
      stderr += data.toString();
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

    // Call tool
    setTimeout(() => {
      const call = JSON.stringify({
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: {
          name: tool,
          arguments: args
        }
      }) + '\n';
      server.stdin.write(call);
    }, 2500);

    // Show output
    setTimeout(() => {
      server.kill();
      
      console.log(`\n   Output (first 300 chars):`);
      console.log(`   ${output.substring(0, 300).replace(/\n/g, '\n   ')}`);
      
      if (stderr) {
        console.log(`\n   Stderr (first 200 chars):`);
        console.log(`   ${stderr.substring(0, 200).replace(/\n/g, '\n   ')}`);
      }
      
      // Check for errors
      if (output.includes('Unknown tool')) {
        console.log(`\n   ❌ ERROR: Tool not found`);
      } else if (output.includes('"isError":true')) {
        console.log(`\n   ❌ ERROR: Tool returned error`);
      } else if (output.includes('"result"')) {
        console.log(`\n   ✅ Tool executed successfully`);
      } else {
        console.log(`\n   ⚠️  Unclear response`);
      }
      
      resolve();
    }, 10000);
  });
}

async function runDebug() {
  console.log('🔍 PHASE 4 DEBUG - Checking Tool Names and Responses\n');
  console.log('='.repeat(70));

  await debugServer(
    'FREE Agent - Code Generation',
    '@robinson_ai_systems/free-agent-mcp@^0.2.0',
    'delegate_code_generation',
    {
      task: 'Create a debounce function',
      context: 'TypeScript',
      complexity: 'simple'
    }
  );

  await debugServer(
    'Thinking Tools - SWOT Analysis',
    '@robinson_ai_systems/thinking-tools-mcp@^1.19.0',
    'swot_analysis_Thinking_Tools_MCP',
    {
      subject: 'Robinson AI',
      perspective: 'technical'
    }
  );

  await debugServer(
    'Robinson Toolkit - GitHub',
    '@robinson_ai_systems/robinsons-toolkit-mcp@^1.1.0',
    'toolkit_list_tools',
    {
      category: 'github',
      limit: 5
    }
  );

  console.log('\n' + '='.repeat(70));
}

runDebug().catch(console.error);

