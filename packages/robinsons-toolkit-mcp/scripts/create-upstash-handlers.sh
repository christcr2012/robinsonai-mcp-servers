#!/bin/bash
# Create Upstash handlers.ts by transforming temp-redis-mcp.ts

cat > src/categories/upstash/handlers.ts << 'HEADER'
/**
 * Upstash (Redis) Handler Functions
 * Extracted from temp-redis-mcp.ts
 * Total: 80 handlers
 */

import { createClient, RedisClientType } from 'redis';

// Module-level client singleton
let clientInstance: RedisClientType | null = null;
let isConnected = false;
let currentDb: 'provider' | 'tenant' = 'provider';

function getRedisUrl(): string {
  const url = process.env.REDIS_URL || process.env.UPSTASH_REDIS_URL || '';
  if (!url) {
    throw new Error('REDIS_URL or UPSTASH_REDIS_URL environment variable is required');
  }
  return url;
}

async function getRedisClient(): Promise<RedisClientType> {
  if (!clientInstance) {
    clientInstance = createClient({ url: getRedisUrl() });
    clientInstance.on('error', (err) => console.error('Redis Client Error', err));
  }
  if (!isConnected) {
    await clientInstance.connect();
    isConnected = true;
  }
  return clientInstance;
}

HEADER

# Extract handlers (lines 1321-1995) and transform
sed -n '1321,1995p' temp-redis-mcp.ts | \
  sed 's/private async handle/export async function redis/g' | \
  sed 's/Get(/get(/g' | \
  sed 's/Set(/set(/g' | \
  sed 's/Delete(/delete(/g' | \
  sed 's/Exists(/exists(/g' | \
  sed 's/TTL(/ttl(/g' | \
  sed 's/Expire(/expire(/g' | \
  sed 's/ListKeys(/listKeys(/g' | \
  sed 's/DeleteByPattern(/deleteByPattern(/g' | \
  sed 's/MGet(/mget(/g' | \
  sed 's/Info(/info(/g' | \
  sed 's/DBSize(/dbsize(/g' | \
  sed 's/MemoryUsage(/memoryUsage(/g' | \
  sed 's/ListSessions(/listSessions(/g' | \
  sed 's/InspectSession(/inspectSession(/g' | \
  sed 's/ClearTenantCache(/clearTenantCache(/g' | \
  sed 's/ListRateLimits(/listRateLimits(/g' | \
  sed 's/CurrentDB(/currentDb(/g' | \
  sed 's/FlushDB(/flushDb(/g' | \
  sed 's/Incr(/incr(/g' | \
  sed 's/Decr(/decr(/g' | \
  sed 's/IncrBy(/incrby(/g' | \
  sed 's/DecrBy(/decrby(/g' | \
  sed 's/Append(/append(/g' | \
  sed 's/StrLen(/strlen(/g' | \
  sed 's/HSet(/hset(/g' | \
  sed 's/HGet(/hget(/g' | \
  sed 's/HGetAll(/hgetall(/g' | \
  sed 's/HDel(/hdel(/g' | \
  sed 's/HExists(/hexists(/g' | \
  sed 's/HKeys(/hkeys(/g' | \
  sed 's/HVals(/hvals(/g' | \
  sed 's/HLen(/hlen(/g' | \
  sed 's/LPush(/lpush(/g' | \
  sed 's/RPush(/rpush(/g' | \
  sed 's/LPop(/lpop(/g' | \
  sed 's/RPop(/rpop(/g' | \
  sed 's/LRange(/lrange(/g' | \
  sed 's/LLen(/llen(/g' | \
  sed 's/SAdd(/sadd(/g' | \
  sed 's/SMembers(/smembers(/g' | \
  sed 's/SRem(/srem(/g' | \
  sed 's/SIsMember(/sismember(/g' | \
  sed 's/SCard(/scard(/g' | \
  sed 's/ZAdd(/zadd(/g' | \
  sed 's/ZRange(/zrange(/g' | \
  sed 's/ZRem(/zrem(/g' | \
  sed 's/ZScore(/zscore(/g' | \
  sed 's/ZCard(/zcard(/g' | \
  sed 's/ZRank(/zrank(/g' | \
  sed 's/Type(/type(/g' | \
  sed 's/Rename(/rename(/g' | \
  sed 's/Persist(/persist(/g' | \
  sed 's/Publish(/publish(/g' | \
  sed 's/XAdd(/xadd(/g' | \
  sed 's/XRead(/xread(/g' | \
  sed 's/XRange(/xrange(/g' | \
  sed 's/XLen(/xlen(/g' | \
  sed 's/GeoAdd(/geoadd(/g' | \
  sed 's/GeoDist(/geodist(/g' | \
  sed 's/GeoRadius(/georadius(/g' | \
  sed 's/PfAdd(/pfadd(/g' | \
  sed 's/PfCount(/pfcount(/g' | \
  sed 's/SetBit(/setbit(/g' | \
  sed 's/GetBit(/getbit(/g' | \
  sed 's/BitCount(/bitcount(/g' | \
  sed 's/ZRangeByScore(/zrangebyscore(/g' | \
  sed 's/ZIncrBy(/zincrby(/g' | \
  sed 's/ZCount(/zcount(/g' | \
  sed 's/Scan(/scan(/g' | \
  sed 's/HScan(/hscan(/g' | \
  sed 's/SScan(/sscan(/g' | \
  sed 's/ZScan(/zscan(/g' | \
  sed 's/GetRange(/getrange(/g' | \
  sed 's/SetRange(/setrange(/g' | \
  sed 's/SInter(/sinter(/g' | \
  sed 's/SUnion(/sunion(/g' | \
  sed 's/SDiff(/sdiff(/g' | \
  sed 's/ZUnionStore(/zunionstore(/g' | \
  sed 's/ZInterStore(/zinterstore(/g' | \
  sed 's/LInsert(/linsert(/g' | \
  sed 's/this\.client!/redisClient/g' | \
  sed 's/this\.client/redisClient/g' | \
  sed 's/this\.currentDb/currentDb/g' | \
  sed 's/this\.config\.url/getRedisUrl()/g' | \
  sed '/^  \/\/ Tool Handlers/d' | \
  sed '/^  \/\/ String Operations Handlers/d' | \
  sed '/^  \/\/ Hash Operations Handlers/d' | \
  sed '/^  \/\/ List Operations Handlers/d' | \
  sed '/^  \/\/ Set Operations Handlers/d' | \
  sed '/^  \/\/ Sorted Set Operations Handlers/d' | \
  sed '/^  \/\/ Key Inspection Handlers/d' | \
  sed '/^  \/\/ Stream Handlers/d' | \
  sed '/^  \/\/ Geospatial Handlers/d' | \
  sed '/^  \/\/ HyperLogLog Handlers/d' | \
  sed '/^  \/\/ Bitmap Handlers/d' | \
  sed '/^  \/\/ Advanced Sorted Set Handlers/d' | \
  sed '/^  \/\/ Scan Handlers/d' | \
  sed '/^  \/\/ String Range Handlers/d' | \
  sed '/^  \/\/ Set Operation Handlers/d' | \
  sed '/^  \/\/ Sorted Set Store Handlers/d' | \
  sed '/^  \/\/ List Insert Handler/d' | \
  sed '/^  \/\/ Pub\/Sub Handlers/d' >> src/categories/upstash/handlers.ts

echo "✅ Created src/categories/upstash/handlers.ts"

