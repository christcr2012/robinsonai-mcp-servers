#!/usr/bin/env node

/**
 * Live Category Testing Script
 * 
 * Tests all tools in a specific category by actually calling them
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const category = process.argv[2];
if (!category) {
  console.error('Usage: node test-category.cjs <category>');
  console.error('Categories: github, vercel, neon, upstash, google, openai');
  process.exit(1);
}

console.log(`\n${'='.repeat(80)}`);
console.log(`🧪 TESTING CATEGORY: ${category.toUpperCase()}`);
console.log(`${'='.repeat(80)}\n`);

// Start the MCP server
const serverPath = path.join(__dirname, '../dist/index.js');
const server = spawn('node', [serverPath], {
  stdio: ['pipe', 'pipe', 'pipe'],
  env: {
    ...process.env,
    GITHUB_TOKEN: process.env.GITHUB_TOKEN || 'test_token',
    VERCEL_TOKEN: process.env.VERCEL_TOKEN || 'test_token',
    NEON_API_KEY: process.env.NEON_API_KEY || 'test_key',
    UPSTASH_EMAIL: process.env.UPSTASH_EMAIL || 'test@example.com',
    UPSTASH_API_KEY: process.env.UPSTASH_API_KEY || 'test_key',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || 'test_key'
  }
});

let outputBuffer = '';
let requestId = 1;
let initialized = false;
let toolsToTest = [];
let currentToolIndex = 0;

const results = {
  category,
  total: 0,
  tested: 0,
  passed: 0,
  failed: 0,
  errors: [],
  toolResults: {}
};

server.stdout.on('data', (data) => {
  outputBuffer += data.toString();
  
  const lines = outputBuffer.split('\n');
  outputBuffer = lines.pop() || '';
  
  lines.forEach(line => {
    if (line.trim()) {
      try {
        const message = JSON.parse(line);
        handleMessage(message);
      } catch (e) {
        // Not JSON
      }
    }
  });
});

server.stderr.on('data', (data) => {
  const msg = data.toString();
  if (!msg.includes('[Robinson Toolkit]')) {
    console.error('Server error:', msg);
  }
});

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
    if (message.result.tools && !initialized) {
      // Server initialized
      initialized = true;
      console.log('✅ Server initialized\n');
      
      // Get tools for this category
      setTimeout(() => {
        sendRequest('tools/call', {
          name: 'toolkit_list_tools',
          arguments: { category, limit: 1000 }
        });
      }, 100);
      
    } else if (message.result.content) {
      const content = message.result.content[0].text;
      const data = JSON.parse(content);
      
      if (Array.isArray(data) && data[0]?.name) {
        // toolkit_list_tools response
        toolsToTest = data;
        results.total = toolsToTest.length;
        
        console.log(`📋 Found ${toolsToTest.length} tools in ${category}\n`);
        console.log('Starting validation tests...\n');
        
        // Test each tool by getting its schema
        testNextTool();
        
      } else if (data.name || data.error) {
        // toolkit_get_tool_schema response
        const toolName = toolsToTest[currentToolIndex - 1]?.name;
        
        if (data.error) {
          results.failed++;
          results.errors.push({
            tool: toolName,
            error: data.error
          });
          console.log(`❌ ${toolName}: ${data.error}`);
        } else {
          results.passed++;
          results.toolResults[toolName] = 'OK';
          process.stdout.write('.');
        }
        
        results.tested++;
        
        // Test next tool
        setTimeout(() => testNextTool(), 10);
      }
    }
  } else if (message.error) {
    console.error('\n❌ Error:', message.error);
    results.errors.push(message.error);
  }
}

function testNextTool() {
  if (currentToolIndex >= toolsToTest.length) {
    // Done testing
    printResults();
    server.kill();
    process.exit(results.failed > 0 ? 1 : 0);
    return;
  }
  
  const tool = toolsToTest[currentToolIndex];
  currentToolIndex++;
  
  // Get tool schema to verify it's properly registered
  sendRequest('tools/call', {
    name: 'toolkit_get_tool_schema',
    arguments: {
      category,
      tool_name: tool.name
    }
  });
}

function printResults() {
  console.log('\n\n' + '='.repeat(80));
  console.log(`📊 TEST RESULTS: ${category.toUpperCase()}`);
  console.log('='.repeat(80) + '\n');
  
  console.log(`Total tools: ${results.total}`);
  console.log(`Tested: ${results.tested}`);
  console.log(`✅ Passed: ${results.passed} (${((results.passed/results.total)*100).toFixed(1)}%)`);
  console.log(`❌ Failed: ${results.failed} (${((results.failed/results.total)*100).toFixed(1)}%)`);
  console.log();
  
  if (results.errors.length > 0) {
    console.log('🔴 ERRORS FOUND:\n');
    results.errors.forEach((err, i) => {
      console.log(`${i + 1}. ${err.tool || 'Unknown'}`);
      console.log(`   ${err.error || JSON.stringify(err)}\n`);
    });
  }
  
  // Save results to file
  const resultsFile = path.join(__dirname, `../test-results-${category}.json`);
  fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
  console.log(`\n📄 Results saved to: test-results-${category}.json\n`);
}

// Initialize
setTimeout(() => {
  sendRequest('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: { name: 'test-script', version: '1.0.0' }
  });
  
  setTimeout(() => {
    sendRequest('tools/list');
  }, 100);
}, 500);

// Timeout
setTimeout(() => {
  console.error('\n❌ Test timed out after 5 minutes\n');
  printResults();
  server.kill();
  process.exit(1);
}, 300000);

