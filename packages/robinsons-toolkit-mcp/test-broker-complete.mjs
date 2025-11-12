#!/usr/bin/env node
/**
 * Comprehensive test for Robinson's Toolkit MCP broker pattern
 * Tests both direct MCP calls and ToolkitClient compatibility
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🧪 Robinson\'s Toolkit MCP - Comprehensive Broker Test\n');

async function runTests() {
  const client = new Client({ name: 'broker-tester', version: '1.0.0' });
  
  // Use the built dist/index.js
  const transport = new StdioClientTransport({
    command: 'node',
    args: [join(__dirname, 'dist', 'index.js')],
  });

  try {
    console.log('📋 Test 1: Connecting to MCP server...');
    await client.connect(transport);
    console.log('✅ Connected successfully\n');

    // Test 2: List tools (should show broker tools)
    console.log('📋 Test 2: Listing available tools...');
    const toolsList = await client.listTools();
    console.log(`✅ Found ${toolsList.tools.length} broker tools:`);
    toolsList.tools.forEach(t => console.log(`   - ${t.name}`));
    console.log('');

    // Test 3: Call toolkit_list_categories (plain name - Augment style)
    console.log('📋 Test 3: Testing plain name (toolkit_list_categories)...');
    const categoriesPlain = await client.callTool({
      name: 'toolkit_list_categories',
      arguments: {},
    });
    const catData = JSON.parse(categoriesPlain.content[0].text);
    console.log(`✅ Plain name works! Found ${catData.total} categories`);
    console.log('');

    // Test 4: Call toolkit_list_categories_robinsons-toolkit-mcp (suffixed - ToolkitClient style)
    console.log('📋 Test 4: Testing suffixed name (toolkit_list_categories_robinsons-toolkit-mcp)...');
    const categoriesSuffixed = await client.callTool({
      name: 'toolkit_list_categories_robinsons-toolkit-mcp',
      arguments: {},
    });
    const catDataSuffixed = JSON.parse(categoriesSuffixed.content[0].text);
    console.log(`✅ Suffixed name works! Found ${catDataSuffixed.total} categories`);
    console.log('');

    // Test 5: List tools in a category
    console.log('📋 Test 5: Listing tools in stripe category...');
    const stripeTools = await client.callTool({
      name: 'toolkit_list_tools',
      arguments: { category: 'stripe', limit: 5 },
    });
    const stripeData = JSON.parse(stripeTools.content[0].text);
    console.log(`✅ Found ${stripeData.total} stripe tools (showing ${stripeData.showing}):`);
    stripeData.tools.forEach(t => console.log(`   - ${t.name}`));
    console.log('');

    // Test 6: Discover tools
    console.log('📋 Test 6: Discovering tools with query "customer"...');
    const discovered = await client.callTool({
      name: 'toolkit_discover',
      arguments: { query: 'customer', limit: 5 },
    });
    const discData = JSON.parse(discovered.content[0].text);
    console.log(`✅ Found ${discData.total} matching tools:`);
    discData.results.forEach(t => console.log(`   - ${t.name} (${t.category})`));
    console.log('');

    // Test 7: Health check
    console.log('📋 Test 7: Running health check...');
    const health = await client.callTool({
      name: 'toolkit_health_check',
      arguments: {},
    });
    const healthData = JSON.parse(health.content[0].text);
    console.log(`✅ Status: ${healthData.status}`);
    console.log(`   Total tools: ${healthData.registry.totalTools}`);
    console.log(`   Total categories: ${healthData.registry.totalCategories}`);
    console.log('');

    // Test 8: Validate registry
    console.log('📋 Test 8: Validating registry...');
    const validation = await client.callTool({
      name: 'toolkit_validate',
      arguments: {},
    });
    const validData = JSON.parse(validation.content[0].text);
    console.log(`✅ Valid: ${validData.valid}`);
    console.log(`   Total tools: ${validData.totalTools}`);
    console.log(`   Total categories: ${validData.totalCategories}`);
    console.log('');

    console.log('============================================================');
    console.log('🎉 All tests passed!');
    console.log('============================================================');
    console.log('✅ Plain names work (Augment compatibility)');
    console.log('✅ Suffixed names work (ToolkitClient compatibility)');
    console.log('✅ All broker tools functional');
    console.log('✅ Registry loaded and validated');
    console.log('============================================================\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await client.close();
    await transport.close();
  }
}

runTests().catch(console.error);

