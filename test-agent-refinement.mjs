#!/usr/bin/env node
/**
 * Test Agent Refinement
 * 
 * Tests that refinement loop works when initial code has issues.
 */

import { CodeGenerator } from './packages/free-agent-mcp/dist/agents/code-generator.js';
import { OllamaClient } from './packages/free-agent-mcp/dist/ollama-client.js';

async function testRefinement() {
  console.log('🧪 Testing Agent Refinement Loop...\n');

  const ollama = new OllamaClient(true);
  const generator = new CodeGenerator(ollama);

  // Test: Complex task that might initially produce placeholders
  console.log('Test: Generate a REST API client with error handling');
  console.log('Task: Create a TypeScript class for making HTTP requests with retry logic\n');
  
  try {
    const result = await generator.generate({
      task: 'Create a TypeScript class called HttpClient that makes HTTP requests with automatic retry logic, timeout handling, and proper error handling. Include methods for GET, POST, PUT, DELETE.',
      context: 'TypeScript, Node.js, use native fetch API',
      complexity: 'simple', // Use simple to get qwen2.5:3b which is available
    });

    console.log('📊 Validation Results:');
    console.log(`  Valid: ${result.validation?.valid ? '✅' : '❌'}`);
    console.log(`  Score: ${result.validation?.score}/100`);
    console.log(`  Refinement Attempts: ${result.refinementAttempts}`);
    console.log(`  Model: ${result.model}`);
    console.log(`  Time: ${result.timeMs}ms\n`);
    
    if (result.validation && !result.validation.valid) {
      console.log('❌ Validation Issues:');
      for (const issue of result.validation.issues) {
        const line = issue.line ? ` (line ${issue.line})` : '';
        console.log(`  - [${issue.type}]${line}: ${issue.description}`);
      }
      console.log('');
    }

    // Check code quality
    const hasTODO = /TODO/i.test(result.code);
    const hasFIXME = /FIXME/i.test(result.code);
    const hasPlaceholder = /PLACEHOLDER/i.test(result.code);
    const hasNotImplemented = /not implemented/i.test(result.code);
    const hasEmptyFunction = /\{\s*\}/.test(result.code);

    console.log('📋 Code Quality Checks:');
    console.log(`  No TODO: ${!hasTODO ? '✅' : '❌'}`);
    console.log(`  No FIXME: ${!hasFIXME ? '✅' : '❌'}`);
    console.log(`  No PLACEHOLDER: ${!hasPlaceholder ? '✅' : '❌'}`);
    console.log(`  No "not implemented": ${!hasNotImplemented ? '✅' : '❌'}`);
    console.log(`  No empty functions: ${!hasEmptyFunction ? '✅' : '❌'}`);
    console.log('');

    // Show a snippet of the code
    const lines = result.code.split('\n');
    console.log('📝 Code Snippet (first 30 lines):');
    console.log(lines.slice(0, 30).join('\n'));
    console.log(lines.length > 30 ? `\n... (${lines.length - 30} more lines)` : '');
    console.log('');

    if (hasTODO || hasFIXME || hasPlaceholder || hasNotImplemented) {
      console.log('❌ TEST FAILED: Code contains forbidden patterns!');
      return false;
    }

    if (result.validation && result.validation.score < 80) {
      console.log(`❌ TEST FAILED: Quality score too low (${result.validation.score}/100)`);
      return false;
    }

    console.log('✅ TEST PASSED: Code is production-ready!');
    return true;

  } catch (error) {
    console.error('❌ TEST FAILED with error:', error.message);
    console.error(error.stack);
    return false;
  }
}

// Run the test
testRefinement()
  .then(success => {
    if (success) {
      console.log('\n🎉 Refinement test PASSED!');
      process.exit(0);
    } else {
      console.log('\n💥 Refinement test FAILED!');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('\n💥 Test crashed:', error);
    process.exit(1);
  });

