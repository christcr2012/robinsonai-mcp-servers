#!/usr/bin/env node

/**
 * Test listing tools to see the schema
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

async function testListTools() {
  console.log('🔧 LIST TOOLS TEST\n');
  
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

    // List tools
    const result = await client.request({
      method: 'tools/list',
      params: {},
    }, {});
    
    console.log('Tools:');
    console.log(JSON.stringify(result, null, 2));

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Message:', error.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

testListTools().catch(console.error);

