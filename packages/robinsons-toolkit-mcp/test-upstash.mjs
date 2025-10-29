import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn } from 'child_process';

console.log('🧪 Starting Upstash Integration Test...\n');

// Start the MCP server
const serverProcess = spawn('node', ['dist/index.js'], {
  cwd: process.cwd(),
  stdio: ['pipe', 'pipe', 'inherit']
});

const transport = new StdioClientTransport({
  command: 'node',
  args: ['dist/index.js']
});

const client = new Client({
  name: 'upstash-test-client',
  version: '1.0.0'
}, {
  capabilities: {}
});

let testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

async function runTest(name, toolName, args = {}) {
  try {
    console.log(`\n📝 Test: ${name}`);
    console.log(`   Tool: ${toolName}`);
    console.log(`   Args: ${JSON.stringify(args, null, 2)}`);
    
    const result = await client.callTool({
      name: toolName,
      arguments: args
    });
    
    console.log(`   ✅ PASSED`);
    console.log(`   Result: ${JSON.stringify(result, null, 2)}`);
    
    testResults.passed++;
    testResults.tests.push({ name, status: 'PASSED', result });
    return result;
  } catch (error) {
    console.log(`   ❌ FAILED: ${error.message}`);
    testResults.failed++;
    testResults.tests.push({ name, status: 'FAILED', error: error.message });
    return null;
  }
}

async function main() {
  try {
    await client.connect(transport);
    console.log('✅ Connected to MCP server\n');
    
    // Test 1: List databases (should be empty)
    await runTest(
      'List Databases (Empty)',
      'upstash_list_redis_databases',
      {}
    );

    // Test 2: Create a test database (using Global Database model)
    const createResult = await runTest(
      'Create Test Database (Global)',
      'upstash_create_redis_database',
      {
        name: 'test-db-' + Date.now(),
        primary_region: 'us-east-1',
        tls: true
      }
    );

    if (createResult && !createResult.isError) {
      const dbData = JSON.parse(createResult.content[0].text);
      const dbId = dbData.database_id;
      const restUrl = dbData.endpoint;
      const restToken = dbData.rest_token;
      
      console.log(`\n📊 Database Created:`);
      console.log(`   ID: ${dbId}`);
      console.log(`   URL: ${restUrl}`);
      console.log(`   Token: ${restToken?.substring(0, 20)}...`);
      
      // Test 3: List databases (should have 1)
      await runTest(
        'List Databases (With Test DB)',
        'upstash_list_redis_databases',
        {}
      );

      // Test 4: Get database details
      await runTest(
        'Get Database Details',
        'upstash_get_redis_database',
        { databaseId: dbId }
      );
      
      // Test 5: Redis SET operation
      await runTest(
        'Redis SET',
        'upstash_redis_set',
        {
          key: 'test:key',
          value: 'Hello Upstash!'
        }
      );
      
      // Test 6: Redis GET operation
      await runTest(
        'Redis GET',
        'upstash_redis_get',
        { key: 'test:key' }
      );
      
      // Test 7: Redis INCR operation
      await runTest(
        'Redis INCR',
        'upstash_redis_incr',
        { key: 'test:counter' }
      );
      
      // Test 8: Redis Pipeline
      await runTest(
        'Redis Pipeline',
        'upstash_redis_pipeline',
        {
          commands: [
            ['SET', 'test:a', '1'],
            ['SET', 'test:b', '2'],
            ['GET', 'test:a'],
            ['GET', 'test:b']
          ]
        }
      );
      
      // Test 9: Delete database
      await runTest(
        'Delete Test Database',
        'upstash_delete_redis_database',
        { databaseId: dbId }
      );

      // Test 10: Verify deletion
      await runTest(
        'List Databases (After Deletion)',
        'upstash_list_redis_databases',
        {}
      );
    }
    
    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`📝 Total:  ${testResults.passed + testResults.failed}`);
    console.log('='.repeat(60));
    
    if (testResults.failed === 0) {
      console.log('\n🎉 ALL TESTS PASSED! Upstash integration is working perfectly!\n');
    } else {
      console.log('\n⚠️  Some tests failed. See details above.\n');
    }
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
  } finally {
    await client.close();
    serverProcess.kill();
    process.exit(testResults.failed === 0 ? 0 : 1);
  }
}

main();

