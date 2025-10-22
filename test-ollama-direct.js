#!/usr/bin/env node

/**
 * Test Ollama connection directly
 */

const OLLAMA = "http://127.0.0.1:11434";

async function testOllama() {
  console.log('🧪 Testing Ollama connection...\n');
  
  try {
    // Test 1: Check if Ollama is running
    console.log('1️⃣ Checking if Ollama is running...');
    const healthRes = await fetch(`${OLLAMA}/api/tags`);
    console.log(`   Status: ${healthRes.status} ${healthRes.statusText}`);
    
    if (!healthRes.ok) {
      console.error('❌ Ollama is not responding');
      process.exit(1);
    }
    
    const tags = await healthRes.json();
    console.log(`   ✅ Found ${tags.models.length} models`);
    tags.models.forEach(m => console.log(`      - ${m.name}`));
    
    // Test 2: Try a simple generation
    console.log('\n2️⃣ Testing generation with qwen2.5:3b...');
    const genRes = await fetch(`${OLLAMA}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen2.5:3b',
        prompt: 'Say "Hello, World!" and nothing else.',
        stream: false
      })
    });
    
    console.log(`   Status: ${genRes.status} ${genRes.statusText}`);
    
    if (!genRes.ok) {
      const text = await genRes.text();
      console.error(`   ❌ Generation failed: ${text}`);
      process.exit(1);
    }
    
    const data = await genRes.json();
    console.log(`   ✅ Response: ${data.response.substring(0, 100)}...`);
    
    console.log('\n✅ All tests passed! Ollama is working correctly.');
    
  } catch (err) {
    console.error(`\n❌ Error: ${err.message}`);
    console.error(err.stack);
    process.exit(1);
  }
}

testOllama();

