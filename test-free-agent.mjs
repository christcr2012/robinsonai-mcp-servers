#!/usr/bin/env node
/**
 * Test script for FREE Agent MCP Server
 * 
 * This script tests:
 * 1. Code generation
 * 2. Code analysis
 * 3. Code refactoring
 * 4. Learning system integration
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn } from 'child_process';

async function testFreeAgent() {
  console.log('🧪 Testing FREE Agent MCP Server\n');

  // Start the MCP server
  console.log('📡 Starting MCP server...');
  const serverProcess = spawn('node', ['packages/free-agent-mcp/dist/index.js'], {
    stdio: ['pipe', 'pipe', 'inherit'],
  });

  // Create transport
  const transport = new StdioClientTransport({
    command: 'node',
    args: ['packages/free-agent-mcp/dist/index.js'],
  });

  // Create client
  const client = new Client({
    name: 'test-client',
    version: '1.0.0',
  }, {
    capabilities: {},
  });

  try {
    // Connect to server
    console.log('🔌 Connecting to server...');
    await client.connect(transport);
    console.log('✅ Connected!\n');

    // List available tools
    console.log('📋 Available tools:');
    const tools = await client.listTools();
    tools.tools.forEach(tool => {
      console.log(`   - ${tool.name}: ${tool.description}`);
    });
    console.log('');

    // Test 1: Code Generation
    console.log('🧪 Test 1: Code Generation');
    console.log('   Task: Generate a simple TypeScript function to calculate factorial\n');
    
    const codeGenResult = await client.callTool({
      name: 'delegate_code_generation',
      arguments: {
        task: 'Create a TypeScript function called factorial that takes a number and returns its factorial. Include JSDoc comments and handle edge cases.',
        context: 'TypeScript, pure function, no dependencies',
        complexity: 'simple',
        quality: 'fast', // Use fast mode for testing
      },
    });

    console.log('   Result:');
    console.log('   ' + JSON.stringify(codeGenResult, null, 2).split('\n').join('\n   '));
    console.log('');

    // Test 2: Code Analysis
    console.log('🧪 Test 2: Code Analysis');
    console.log('   Task: Analyze a simple function for issues\n');

    const testCode = `
function add(a, b) {
  return a + b;
}
`;

    const analysisResult = await client.callTool({
      name: 'delegate_code_analysis',
      arguments: {
        code: testCode,
        question: 'What are the potential issues with this function? Consider TypeScript types, error handling, and edge cases.',
      },
    });

    console.log('   Result:');
    console.log('   ' + JSON.stringify(analysisResult, null, 2).split('\n').join('\n   '));
    console.log('');

    // Test 3: Code Refactoring
    console.log('🧪 Test 3: Code Refactoring');
    console.log('   Task: Refactor code to use modern TypeScript\n');

    const legacyCode = `
var users = [];

function addUser(name, age) {
  users.push({ name: name, age: age });
}

function getUser(name) {
  for (var i = 0; i < users.length; i++) {
    if (users[i].name === name) {
      return users[i];
    }
  }
  return null;
}
`;

    const refactorResult = await client.callTool({
      name: 'delegate_code_refactoring',
      arguments: {
        code: legacyCode,
        instructions: 'Refactor to modern TypeScript with proper types, const/let, arrow functions, and array methods',
      },
    });

    console.log('   Result:');
    console.log('   ' + JSON.stringify(refactorResult, null, 2).split('\n').join('\n   '));
    console.log('');

    // Test 4: Check Learning System
    console.log('🧪 Test 4: Learning System');
    console.log('   Checking if runs were recorded...\n');

    // Give it a moment for async operations
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check the experience database
    const { execSync } = await import('child_process');
    try {
      const dbCheck = execSync('sqlite3 .agent/experience.db "SELECT COUNT(*) FROM runs"', {
        encoding: 'utf-8',
        cwd: process.cwd(),
      });
      console.log(`   ✅ Runs recorded: ${dbCheck.trim()}`);
    } catch (error) {
      console.log('   ⚠️  Could not check database (may not exist yet)');
    }

    console.log('\n✅ All tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  } finally {
    // Cleanup
    await client.close();
    serverProcess.kill();
  }
}

// Run tests
testFreeAgent().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

