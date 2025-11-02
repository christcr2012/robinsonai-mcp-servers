#!/usr/bin/env node

/**
 * Test FREE agent using raw JSON-RPC (bypasses MCP SDK client issues)
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Testing FREE Agent with Raw JSON-RPC\n');

// Spawn the free-agent-mcp process
const agentPath = join(__dirname, 'packages', 'free-agent-mcp', 'dist', 'index.js');
const agent = spawn('node', [agentPath], {
  stdio: ['pipe', 'pipe', 'pipe'],
  env: {
    ...process.env,
    MAX_OLLAMA_CONCURRENCY: '1',
    OLLAMA_BASE_URL: 'http://localhost:11434',
  }
});

let output = '';
let errorOutput = '';

agent.stdout.on('data', (data) => {
  output += data.toString();
  // Check if we have a complete JSON-RPC response
  const lines = output.split('\n');
  for (const line of lines) {
    if (line.trim().startsWith('{')) {
      try {
        const response = JSON.parse(line);
        if (response.id === 2) {
          console.log('✅ Received response!');
          console.log(JSON.stringify(response, null, 2));
          agent.kill();
          process.exit(0);
        }
      } catch (e) {
        // Not a complete JSON yet
      }
    }
  }
});

agent.stderr.on('data', (data) => {
  errorOutput += data.toString();
  process.stderr.write(data);
});

agent.on('close', (code) => {
  if (code !== 0) {
    console.error(`\n❌ Agent exited with code ${code}`);
    process.exit(1);
  }
});

// Wait for server to start
setTimeout(() => {
  console.log('Sending initialize request...\n');
  
  // Send initialize request
  const initRequest = {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'test-client',
        version: '1.0.0'
      }
    }
  };
  
  agent.stdin.write(JSON.stringify(initRequest) + '\n');
  
  // Wait a bit then send the actual request
  setTimeout(() => {
    console.log('Sending code generation request...\n');
    
    const request = {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'delegate_code_generation',
        arguments: {
          task: 'Create a function that calculates factorial',
          context: 'TypeScript, recursive implementation',
          complexity: 'simple',
          quality: 'fast'
        }
      }
    };
    
    agent.stdin.write(JSON.stringify(request) + '\n');
  }, 1000);
}, 2000);

// Timeout after 60 seconds
setTimeout(() => {
  console.error('\n❌ Test timed out after 60 seconds');
  agent.kill();
  process.exit(1);
}, 60000);

