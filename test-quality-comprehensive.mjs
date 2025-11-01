#!/usr/bin/env node

/**
 * Comprehensive Quality Test Suite for FREE Agent
 * 
 * Tests code generation across multiple complexity levels and code types:
 * - Simple: Basic functions, utilities
 * - Medium: API endpoints, React components
 * - Complex: Algorithms, data structures, system design
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { writeFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Test cases organized by complexity
const TEST_CASES = [
  // SIMPLE COMPLEXITY (Expected: 75-80% quality, <30s)
  {
    id: 'simple-1',
    name: 'Factorial Function',
    complexity: 'simple',
    quality: 'fast',
    task: 'Create a function that calculates factorial',
    context: 'TypeScript, recursive implementation with error handling',
    expectedFeatures: ['function', 'recursion', 'error handling', 'type safety'],
  },
  {
    id: 'simple-2',
    name: 'Array Utilities',
    complexity: 'simple',
    quality: 'fast',
    task: 'Create utility functions for array operations: chunk, flatten, unique',
    context: 'TypeScript, pure functions, no external dependencies',
    expectedFeatures: ['multiple functions', 'generics', 'type safety'],
  },
  {
    id: 'simple-3',
    name: 'String Formatter',
    complexity: 'simple',
    quality: 'fast',
    task: 'Create a string formatter that converts snake_case to camelCase and vice versa',
    context: 'TypeScript, utility function, comprehensive tests',
    expectedFeatures: ['string manipulation', 'regex', 'tests'],
  },
  
  // MEDIUM COMPLEXITY (Expected: 70-75% quality, <60s)
  {
    id: 'medium-1',
    name: 'REST API Endpoint',
    complexity: 'medium',
    quality: 'balanced',
    task: 'Create a REST API endpoint for user registration with validation',
    context: 'Express, TypeScript, Zod validation, error handling',
    expectedFeatures: ['express router', 'validation', 'error handling', 'types'],
  },
  {
    id: 'medium-2',
    name: 'React Component',
    complexity: 'medium',
    quality: 'balanced',
    task: 'Create a reusable Button component with variants and loading state',
    context: 'React, TypeScript, Tailwind CSS, accessibility',
    expectedFeatures: ['component', 'props', 'variants', 'accessibility'],
  },
  {
    id: 'medium-3',
    name: 'Database Model',
    complexity: 'medium',
    quality: 'balanced',
    task: 'Create a Prisma schema for a blog with posts, comments, and users',
    context: 'Prisma, PostgreSQL, relations, indexes',
    expectedFeatures: ['models', 'relations', 'indexes', 'constraints'],
  },
  
  // COMPLEX COMPLEXITY (Expected: 65-70% quality, <120s)
  {
    id: 'complex-1',
    name: 'LRU Cache',
    complexity: 'complex',
    quality: 'best',
    task: 'Implement an LRU (Least Recently Used) cache with O(1) operations',
    context: 'TypeScript, data structures (Map + doubly-linked list), comprehensive tests',
    expectedFeatures: ['class', 'data structures', 'O(1) operations', 'tests'],
  },
  {
    id: 'complex-2',
    name: 'Rate Limiter',
    complexity: 'complex',
    quality: 'best',
    task: 'Implement a sliding window rate limiter using Redis',
    context: 'TypeScript, Redis, distributed systems, concurrency',
    expectedFeatures: ['redis integration', 'sliding window', 'concurrency handling'],
  },
  {
    id: 'complex-3',
    name: 'Event Sourcing',
    complexity: 'complex',
    quality: 'best',
    task: 'Implement an event sourcing system with event store and projections',
    context: 'TypeScript, event sourcing pattern, PostgreSQL, CQRS',
    expectedFeatures: ['event store', 'projections', 'CQRS', 'consistency'],
  },
];

// Results tracking
const results = {
  total: TEST_CASES.length,
  passed: 0,
  failed: 0,
  tests: [],
  summary: {
    simple: { total: 0, passed: 0, avgTime: 0, avgQuality: 0 },
    medium: { total: 0, passed: 0, avgTime: 0, avgQuality: 0 },
    complex: { total: 0, passed: 0, avgTime: 0, avgQuality: 0 },
  },
};

async function runTest(testCase) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🧪 Test: ${testCase.name} (${testCase.complexity})`);
  console.log(`${'='.repeat(80)}\n`);
  
  const startTime = Date.now();
  
  return new Promise((resolve) => {
    const agent = spawn('node', [join(__dirname, 'packages', 'free-agent-mcp', 'dist', 'index.js')], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        MAX_OLLAMA_CONCURRENCY: '1',
        OLLAMA_BASE_URL: 'http://localhost:11434',
      }
    });

    let output = '';
    let errorOutput = '';

    agent.stdout.on('data', (data) => {
      output += data.toString();
      const lines = output.split('\n');
      for (const line of lines) {
        if (line.trim().startsWith('{')) {
          try {
            const response = JSON.parse(line);
            if (response.id === 2) {
              const timeMs = Date.now() - startTime;
              const result = parseResult(response, testCase, timeMs);
              agent.kill();
              resolve(result);
            }
          } catch (e) {
            // Not a complete JSON yet
          }
        }
      }
    });

    agent.stderr.on('data', (data) => {
      errorOutput += data.toString();
      // Don't log to console to keep output clean
    });

    agent.on('close', (code) => {
      if (code !== 0) {
        const timeMs = Date.now() - startTime;
        resolve({
          id: testCase.id,
          name: testCase.name,
          complexity: testCase.complexity,
          passed: false,
          error: `Agent exited with code ${code}`,
          timeMs,
        });
      }
    });

    // Send initialize request
    setTimeout(() => {
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
      agent.stdin.write(JSON.stringify(initRequest) + '\n');
      
      // Send code generation request
      setTimeout(() => {
        const request = {
          jsonrpc: '2.0',
          id: 2,
          method: 'tools/call',
          params: {
            name: 'delegate_code_generation',
            arguments: {
              task: testCase.task,
              context: testCase.context,
              complexity: testCase.complexity,
              quality: testCase.quality,
            }
          }
        };
        agent.stdin.write(JSON.stringify(request) + '\n');
      }, 1000);
    }, 2000);

    // Timeout after 180 seconds
    setTimeout(() => {
      agent.kill();
      resolve({
        id: testCase.id,
        name: testCase.name,
        complexity: testCase.complexity,
        passed: false,
        error: 'Timeout after 180 seconds',
        timeMs: 180000,
      });
    }, 180000);
  });
}

function parseResult(response, testCase, timeMs) {
  try {
    const content = response.result.content[0].text;
    const data = JSON.parse(content);
    
    const result = {
      id: testCase.id,
      name: testCase.name,
      complexity: testCase.complexity,
      quality: testCase.quality,
      passed: data.validation?.valid || false,
      score: data.validation?.score || 0,
      timeMs,
      timeSec: (timeMs / 1000).toFixed(1),
      model: data.model,
      tokens: data.tokens,
      cost: data.cost,
      creditsSaved: data.creditsSaved,
      refinementAttempts: data.refinementAttempts,
      issues: data.validation?.issues || [],
      code: data.code,
    };
    
    // Check for expected features
    const hasExpectedFeatures = testCase.expectedFeatures.every(feature => {
      const codeStr = data.code.toLowerCase();
      return codeStr.includes(feature.toLowerCase());
    });
    
    result.hasExpectedFeatures = hasExpectedFeatures;
    result.passed = result.passed && hasExpectedFeatures;
    
    return result;
  } catch (error) {
    return {
      id: testCase.id,
      name: testCase.name,
      complexity: testCase.complexity,
      passed: false,
      error: `Failed to parse response: ${error.message}`,
      timeMs,
    };
  }
}

function updateSummary(result) {
  const complexity = result.complexity;
  results.summary[complexity].total++;
  if (result.passed) {
    results.summary[complexity].passed++;
  }
  results.summary[complexity].avgTime += result.timeMs || 0;
  results.summary[complexity].avgQuality += result.score || 0;
}

function printResult(result) {
  const status = result.passed ? '✅ PASS' : '❌ FAIL';
  const color = result.passed ? '\x1b[32m' : '\x1b[31m';
  const reset = '\x1b[0m';
  
  console.log(`${color}${status}${reset} ${result.name}`);
  console.log(`  Complexity: ${result.complexity}`);
  console.log(`  Quality Mode: ${result.quality}`);
  console.log(`  Time: ${result.timeSec}s`);
  console.log(`  Score: ${result.score}/100`);
  console.log(`  Model: ${result.model}`);
  console.log(`  Tokens: ${result.tokens?.total || 'N/A'}`);
  console.log(`  Credits Saved: ${result.creditsSaved || 0}`);
  
  if (result.error) {
    console.log(`  Error: ${result.error}`);
  }
  
  if (result.issues && result.issues.length > 0) {
    console.log(`  Issues: ${result.issues.join(', ')}`);
  }
  
  console.log('');
}

function printSummary() {
  console.log(`\n${'='.repeat(80)}`);
  console.log('📊 COMPREHENSIVE QUALITY TEST RESULTS');
  console.log(`${'='.repeat(80)}\n`);
  
  console.log(`Total Tests: ${results.total}`);
  console.log(`Passed: ${results.passed} (${((results.passed / results.total) * 100).toFixed(1)}%)`);
  console.log(`Failed: ${results.failed} (${((results.failed / results.total) * 100).toFixed(1)}%)\n`);
  
  // Summary by complexity
  for (const [complexity, stats] of Object.entries(results.summary)) {
    if (stats.total === 0) continue;
    
    const avgTime = (stats.avgTime / stats.total / 1000).toFixed(1);
    const avgQuality = (stats.avgQuality / stats.total).toFixed(1);
    const passRate = ((stats.passed / stats.total) * 100).toFixed(1);
    
    console.log(`${complexity.toUpperCase()}:`);
    console.log(`  Tests: ${stats.passed}/${stats.total} passed (${passRate}%)`);
    console.log(`  Avg Time: ${avgTime}s`);
    console.log(`  Avg Quality: ${avgQuality}/100\n`);
  }
  
  // Save results to file
  const resultsFile = join(__dirname, 'test-quality-results.json');
  writeFileSync(resultsFile, JSON.stringify(results, null, 2));
  console.log(`Results saved to: ${resultsFile}\n`);
}

async function runAllTests() {
  console.log('🚀 Starting Comprehensive Quality Tests\n');
  console.log(`Total test cases: ${TEST_CASES.length}\n`);
  
  for (const testCase of TEST_CASES) {
    const result = await runTest(testCase);
    results.tests.push(result);
    
    if (result.passed) {
      results.passed++;
    } else {
      results.failed++;
    }
    
    updateSummary(result);
    printResult(result);
    
    // Wait 2 seconds between tests to avoid overwhelming Ollama
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  printSummary();
}

runAllTests().catch(console.error);

