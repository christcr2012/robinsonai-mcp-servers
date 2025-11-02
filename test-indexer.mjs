import { indexRepo } from './packages/thinking-tools-mcp/dist/context/indexer.js';

console.log('Starting indexer...');
try {
  await indexRepo();
  console.log('✅ Indexing complete!');
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error(error.stack);
  process.exit(1);
}

