#!/usr/bin/env node
/**
 * Test script for provider-agnostic metrics adapters
 * Tests all 5 providers: OpenAI, Ollama, Anthropic, Moonshot, Voyage
 */

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '.env.local') });

console.log('🔑 Environment Variables Loaded:');
console.log(`   OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? '✅ Set' : '❌ Missing'}`);
console.log(`   ANTHROPIC_API_KEY: ${process.env.ANTHROPIC_API_KEY ? '✅ Set' : '❌ Missing'}`);
console.log(`   MOONSHOT_API_KEY: ${process.env.MOONSHOT_API_KEY ? '✅ Set' : '❌ Missing'}`);
console.log(`   VOYAGE_API_KEY: ${process.env.VOYAGE_API_KEY ? '✅ Set' : '❌ Missing'}`);
console.log('');

import {
  OpenAIMetricsAdapter,
  OllamaMetricsAdapter,
  AnthropicMetricsAdapter,
  MoonshotMetricsAdapter,
  VoyageMetricsAdapter,
} from './packages/shared-llm/dist/index.js';

console.log('🧪 Testing Provider-Agnostic Metrics Adapters\n');

// Test parameters
const testParams = {
  inputTokens: 1000,
  outputTokens: 500,
};

// Mock token stats function
const mockTokenStats = (period) => ({
  total_cost: 0,
  total_tokens: 0,
  total_requests: 0,
  by_model: {},
});

async function testAdapter(name, adapter, model) {
  console.log(`\n📊 Testing ${name}:`);
  console.log(`   Model: ${model}`);
  console.log(`   Available: ${adapter.isAvailable()}`);

  try {
    // Test cost estimate
    const estimate = await adapter.getCostEstimate({
      model,
      inputTokens: testParams.inputTokens,
      outputTokens: testParams.outputTokens,
    });

    console.log(`   ✅ Cost Estimate:`);
    console.log(`      Input Cost:  $${estimate.inputCost.toFixed(6)}`);
    console.log(`      Output Cost: $${estimate.outputCost.toFixed(6)}`);
    console.log(`      Total Cost:  $${estimate.totalCost.toFixed(6)}`);
    console.log(`      Pricing Source: ${estimate.pricing.source}`);
    console.log(`      Input per 1K: $${estimate.pricing.inputPer1k.toFixed(6)}`);
    console.log(`      Output per 1K: $${estimate.pricing.outputPer1k.toFixed(6)}`);
    console.log(`      Last Updated: ${estimate.pricing.lastUpdated}`);

    // Test usage stats
    const stats = await adapter.getUsageStats({ period: 'month' });
    console.log(`   ✅ Usage Stats: OK`);

    // Test capacity
    const capacity = await adapter.getCapacity();
    console.log(`   ✅ Capacity: ${Object.keys(capacity.models).length} models available`);

    // Test pricing refresh
    const refreshed = await adapter.refreshPricing();
    console.log(`   ✅ Pricing Refresh: ${refreshed ? 'SUCCESS' : 'FALLBACK'}`);

  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
}

async function main() {
  // 1. OpenAI
  const openaiAdapter = new OpenAIMetricsAdapter(
    () => 0, // getMonthlySpend
    () => 100, // getMonthlyBudget
    mockTokenStats
  );
  await testAdapter('OpenAI', openaiAdapter, 'gpt-4o-mini');

  // 2. Ollama
  const ollamaAdapter = new OllamaMetricsAdapter(mockTokenStats);
  await testAdapter('Ollama', ollamaAdapter, 'qwen2.5-coder:7b');

  // 3. Anthropic
  const anthropicAdapter = new AnthropicMetricsAdapter(mockTokenStats);
  await testAdapter('Anthropic', anthropicAdapter, 'claude-3-5-sonnet-20241022');

  // 4. Moonshot
  const moonshotAdapter = new MoonshotMetricsAdapter(mockTokenStats);
  await testAdapter('Moonshot', moonshotAdapter, 'moonshot-v1-8k');

  // 5. Voyage
  const voyageAdapter = new VoyageMetricsAdapter(mockTokenStats);
  await testAdapter('Voyage', voyageAdapter, 'voyage-3');

  console.log('\n\n✅ All tests complete!');
  console.log('\n📝 Summary:');
  console.log('   - OpenAI: Live pricing scraper + fallback');
  console.log('   - Ollama: Always $0 (local)');
  console.log('   - Anthropic: Live pricing scraper + fallback');
  console.log('   - Moonshot: Live pricing scraper + fallback (CNY→USD conversion)');
  console.log('   - Voyage: Live pricing scraper + fallback');
}

main().catch(console.error);

