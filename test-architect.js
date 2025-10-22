#!/usr/bin/env node

/**
 * Quick test of Architect MCP - verify it actually calls Ollama
 */

import { spawn } from 'child_process';
import { createInterface } from 'readline';

console.log('🧪 Testing Architect MCP with real Ollama planning...\n');

// Start the MCP server
const server = spawn('node', ['packages/architect-mcp/dist/index.js'], {
  stdio: ['pipe', 'pipe', 'inherit']
});

const rl = createInterface({ input: server.stdout });
let responseBuffer = '';

rl.on('line', (line) => {
  responseBuffer += line + '\n';
  
  // Check if we got a complete JSON-RPC response
  try {
    const msg = JSON.parse(line);
    if (msg.result) {
      console.log('\n✅ Got response:', JSON.stringify(msg.result, null, 2));
      server.kill();
      process.exit(0);
    }
  } catch (e) {
    // Not JSON, keep buffering
  }
});

server.on('error', (err) => {
  console.error('❌ Server error:', err);
  process.exit(1);
});

server.on('exit', (code) => {
  if (code !== 0 && code !== null) {
    console.error(`❌ Server exited with code ${code}`);
    process.exit(1);
  }
});

// Wait for server to start
setTimeout(() => {
  console.log('📤 Sending plan_work request...\n');
  
  // Send initialize request first
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
  
  server.stdin.write(JSON.stringify(initRequest) + '\n');
  
  // Then send the actual tool call
  setTimeout(() => {
    const toolRequest = {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'plan_work',
        arguments: {
          goal: 'Add a simple health check endpoint to the API',
          depth: 'fast'
        }
      }
    };
    
    server.stdin.write(JSON.stringify(toolRequest) + '\n');
  }, 1000);
}, 2000);

// Timeout after 3 minutes
setTimeout(() => {
  console.error('❌ Test timed out after 3 minutes');
  server.kill();
  process.exit(1);
}, 180000);

