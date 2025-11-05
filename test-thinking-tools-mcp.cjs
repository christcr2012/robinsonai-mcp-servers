#!/usr/bin/env node
/**
 * Test Thinking Tools MCP to see if it exposes tools
 */

const { spawn } = require('child_process');

// Spawn the MCP server
const server = spawn('npx', ['-y', '@robinson_ai_systems/thinking-tools-mcp@1.20.1'], {
  stdio: ['pipe', 'pipe', 'pipe'],
  env: {
    ...process.env,
    WORKSPACE_ROOT: process.cwd(),
    AUGMENT_WORKSPACE_ROOT: process.cwd(),
  }
});

// Send tools/list request
const request = {
  jsonrpc: '2.0',
  id: 1,
  method: 'tools/list',
  params: {}
};

server.stdin.write(JSON.stringify(request) + '\n');

// Collect response
let response = '';
server.stdout.on('data', (data) => {
  response += data.toString();
  console.log('Response:', data.toString());
  
  // Try to parse as JSON
  try {
    const lines = response.split('\n').filter(l => l.trim());
    for (const line of lines) {
      const json = JSON.parse(line);
      if (json.result && json.result.tools) {
        console.log(`\n✅ Found ${json.result.tools.length} tools:`);
        json.result.tools.slice(0, 10).forEach(t => {
          console.log(`  - ${t.name}: ${t.description.substring(0, 60)}...`);
        });
        server.kill();
        process.exit(0);
      }
    }
  } catch (e) {
    // Not valid JSON yet, keep collecting
  }
});

server.stderr.on('data', (data) => {
  console.error('Error:', data.toString());
});

server.on('close', (code) => {
  console.log(`Server exited with code ${code}`);
  if (response.includes('"tools"')) {
    console.log('\n✅ Server responded with tools');
  } else {
    console.log('\n❌ Server did not respond with tools');
    console.log('Full response:', response);
  }
});

// Timeout after 5 seconds
setTimeout(() => {
  console.log('\n⏱️  Timeout - killing server');
  server.kill();
  process.exit(1);
}, 5000);

