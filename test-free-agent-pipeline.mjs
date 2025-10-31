#!/usr/bin/env node
/**
 * Test FREE Agent with Integrated Pipeline
 * 
 * Verifies that the FREE agent now uses the Synthesize-Execute-Critique-Refine pipeline
 * and produces real, working code without fake APIs.
 */

import { CodeGenerator } from './packages/free-agent-mcp/dist/agents/code-generator.js';
import { OllamaClient } from './packages/free-agent-mcp/dist/ollama-client.js';

async function testFreeAgentPipeline() {
  console.log('🧪 Testing FREE Agent with Integrated Pipeline\n');
  
  const ollama = new OllamaClient(true);
  const generator = new CodeGenerator(ollama);
  
  // Test 1: Simple function (should pass easily)
  console.log('📝 Test 1: Simple addition function');
  console.log('Task: Create a function that adds two numbers\n');
  
  try {
    const result1 = await generator.generate({
      task: 'Create a TypeScript function that adds two numbers',
      context: 'TypeScript, Node.js, simple math function',
      complexity: 'simple',
    });
    
    console.log('✅ Test 1 Result:');
    console.log(`  Valid: ${result1.validation?.valid ? '✅' : '❌'}`);
    console.log(`  Score: ${result1.validation?.score.toFixed(1)}%`);
    console.log(`  Attempts: ${result1.refinementAttempts}`);
    console.log(`  Time: ${result1.timeMs}ms`);
    
    if (result1.files && result1.files.length > 0) {
      console.log(`\n📄 Generated ${result1.files.length} files:`);
      for (const file of result1.files) {
        console.log(`\n  ${file.path}:`);
        console.log(file.content.split('\n').slice(0, 20).map(line => `    ${line}`).join('\n'));
        if (file.content.split('\n').length > 20) {
          console.log('    ... (truncated)');
        }
      }
    } else {
      console.log('\n📄 Generated code:');
      console.log(result1.code.split('\n').slice(0, 20).map(line => `  ${line}`).join('\n'));
    }
    
    // Check for fake APIs
    const allCode1 = result1.files ? result1.files.map(f => f.content).join('\n') : result1.code;
    const fakeAPIs = [
      'RestifyClient',
      'executeRequest',
      'AWS.RestifyClient',
      'sum from @aws-sdk',
      'GPT4oMini',
      'analyzeComplexity',
    ];
    
    const foundFakeAPIs1 = fakeAPIs.filter(api => allCode1.includes(api));
    
    if (foundFakeAPIs1.length > 0) {
      console.log('\n⚠️  WARNING: Found potential fake APIs:');
      foundFakeAPIs1.forEach(api => console.log(`    - ${api}`));
    } else {
      console.log('\n✅ No fake APIs detected!');
    }
    
    if (!result1.validation?.valid) {
      console.log('\n❌ Validation issues:');
      result1.validation?.issues.forEach(issue => {
        console.log(`  - [${issue.type}] ${issue.description}`);
      });
    }
  } catch (error) {
    console.error('\n❌ Test 1 failed with error:', error);
  }
  
  // Test 2: HTTP client (previously generated fake AWS APIs)
  console.log('\n\n📝 Test 2: HTTP client (previously generated fake APIs)');
  console.log('Task: Create an HTTP client\n');
  
  try {
    const result2 = await generator.generate({
      task: 'Create a simple HTTP client function that fetches data from a URL using the built-in fetch API',
      context: 'TypeScript, Node.js 18+, use native fetch',
      complexity: 'simple',
    });
    
    console.log('✅ Test 2 Result:');
    console.log(`  Valid: ${result2.validation?.valid ? '✅' : '❌'}`);
    console.log(`  Score: ${result2.validation?.score.toFixed(1)}%`);
    console.log(`  Attempts: ${result2.refinementAttempts}`);
    console.log(`  Time: ${result2.timeMs}ms`);
    
    if (result2.files && result2.files.length > 0) {
      console.log(`\n📄 Generated ${result2.files.length} files:`);
      for (const file of result2.files) {
        console.log(`\n  ${file.path}:`);
        console.log(file.content.split('\n').slice(0, 30).map(line => `    ${line}`).join('\n'));
        if (file.content.split('\n').length > 30) {
          console.log('    ... (truncated)');
        }
      }
    } else {
      console.log('\n📄 Generated code:');
      console.log(result2.code.split('\n').slice(0, 30).map(line => `  ${line}`).join('\n'));
    }
    
    // Check for fake APIs
    const allCode2 = result2.files ? result2.files.map(f => f.content).join('\n') : result2.code;
    const foundFakeAPIs2 = fakeAPIs.filter(api => allCode2.includes(api));
    
    if (foundFakeAPIs2.length > 0) {
      console.log('\n⚠️  WARNING: Found potential fake APIs:');
      foundFakeAPIs2.forEach(api => console.log(`    - ${api}`));
    } else {
      console.log('\n✅ No fake APIs detected!');
    }
    
    if (!result2.validation?.valid) {
      console.log('\n❌ Validation issues:');
      result2.validation?.issues.forEach(issue => {
        console.log(`  - [${issue.type}] ${issue.description}`);
      });
    }
  } catch (error) {
    console.error('\n❌ Test 2 failed with error:', error);
  }
  
  console.log('\n\n🎯 FREE Agent Pipeline Test Complete!');
}

testFreeAgentPipeline().catch(console.error);

