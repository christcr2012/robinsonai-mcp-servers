#!/usr/bin/env node

/**
 * Test script to verify FREE agent works
 * 
 * This will call delegate_code_generation_free-agent-mcp to generate
 * a simple utility function and save it to a file.
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// MCP request to generate code
const request = {
  jsonrpc: '2.0',
  id: 1,
  method: 'tools/call',
  params: {
    name: 'delegate_code_generation_free-agent-mcp',
    arguments: {
      task: 'Create a simple TypeScript utility function called formatCurrency that takes a number and returns a formatted currency string (e.g., 1234.56 -> "$1,234.56")',
      context: 'TypeScript, utility function, no external dependencies',
      complexity: 'simple'
    }
  }
};

console.log('🚀 Testing FREE Agent...\n');
console.log('Task: Generate formatCurrency utility function\n');

// Spawn the free-agent-mcp process
const agentPath = join(__dirname, 'packages', 'free-agent-mcp', 'dist', 'index.js');
const agent = spawn('node', [agentPath], {
  stdio: ['pipe', 'pipe', 'inherit'],
  env: {
    ...process.env,
    MAX_OLLAMA_CONCURRENCY: '1',
    OLLAMA_BASE_URL: 'http://localhost:11434',
  }
});

let output = '';

agent.stdout.on('data', (data) => {
  output += data.toString();
});

agent.on('close', (code) => {
  console.log(`\n✅ Agent exited with code ${code}\n`);
  
  try {
    // Parse the output
    const lines = output.split('\n').filter(line => line.trim());
    const responseLine = lines.find(line => line.includes('"result"'));
    
    if (responseLine) {
      const response = JSON.parse(responseLine);
      console.log('📦 Response:', JSON.stringify(response, null, 2));
    } else {
      console.log('📄 Raw output:', output);
    }
  } catch (error) {
    console.error('❌ Error parsing response:', error.message);
    console.log('📄 Raw output:', output);
  }
});

// Send the request
agent.stdin.write(JSON.stringify(request) + '\n');
agent.stdin.end();

console.log('⏳ Waiting for response...\n');

