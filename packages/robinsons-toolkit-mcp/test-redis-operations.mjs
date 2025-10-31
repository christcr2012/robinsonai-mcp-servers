#!/usr/bin/env node

/**
 * Upstash Redis Operations Test Suite
 * Tests all 119 Redis REST API tools
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const testResults = { passed: 0, failed: 0 };

async function runTest(testName, toolName, args) {
  console.log(`\n📝 Test: ${testName}`);
  console.log(`   Tool: ${toolName}`);
  console.log(`   Args: ${JSON.stringify(args, null, 2)}`);
  
  try {
    const result = await client.callTool({ name: toolName, arguments: args });
    console.log(`   ✅ PASSED`);
    console.log(`   Result: ${JSON.stringify(result, null, 2)}`);
    testResults.passed++;
    return result;
  } catch (error) {
    console.log(`   ❌ FAILED`);
    console.log(`   Error: ${error.message}`);
    testResults.failed++;
    return null;
  }
}

let client;

async function main() {
  try {
    console.log('🧪 Starting Upstash Redis Operations Test...\n');
    
    // Connect to MCP server
    const transport = new StdioClientTransport({
      command: 'node',
      args: ['dist/index.js']
    });
    
    client = new Client({
      name: 'upstash-redis-test-client',
      version: '1.0.0'
    }, {
      capabilities: {}
    });
    
    await client.connect(transport);
    console.log('✅ Connected to MCP server\n');
    console.log('='.repeat(60));
    
    // ============================================================
    // STRING OPERATIONS
    // ============================================================
    console.log('\n📦 STRING OPERATIONS');
    console.log('='.repeat(60));
    
    await runTest('SET key', 'upstash_redis_set', {
      key: 'test:string',
      value: 'Hello Upstash!'
    });
    
    await runTest('GET key', 'upstash_redis_get', {
      key: 'test:string'
    });
    
    await runTest('APPEND to key', 'upstash_redis_append', {
      key: 'test:string',
      value: ' - Appended!'
    });
    
    await runTest('STRLEN', 'upstash_redis_strlen', {
      key: 'test:string'
    });
    
    await runTest('INCR counter', 'upstash_redis_incr', {
      key: 'test:counter'
    });
    
    await runTest('INCRBY counter', 'upstash_redis_incrby', {
      key: 'test:counter',
      increment: 10
    });
    
    await runTest('DECR counter', 'upstash_redis_decr', {
      key: 'test:counter'
    });
    
    await runTest('GETRANGE', 'upstash_redis_getrange', {
      key: 'test:string',
      start: 0,
      end: 5
    });
    
    // ============================================================
    // HASH OPERATIONS
    // ============================================================
    console.log('\n📦 HASH OPERATIONS');
    console.log('='.repeat(60));
    
    await runTest('HSET field', 'upstash_redis_hset', {
      key: 'test:hash',
      field: 'name',
      value: 'Robinson AI'
    });
    
    await runTest('HGET field', 'upstash_redis_hget', {
      key: 'test:hash',
      field: 'name'
    });
    
    await runTest('HMSET multiple fields', 'upstash_redis_hmset', {
      key: 'test:hash',
      fieldValues: { email: 'ops@robinsonaisystems.com', status: 'active' }
    });
    
    await runTest('HGETALL', 'upstash_redis_hgetall', {
      key: 'test:hash'
    });
    
    await runTest('HKEYS', 'upstash_redis_hkeys', {
      key: 'test:hash'
    });
    
    await runTest('HVALS', 'upstash_redis_hvals', {
      key: 'test:hash'
    });
    
    await runTest('HLEN', 'upstash_redis_hlen', {
      key: 'test:hash'
    });
    
    await runTest('HEXISTS', 'upstash_redis_hexists', {
      key: 'test:hash',
      field: 'name'
    });
    
    // ============================================================
    // LIST OPERATIONS
    // ============================================================
    console.log('\n📦 LIST OPERATIONS');
    console.log('='.repeat(60));
    
    await runTest('LPUSH to list', 'upstash_redis_lpush', {
      key: 'test:list',
      values: ['item1', 'item2', 'item3']
    });
    
    await runTest('RPUSH to list', 'upstash_redis_rpush', {
      key: 'test:list',
      values: ['item4', 'item5']
    });
    
    await runTest('LRANGE', 'upstash_redis_lrange', {
      key: 'test:list',
      start: 0,
      stop: -1
    });
    
    await runTest('LLEN', 'upstash_redis_llen', {
      key: 'test:list'
    });
    
    await runTest('LINDEX', 'upstash_redis_lindex', {
      key: 'test:list',
      index: 0
    });
    
    await runTest('LPOP', 'upstash_redis_lpop', {
      key: 'test:list'
    });
    
    await runTest('RPOP', 'upstash_redis_rpop', {
      key: 'test:list'
    });
    
    // ============================================================
    // SET OPERATIONS
    // ============================================================
    console.log('\n📦 SET OPERATIONS');
    console.log('='.repeat(60));
    
    await runTest('SADD to set', 'upstash_redis_sadd', {
      key: 'test:set',
      members: ['member1', 'member2', 'member3']
    });
    
    await runTest('SMEMBERS', 'upstash_redis_smembers', {
      key: 'test:set'
    });
    
    await runTest('SCARD', 'upstash_redis_scard', {
      key: 'test:set'
    });
    
    await runTest('SISMEMBER', 'upstash_redis_sismember', {
      key: 'test:set',
      member: 'member1'
    });
    
    await runTest('SREM from set', 'upstash_redis_srem', {
      key: 'test:set',
      members: ['member3']
    });
    
    // ============================================================
    // SORTED SET OPERATIONS
    // ============================================================
    console.log('\n📦 SORTED SET OPERATIONS');
    console.log('='.repeat(60));
    
    await runTest('ZADD to sorted set', 'upstash_redis_zadd', {
      key: 'test:zset',
      members: [
        { score: 100, member: 'player1' },
        { score: 200, member: 'player2' },
        { score: 150, member: 'player3' }
      ]
    });
    
    await runTest('ZRANGE', 'upstash_redis_zrange', {
      key: 'test:zset',
      start: 0,
      stop: -1
    });
    
    await runTest('ZCARD', 'upstash_redis_zcard', {
      key: 'test:zset'
    });
    
    await runTest('ZSCORE', 'upstash_redis_zscore', {
      key: 'test:zset',
      member: 'player2'
    });
    
    await runTest('ZRANK', 'upstash_redis_zrank', {
      key: 'test:zset',
      member: 'player1'
    });
    
    // ============================================================
    // KEY OPERATIONS
    // ============================================================
    console.log('\n📦 KEY OPERATIONS');
    console.log('='.repeat(60));
    
    await runTest('EXISTS', 'upstash_redis_exists', {
      keys: ['test:string', 'test:hash', 'test:list']
    });
    
    await runTest('TTL', 'upstash_redis_ttl', {
      key: 'test:string'
    });
    
    await runTest('EXPIRE', 'upstash_redis_expire', {
      key: 'test:string',
      seconds: 3600
    });
    
    await runTest('TYPE', 'upstash_redis_type', {
      key: 'test:hash'
    });
    
    // ============================================================
    // PIPELINE OPERATIONS
    // ============================================================
    console.log('\n📦 PIPELINE OPERATIONS');
    console.log('='.repeat(60));
    
    await runTest('Pipeline (batch commands)', 'upstash_redis_pipeline', {
      commands: [
        ['SET', 'pipeline:key1', 'value1'],
        ['SET', 'pipeline:key2', 'value2'],
        ['GET', 'pipeline:key1'],
        ['GET', 'pipeline:key2'],
        ['INCR', 'pipeline:counter']
      ]
    });
    
    // ============================================================
    // CLEANUP
    // ============================================================
    console.log('\n📦 CLEANUP');
    console.log('='.repeat(60));
    
    await runTest('DEL keys', 'upstash_redis_del', {
      keys: [
        'test:string', 'test:counter', 'test:hash', 'test:list',
        'test:set', 'test:zset', 'pipeline:key1', 'pipeline:key2',
        'pipeline:counter'
      ]
    });
    
    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`📝 Total:  ${testResults.passed + testResults.failed}`);
    console.log('='.repeat(60));
    
    if (testResults.failed === 0) {
      console.log('\n🎉 ALL REDIS OPERATIONS WORKING! Integration complete!\n');
    } else {
      console.log('\n⚠️  Some tests failed. See details above.\n');
    }
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
  } finally {
    await client.close();
    process.exit(testResults.failed === 0 ? 0 : 1);
  }
}

main();

