#!/usr/bin/env node
/**
 * Test RCE Fixes - Validate all 3 phases
 * 
 * Tests:
 * 1. File filtering - no .venv-learning files
 * 2. Vector search - hybrid method with vectors
 * 3. Language-aware ranking - TypeScript > Python, no test files
 */

import { RobinsonsContextEngine } from './packages/robinsons-context-engine/dist/index.js';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = __dirname;

console.log('🧪 Testing RCE Fixes\n');
console.log('=' .repeat(80));

const rce = new RobinsonsContextEngine(root);

// Test 1: Clear and re-index
console.log('\n📦 Phase 1 Test: File Filtering');
console.log('-'.repeat(80));

console.log('Clearing old index...');
await rce.reset();

console.log('Re-indexing repository...');
const indexResult = await rce.indexRepo(root);
console.log(`✅ Indexed ${indexResult.files} files, ${indexResult.chunks} chunks, ${indexResult.vectors} vectors`);

// Check stats
const stats = await rce.stats();
console.log(`\n📊 Index Stats:`);
console.log(`  - Sources: ${stats.sources}`);
console.log(`  - Chunks: ${stats.chunks}`);
console.log(`  - Vectors: ${stats.vectors}`);
console.log(`  - Mode: ${stats.mode}`);
console.log(`  - Model: ${stats.model}`);
console.log(`  - Cost: $${stats.totalCost?.toFixed(4) || '0.0000'}`);

// Load all chunks and check for .venv-learning
const store = rce.store;
const allChunks = await store.loadAll();
const venvChunks = allChunks.filter(c => c.uri.includes('.venv-learning'));
const sitePackagesChunks = allChunks.filter(c => c.uri.includes('site-packages'));

console.log(`\n🔍 File Filtering Check:`);
console.log(`  - Total chunks: ${allChunks.length}`);
console.log(`  - .venv-learning chunks: ${venvChunks.length} ${venvChunks.length === 0 ? '✅' : '❌'}`);
console.log(`  - site-packages chunks: ${sitePackagesChunks.length} ${sitePackagesChunks.length === 0 ? '✅' : '❌'}`);

if (venvChunks.length > 0) {
  console.log(`\n❌ FAIL: Found .venv-learning files in index!`);
  console.log('Sample:', venvChunks.slice(0, 3).map(c => c.uri));
} else {
  console.log(`\n✅ PASS: No .venv-learning files in index`);
}

// Test 2: Vector Search
console.log('\n\n🔍 Phase 2 Test: Vector Search');
console.log('-'.repeat(80));

const testQueries = [
  'MCP server architecture',
  'context search implementation',
  'tool registration patterns',
  'error handling'
];

for (const query of testQueries) {
  console.log(`\nQuery: "${query}"`);
  const results = await rce.search(query, 12);
  
  if (results.length === 0) {
    console.log('  ❌ No results returned');
    continue;
  }
  
  const method = results[0]._method;
  const provider = results[0]._provider;
  const hasVectors = results.some(r => r._provider?.includes('vector'));
  
  console.log(`  Method: ${method} ${method === 'hybrid' ? '✅' : '⚠️'}`);
  console.log(`  Provider: ${provider} ${hasVectors ? '✅' : '⚠️'}`);
  console.log(`  Results: ${results.length}`);
  
  // Show top 3 results
  console.log(`  Top 3 results:`);
  results.slice(0, 3).forEach((r, i) => {
    const ext = path.extname(r.uri);
    const isTest = r.uri.includes('test') || r.uri.includes('spec');
    const isPython = ext === '.py';
    console.log(`    ${i + 1}. ${r.uri} (${ext}) ${isTest ? '🧪' : ''} ${isPython ? '🐍' : ''} - score: ${r.score?.toFixed(4) || 'N/A'}`);
  });
}

// Test 3: Language-Aware Ranking
console.log('\n\n🎯 Phase 3 Test: Language-Aware Ranking');
console.log('-'.repeat(80));

const rankingQuery = 'MCP server';
console.log(`\nQuery: "${rankingQuery}"`);
const rankingResults = await rce.search(rankingQuery, 12);

const tsResults = rankingResults.filter(r => r.uri.endsWith('.ts') || r.uri.endsWith('.tsx'));
const pyResults = rankingResults.filter(r => r.uri.endsWith('.py'));
const testResults = rankingResults.filter(r => 
  r.uri.includes('/tests/') || 
  r.uri.includes('\\tests\\') || 
  r.uri.includes('test_') ||
  r.uri.includes('.test.') ||
  r.uri.includes('.spec.')
);

console.log(`\n📊 Language Distribution:`);
console.log(`  - TypeScript files: ${tsResults.length}/12 ${tsResults.length >= 10 ? '✅' : '⚠️'}`);
console.log(`  - Python files: ${pyResults.length}/12 ${pyResults.length === 0 ? '✅' : '⚠️'}`);
console.log(`  - Test files: ${testResults.length}/12 ${testResults.length === 0 ? '✅' : '⚠️'}`);

console.log(`\n📋 All Results:`);
rankingResults.forEach((r, i) => {
  const ext = path.extname(r.uri);
  const isTest = r.uri.includes('test') || r.uri.includes('spec');
  const isPython = ext === '.py';
  const isTS = ext === '.ts' || ext === '.tsx';
  const emoji = isTest ? '🧪' : isPython ? '🐍' : isTS ? '📘' : '📄';
  console.log(`  ${i + 1}. ${emoji} ${r.uri} - score: ${r.score?.toFixed(4) || 'N/A'}`);
});

// Final Summary
console.log('\n\n' + '='.repeat(80));
console.log('📊 FINAL SUMMARY');
console.log('='.repeat(80));

const phase1Pass = venvChunks.length === 0 && sitePackagesChunks.length === 0;
const phase2Pass = rankingResults.length > 0 && rankingResults[0]._method === 'hybrid';
const phase3Pass = tsResults.length >= 10 && pyResults.length === 0 && testResults.length === 0;

console.log(`\n✅ Phase 1 (File Filtering): ${phase1Pass ? 'PASS' : 'FAIL'}`);
console.log(`${phase2Pass ? '✅' : '⚠️'} Phase 2 (Vector Search): ${phase2Pass ? 'PASS' : 'PARTIAL'}`);
console.log(`✅ Phase 3 (Language Ranking): ${phase3Pass ? 'PASS' : 'FAIL'}`);

const allPass = phase1Pass && phase2Pass && phase3Pass;
console.log(`\n${allPass ? '🎉' : '⚠️'} Overall: ${allPass ? 'ALL TESTS PASSED!' : 'SOME TESTS FAILED'}`);

if (allPass) {
  console.log('\n🚀 RCE is now ready to compete with Augment\'s Context Engine!');
} else {
  console.log('\n⚠️ Some issues remain. Review the test output above.');
}

console.log('\n' + '='.repeat(80));

