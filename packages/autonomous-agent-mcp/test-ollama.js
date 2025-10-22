/**
 * Quick test script to verify Ollama is working
 * 
 * Run this after Ollama finishes installing:
 * node test-ollama.js
 */

import Ollama from 'ollama';

async function testOllama() {
  console.log('🤖 Testing Ollama connection...\n');

  const ollama = new Ollama({ host: 'http://localhost:11434' });

  try {
    // 1. Check if Ollama is running
    console.log('1️⃣ Checking if Ollama is running...');
    const models = await ollama.list();
    console.log('✅ Ollama is running!\n');

    // 2. List available models
    console.log('2️⃣ Available models:');
    if (models.models.length === 0) {
      console.log('❌ No models found!');
      console.log('\nPlease pull models:');
      console.log('  ollama pull deepseek-coder:33b');
      console.log('  ollama pull qwen2.5-coder:32b');
      console.log('  ollama pull codellama:34b\n');
      return;
    }

    models.models.forEach((model, i) => {
      console.log(`  ${i + 1}. ${model.name}`);
    });
    console.log('');

    // 3. Check for recommended models
    console.log('3️⃣ Checking for recommended models:');
    const recommendedModels = [
      'deepseek-coder:33b',
      'qwen2.5-coder:32b',
      'codellama:34b',
    ];

    const availableModelNames = models.models.map((m) => m.name);
    let allPresent = true;

    for (const model of recommendedModels) {
      if (availableModelNames.includes(model)) {
        console.log(`  ✅ ${model}`);
      } else {
        console.log(`  ❌ ${model} - Run: ollama pull ${model}`);
        allPresent = false;
      }
    }
    console.log('');

    if (!allPresent) {
      console.log('⚠️  Some recommended models are missing.');
      console.log('The agent will still work, but may have limited capabilities.\n');
      return;
    }

    // 4. Test code generation with fastest model
    console.log('4️⃣ Testing code generation with qwen2.5-coder:32b...');
    console.log('(This may take 10-30 seconds)\n');

    const startTime = Date.now();
    const response = await ollama.generate({
      model: 'qwen2.5-coder:32b',
      prompt: `Generate a simple TypeScript function that adds two numbers.
Just provide the code, no explanation.`,
      options: {
        temperature: 0.7,
        num_predict: 200,
      },
    });

    const timeMs = Date.now() - startTime;

    console.log('Generated code:');
    console.log('---');
    console.log(response.response);
    console.log('---\n');

    console.log(`⏱️  Generation time: ${timeMs}ms`);
    console.log(`📊 Tokens generated: ${response.eval_count || 0}\n`);

    // 5. Success!
    console.log('✅ All tests passed!');
    console.log('\n🎉 Ollama is ready to use with the Autonomous Agent!\n');
    console.log('Next steps:');
    console.log('  1. cd packages/autonomous-agent-mcp');
    console.log('  2. npm install');
    console.log('  3. npm run build');
    console.log('  4. Configure in Augment Code');
    console.log('  5. Start saving credits!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\nTroubleshooting:');
    console.log('  1. Make sure Ollama is installed');
    console.log('  2. Make sure Ollama is running (ollama serve)');
    console.log('  3. Check if port 11434 is available\n');
  }
}

testOllama();

