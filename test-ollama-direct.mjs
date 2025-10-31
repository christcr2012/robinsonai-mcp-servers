#!/usr/bin/env node
/**
 * Test Ollama directly to see if it's working
 */

async function testOllama() {
  console.log('🧪 Testing Ollama directly...\n');

  try {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen2.5:3b',
        prompt: 'Write a simple hello world function in TypeScript. Just the code, no explanation.',
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log('✅ Ollama responded!');
    console.log('\nModel:', data.model);
    console.log('Response length:', data.response?.length || 0, 'chars');
    console.log('\nGenerated code:');
    console.log(data.response);
    console.log('\nDone:', data.done);
    console.log('Total duration:', data.total_duration ? `${(data.total_duration / 1e9).toFixed(2)}s` : 'N/A');

  } catch (error) {
    console.error('❌ Ollama test failed:', error.message);
    process.exit(1);
  }
}

testOllama();

