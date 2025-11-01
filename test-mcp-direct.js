#!/usr/bin/env node

/**
 * Direct test of MCP servers without shell issues
 */

const { spawn } = require('child_process');
const path = require('path');

async function testServer(serverName, packageName) {
  console.log(`\n🧪 Testing ${serverName}...`);
  
  return new Promise((resolve) => {
    // Try to run the server directly using node
    const serverPath = path.join(__dirname, 'node_modules', '@robinsonai', packageName.split('/')[1], 'dist', 'index.js');
    
    console.log(`   📍 Server path: ${serverPath}`);
    
    const child = spawn('node', [serverPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        OLLAMA_BASE_URL: 'http://localhost:11434',
        MAX_OLLAMA_CONCURRENCY: '15',
        AGENT_STATS_DB: 'agent-stats.db'
      }
    });

    let output = '';
    let errorOutput = '';
    let hasStarted = false;
    
    const timeout = setTimeout(() => {
      if (!hasStarted) {
        child.kill();
        console.log(`   ⚠️  ${serverName}: Timeout (may still work)`);
        resolve({ name: serverName, status: 'timeout' });
      }
    }, 10000);

    child.stdout.on('data', (data) => {
      output += data.toString();
      console.log(`   📤 stdout: ${data.toString().trim()}`);
      
      // Look for signs the server is ready
      if (output.includes('Server running') || 
          output.includes('listening') || 
          output.includes('ready') ||
          output.includes('MCP server')) {
        hasStarted = true;
        clearTimeout(timeout);
        
        // Send a simple initialize request
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
        
        child.stdin.write(JSON.stringify(initRequest) + '\n');
        
        setTimeout(() => {
          child.kill();
          console.log(`   ✅ ${serverName}: Started successfully`);
          resolve({ name: serverName, status: 'success' });
        }, 2000);
      }
    });

    child.stderr.on('data', (data) => {
      errorOutput += data.toString();
      console.log(`   📥 stderr: ${data.toString().trim()}`);
      
      if (data.toString().includes('Error') || data.toString().includes('ENOENT')) {
        clearTimeout(timeout);
        child.kill();
        console.log(`   ❌ ${serverName}: Error - ${data.toString().trim()}`);
        resolve({ name: serverName, status: 'error', error: data.toString().trim() });
      }
    });

    child.on('close', (code) => {
      clearTimeout(timeout);
      if (!hasStarted && code !== 0) {
        console.log(`   ❌ ${serverName}: Exited with code ${code}`);
        console.log(`   📋 Output: ${output}`);
        console.log(`   📋 Error: ${errorOutput}`);
        resolve({ name: serverName, status: 'failed', code, output, errorOutput });
      }
    });

    child.on('error', (err) => {
      clearTimeout(timeout);
      console.log(`   ❌ ${serverName}: Process error - ${err.message}`);
      resolve({ name: serverName, status: 'process_error', error: err.message });
    });
  });
}

async function main() {
  console.log('🚀 Testing MCP Servers Directly...\n');
  
  const servers = [
    { name: 'free-agent-mcp', package: '@robinsonai/free-agent-mcp' },
    { name: 'thinking-tools-mcp', package: '@robinsonai/thinking-tools-mcp' },
    { name: 'credit-optimizer-mcp', package: '@robinsonai/credit-optimizer-mcp' }
  ];
  
  const results = [];
  
  for (const server of servers) {
    const result = await testServer(server.name, server.package);
    results.push(result);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait between tests
  }
  
  console.log('\n📊 Test Results:');
  console.log('================');
  
  const successful = results.filter(r => r.status === 'success').length;
  const total = results.length;
  
  results.forEach(result => {
    const icon = result.status === 'success' ? '✅' : 
                 result.status === 'timeout' ? '⚠️' : '❌';
    console.log(`${icon} ${result.name}: ${result.status}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });
  
  console.log(`\n🎯 Summary: ${successful}/${total} servers working`);
  
  if (successful === total) {
    console.log('\n🎉 All servers are working!');
  } else {
    console.log('\n🔧 Some servers need attention. Check the errors above.');
  }
}

main().catch(console.error);
