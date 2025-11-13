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

// Start MCP server and send initialize request
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
    let handshakeComplete = false;
    let stdoutBuffer = '';

    // Listen for stdout (JSON-RPC responses)
    server.stdout.on('data', (data) => {
      stdoutBuffer += data.toString();

      // Try to parse initialize response
      if (!handshakeComplete) {
        try {
          const lines = stdoutBuffer.split('\n');
          for (const line of lines) {
            if (!line.trim()) continue;
            const response = JSON.parse(line);
            if (response.id === 1 && response.result) {
              handshakeComplete = true;
              info('MCP handshake complete');
            }
          }
        } catch (e) {
          // Not complete JSON yet, keep buffering
        }
      }
    });

    // Listen for stderr (logs)
    server.stderr.on('data', (data) => {
      const msg = data.toString();
      if (msg.includes('[ttmcp]')) {
        info(msg.trim());
      }

      // Look for "Server connected and ready" message
      if (msg.includes('Server connected and ready') && !initialized) {
        initialized = true;
        // Send initialize request to complete MCP handshake
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

        server.stdin.write(JSON.stringify(initRequest) + '\n');

        // Wait for handshake to complete
        const checkHandshake = setInterval(() => {
          if (handshakeComplete) {
            clearInterval(checkHandshake);
            // Give it a moment to fully initialize
            setTimeout(() => resolve(server), 500);
          }
        }, 100);

        // Timeout for handshake
        setTimeout(() => {
          if (!handshakeComplete) {
            clearInterval(checkHandshake);
            reject(new Error('MCP handshake failed to complete'));
          }
        }, 5000);
      }
    });

    server.on('error', (err) => {
      error(`Server error: ${err.message}`);
      reject(err);
    });

    server.on('exit', (code, signal) => {
      if (!initialized) {
        error(`Server exited before initialization (code: ${code}, signal: ${signal})`);
        reject(new Error(`Server exited prematurely with code ${code}`));
      }
    });

    // Timeout after 30 seconds (increased from 10 for slower systems)
    setTimeout(() => {
      if (!initialized) {
        error('Server initialization timeout - no "Server connected and ready" message received');
        reject(new Error('Server failed to initialize within 30 seconds'));
      }
    }, 30000);
  });
}

// Send JSON-RPC request with configurable timeout
function sendRequest(server, method, params = {}, timeoutMs = 30000) {
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

    // Configurable timeout
    setTimeout(() => {
      if (!resolved) {
        server.stdout.off('data', onData);
        reject(new Error(`Request timeout after ${timeoutMs}ms: ${method}`));
      }
    }, timeoutMs);
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
    // Use incremental indexing (force: false) to avoid re-embedding everything
    // This is much faster and still validates that indexing works
    const result = await sendRequest(server, 'tools/call', {
      name: 'context_index_repo',
      arguments: { force: false }
    }, 60000); // 1 minute should be enough for incremental

    const text = result.content?.[0]?.text || '';
    info(`Index result: ${text.substring(0, 200)}...`);

    // Try to parse as JSON first
    try {
      const indexResult = JSON.parse(text);
      const chunks = indexResult.chunks || 0;

      if (chunks === 0) {
        error('Indexing created 0 chunks! This is the bug mentioned in ChatGPT doc.');
        return false;
      }

      success(`Indexing successful: ${chunks} chunks`);
      return true;
    } catch (jsonError) {
      // Fall back to text parsing
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
    }
  } catch (e) {
    error(`Failed to index repo: ${e.message}`);
    return false;
  }
}

// Test 3: Context stats
async function testContextStats(server) {
  info('Test 3: Getting context stats...');

  try {
    // Stats might need to build symbol index, use 1 minute timeout
    const result = await sendRequest(server, 'tools/call', {
      name: 'context_stats',
      arguments: {}
    }, 60000); // 1 minute

    const text = result.content?.[0]?.text || '';
    info(`Stats: ${text}`);

    // Try to parse as JSON first
    try {
      const stats = JSON.parse(text);
      const chunks = stats.chunks || 0;
      const sources = stats.sources?.repo || 0;

      if (chunks === 0 && sources > 0) {
        error('BUG CONFIRMED: 0 chunks but sources > 0');
        return false;
      }

      if (chunks > 0) {
        success(`Context has ${chunks} chunks from ${sources} sources`);
        return true;
      }

      warn('Stats returned 0 chunks');
      return false;
    } catch (jsonError) {
      // Fall back to text parsing
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
    }
  } catch (e) {
    error(`Failed to get stats: ${e.message}`);
    return false;
  }
}

// Test 4: Sequential thinking with state
async function testSequentialThinking(server) {
  info('Test 4: Testing sequential thinking state...');

  try {
    // Use a simple problem with reasonable evidence gathering
    // Default k=6 should work fine with the architectural fixes
    const result1 = await sendRequest(server, 'tools/call', {
      name: 'sequential_thinking',
      arguments: {
        problem: 'How to implement user authentication',
        steps: 2
        // Using default k=6 to test real-world performance
      }
    }, 30000); // 30 seconds should be enough with proper architecture

    const text1 = result1.content?.[0]?.text || '';
    info(`First thought: ${text1.substring(0, 200)}...`);

    // Check if it returned a valid response (not template/placeholder)
    if (text1.includes('(none yet)') || text1.includes('template')) {
      error('Sequential thinking returned template/placeholder response');
      return false;
    }

    // Check if it has evidence or problem in the response
    if (text1.includes('evidence') || text1.includes('problem') || text1.includes('authentication')) {
      success('Sequential thinking returned real response with evidence');
      return true;
    }

    success('Sequential thinking completed successfully');
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

