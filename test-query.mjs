import { hybridQuery } from './packages/thinking-tools-mcp/dist/context/search.js';

console.log('Testing hybrid query...');

try {
  const results = await hybridQuery('test embedding', 3);
  console.log(`✅ Found ${results.length} results`);
  
  if (results.length > 0) {
    console.log('\nTop result:');
    console.log('  Score:', results[0].score);
    console.log('  Path:', results[0].chunk.path);
    console.log('  Text:', results[0].chunk.text.slice(0, 100));
    process.exit(0);
  } else {
    console.log('❌ No results found');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}

