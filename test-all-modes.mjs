#!/usr/bin/env node

/**
 * Comprehensive test of FREE Agent with all quality modes
 * Tests: fast, balanced, and best modes
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

async function testFreeAgent() {
  console.log('🧪 FREE AGENT COMPREHENSIVE TEST\n');
  console.log('='.repeat(60));
  
  // Create MCP client
  const transport = new StdioClientTransport({
    command: 'node',
    args: ['packages/free-agent-mcp/dist/index.js'],
  });

  const client = new Client({
    name: 'test-client',
    version: '1.0.0',
  }, {
    capabilities: {},
  });

  try {
    await client.connect(transport);
    console.log('✅ Connected to FREE Agent MCP server\n');

    // Test 1: Fast Mode (should complete in <30s)
    console.log('\n' + '='.repeat(60));
    console.log('TEST 1: FAST MODE (Simple Task)');
    console.log('='.repeat(60));
    console.log('Expected: <30s, no sandbox, direct generation\n');
    
    const fastStart = Date.now();
    const fastResult = await client.request({
      method: 'tools/call',
      params: {
        name: 'delegate_code_generation',
        arguments: {
          task: 'Create a function that calculates the Fibonacci sequence',
          context: 'TypeScript, recursive implementation with memoization',
          complexity: 'simple',
          quality: 'fast',
        },
      },
    }, {});
    const fastTime = ((Date.now() - fastStart) / 1000).toFixed(1);
    
    console.log(`\n✅ Fast mode completed in ${fastTime}s`);
    console.log('Result:', JSON.stringify(fastResult, null, 2).substring(0, 500) + '...');

    // Test 2: Balanced Mode (should use Docker sandbox)
    console.log('\n' + '='.repeat(60));
    console.log('TEST 2: BALANCED MODE (Medium Task)');
    console.log('='.repeat(60));
    console.log('Expected: ~60s, Docker sandbox, moderate quality gates\n');
    
    const balancedStart = Date.now();
    const balancedResult = await client.request({
      method: 'tools/call',
      params: {
        name: 'delegate_code_generation',
        arguments: {
          task: 'Create a REST API endpoint for user authentication',
          context: 'Express.js, TypeScript, JWT tokens, input validation',
          complexity: 'medium',
          quality: 'balanced',
        },
      },
    }, {});
    const balancedTime = ((Date.now() - balancedStart) / 1000).toFixed(1);
    
    console.log(`\n✅ Balanced mode completed in ${balancedTime}s`);
    console.log('Result:', JSON.stringify(balancedResult, null, 2).substring(0, 500) + '...');

    // Test 3: Best Mode (should use Docker sandbox with strict gates)
    console.log('\n' + '='.repeat(60));
    console.log('TEST 3: BEST MODE (Complex Task)');
    console.log('='.repeat(60));
    console.log('Expected: ~120s, Docker sandbox, strict quality gates\n');
    
    const bestStart = Date.now();
    const bestResult = await client.request({
      method: 'tools/call',
      params: {
        name: 'delegate_code_generation',
        arguments: {
          task: 'Create a distributed rate limiter using Redis',
          context: 'TypeScript, Redis, sliding window algorithm, high concurrency',
          complexity: 'complex',
          quality: 'best',
        },
      },
    }, {});
    const bestTime = ((Date.now() - bestStart) / 1000).toFixed(1);
    
    console.log(`\n✅ Best mode completed in ${bestTime}s`);
    console.log('Result:', JSON.stringify(bestResult, null, 2).substring(0, 500) + '...');

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Fast Mode:     ${fastTime}s`);
    console.log(`Balanced Mode: ${balancedTime}s`);
    console.log(`Best Mode:     ${bestTime}s`);
    console.log('\n✅ All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    if (error.message) {
      console.error('Message:', error.message);
    }
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  } finally {
    await client.close();
  }
}

testFreeAgent().catch(console.error);

