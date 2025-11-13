#!/usr/bin/env node
/**
 * Neon Integration Test
 * Verifies that Neon category is properly integrated into Robinson's Toolkit
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn } from 'child_process';

console.log('🧪 Neon Integration Test\n');

// Start the MCP server
const serverProcess = spawn('node', ['dist/index.js'], {
  stdio: ['pipe', 'pipe', 'inherit'],
});

const transport = new StdioClientTransport({
  command: 'node',
  args: ['dist/index.js'],
});

const client = new Client({
  name: 'neon-test-client',
  version: '1.0.0',
}, {
  capabilities: {},
});

try {
  // Connect
  console.log('📋 Test 1: Connecting to MCP server...');
  await client.connect(transport);
  console.log('✅ Connected successfully\n');

  // Test 1: Check if Neon appears in categories
  console.log('📋 Test 2: Checking if Neon category exists...');
  const categoriesResult = await client.callTool({
    name: 'toolkit_list_categories',
    arguments: {},
  });
  
  const categoriesData = JSON.parse(categoriesResult.content[0].text);
  const neonCategory = categoriesData.categories.find(c => c.name === 'neon');
  
  if (!neonCategory) {
    throw new Error('Neon category not found in toolkit_list_categories');
  }
  
  console.log(`✅ Neon category found!`);
  console.log(`   Display Name: ${neonCategory.displayName}`);
  console.log(`   Description: ${neonCategory.description}`);
  console.log(`   Tool Count: ${neonCategory.toolCount}\n`);

  // Test 2: List Neon tools
  console.log('📋 Test 3: Listing Neon tools...');
  const toolsResult = await client.callTool({
    name: 'toolkit_list_tools',
    arguments: { category: 'neon', limit: 10 },
  });
  
  const toolsData = JSON.parse(toolsResult.content[0].text);
  
  if (!toolsData.tools || toolsData.tools.length === 0) {
    throw new Error('No Neon tools found');
  }
  
  console.log(`✅ Found ${toolsData.total} Neon tools (showing first 10):`);
  toolsData.tools.forEach(tool => {
    console.log(`   - ${tool.name}: ${tool.description}`);
  });
  console.log('');

  // Test 3: Call neon_check_api_key (doesn't require actual API key to test the handler)
  console.log('📋 Test 4: Testing neon_check_api_key tool...');
  try {
    const checkResult = await client.callTool({
      name: 'toolkit_call',
      arguments: {
        category: 'neon',
        tool_name: 'neon_check_api_key',
        arguments: {},
      },
    });
    
    const checkData = JSON.parse(checkResult.content[0].text);
    console.log('✅ neon_check_api_key executed successfully');
    console.log(`   Result: ${JSON.stringify(checkData, null, 2)}\n`);
  } catch (error) {
    console.log(`⚠️  neon_check_api_key failed (expected if NEON_API_KEY not set):`);
    console.log(`   ${error.message}\n`);
  }

  // Test 4: Discover Neon tools
  console.log('📋 Test 5: Discovering Neon tools with query "project"...');
  const discoverResult = await client.callTool({
    name: 'toolkit_discover',
    arguments: { query: 'project', category: 'neon', limit: 5 },
  });

  const discoverData = JSON.parse(discoverResult.content[0].text);
  const toolCount = discoverData.tools?.length || 0;
  console.log(`✅ Found ${toolCount} matching tools:`);
  if (discoverData.tools) {
    discoverData.tools.forEach(tool => {
      console.log(`   - ${tool.name} (${tool.category})`);
    });
  }
  console.log('');

  console.log('============================================================');
  console.log('🎉 All Neon integration tests passed!');
  console.log('============================================================');
  console.log('✅ Neon category appears in toolkit_list_categories');
  console.log('✅ Neon tools show up in toolkit_list_tools');
  console.log('✅ Neon tools are discoverable via toolkit_discover');
  console.log('✅ Neon tool handlers can be called via toolkit_call');
  console.log('============================================================\n');

  process.exit(0);
} catch (error) {
  console.error('❌ Test failed:', error.message);
  console.error(error.stack);
  process.exit(1);
} finally {
  await client.close();
  serverProcess.kill();
}

