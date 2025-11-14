/**
 * Model Warmup Utility
 * 
 * Pre-loads Ollama models on startup to avoid cold start delays.
 * Sends dummy requests to warm up the model cache.
 */

import { ollamaGenerate } from '../shared/shared-llm/ollama-client.js';

interface WarmupConfig {
  models: string[];
  timeoutMs?: number;
  retries?: number;
}

const DEFAULT_WARMUP_CONFIG: WarmupConfig = {
  models: ['qwen2.5-coder:7b', 'qwen2.5:3b'],
  timeoutMs: 30000, // 30 seconds for warmup
  retries: 2,
};

/**
 * Warm up models by sending dummy requests
 */
export async function warmupModels(config: WarmupConfig = DEFAULT_WARMUP_CONFIG): Promise<void> {
  console.log('🔥 Warming up Ollama models...');
  
  const startTime = Date.now();
  const results: Array<{ model: string; success: boolean; timeMs: number }> = [];
  
  for (const model of config.models) {
    const modelStartTime = Date.now();
    let success = false;
    
    for (let attempt = 1; attempt <= (config.retries ?? 2); attempt++) {
      try {
        console.log(`  ⏳ Warming up ${model} (attempt ${attempt}/${config.retries})...`);
        
        // Send a simple dummy request to load the model into memory
        await ollamaGenerate({
          model,
          prompt: 'Hello! This is a warmup request. Please respond with "Ready".',
          format: 'json',
          timeoutMs: config.timeoutMs ?? 30000,
        });
        
        success = true;
        const elapsed = Date.now() - modelStartTime;
        console.log(`  ✅ ${model} warmed up in ${elapsed}ms`);
        results.push({ model, success: true, timeMs: elapsed });
        break;
      } catch (error) {
        if (attempt === (config.retries ?? 2)) {
          const elapsed = Date.now() - modelStartTime;
          console.warn(`  ⚠️  ${model} warmup failed after ${attempt} attempts (${elapsed}ms):`, error);
          results.push({ model, success: false, timeMs: elapsed });
        } else {
          console.warn(`  ⚠️  ${model} warmup attempt ${attempt} failed, retrying...`);
        }
      }
    }
  }
  
  const totalTime = Date.now() - startTime;
  const successCount = results.filter(r => r.success).length;
  
  console.log(`\n🔥 Warmup complete: ${successCount}/${config.models.length} models ready (${totalTime}ms total)`);
  
  if (successCount === 0) {
    console.warn('⚠️  WARNING: No models warmed up successfully. First requests may be slow.');
  }
}

/**
 * Warm up a single model
 */
export async function warmupModel(model: string, timeoutMs: number = 30000): Promise<boolean> {
  try {
    console.log(`🔥 Warming up ${model}...`);
    
    await ollamaGenerate({
      model,
      prompt: 'Hello! This is a warmup request. Please respond with "Ready".',
      format: 'json',
      timeoutMs,
    });
    
    console.log(`✅ ${model} warmed up successfully`);
    return true;
  } catch (error) {
    console.warn(`⚠️  ${model} warmup failed:`, error);
    return false;
  }
}

/**
 * Check if a model is available
 */
export async function isModelAvailable(model: string): Promise<boolean> {
  try {
    await ollamaGenerate({
      model,
      prompt: 'ping',
      timeoutMs: 5000, // Quick check
    });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get list of available models and warm them up
 */
export async function warmupAvailableModels(): Promise<void> {
  const modelsToTry = ['qwen2.5-coder:7b', 'qwen2.5:3b', 'deepseek-coder:1.3b'];
  const availableModels: string[] = [];
  
  console.log('🔍 Checking available models...');
  
  for (const model of modelsToTry) {
    const available = await isModelAvailable(model);
    if (available) {
      console.log(`  ✅ ${model} is available`);
      availableModels.push(model);
    } else {
      console.log(`  ⚠️  ${model} is not available`);
    }
  }
  
  if (availableModels.length === 0) {
    console.warn('⚠️  WARNING: No models available for warmup');
    return;
  }
  
  await warmupModels({ models: availableModels });
}

