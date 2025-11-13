#!/usr/bin/env node
/**
 * Extract Upstash (Redis) tools and handlers from temp-redis-mcp.ts
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';

const content = readFileSync('temp-redis-mcp.ts', 'utf-8');
const lines = content.split('\n');

// Extract tools (lines 64-1104)
const toolsLines = lines.slice(63, 1104);
const toolsText = toolsLines.join('\n');

// Extract tool definitions using regex
const toolMatches = [...toolsText.matchAll(/\{\s*name:\s*"([^"]+)",\s*description:\s*"([^"]+)",\s*inputSchema:\s*(\{[^}]*(?:\{[^}]*\}[^}]*)*\})/gs)];

console.log(`Found ${toolMatches.length} tool matches`);

// Build tools array
const tools = [];
for (const match of toolMatches) {
  const [, name, description, schema] = match;
  // Clean up schema - make it single line
  const cleanSchema = schema.replace(/\s+/g, ' ').replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
  tools.push(`  { name: '${name}', description: '${description}', inputSchema: ${cleanSchema} }`);
}

const toolsTs = `/**
 * Upstash (Redis) Tool Definitions
 * Extracted from temp-redis-mcp.ts
 * Total: ${tools.length} tools
 */

export const UPSTASH_TOOLS = [
${tools.join(',\n')}
];
`;

// Create directory
mkdirSync('src/categories/upstash', { recursive: true });

// Write tools.ts
writeFileSync('src/categories/upstash/tools.ts', toolsTs);
console.log(`✅ Wrote src/categories/upstash/tools.ts (${tools.length} tools)`);

// Extract handlers
const handlersText = lines.slice(1200).join('\n');  // Handlers start around line 1200
const handlerMatches = [...handlersText.matchAll(/private\s+async\s+(handle\w+)\s*\([^)]*\)[^{]*\{([\s\S]*?)^\s{2}\}/gm)];

console.log(`Found ${handlerMatches.length} handler matches`);

const handlers = [];
for (const match of handlerMatches) {
  const [, methodName, body] = match;
  const funcName = 'upstash' + methodName.slice(6); // Remove 'handle' prefix
  
  // Transform body
  let cleanBody = body
    .replace(/this\.client\./g, 'redisClient.')
    .replace(/this\.client/g, 'redisClient')
    .replace(/this\.currentDb/g, 'getCurrentDb()');
  
  handlers.push(`export async function ${funcName}(args: any) {
  const redisClient = await getRedisClient();${cleanBody}
}`);
}

const handlersTs = `/**
 * Upstash (Redis) Handler Methods
 * Extracted from temp-redis-mcp.ts
 * Total: ${handlers.length} handlers
 */

import { createClient, RedisClientType } from 'redis';

// Redis client setup
function createRedisClient(url: string): RedisClientType {
  return createClient({ url });
}

// Get Redis URL from environment
function getRedisUrl(): string {
  const url = process.env.REDIS_URL || process.env.UPSTASH_REDIS_URL || '';
  if (!url) {
    throw new Error('REDIS_URL or UPSTASH_REDIS_URL environment variable is not set');
  }
  return url;
}

// Create client instance (singleton)
let clientInstance: RedisClientType | null = null;
let isConnected = false;

async function getRedisClient(): Promise<RedisClientType> {
  if (!clientInstance) {
    clientInstance = createRedisClient(getRedisUrl());
  }
  if (!isConnected) {
    await clientInstance.connect();
    isConnected = true;
  }
  return clientInstance;
}

// Current database context
let currentDb: 'provider' | 'tenant' = 'provider';

function getCurrentDb(): 'provider' | 'tenant' {
  return currentDb;
}

function setCurrentDb(db: 'provider' | 'tenant'): void {
  currentDb = db;
}

${handlers.join('\n\n')}
`;

writeFileSync('src/categories/upstash/handlers.ts', handlersTs);
console.log(`✅ Wrote src/categories/upstash/handlers.ts (${handlers.length} handlers)`);

