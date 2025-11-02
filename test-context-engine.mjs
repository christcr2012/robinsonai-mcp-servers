#!/usr/bin/env node
/**
 * Test Context Engine - Index and Query Documentation
 */

import { indexRepo } from './packages/thinking-tools-mcp/dist/context/indexer.js';
import { hybridQuery } from './packages/thinking-tools-mcp/dist/context/search.js';
import { getPaths } from './packages/thinking-tools-mcp/dist/context/store.js';

console.log('🔍 Testing Context Engine\n');

// Step 1: Index the repository
console.log('📚 Step 1: Indexing repository documentation...');
try {
  await indexRepo();
  console.log('✅ Repository indexed successfully!\n');
  
  const paths = getPaths();
  console.log('📁 Storage locations:');
  console.log(`   - Chunks: ${paths.chunks}`);
  console.log(`   - Embeddings: ${paths.embeddings}`);
  console.log(`   - Stats: ${paths.stats}\n`);
} catch (error) {
  console.error('❌ Indexing failed:', error.message);
  process.exit(1);
}

// Step 2: Query for plans and documentation
console.log('🔎 Step 2: Querying for plans and roadmaps...\n');

const queries = [
  'roadmap plans future work TODO',
  'architecture system design',
  'deployment production setup',
  'testing quality assurance',
  'documentation README guides'
];

for (const query of queries) {
  console.log(`\n📋 Query: "${query}"`);
  console.log('─'.repeat(80));
  
  try {
    const results = await hybridQuery(query, 5);
    
    if (results.length === 0) {
      console.log('   No results found');
      continue;
    }
    
    for (let i = 0; i < results.length; i++) {
      const hit = results[i];
      console.log(`\n   ${i + 1}. ${hit.chunk.path} (lines ${hit.chunk.start}-${hit.chunk.end})`);
      console.log(`      Score: ${hit.score.toFixed(2)}`);
      console.log(`      Preview: ${hit.chunk.text.slice(0, 200).replace(/\n/g, ' ')}...`);
    }
  } catch (error) {
    console.error(`   ❌ Query failed: ${error.message}`);
  }
}

console.log('\n\n✅ Context Engine test complete!');

