import { embedBatch } from './packages/thinking-tools-mcp/dist/context/embedding.js';
import { ensureDirs, saveChunk, saveEmbedding, saveStats } from './packages/thinking-tools-mcp/dist/context/store.js';

console.log('Testing embedding...');

try {
  ensureDirs();
  
  // Test with a single small chunk
  const testText = 'This is a test of the Context Engine embedding system.';
  console.log('Embedding test text...');
  
  const [embedding] = await embedBatch([testText]);
  console.log(`✅ Got embedding with ${embedding.length} dimensions`);
  
  // Save a test chunk
  const chunk = {
    id: 'test-1',
    source: 'repo',
    path: 'test.txt',
    sha: 'abc123',
    start: 1,
    end: 1,
    text: testText
  };
  
  saveChunk(chunk);
  saveEmbedding({ id: 'test-1', vec: embedding });
  
  console.log('✅ Saved test chunk and embedding');
  
  saveStats({
    chunks: 1,
    embeddings: 1,
    sources: { repo: 1 },
    updatedAt: new Date().toISOString()
  });
  
  console.log('✅ Context Engine is working!');
  
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error(error.stack);
  process.exit(1);
}

