#!/usr/bin/env node
/**
 * Test evidence gathering in frameworks
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
            console.log('✅ Server initialized\n');
            resolve(server);
          }
        } catch (e) {
          // Ignore
        }
      }
    });

    server.stderr.on('data', (data) => {
      const text = data.toString().trim();
      // Log all Context Engine and framework activity
      if (text.includes('[blendedSearch]') || text.includes('[framework_') ||
          text.includes('[ContextEngine]') || text.includes('[buildSymbolIndex]')) {
        console.log('[stderr]', text);
      }
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
    }, 60000); // 60s timeout for symbol index building

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
  console.log('\n=== EVIDENCE GATHERING TEST ===\n');
  
  let server;
  
  try {
    server = await startServer();
    
    // Test: Initialize framework with evidence gathering
    console.log('🔍 Testing framework_devils_advocate with evidence gathering...\n');
    
    const startTime = Date.now();
    const result = await sendRequest(server, 'tools/call', {
      name: 'framework_devils_advocate',
      arguments: {
        problem: 'We should use a monolithic architecture instead of microservices',
        context: 'MCP servers, Robinson AI system',
        totalSteps: 3
      }
    });
    const elapsed = Date.now() - startTime;
    
    console.log(`\n⏱️  Initialization took ${elapsed}ms`);
    
    // Parse the response to check for evidence
    const text = result.content[0].text;

    console.log('\n📄 Full response (first 1000 chars):');
    console.log(text.substring(0, 1000));
    console.log('\n...\n');

    // Look for evidence count in header
    const evidenceCountMatch = text.match(/\*\*Evidence Gathered:\*\*\s+(\d+)\s+items/);
    if (evidenceCountMatch) {
      const count = parseInt(evidenceCountMatch[1]);
      console.log(`\n✅ SUCCESS: Evidence gathering working! Found ${count} evidence items!`);

      // Look for evidence section
      const evidenceMatch = text.match(/## Evidence from Codebase[\s\S]*?(?=\n## |$)/);
      if (evidenceMatch) {
        console.log('\n📚 Evidence section preview:');
        console.log(evidenceMatch[0].substring(0, 500) + '...');
      }
    } else {
      console.log('\n❌ No evidence count found in response');
    }
    
    console.log('\n✅ Test complete');
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

