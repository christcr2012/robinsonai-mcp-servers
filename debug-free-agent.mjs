#!/usr/bin/env node

import { spawn } from 'child_process';

console.log('🔍 Debugging Free Agent MCP - Code Generation\n');

const server = spawn('npx', ['-y', '@robinson_ai_systems/free-agent-mcp@^0.2.0'], {
  stdio: ['pipe', 'pipe', 'pipe'],
  shell: true,
  timeout: 30000
});

let output = '';
let stderr = '';

server.stdout.on('data', (data) => {
  output += data.toString();
  console.log('STDOUT:', data.toString().substring(0, 200));
});

server.stderr.on('data', (data) => {
  stderr += data.toString();
  if (!data.toString().includes('better-sqlite3')) {
    console.log('STDERR:', data.toString().substring(0, 200));
  }
});

// Initialize
setTimeout(() => {
  console.log('\n📤 Sending initialize...');
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
}, 1000);

// List tools
setTimeout(() => {
  console.log('\n📤 Requesting tools list...');
  const tools = JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/list',
    params: {}
  }) + '\n';
  server.stdin.write(tools);
}, 2000);

// Call code generation
setTimeout(() => {
  console.log('\n📤 Calling code generation tool...');
  const call = JSON.stringify({
    jsonrpc: '2.0',
    id: 2,
    method: 'tools/call',
    params: {
      name: 'delegate_code_generation_free-agent-mcp',
      arguments: {
        task: 'Write a function that validates email addresses',
        context: 'TypeScript, strict mode',
        complexity: 'simple'
      }
    }
  }) + '\n';
  server.stdin.write(call);
}, 3000);

// Terminate and show results
setTimeout(() => {
  console.log('\n\n📊 FULL OUTPUT:\n');
  console.log('='.repeat(70));
  console.log(output);
  console.log('='.repeat(70));
  
  console.log('\n✅ Analysis:');
  if (output.includes('"jsonrpc"')) {
    console.log('  ✅ Server responds with JSON-RPC');
  }
  if (output.includes('"result"')) {
    console.log('  ✅ Tool returned a result');
  }
  if (output.includes('function') || output.includes('validate')) {
    console.log('  ✅ Response contains code-related content');
  }
  if (output.includes('error')) {
    console.log('  ❌ Response contains error');
  }
  
  server.kill();
}, 12000);

