#!/usr/bin/env node

/**
 * Test architect-mcp to see if it works with the same SDK version
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

async function testArchitect() {
  console.log('🏗️  ARCHITECT MCP TEST\n');
  
  const transport = new StdioClientTransport({
    command: 'node',
    args: ['packages/architect-mcp/dist/index.js'],
  });

  const client = new Client({
    name: 'test-client',
    version: '1.0.0',
  }, {
    capabilities: {},
  });

  try {
    await client.connect(transport);
    console.log('✅ Connected to Architect MCP\n');

    // List tools
    const result = await client.request({
      method: 'tools/list',
      params: {},
    }, {});
    
    console.log('Tools:');
    console.log(JSON.stringify(result, null, 2).substring(0, 500));

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Message:', error.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

testArchitect().catch(console.error);

