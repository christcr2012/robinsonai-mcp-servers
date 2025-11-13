#!/usr/bin/env node
/**
 * Clean extraction of Redis tools and handlers from temp-redis-mcp.ts
 * Manually creates properly formatted files following the Neon pattern
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';

const content = readFileSync('temp-redis-mcp.ts', 'utf-8');
const lines = content.split('\n');

// Extract the tools array (lines 64-1104) - this is the tools array in ListToolsRequestSchema
let inToolsArray = false;
let braceDepth = 0;
let currentTool = null;
const tools = [];

for (let i = 63; i < 1104; i++) {
  const line = lines[i].trim();
  
  if (line.includes('tools: [')) {
    inToolsArray = true;
    continue;
  }
  
  if (!inToolsArray) continue;
  
  // Track opening braces
  for (const char of line) {
    if (char === '{') braceDepth++;
    if (char === '}') braceDepth--;
  }
  
  // Start of a new tool
  if (line.startsWith('{') && braceDepth === 1) {
    currentTool = { lines: [] };
  }
  
  // Collect lines for current tool
  if (currentTool) {
    currentTool.lines.push(lines[i]);
  }
  
  // End of current tool
  if (braceDepth === 0 && currentTool && currentTool.lines.length > 0) {
    // Parse the tool
    const toolText = currentTool.lines.join('\n');
    const nameMatch = toolText.match(/name:\s*"([^"]+)"/);
    const descMatch = toolText.match(/description:\s*"([^"]+)"/);
    
    if (nameMatch && descMatch) {
      // Extract inputSchema - find it between inputSchema: and the closing brace
      const schemaStart = toolText.indexOf('inputSchema:');
      if (schemaStart !== -1) {
        const schemaText = toolText.substring(schemaStart + 12).trim();
        // Find the matching closing brace for inputSchema
        let depth = 0;
        let schemaEnd = 0;
        for (let j = 0; j < schemaText.length; j++) {
          if (schemaText[j] === '{') depth++;
          if (schemaText[j] === '}') {
            depth--;
            if (depth === 0) {
              schemaEnd = j + 1;
              break;
            }
          }
        }
        const schema = schemaText.substring(0, schemaEnd).replace(/\s+/g, ' ').trim();
        
        tools.push({
          name: nameMatch[1],
          description: descMatch[1],
          schema: schema
        });
      }
    }
    
    currentTool = null;
  }
}

console.log(`Extracted ${tools.length} tools`);

// Generate tools.ts
const toolDefs = tools.map(t => 
  `  { name: '${t.name}', description: '${t.description}', inputSchema: ${t.schema} }`
);

const toolsTs = `/**
 * Upstash (Redis) Tool Definitions
 * Extracted from temp-redis-mcp.ts
 * Total: ${tools.length} tools
 */

export const UPSTASH_TOOLS = [
${toolDefs.join(',\n')}
];
`;

mkdirSync('src/categories/upstash', { recursive: true });
writeFileSync('src/categories/upstash/tools.ts', toolsTs);
console.log(`✅ Wrote src/categories/upstash/tools.ts (${tools.length} tools)`);

// Now extract handlers
const handlers = [];
const handlerMap = {
  'redis_get': 'Get',
  'redis_set': 'Set',
  'redis_delete': 'Delete',
  'redis_exists': 'Exists',
  'redis_ttl': 'TTL',
  'redis_expire': 'Expire',
  'redis_list_keys': 'ListKeys',
  'redis_delete_by_pattern': 'DeleteByPattern',
  'redis_mget': 'MGet',
  'redis_info': 'Info',
  'redis_dbsize': 'DBSize',
  'redis_memory_usage': 'MemoryUsage',
  'redis_list_sessions': 'ListSessions',
  'redis_inspect_session': 'InspectSession',
  'redis_clear_tenant_cache': 'ClearTenantCache',
  'redis_list_rate_limits': 'ListRateLimits',
  'redis_current_db': 'CurrentDB',
  'redis_flush_db': 'FlushDB',
  'redis_incr': 'Incr',
  'redis_decr': 'Decr',
  'redis_incrby': 'IncrBy',
  'redis_decrby': 'DecrBy',
  'redis_append': 'Append',
  'redis_strlen': 'StrLen',
  'redis_hset': 'HSet',
  'redis_hget': 'HGet',
  'redis_hgetall': 'HGetAll',
  'redis_hdel': 'HDel',
  'redis_hexists': 'HExists',
  'redis_hkeys': 'HKeys',
  'redis_hvals': 'HVals',
  'redis_hlen': 'HLen',
  'redis_lpush': 'LPush',
  'redis_rpush': 'RPush',
  'redis_lpop': 'LPop',
  'redis_rpop': 'RPop',
  'redis_lrange': 'LRange',
  'redis_llen': 'LLen',
  'redis_sadd': 'SAdd',
  'redis_smembers': 'SMembers',
  'redis_srem': 'SRem',
  'redis_sismember': 'SIsMember',
  'redis_scard': 'SCard',
  'redis_zadd': 'ZAdd',
  'redis_zrange': 'ZRange',
  'redis_zrem': 'ZRem',
  'redis_zscore': 'ZScore',
  'redis_zcard': 'ZCard',
  'redis_zrank': 'ZRank',
  'redis_type': 'Type',
  'redis_rename': 'Rename',
  'redis_persist': 'Persist',
  'redis_publish': 'Publish',
  'redis_xadd': 'XAdd',
  'redis_xread': 'XRead',
  'redis_xrange': 'XRange',
  'redis_xlen': 'XLen',
  'redis_geoadd': 'GeoAdd',
  'redis_geodist': 'GeoDist',
  'redis_georadius': 'GeoRadius',
  'redis_pfadd': 'PfAdd',
  'redis_pfcount': 'PfCount',
  'redis_setbit': 'SetBit',
  'redis_getbit': 'GetBit',
  'redis_bitcount': 'BitCount',
  'redis_zrangebyscore': 'ZRangeByScore',
  'redis_zincrby': 'ZIncrBy',
  'redis_zcount': 'ZCount',
  'redis_scan': 'Scan',
  'redis_hscan': 'HScan',
  'redis_sscan': 'SScan',
  'redis_zscan': 'ZScan',
  'redis_getrange': 'GetRange',
  'redis_setrange': 'SetRange',
  'redis_sinter': 'SInter',
  'redis_sunion': 'SUnion',
  'redis_sdiff': 'SDiff',
  'redis_zunionstore': 'ZUnionStore',
  'redis_zinterstore': 'ZInterStore',
  'redis_linsert': 'LInsert'
};

// Extract each handler method
for (const [toolName, methodSuffix] of Object.entries(handlerMap)) {
  const methodName = `handle${methodSuffix}`;
  const funcName = toolName.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());

  // Find the method in the file - look for the opening brace on the same or next line
  const methodPattern = `private async ${methodName}\\(`;
  const methodIndex = content.indexOf(methodPattern);

  if (methodIndex !== -1) {
    // Find the opening brace
    const afterSignature = content.substring(methodIndex);
    const openBraceIndex = afterSignature.indexOf('{');
    if (openBraceIndex === -1) {
      console.warn(`⚠️  Could not find opening brace for ${toolName}`);
      continue;
    }

    // Extract the body by counting braces
    let braceCount = 1;
    let bodyStart = methodIndex + openBraceIndex + 1;
    let bodyEnd = bodyStart;

    for (let i = bodyStart; i < content.length; i++) {
      if (content[i] === '{') braceCount++;
      if (content[i] === '}') {
        braceCount--;
        if (braceCount === 0) {
          bodyEnd = i;
          break;
        }
      }
    }

    let body = content.substring(bodyStart, bodyEnd);

    // Transform this.client to redisClient
    body = body.replace(/this\.client!/g, 'redisClient');
    body = body.replace(/this\.client/g, 'redisClient');
    body = body.replace(/this\.currentDb/g, 'currentDb');
    body = body.replace(/this\.config\.url/g, 'getRedisUrl()');

    handlers.push(`export async function ${funcName}(args: any) {
  const redisClient = await getRedisClient();${body}
}`);
  } else {
    console.warn(`⚠️  Could not find handler for ${toolName} (${methodName})`);
  }
}

console.log(`Extracted ${handlers.length} handlers`);

const handlersTs = `/**
 * Upstash (Redis) Handler Functions
 * Extracted from temp-redis-mcp.ts
 * Total: ${handlers.length} handlers
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

${handlers.join('\n\n')}
`;

writeFileSync('src/categories/upstash/handlers.ts', handlersTs);
console.log(`✅ Wrote src/categories/upstash/handlers.ts (${handlers.length} handlers)`);

