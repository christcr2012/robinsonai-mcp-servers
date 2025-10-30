#!/usr/bin/env node
import { spawn } from 'child_process';

const serverPath = process.argv[2] || 'packages/free-agent-mcp/dist/index.js';

console.log(`Testing: ${serverPath}\n`);

const proc = spawn('node', [serverPath], {
  stdio: ['pipe', 'pipe', 'pipe']
});

let output = '';

proc.stdout.on('data', (data) => {
  const str = data.toString();
  output += str;
  console.log('STDOUT:', str);
  
  // Parse for JSON-RPC responses
  const lines = str.split('\n');
  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const json = JSON.parse(line);
      console.log('JSON Response:', JSON.stringify(json, null, 2));
    } catch (e) {
      // Not JSON
    }
  }
});

proc.stderr.on('data', (data) => {
  console.log('STDERR:', data.toString());
});

proc.on('close', (code) => {
  console.log(`\nProcess exited with code ${code}`);
  process.exit(code);
});

// Wait for server to start
setTimeout(() => {
  console.log('\n=== Sending initialize request ===');
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
  
  setTimeout(() => {
    console.log('\n=== Sending tools/list request ===');
    const toolsRequest = {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list',
      params: {}
    };
    proc.stdin.write(JSON.stringify(toolsRequest) + '\n');
    
    setTimeout(() => {
      console.log('\n=== Killing process ===');
      proc.kill();
    }, 3000);
  }, 2000);
}, 1000);

