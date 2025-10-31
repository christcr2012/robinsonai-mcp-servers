#!/usr/bin/env node
/**
 * Debug CodeGenerator to see what's happening
 */

import { CodeGenerator } from './packages/free-agent-mcp/dist/agents/code-generator.js';
import { OllamaClient } from './packages/free-agent-mcp/dist/ollama-client.js';

async function testCodeGenerator() {
  console.log('🧪 Testing CodeGenerator with Debug Logging...\n');

  const ollama = new OllamaClient(true);
  const generator = new CodeGenerator(ollama);

  console.log('Generating code...');
  
  try {
    const result = await generator.generate({
      task: 'Create a TypeScript function that adds two numbers',
      context: 'TypeScript, Node.js',
      complexity: 'simple',
    });

    console.log('\n✅ Generation succeeded!');
    console.log('Model:', result.model);
    console.log('Code length:', result.code.length);
    console.log('Time:', result.timeMs, 'ms');
    console.log('Validation valid:', result.validation?.valid);
    console.log('Validation score:', result.validation?.score);
    console.log('Refinement attempts:', result.refinementAttempts);
    
    if (result.validation && result.validation.issues.length > 0) {
      console.log('\nValidation issues:');
      for (const issue of result.validation.issues) {
        console.log(`  - [${issue.type}] ${issue.description}`);
      }
    }
    
    console.log('\nGenerated code:');
    console.log(result.code);

  } catch (error) {
    console.error('\n❌ Generation failed:', error.message);
    console.error(error.stack);
  }
}

testCodeGenerator();

