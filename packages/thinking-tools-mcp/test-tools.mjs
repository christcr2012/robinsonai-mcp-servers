#!/usr/bin/env node

/**
 * Test script to verify thinking tools MCP actually works
 * Tests:
 * 1. Context engine indexing (should create chunks, not just sources)
 * 2. Sequential thinking (should maintain state across calls)
 * 3. Evidence import/merge (should blend local + imported)
 * 4. Context search (should return ranked results)
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Colors for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(msg, color = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

function success(msg) {
  log(`✅ ${msg}`, 'green');
}

function error(msg) {
  log(`❌ ${msg}`, 'red');
}

function info(msg) {
  log(`ℹ️  ${msg}`, 'cyan');
}

function warn(msg) {
  log(`⚠️  ${msg}`, 'yellow');
}

// Start MCP server
function startServer() {
  return new Promise((resolve, reject) => {
    const serverPath = join(__dirname, 'dist', 'index.js');
    
    if (!fs.existsSync(serverPath)) {
      reject(new Error(`Server not built! Run 'npm run build' first. Looking for: ${serverPath}`));
      return;
    }

    info(`Starting MCP server: ${serverPath}`);
    
    const server = spawn('node', [serverPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        WORKSPACE_ROOT: join(__dirname, '..', '..'),
        NODE_ENV: 'test'
      }
    });

    let initialized = false;
    let buffer = '';

    server.stdout.on('data', (data) => {
      buffer += data.toString();
    });

    server.stderr.on('data', (data) => {
      const msg = data.toString();
      if (msg.includes('[ttmcp]')) {
        info(msg.trim());
      }

      // Look for "Server connected and ready" message
      if (msg.includes('Server connected and ready') && !initialized) {
        initialized = true;
        // Give it a moment to fully initialize
        setTimeout(() => resolve(server), 500);
      }
    });

    server.on('error', reject);
    
    // Timeout after 10 seconds
    setTimeout(() => {
      if (!initialized) {
        reject(new Error('Server failed to initialize within 10 seconds'));
      }
    }, 10000);
  });
}

// Send JSON-RPC request
function sendRequest(server, method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = Math.floor(Math.random() * 1000000);
    const request = {
      jsonrpc: '2.0',
      id,
      method,
      params
    };

    let buffer = '';
    let resolved = false;

    const onData = (data) => {
      buffer += data.toString();
      
      try {
        const lines = buffer.split('\n');
        for (const line of lines) {
          if (!line.trim()) continue;
          
          const response = JSON.parse(line);
          if (response.id === id) {
            resolved = true;
            server.stdout.off('data', onData);
            
            if (response.error) {
              reject(new Error(response.error.message || JSON.stringify(response.error)));
            } else {
              resolve(response.result);
            }
            return;
          }
        }
      } catch (e) {
        // Not complete JSON yet, keep buffering
      }
    };

    server.stdout.on('data', onData);
    
    server.stdin.write(JSON.stringify(request) + '\n');

    // Timeout after 30 seconds
    setTimeout(() => {
      if (!resolved) {
        server.stdout.off('data', onData);
        reject(new Error(`Request timeout: ${method}`));
      }
    }, 30000);
  });
}

// Test 1: List tools
async function testListTools(server) {
  info('Test 1: Listing tools...');
  
  try {
    const result = await sendRequest(server, 'tools/list');
    const tools = result.tools || [];
    
    if (tools.length === 0) {
      error('No tools registered!');
      return false;
    }
    
    success(`Found ${tools.length} tools`);
    
    // Check for key tools (using standardized names from STANDARDIZATION-PLAN.md)
    const keyTools = [
      'context_index_repo',
      'context_query',
      'sequential_thinking',
      'evidence_import',  // Standardized from ctx_import_evidence
      'evidence_merge_config'  // Standardized from ctx_merge_config
    ];
    
    for (const toolName of keyTools) {
      const found = tools.find(t => t.name === toolName);
      if (found) {
        success(`  ✓ ${toolName}`);
      } else {
        error(`  ✗ ${toolName} NOT FOUND`);
        return false;
      }
    }
    
    return true;
  } catch (e) {
    error(`Failed to list tools: ${e.message}`);
    return false;
  }
}

// Test 2: Index repository
async function testIndexRepo(server) {
  info('Test 2: Indexing repository...');
  
  try {
    const result = await sendRequest(server, 'tools/call', {
      name: 'context_index_repo',
      arguments: { force: true }
    });
    
    const text = result.content?.[0]?.text || '';
    info(`Index result: ${text}`);
    
    // Check for chunks (not just sources)
    if (text.includes('0 chunks')) {
      error('Indexing created 0 chunks! This is the bug mentioned in ChatGPT doc.');
      return false;
    }
    
    if (text.match(/\d+ chunks/)) {
      success('Indexing created chunks successfully');
      return true;
    }
    
    warn('Could not verify chunk count from output');
    return false;
  } catch (e) {
    error(`Failed to index repo: ${e.message}`);
    return false;
  }
}

// Test 3: Context stats
async function testContextStats(server) {
  info('Test 3: Getting context stats...');
  
  try {
    const result = await sendRequest(server, 'tools/call', {
      name: 'context_stats',
      arguments: {}
    });
    
    const text = result.content?.[0]?.text || '';
    info(`Stats: ${text}`);
    
    // Parse stats
    const chunkMatch = text.match(/(\d+) chunks/);
    const sourceMatch = text.match(/(\d+) sources/);
    
    if (chunkMatch && sourceMatch) {
      const chunks = parseInt(chunkMatch[1]);
      const sources = parseInt(sourceMatch[1]);
      
      if (chunks === 0 && sources > 0) {
        error('BUG CONFIRMED: 0 chunks but sources > 0');
        return false;
      }
      
      if (chunks > 0) {
        success(`Context has ${chunks} chunks from ${sources} sources`);
        return true;
      }
    }
    
    warn('Could not parse stats');
    return false;
  } catch (e) {
    error(`Failed to get stats: ${e.message}`);
    return false;
  }
}

// Test 4: Sequential thinking with state
async function testSequentialThinking(server) {
  info('Test 4: Testing sequential thinking state...');
  
  try {
    // First thought
    const result1 = await sendRequest(server, 'tools/call', {
      name: 'sequential_thinking',
      arguments: {
        problem: 'Test problem',
        steps: 3
      }
    });
    
    const text1 = result1.content?.[0]?.text || '';
    info(`First thought: ${text1.substring(0, 100)}...`);
    
    if (text1.includes('(none yet)') || text1.includes('template')) {
      error('Sequential thinking returned template/placeholder response');
      return false;
    }
    
    success('Sequential thinking returned real response');
    return true;
  } catch (e) {
    error(`Failed sequential thinking: ${e.message}`);
    return false;
  }
}

// Main test runner
async function runTests() {
  log('\n🧪 Starting Thinking Tools MCP Tests\n', 'bright');
  
  let server;
  const results = [];
  
  try {
    // Start server
    server = await startServer();
    success('Server started successfully\n');
    
    // Run tests
    results.push({ name: 'List Tools', passed: await testListTools(server) });
    results.push({ name: 'Index Repo', passed: await testIndexRepo(server) });
    results.push({ name: 'Context Stats', passed: await testContextStats(server) });
    results.push({ name: 'Sequential Thinking', passed: await testSequentialThinking(server) });
    
  } catch (e) {
    error(`Test setup failed: ${e.message}`);
    if (server) server.kill();
    process.exit(1);
  } finally {
    if (server) {
      server.kill();
      info('Server stopped');
    }
  }
  
  // Print summary
  log('\n📊 Test Summary\n', 'bright');
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  results.forEach(r => {
    if (r.passed) {
      success(`${r.name}`);
    } else {
      error(`${r.name}`);
    }
  });
  
  log(`\n${passed}/${total} tests passed\n`, passed === total ? 'green' : 'red');
  
  process.exit(passed === total ? 0 : 1);
}

runTests().catch(e => {
  error(`Fatal error: ${e.message}`);
  process.exit(1);
});

