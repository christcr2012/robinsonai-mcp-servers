#!/usr/bin/env node
/**
 * Direct test of Context Engine search functionality
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Start MCP server
function startServer() {
  return new Promise((resolve, reject) => {
    const serverPath = join(__dirname, 'packages', 'thinking-tools-mcp', 'dist', 'index.js');
    
    console.log(`Starting server: ${serverPath}`);
    
    const server = spawn('node', [serverPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        VOYAGE_API_KEY: process.env.VOYAGE_API_KEY || '',
        AUGMENT_WORKSPACE_ROOT: __dirname,
      }
    });

    let initDone = false;
    let buffer = '';

    server.stdout.on('data', (data) => {
      buffer += data.toString();
      
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      
      for (const line of lines) {
        if (!line.trim()) continue;
        
        try {
          const msg = JSON.parse(line);
          if (msg.id === 'init' && msg.result) {
            initDone = true;
            console.log('✅ Server initialized');
            resolve(server);
          }
        } catch (e) {
          // Ignore
        }
      }
    });

    server.stderr.on('data', (data) => {
      console.log('[stderr]', data.toString().trim());
    });

    server.on('error', reject);
    server.on('exit', (code) => {
      if (!initDone) {
        reject(new Error(`Server exited with code ${code}`));
      }
    });

    // Send initialize
    setTimeout(() => {
      sendRequest(server, 'initialize', {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'test', version: '1.0.0' }
      }, 'init');
    }, 100);
  });
}

function sendRequest(server, method, params, id = Date.now()) {
  const request = {
    jsonrpc: '2.0',
    id,
    method,
    params
  };
  
  server.stdin.write(JSON.stringify(request) + '\n');
  
  return new Promise((resolve, reject) => {
    let buffer = '';
    const timeout = setTimeout(() => {
      reject(new Error(`Timeout: ${method}`));
    }, 30000);

    const onData = (data) => {
      buffer += data.toString();
      
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      
      for (const line of lines) {
        if (!line.trim()) continue;
        
        try {
          const msg = JSON.parse(line);
          if (msg.id === id) {
            clearTimeout(timeout);
            server.stdout.off('data', onData);
            
            if (msg.error) {
              reject(new Error(`RPC Error: ${JSON.stringify(msg.error)}`));
            } else {
              resolve(msg.result);
            }
          }
        } catch (e) {
          // Ignore
        }
      }
    };

    server.stdout.on('data', onData);
  });
}

async function main() {
  console.log('\n=== CONTEXT ENGINE DIRECT TEST ===\n');
  
  let server;
  
  try {
    server = await startServer();
    
    // Test 1: context_stats
    console.log('\n📊 Test 1: Get Context Engine stats...');
    const stats = await sendRequest(server, 'tools/call', {
      name: 'context_stats',
      arguments: {}
    });
    
    console.log('Stats result:', JSON.stringify(stats, null, 2));
    
    // Test 2: context_query
    console.log('\n🔍 Test 2: Query for "MCP server"...');
    const query = await sendRequest(server, 'tools/call', {
      name: 'context_query',
      arguments: {
        query: 'MCP server',
        top_k: 5
      }
    });
    
    console.log('Query result:', JSON.stringify(query, null, 2));
    
    console.log('\n✅ Tests complete');
    process.exit(0);
    
  } catch (e) {
    console.error('\n❌ Test failed:', e.message);
    console.error(e.stack);
    process.exit(1);
  } finally {
    if (server) {
      server.kill();
    }
  }
}

main();

