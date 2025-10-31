#!/usr/bin/env node
/**
 * Debug agent to see what's happening
 */

import { OllamaClient } from './packages/free-agent-mcp/dist/ollama-client.js';

async function testAgent() {
  console.log('🧪 Testing Agent with Debug Logging...\n');

  const ollama = new OllamaClient(true);

  console.log('Generating simple prompt...');
  
  try {
    const result = await ollama.generate(
      'Write a TypeScript function that adds two numbers. Just the code, no explanation.',
      { complexity: 'simple' }
    );

    console.log('\n✅ Generation succeeded!');
    console.log('Model:', result.model);
    console.log('Text length:', result.text.length);
    console.log('Time:', result.timeMs, 'ms');
    console.log('\nGenerated text:');
    console.log(result.text);

  } catch (error) {
    console.error('\n❌ Generation failed:', error.message);
    console.error(error.stack);
  }
}

testAgent();

