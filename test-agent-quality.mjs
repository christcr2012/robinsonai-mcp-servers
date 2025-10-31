#!/usr/bin/env node
/**
 * Test Agent Quality
 * 
 * Tests that our agents now produce real, working code without placeholders.
 */

import { CodeGenerator } from './packages/free-agent-mcp/dist/agents/code-generator.js';
import { OllamaClient } from './packages/free-agent-mcp/dist/ollama-client.js';

async function testAgentQuality() {
  console.log('🧪 Testing Agent Quality...\n');

  const ollama = new OllamaClient(true);
  const generator = new CodeGenerator(ollama);

  // Test 1: Simple function generation
  console.log('Test 1: Generate a simple function');
  console.log('Task: Create a function that calculates factorial');
  
  try {
    const result = await generator.generate({
      task: 'Create a TypeScript function that calculates the factorial of a number',
      context: 'TypeScript, Node.js',
      complexity: 'simple',
    });

    console.log('\n📝 Generated Code:');
    console.log(result.code);
    console.log('\n📊 Validation Results:');
    console.log(`  Valid: ${result.validation?.valid ? '✅' : '❌'}`);
    console.log(`  Score: ${result.validation?.score}/100`);
    console.log(`  Refinement Attempts: ${result.refinementAttempts}`);
    
    if (result.validation && !result.validation.valid) {
      console.log('\n❌ Validation Issues:');
      for (const issue of result.validation.issues) {
        console.log(`  - [${issue.type}] ${issue.description}`);
      }
    }

    // Check for forbidden patterns
    const hasTODO = /TODO/i.test(result.code);
    const hasFIXME = /FIXME/i.test(result.code);
    const hasPlaceholder = /PLACEHOLDER/i.test(result.code);
    const hasNotImplemented = /not implemented/i.test(result.code);

    if (hasTODO || hasFIXME || hasPlaceholder || hasNotImplemented) {
      console.log('\n❌ TEST FAILED: Code contains forbidden patterns!');
      if (hasTODO) console.log('  - Found TODO');
      if (hasFIXME) console.log('  - Found FIXME');
      if (hasPlaceholder) console.log('  - Found PLACEHOLDER');
      if (hasNotImplemented) console.log('  - Found "not implemented"');
      return false;
    }

    console.log('\n✅ Test 1 PASSED: No forbidden patterns found');
    return true;

  } catch (error) {
    console.error('\n❌ Test 1 FAILED with error:', error.message);
    return false;
  }
}

// Run the test
testAgentQuality()
  .then(success => {
    if (success) {
      console.log('\n🎉 Agent quality test PASSED!');
      process.exit(0);
    } else {
      console.log('\n💥 Agent quality test FAILED!');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('\n💥 Test crashed:', error);
    process.exit(1);
  });

