#!/usr/bin/env node

/**
 * Quick test of fast mode (should complete in <30s)
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

async function testFastMode() {
  console.log('⚡ FAST MODE TEST\n');
  
  const transport = new StdioClientTransport({
    command: 'node',
    args: ['packages/free-agent-mcp/dist/index.js'],
  });

  const client = new Client({
    name: 'test-client',
    version: '1.0.0',
  }, {
    capabilities: {},
  });

  try {
    await client.connect(transport);
    console.log('✅ Connected to FREE Agent\n');

    // Test fast mode
    console.log('Testing FAST mode (no sandbox, direct generation)...\n');
    
    const start = Date.now();
    const result = await client.request({
      method: 'tools/call',
      params: {
        name: 'delegate_code_generation',
        arguments: {
          task: 'Create a function that calculates factorial',
          context: 'TypeScript, recursive implementation',
          complexity: 'simple',
          quality: 'fast',
        },
      },
    }, {});
    const time = ((Date.now() - start) / 1000).toFixed(1);
    
    console.log(`\n✅ Completed in ${time}s`);
    console.log('\nResult:');
    console.log(JSON.stringify(result, null, 2));

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Message:', error.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

testFastMode().catch(console.error);

