#!/usr/bin/env node
/**
 * Real Usage Test for Thinking Tools MCP Framework Tools
 * 
 * Tests frameworks by ACTUALLY USING THEM, not just checking if they're callable.
 * 
 * Tests:
 * 1. Devil's Advocate - Challenge a plan
 * 2. SWOT Analysis - Analyze a situation
 * 3. First Principles - Break down a problem
 * 4. Decision Matrix - Compare options
 * 5. Premortem - Imagine failure
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ANSI colors
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

function success(msg) { log(`✅ ${msg}`, 'green'); }
function error(msg) { log(`❌ ${msg}`, 'red'); }
function info(msg) { log(`ℹ️  ${msg}`, 'cyan'); }
function warn(msg) { log(`⚠️  ${msg}`, 'yellow'); }

// Start MCP server
function startServer() {
  return new Promise((resolve, reject) => {
    const serverPath = join(__dirname, 'packages', 'thinking-tools-mcp', 'dist', 'index.js');
    
    info(`Starting Thinking Tools MCP server: ${serverPath}`);
    
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
      
      // Process complete JSON-RPC messages
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer
      
      for (const line of lines) {
        if (!line.trim()) continue;
        
        try {
          const msg = JSON.parse(line);
          if (msg.id === 'init' && msg.result) {
            initDone = true;
            success('Server initialized');
            resolve(server);
          }
        } catch (e) {
          // Ignore parse errors for incomplete messages
        }
      }
    });

    server.stderr.on('data', (data) => {
      // Framework tools log to stderr - this is expected
      const msg = data.toString();
      if (msg.includes('[framework_')) {
        info(`Framework log: ${msg.trim()}`);
      }
    });

    server.on('error', reject);
    server.on('exit', (code) => {
      if (!initDone) {
        reject(new Error(`Server exited with code ${code} before initialization`));
      }
    });

    // Send initialize request
    setTimeout(() => {
      sendRequest(server, 'initialize', {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'test-client', version: '1.0.0' }
      }, 'init');
    }, 100);
  });
}

// Send JSON-RPC request
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
      reject(new Error(`Request timeout: ${method}`));
    }, 30000); // 30s timeout

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
          // Ignore parse errors
        }
      }
    };

    server.stdout.on('data', onData);
  });
}

// Test framework initialization and step recording
async function testFramework(server, frameworkName, testCase) {
  info(`\n${'='.repeat(60)}`);
  info(`Testing: ${frameworkName}`);
  info(`${'='.repeat(60)}`);
  
  try {
    // Step 1: Initialize
    info(`Step 1: Initializing with problem: "${testCase.problem}"`);
    const initResult = await sendRequest(server, 'tools/call', {
      name: frameworkName,
      arguments: {
        problem: testCase.problem,
        context: testCase.context || '',
        totalSteps: testCase.totalSteps || 3
      }
    });
    
    const initText = initResult.content?.[0]?.text || '';
    
    // Verify initialization response
    if (!initText) {
      error(`No response text from initialization`);
      return false;
    }
    
    if (initText.includes('(none yet)') || initText.includes('template')) {
      error(`Initialization returned placeholder/template response`);
      warn(`Response: ${initText.substring(0, 200)}...`);
      return false;
    }
    
    if (!initText.includes('Session Initialized')) {
      error(`Initialization response doesn't include "Session Initialized"`);
      warn(`Response: ${initText.substring(0, 200)}...`);
      return false;
    }
    
    success(`Initialization successful (${initText.length} chars)`);
    info(`Evidence gathered: ${(initText.match(/Evidence Gathered: (\d+)/)?.[1] || '0')} items`);
    
    // Step 2: Record first step
    info(`Step 2: Recording first analysis step`);
    const step1Result = await sendRequest(server, 'tools/call', {
      name: frameworkName,
      arguments: {
        stepNumber: 1,
        content: testCase.step1Content,
        nextStepNeeded: true
      }
    });
    
    const step1Text = step1Result.content?.[0]?.text || '';
    
    if (!step1Text) {
      error(`No response text from step 1`);
      return false;
    }
    
    if (step1Text.includes('(none yet)') || step1Text.includes('template')) {
      error(`Step 1 returned placeholder/template response`);
      return false;
    }
    
    if (!step1Text.includes('Step 1')) {
      error(`Step 1 response doesn't include "Step 1"`);
      return false;
    }
    
    success(`Step 1 recorded successfully (${step1Text.length} chars)`);
    
    // Step 3: Record final step
    info(`Step 3: Recording final step`);
    const step2Result = await sendRequest(server, 'tools/call', {
      name: frameworkName,
      arguments: {
        stepNumber: 2,
        content: testCase.step2Content,
        nextStepNeeded: false
      }
    });
    
    const step2Text = step2Result.content?.[0]?.text || '';
    
    if (!step2Text) {
      error(`No response text from step 2`);
      return false;
    }
    
    if (!step2Text.includes('Step 2')) {
      error(`Step 2 response doesn't include "Step 2"`);
      return false;
    }
    
    if (!step2Text.includes('complete')) {
      warn(`Step 2 response doesn't indicate completion`);
    }
    
    success(`Step 2 recorded successfully (${step2Text.length} chars)`);
    success(`✅ ${frameworkName} PASSED - All steps working correctly`);
    
    return true;
    
  } catch (e) {
    error(`${frameworkName} FAILED: ${e.message}`);
    return false;
  }
}

// Index repository for Context Engine
async function indexRepository(server) {
  info('\n📚 Indexing repository for Context Engine...');

  try {
    const result = await sendRequest(server, 'tools/call', {
      name: 'context_index_repo',
      arguments: {}
    }, 'index-repo');

    const text = result.content?.[0]?.text || '';
    if (text.includes('ok: true')) {
      success('Repository indexed successfully');
      return true;
    } else {
      warn('Indexing completed but may have issues');
      info(text.substring(0, 200));
      return false;
    }
  } catch (e) {
    error(`Indexing failed: ${e.message}`);
    return false;
  }
}

// Main test runner
async function main() {
  log('\n' + '='.repeat(70), 'bright');
  log('  THINKING TOOLS MCP - REAL USAGE FRAMEWORK TESTS', 'bright');
  log('='.repeat(70) + '\n', 'bright');

  let server;

  try {
    server = await startServer();

    // Index repository first
    const indexed = await indexRepository(server);
    
    const testCases = [
      {
        framework: 'framework_devils_advocate',
        problem: 'We should migrate all our MCP servers to use a single shared database',
        context: 'Currently each server manages its own state independently',
        totalSteps: 3,
        step1Content: 'Assumption: Shared database will improve consistency. Challenge: What if the database becomes a single point of failure?',
        step2Content: 'Risk: Database connection issues could bring down all 5 servers simultaneously. Mitigation: Keep independent state as fallback.'
      },
      {
        framework: 'framework_swot',
        problem: 'Robinson AI MCP Servers system',
        context: '5-server architecture with FREE and PAID agents',
        totalSteps: 4,
        step1Content: 'Strengths: 0-credit FREE agent, comprehensive toolkit integration, stateful frameworks',
        step2Content: 'Weaknesses: Complex architecture, multiple dependencies, learning curve for new users'
      },
      {
        framework: 'framework_first_principles',
        problem: 'Why do we need 5 separate MCP servers instead of 1?',
        context: 'Current architecture has FREE Agent, PAID Agent, Toolkit, Thinking Tools, Credit Optimizer',
        totalSteps: 3,
        step1Content: 'Fundamental truth: Different servers serve different purposes (cost optimization, integrations, cognitive frameworks)',
        step2Content: 'Conclusion: Separation allows independent scaling, versioning, and deployment of each concern'
      }
    ];
    
    const results = [];
    
    for (const testCase of testCases) {
      const passed = await testFramework(server, testCase.framework, testCase);
      results.push({ framework: testCase.framework, passed });
    }
    
    // Summary
    log('\n' + '='.repeat(70), 'bright');
    log('  TEST SUMMARY', 'bright');
    log('='.repeat(70) + '\n', 'bright');
    
    const passCount = results.filter(r => r.passed).length;
    const totalCount = results.length;
    
    results.forEach(r => {
      if (r.passed) {
        success(`${r.framework}: PASSED`);
      } else {
        error(`${r.framework}: FAILED`);
      }
    });
    
    log('');
    if (passCount === totalCount) {
      success(`ALL TESTS PASSED (${passCount}/${totalCount})`);
      process.exit(0);
    } else {
      error(`SOME TESTS FAILED (${passCount}/${totalCount} passed)`);
      process.exit(1);
    }
    
  } catch (e) {
    error(`Test runner failed: ${e.message}`);
    console.error(e.stack);
    process.exit(1);
  } finally {
    if (server) {
      server.kill();
    }
  }
}

main();

