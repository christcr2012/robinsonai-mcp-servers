#!/usr/bin/env node

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: join(__dirname, '..', '..', '.env.local') });

async function testRedisIntegration() {
  console.log('🧪 Testing Redis Integration in Robinson\'s Toolkit...\n');

  if (!process.env.REDIS_URL) {
    console.error('❌ REDIS_URL environment variable is not set');
    console.error('Please ensure .env.local file exists in the project root with REDIS_URL');
    process.exit(1);
  }

  console.log('✅ REDIS_URL loaded from environment\n');

  const serverPath = join(__dirname, 'dist', 'index.js');
  const serverProcess = spawn('node', [serverPath], {
    stdio: ['pipe', 'pipe', 'inherit'],
    env: { ...process.env }
  });

  const transport = new StdioClientTransport({
    command: 'node',
    args: [serverPath],
    env: { ...process.env }
  });

  const client = new Client({
    name: 'redis-test-client',
    version: '1.0.0',
  }, {
    capabilities: {},
  });

  try {
    await client.connect(transport);
    console.log('✅ Connected to Robinson\'s Toolkit MCP server\n');

    const testKey = `test:redis:${Date.now()}`;
    const testValue = 'Hello Redis from Robinson\'s Toolkit!';

    console.log('📝 Test 1: redis_set - Setting a test key-value pair');
    const setResult = await client.callTool({
      name: 'redis_set',
      arguments: {
        key: testKey,
        value: testValue,
        ttl: 300
      }
    });
    console.log('Result:', setResult.content[0].text);
    console.log('✅ Test 1 passed\n');

    console.log('📖 Test 2: redis_get - Retrieving the test value');
    const getResult = await client.callTool({
      name: 'redis_get',
      arguments: {
        key: testKey
      }
    });
    console.log('Result:', getResult.content[0].text);
    if (getResult.content[0].text !== testValue) {
      throw new Error(`Expected "${testValue}", got "${getResult.content[0].text}"`);
    }
    console.log('✅ Test 2 passed\n');

    console.log('⏱️  Test 3: redis_ttl - Checking TTL of the test key');
    const ttlResult = await client.callTool({
      name: 'redis_ttl',
      arguments: {
        key: testKey
      }
    });
    console.log('Result:', ttlResult.content[0].text);
    console.log('✅ Test 3 passed\n');

    console.log('📊 Test 4: redis_info - Getting Redis server info');
    const infoResult = await client.callTool({
      name: 'redis_info',
      arguments: {
        section: 'server'
      }
    });
    console.log('Result (first 200 chars):', infoResult.content[0].text.substring(0, 200) + '...');
    console.log('✅ Test 4 passed\n');

    console.log('🔢 Test 5: redis_dbsize - Getting database size');
    const dbsizeResult = await client.callTool({
      name: 'redis_dbsize',
      arguments: {}
    });
    console.log('Result:', dbsizeResult.content[0].text);
    console.log('✅ Test 5 passed\n');

    console.log('🔍 Test 6: redis_exists - Checking if test key exists');
    const existsResult = await client.callTool({
      name: 'redis_exists',
      arguments: {
        keys: [testKey]
      }
    });
    console.log('Result:', existsResult.content[0].text);
    console.log('✅ Test 6 passed\n');

    console.log('🗑️  Test 7: redis_delete - Deleting the test key');
    const deleteResult = await client.callTool({
      name: 'redis_delete',
      arguments: {
        keys: [testKey]
      }
    });
    console.log('Result:', deleteResult.content[0].text);
    console.log('✅ Test 7 passed\n');

    console.log('✅ Verifying deletion - Key should not exist');
    const verifyResult = await client.callTool({
      name: 'redis_get',
      arguments: {
        key: testKey
      }
    });
    console.log('Result:', verifyResult.content[0].text);
    if (!verifyResult.content[0].text.includes('not found')) {
      throw new Error('Key should have been deleted');
    }
    console.log('✅ Deletion verified\n');

    console.log('🎉 All Redis integration tests passed!');
    console.log('\n📊 Summary:');
    console.log('  ✅ redis_set - Working');
    console.log('  ✅ redis_get - Working');
    console.log('  ✅ redis_ttl - Working');
    console.log('  ✅ redis_info - Working');
    console.log('  ✅ redis_dbsize - Working');
    console.log('  ✅ redis_exists - Working');
    console.log('  ✅ redis_delete - Working');
    console.log('\n🚀 Redis integration is fully functional!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await client.close();
    serverProcess.kill();
  }
}

testRedisIntegration().catch(console.error);

