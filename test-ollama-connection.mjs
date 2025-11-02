#!/usr/bin/env node

/**
 * Test Ollama Connection
 * 
 * This script tests if Ollama is running and accessible
 */

async function testOllamaConnection() {
  const baseUrls = [
    'http://localhost:11434',
    'http://127.0.0.1:11434'
  ];

  console.log('🔍 Testing Ollama connection...\n');

  for (const baseUrl of baseUrls) {
    console.log(`Testing ${baseUrl}:`);
    
    try {
      // Test /api/tags endpoint
      const response = await fetch(`${baseUrl}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${baseUrl} - WORKING`);
        console.log(`   Models available: ${data.models?.length || 0}`);
        
        if (data.models && data.models.length > 0) {
          console.log('   Available models:');
          data.models.forEach(model => {
            console.log(`     - ${model.name} (${(model.size / 1024 / 1024 / 1024).toFixed(1)}GB)`);
          });
        }
        console.log('');
        return true;
      } else {
        console.log(`❌ ${baseUrl} - HTTP ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ ${baseUrl} - ${error.message}`);
    }
    console.log('');
  }

  return false;
}

async function testModelGeneration() {
  console.log('🧪 Testing model generation...\n');
  
  const baseUrl = 'http://localhost:11434';
  const testModels = ['qwen2.5:3b', 'qwen2.5-coder:7b', 'deepseek-coder:1.3b'];
  
  for (const model of testModels) {
    console.log(`Testing ${model}:`);
    
    try {
      const response = await fetch(`${baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: model,
          prompt: 'Hello, respond with just "OK"',
          stream: false
        }),
        signal: AbortSignal.timeout(30000)
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${model} - Generated: "${data.response?.trim()}"`);
      } else {
        console.log(`❌ ${model} - HTTP ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ ${model} - ${error.message}`);
    }
    console.log('');
  }
}

// Run tests
async function main() {
  const isConnected = await testOllamaConnection();
  
  if (isConnected) {
    await testModelGeneration();
  } else {
    console.log('❌ Ollama is not accessible. Please start Ollama with: ollama serve');
    process.exit(1);
  }
}

main().catch(console.error);
