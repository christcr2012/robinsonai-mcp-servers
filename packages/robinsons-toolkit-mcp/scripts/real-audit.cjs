#!/usr/bin/env node

/**
 * REAL Audit - Actually test the toolkit by calling it
 * 
 * This audit:
 * 1. Starts the MCP server
 * 2. Calls toolkit_list_categories
 * 3. Calls toolkit_list_tools for each category
 * 4. Calls toolkit_validate
 * 5. Reports what's actually working
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🔍 REAL AUDIT - Testing Robinson\'s Toolkit MCP\n');
console.log('='.repeat(80) + '\n');

// Start the MCP server
const serverPath = path.join(__dirname, '../dist/index.js');
console.log(`Starting server: ${serverPath}\n`);

const server = spawn('node', [serverPath], {
  stdio: ['pipe', 'pipe', 'pipe'],
  env: {
    ...process.env,
    GITHUB_TOKEN: process.env.GITHUB_TOKEN || 'dummy',
    VERCEL_TOKEN: process.env.VERCEL_TOKEN || 'dummy',
    NEON_API_KEY: process.env.NEON_API_KEY || 'dummy',
    UPSTASH_EMAIL: process.env.UPSTASH_EMAIL || 'dummy',
    UPSTASH_API_KEY: process.env.UPSTASH_API_KEY || 'dummy',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || 'dummy'
  }
});

let outputBuffer = '';
let requestId = 1;

server.stdout.on('data', (data) => {
  outputBuffer += data.toString();
  
  // Process complete JSON-RPC messages
  const lines = outputBuffer.split('\n');
  outputBuffer = lines.pop() || ''; // Keep incomplete line in buffer
  
  lines.forEach(line => {
    if (line.trim()) {
      try {
        const message = JSON.parse(line);
        handleMessage(message);
      } catch (e) {
        // Not JSON, might be initialization message
      }
    }
  });
});

server.stderr.on('data', (data) => {
  console.error('Server error:', data.toString());
});

const results = {
  categories: null,
  toolCounts: {},
  validationResult: null,
  errors: []
};

function sendRequest(method, params = {}) {
  const request = {
    jsonrpc: '2.0',
    id: requestId++,
    method,
    params
  };
  
  server.stdin.write(JSON.stringify(request) + '\n');
  return request.id;
}

function handleMessage(message) {
  if (message.result) {
    // Handle response based on what we requested
    if (message.result.tools) {
      // Response to tools/list
      console.log('✅ Server initialized with broker tools\n');
      
      // Now test the actual toolkit
      setTimeout(() => {
        console.log('📊 Testing toolkit_list_categories...\n');
        sendRequest('tools/call', {
          name: 'toolkit_list_categories',
          arguments: {}
        });
      }, 100);
      
    } else if (message.result.content) {
      // Response to tools/call
      const content = message.result.content[0].text;
      const data = JSON.parse(content);
      
      if (Array.isArray(data) && data[0]?.category) {
        // toolkit_list_categories response
        results.categories = data;
        console.log(`✅ Found ${data.length} categories:\n`);
        data.forEach(cat => {
          console.log(`   ${cat.category}: ${cat.count} tools`);
          results.toolCounts[cat.category] = cat.count;
        });
        console.log();
        
        // Now call toolkit_validate
        setTimeout(() => {
          console.log('🔍 Running toolkit_validate...\n');
          sendRequest('tools/call', {
            name: 'toolkit_validate',
            arguments: {}
          });
        }, 100);
        
      } else if (data.ok !== undefined) {
        // toolkit_validate response
        results.validationResult = data;
        
        console.log('📋 Validation Results:\n');
        console.log(`   Total tools: ${data.total}`);
        console.log(`   Invalid tools: ${data.invalid}`);
        console.log(`   Status: ${data.ok ? '✅ PASS' : '❌ FAIL'}\n`);
        
        if (data.sample && data.sample.length > 0) {
          console.log('⚠️  Sample of invalid tools:\n');
          data.sample.slice(0, 10).forEach(tool => {
            console.log(`   - ${tool.name}: ${tool.reason}`);
          });
          console.log();
        }
        
        // Done - print summary and exit
        printSummary();
        server.kill();
        process.exit(0);
      }
    }
  } else if (message.error) {
    console.error('❌ Error:', message.error);
    results.errors.push(message.error);
  }
}

function printSummary() {
  console.log('='.repeat(80));
  console.log('\n📊 AUDIT SUMMARY\n');
  console.log('='.repeat(80) + '\n');
  
  if (results.categories) {
    console.log('✅ Categories Working:');
    results.categories.forEach(cat => {
      console.log(`   ${cat.category}: ${cat.count} tools`);
    });
    console.log();
  }
  
  if (results.validationResult) {
    const { total, invalid, ok } = results.validationResult;
    const valid = total - invalid;
    const percentage = ((valid / total) * 100).toFixed(1);
    
    console.log('📈 Tool Status:');
    console.log(`   Total: ${total}`);
    console.log(`   Valid: ${valid} (${percentage}%)`);
    console.log(`   Invalid: ${invalid}`);
    console.log(`   Overall: ${ok ? '✅ PASS' : '❌ FAIL'}\n`);
  }
  
  if (results.errors.length > 0) {
    console.log('❌ Errors Encountered:');
    results.errors.forEach(err => {
      console.log(`   - ${err.message || JSON.stringify(err)}`);
    });
    console.log();
  }
  
  console.log('='.repeat(80) + '\n');
}

// Initialize
setTimeout(() => {
  sendRequest('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: {
      name: 'audit-script',
      version: '1.0.0'
    }
  });
  
  setTimeout(() => {
    sendRequest('tools/list');
  }, 100);
}, 500);

// Timeout after 30 seconds
setTimeout(() => {
  console.error('\n❌ Audit timed out after 30 seconds\n');
  printSummary();
  server.kill();
  process.exit(1);
}, 30000);

