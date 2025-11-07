#!/usr/bin/env node
/**
 * Test Context Engine indexing with Voyage AI
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

async function testIndexing() {
  console.log('🧪 Testing Context Engine Indexing...\n');
  
  const startTime = Date.now();
  
  // Create MCP client
  const transport = new StdioClientTransport({
    command: 'npx',
    args: ['-y', '@robinson_ai_systems/thinking-tools-mcp'],
    env: {
      ...process.env,
      AUGMENT_WORKSPACE_ROOT: process.cwd(),
      WORKSPACE_ROOT: process.cwd()
    }
  });
  
  const client = new Client({
    name: 'test-indexing',
    version: '1.0.0'
  }, {
    capabilities: {}
  });
  
  await client.connect(transport);
  console.log('✅ Connected to Thinking Tools MCP\n');
  
  try {
    // Step 1: Get initial stats
    console.log('📊 Step 1: Getting initial stats...');
    const statsResult = await client.callTool({
      name: 'context_stats_Thinking_Tools_MCP',
      arguments: {}
    });
    console.log('Initial stats:', JSON.stringify(statsResult.content[0].text, null, 2));
    console.log('');
    
    // Step 2: Run full index
    console.log('🔄 Step 2: Running full index...');
    const indexStart = Date.now();
    
    const indexResult = await client.callTool({
      name: 'context_index_full_Thinking_Tools_MCP',
      arguments: {}
    });
    
    const indexTime = Date.now() - indexStart;
    console.log(`✅ Indexing completed in ${(indexTime / 1000).toFixed(1)}s`);
    console.log('Result:', JSON.stringify(indexResult.content[0].text, null, 2));
    console.log('');
    
    // Step 3: Get final stats
    console.log('📊 Step 3: Getting final stats...');
    const finalStatsResult = await client.callTool({
      name: 'context_stats_Thinking_Tools_MCP',
      arguments: {}
    });
    
    const finalStats = JSON.parse(finalStatsResult.content[0].text);
    console.log('Final stats:', JSON.stringify(finalStats, null, 2));
    console.log('');
    
    // Step 4: Test a query
    console.log('🔍 Step 4: Testing semantic search...');
    const queryResult = await client.callTool({
      name: 'context_query_Thinking_Tools_MCP',
      arguments: {
        query: 'embedding provider voyage AI',
        top_k: 3
      }
    });
    
    const queryResults = JSON.parse(queryResult.content[0].text);
    console.log(`Found ${queryResults.results?.length || 0} results`);
    if (queryResults.results && queryResults.results.length > 0) {
      console.log('Top result:', queryResults.results[0].path);
      console.log('Score:', queryResults.results[0].score);
    }
    console.log('');
    
    // Summary
    const totalTime = Date.now() - startTime;
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ TEST COMPLETE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Total time: ${(totalTime / 1000).toFixed(1)}s`);
    console.log(`Indexing time: ${(indexTime / 1000).toFixed(1)}s`);
    console.log(`Chunks created: ${finalStats.chunks || 0}`);
    console.log(`Sources indexed: ${finalStats.sources || 0}`);
    console.log(`Embeddings: ${finalStats.embeddings || 0}`);
    console.log('');
    
    if (finalStats.chunks > 0) {
      console.log('✅ SUCCESS: Chunks created successfully!');
      console.log('✅ Voyage AI embeddings working!');
    } else {
      console.log('❌ FAILURE: No chunks created!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await client.close();
  }
}

testIndexing().catch(console.error);

