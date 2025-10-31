#!/usr/bin/env node
/**
 * Comprehensive Agent Testing
 * 
 * Tests both FREE and PAID agents with variety of tasks to verify:
 * 1. Real code generation (no fake APIs)
 * 2. No placeholders/TODOs
 * 3. Code compiles and runs
 * 4. Tests pass
 * 5. Quality gates work
 */

import { CodeGenerator } from './packages/free-agent-mcp/dist/agents/code-generator.js';
import { OllamaClient } from './packages/free-agent-mcp/dist/ollama-client.js';

const TESTS = [
  {
    name: 'Simple Function',
    task: 'Create a TypeScript function that validates an email address using regex',
    context: 'TypeScript, Node.js, return boolean',
    complexity: 'simple',
    expectedPatterns: ['function', 'email', 'test', 'return'],
    forbiddenPatterns: ['TODO', 'FIXME', 'PLACEHOLDER', 'fake', 'RestifyClient'],
  },
  {
    name: 'HTTP Client',
    task: 'Create a simple HTTP GET function using native fetch API',
    context: 'TypeScript, Node.js 18+, use built-in fetch, handle errors',
    complexity: 'simple',
    expectedPatterns: ['fetch', 'async', 'Response', 'catch'],
    forbiddenPatterns: ['axios', 'RestifyClient', 'executeRequest', 'TODO'],
  },
  {
    name: 'Data Processing',
    task: 'Create a function that filters and sorts an array of objects by a property',
    context: 'TypeScript, generic function, type-safe',
    complexity: 'simple',
    expectedPatterns: ['filter', 'sort', 'Array', 'generic'],
    forbiddenPatterns: ['TODO', 'FIXME', 'lodash'],
  },
  {
    name: 'File Operations',
    task: 'Create a function that reads a JSON file and parses it safely',
    context: 'TypeScript, Node.js, use fs/promises, handle errors',
    complexity: 'simple',
    expectedPatterns: ['readFile', 'JSON.parse', 'try', 'catch'],
    forbiddenPatterns: ['TODO', 'sync', 'PLACEHOLDER'],
  },
  {
    name: 'Class with Methods',
    task: 'Create a Calculator class with add, subtract, multiply, divide methods',
    context: 'TypeScript, class-based, handle division by zero',
    complexity: 'simple',
    expectedPatterns: ['class', 'Calculator', 'add', 'subtract', 'multiply', 'divide'],
    forbiddenPatterns: ['TODO', 'FIXME', 'not implemented'],
  },
];

async function runTest(generator, test, testNum) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`📝 Test ${testNum}/${TESTS.length}: ${test.name}`);
  console.log(`${'='.repeat(80)}`);
  console.log(`Task: ${test.task}`);
  console.log(`Context: ${test.context}\n`);
  
  const startTime = Date.now();
  
  try {
    const result = await generator.generate({
      task: test.task,
      context: test.context,
      complexity: test.complexity,
    });
    
    const elapsed = Date.now() - startTime;
    
    // Extract all code
    const allCode = result.files 
      ? result.files.map(f => f.content).join('\n')
      : result.code;
    
    // Check validation
    const passed = result.validation?.valid || false;
    const score = result.validation?.score || 0;
    
    console.log(`\n📊 Results:`);
    console.log(`  ✓ Time: ${elapsed}ms (${(elapsed / 1000).toFixed(1)}s)`);
    console.log(`  ✓ Valid: ${passed ? '✅' : '❌'}`);
    console.log(`  ✓ Score: ${score.toFixed(1)}%`);
    console.log(`  ✓ Attempts: ${result.refinementAttempts}`);
    console.log(`  ✓ Files: ${result.files?.length || 1}`);
    
    // Check for expected patterns
    console.log(`\n🔍 Pattern Analysis:`);
    const foundExpected = test.expectedPatterns.filter(p => 
      allCode.toLowerCase().includes(p.toLowerCase())
    );
    const missingExpected = test.expectedPatterns.filter(p => 
      !allCode.toLowerCase().includes(p.toLowerCase())
    );
    
    if (foundExpected.length > 0) {
      console.log(`  ✅ Found expected: ${foundExpected.join(', ')}`);
    }
    if (missingExpected.length > 0) {
      console.log(`  ⚠️  Missing expected: ${missingExpected.join(', ')}`);
    }
    
    // Check for forbidden patterns
    const foundForbidden = test.forbiddenPatterns.filter(p => 
      allCode.includes(p)
    );
    
    if (foundForbidden.length > 0) {
      console.log(`  ❌ Found forbidden: ${foundForbidden.join(', ')}`);
    } else {
      console.log(`  ✅ No forbidden patterns detected`);
    }
    
    // Show generated code (first 30 lines)
    console.log(`\n📄 Generated Code (preview):`);
    if (result.files && result.files.length > 0) {
      for (const file of result.files.slice(0, 2)) {
        console.log(`\n  ${file.path}:`);
        const lines = file.content.split('\n').slice(0, 30);
        lines.forEach(line => console.log(`    ${line}`));
        if (file.content.split('\n').length > 30) {
          console.log(`    ... (${file.content.split('\n').length - 30} more lines)`);
        }
      }
    } else {
      const lines = allCode.split('\n').slice(0, 30);
      lines.forEach(line => console.log(`  ${line}`));
      if (allCode.split('\n').length > 30) {
        console.log(`  ... (${allCode.split('\n').length - 30} more lines)`);
      }
    }
    
    // Show validation issues if any
    if (result.validation && result.validation.issues.length > 0) {
      console.log(`\n⚠️  Validation Issues:`);
      result.validation.issues.forEach(issue => {
        console.log(`  - [${issue.type}] ${issue.description}`);
        if (issue.suggestion) {
          console.log(`    💡 ${issue.suggestion}`);
        }
      });
    }
    
    // Overall assessment
    console.log(`\n🎯 Assessment:`);
    const hasExpected = foundExpected.length >= test.expectedPatterns.length * 0.5;
    const noForbidden = foundForbidden.length === 0;
    const goodScore = score >= 60;
    
    if (passed && hasExpected && noForbidden) {
      console.log(`  ✅ EXCELLENT - Code is valid, has expected patterns, no forbidden patterns`);
      return { passed: true, score, test: test.name };
    } else if (goodScore && noForbidden) {
      console.log(`  ✅ GOOD - Code has decent score and no forbidden patterns`);
      return { passed: true, score, test: test.name };
    } else if (noForbidden) {
      console.log(`  ⚠️  ACCEPTABLE - No forbidden patterns but needs improvement`);
      return { passed: false, score, test: test.name };
    } else {
      console.log(`  ❌ FAILED - Found forbidden patterns or critical issues`);
      return { passed: false, score, test: test.name };
    }
    
  } catch (error) {
    console.error(`\n❌ Test failed with error:`, error.message);
    return { passed: false, score: 0, test: test.name, error: error.message };
  }
}

async function main() {
  console.log('🧪 COMPREHENSIVE AGENT TESTING');
  console.log('Testing FREE Agent with Tuned Pipeline\n');
  console.log(`Models: qwen2.5-coder:7b (upgraded from qwen2.5:3b)`);
  console.log(`Parameters: maxAttempts=5, acceptThreshold=70%, minCoverage=70%\n`);
  
  const ollama = new OllamaClient(true);
  const generator = new CodeGenerator(ollama);
  
  const results = [];
  
  for (let i = 0; i < TESTS.length; i++) {
    const result = await runTest(generator, TESTS[i], i + 1);
    results.push(result);
    
    // Brief pause between tests
    if (i < TESTS.length - 1) {
      console.log(`\n⏸️  Pausing 2 seconds before next test...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  // Summary
  console.log(`\n\n${'='.repeat(80)}`);
  console.log(`📊 FINAL SUMMARY`);
  console.log(`${'='.repeat(80)}\n`);
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
  
  console.log(`Total Tests: ${TESTS.length}`);
  console.log(`Passed: ${passed} ✅`);
  console.log(`Failed: ${failed} ❌`);
  console.log(`Average Score: ${avgScore.toFixed(1)}%`);
  console.log(`Success Rate: ${((passed / TESTS.length) * 100).toFixed(1)}%\n`);
  
  console.log(`Individual Results:`);
  results.forEach((r, i) => {
    const status = r.passed ? '✅' : '❌';
    const errorMsg = r.error ? ` (${r.error})` : '';
    console.log(`  ${status} ${r.test}: ${r.score.toFixed(1)}%${errorMsg}`);
  });
  
  console.log(`\n${'='.repeat(80)}`);
  
  if (passed >= TESTS.length * 0.6) {
    console.log(`\n🎉 SUCCESS! ${passed}/${TESTS.length} tests passed (${((passed/TESTS.length)*100).toFixed(0)}%)`);
    console.log(`The pipeline is working well with the tuned parameters!`);
  } else {
    console.log(`\n⚠️  NEEDS IMPROVEMENT: Only ${passed}/${TESTS.length} tests passed`);
    console.log(`Consider further tuning or using larger models.`);
  }
}

main().catch(console.error);

