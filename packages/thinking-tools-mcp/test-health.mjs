#!/usr/bin/env node
// Test tools/list to see all registered tools
import { spawn } from 'child_process';

const server = spawn('node', ['dist/index.js'], {
  stdio: ['pipe', 'pipe', 'pipe'],  // Capture stderr too
  cwd: process.cwd()
});

let buffer = '';
let initialized = false;
let handshakeComplete = false;

// Listen to stderr for "Server connected and ready" message
server.stderr.on('data', (data) => {
  const text = data.toString();

  // Look for "Server connected and ready" message
  if (text.includes('Server connected and ready') && !initialized) {
    console.log('✓ Server ready, sending initialize request...');
    initialized = true;
    // Send initialize request to complete MCP handshake
    server.stdin.write(JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'test-client', version: '1.0.0' }
      }
    }) + '\n');
  }
});

server.stdout.on('data', (data) => {
  const text = data.toString();
  buffer += text;

  const lines = buffer.split('\n');
  buffer = lines.pop() || '';

  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const msg = JSON.parse(line);

      // After initialize response, send initialized notification and list tools
      if (msg.id === 1 && msg.result && !handshakeComplete) {
        console.log('✓ Initialize response received, sending initialized notification...');
        handshakeComplete = true;
        // Send initialized notification
        server.stdin.write(JSON.stringify({
          jsonrpc: '2.0',
          method: 'notifications/initialized',
          params: {}
        }) + '\n');

        console.log('✓ Requesting tools list...');
        // List tools
        server.stdin.write(JSON.stringify({
          jsonrpc: '2.0',
          id: 2,
          method: 'tools/list',
          params: {}
        }) + '\n');
      }

      // Print tools list
      if (msg.id === 2 && msg.result) {
        console.log('✓ Tools list received!');
        console.log('\n=== TOOLS LIST ===');
        console.log(`Total tools: ${msg.result.tools?.length || 0}`);
        console.log('\nTool names:');
        (msg.result.tools || []).forEach((t, i) => {
          console.log(`${i + 1}. ${t.name}`);
        });
        server.kill();
        process.exit(0);
      }
    } catch (e) {
      // Ignore non-JSON lines
    }
  }
});

setTimeout(() => {
  console.error('Timeout');
  server.kill();
  process.exit(1);
}, 10000);

