#!/usr/bin/env node
// Test tools/list to see all registered tools
import { spawn } from 'child_process';

const server = spawn('node', ['dist/index.js'], {
  stdio: ['pipe', 'pipe', 'inherit'],
  cwd: process.cwd()
});

let buffer = '';
let initialized = false;

server.stdout.on('data', (data) => {
  buffer += data.toString();
  const lines = buffer.split('\n');
  buffer = lines.pop() || '';

  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const msg = JSON.parse(line);

      // Send initialize request
      if (!initialized && !msg.id) {
        initialized = true;
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

      // After initialize, list tools
      if (msg.id === 1 && msg.result) {
        server.stdin.write(JSON.stringify({
          jsonrpc: '2.0',
          id: 2,
          method: 'tools/list',
          params: {}
        }) + '\n');
      }

      // Print tools list
      if (msg.id === 2 && msg.result) {
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

