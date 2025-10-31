#!/usr/bin/env node
/**
 * Model Comparison Test
 * 
 * Tests different Ollama models to find optimal balance of:
 * - Speed (time to generate)
 * - Quality (code correctness)
 * - Reliability (success rate)
 */

import { ollamaGenerate } from './packages/shared-llm/dist/ollama-client.js';

const MODELS = [
  { name: 'deepseek-coder:1.3b', size: '776 MB', timeout: 30000 },
  { name: 'qwen2.5:3b', size: '1.9 GB', timeout: 60000 },
  { name: 'qwen2.5-coder:7b', size: '4.7 GB', timeout: 180000 },
];

const TEST_PROMPT = `Generate a TypeScript function that validates an email address using regex.
Return ONLY valid JSON in this format:
{
  "code": "export function validateEmail(email: string): boolean { ... }",
  "explanation": "brief explanation"
}`;

async function testModel(model) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🧪 Testing: ${model.name} (${model.size})`);
  console.log(`${'='.repeat(80)}`);
  
  const results = {
    model: model.name,
    size: model.size,
    attempts: [],
    avgTime: 0,
    successRate: 0,
  };
  
  // Run 3 attempts to get average
  for (let i = 1; i <= 3; i++) {
    console.log(`\n  Attempt ${i}/3...`);
    const startTime = Date.now();
    
    try {
      const response = await ollamaGenerate({
        model: model.name,
        prompt: TEST_PROMPT,
        format: 'json',
        timeoutMs: model.timeout,
      });
      
      const elapsed = Date.now() - startTime;
      console.log(`  ✅ Success in ${elapsed}ms (${(elapsed / 1000).toFixed(1)}s)`);
      
      // Try to parse response
      let parsed = null;
      try {
        parsed = JSON.parse(response);
        console.log(`  ✅ Valid JSON response`);
      } catch (e) {
        console.log(`  ⚠️  Invalid JSON response`);
      }
      
      results.attempts.push({
        success: true,
        timeMs: elapsed,
        validJson: parsed !== null,
      });
      
    } catch (error) {
      const elapsed = Date.now() - startTime;
      console.log(`  ❌ Failed in ${elapsed}ms: ${error.message}`);
      
      results.attempts.push({
        success: false,
        timeMs: elapsed,
        validJson: false,
        error: error.message,
      });
    }
  }
  
  // Calculate stats
  const successful = results.attempts.filter(a => a.success);
  results.successRate = (successful.length / results.attempts.length) * 100;
  results.avgTime = successful.length > 0
    ? successful.reduce((sum, a) => sum + a.timeMs, 0) / successful.length
    : 0;
  
  console.log(`\n  📊 Results:`);
  console.log(`    Success Rate: ${results.successRate.toFixed(0)}% (${successful.length}/3)`);
  if (successful.length > 0) {
    console.log(`    Average Time: ${results.avgTime.toFixed(0)}ms (${(results.avgTime / 1000).toFixed(1)}s)`);
    console.log(`    Min Time: ${Math.min(...successful.map(a => a.timeMs))}ms`);
    console.log(`    Max Time: ${Math.max(...successful.map(a => a.timeMs))}ms`);
  }
  
  return results;
}

async function main() {
  console.log('🔬 MODEL COMPARISON TEST');
  console.log('Testing different Ollama models for optimal balance\n');
  console.log(`Models to test: ${MODELS.length}`);
  console.log(`Attempts per model: 3`);
  console.log(`Total tests: ${MODELS.length * 3}\n`);
  
  const allResults = [];
  
  for (const model of MODELS) {
    const result = await testModel(model);
    allResults.push(result);
    
    // Brief pause between models
    if (MODELS.indexOf(model) < MODELS.length - 1) {
      console.log(`\n⏸️  Pausing 3 seconds before next model...`);
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  
  // Final comparison
  console.log(`\n\n${'='.repeat(80)}`);
  console.log(`📊 FINAL COMPARISON`);
  console.log(`${'='.repeat(80)}\n`);
  
  console.log(`| Model | Size | Success Rate | Avg Time | Speed Score |`);
  console.log(`|-------|------|--------------|----------|-------------|`);
  
  allResults.forEach(r => {
    const speedScore = r.successRate > 0 
      ? ((r.successRate / 100) * (60000 / Math.max(r.avgTime, 1000))).toFixed(1)
      : 0;
    
    console.log(
      `| ${r.model.padEnd(20)} | ${r.size.padEnd(7)} | ` +
      `${r.successRate.toFixed(0).padStart(3)}% | ` +
      `${(r.avgTime / 1000).toFixed(1).padStart(5)}s | ` +
      `${speedScore.padStart(5)} |`
    );
  });
  
  console.log(`\n📝 Notes:`);
  console.log(`  - Speed Score = (Success Rate) × (60s / Avg Time)`);
  console.log(`  - Higher score = better balance of speed and reliability`);
  console.log(`  - Success Rate: % of attempts that completed successfully`);
  console.log(`  - Avg Time: Average time for successful attempts only\n`);
  
  // Recommendation
  const bestModel = allResults.reduce((best, current) => {
    const bestScore = best.successRate > 0 
      ? (best.successRate / 100) * (60000 / Math.max(best.avgTime, 1000))
      : 0;
    const currentScore = current.successRate > 0
      ? (current.successRate / 100) * (60000 / Math.max(current.avgTime, 1000))
      : 0;
    
    return currentScore > bestScore ? current : best;
  });
  
  console.log(`🏆 RECOMMENDATION: ${bestModel.model}`);
  console.log(`   Reason: Best balance of speed (${(bestModel.avgTime / 1000).toFixed(1)}s) and reliability (${bestModel.successRate.toFixed(0)}%)\n`);
  
  // Export results
  const report = {
    timestamp: new Date().toISOString(),
    models: allResults,
    recommendation: bestModel.model,
  };
  
  console.log(`📄 Full results saved to model-comparison-results.json`);
  
  const fs = await import('fs');
  fs.writeFileSync(
    'model-comparison-results.json',
    JSON.stringify(report, null, 2)
  );
}

main().catch(console.error);

