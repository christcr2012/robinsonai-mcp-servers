#!/usr/bin/env python3
"""
Extract Upstash (Redis) handler methods from temp-redis-mcp.ts
"""

import re

# Read the temp file
with open('temp-redis-mcp.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Find all private async handle* methods
methods = []
lines = content.split('\n')
i = 0

while i < len(lines):
    line = lines[i]

    # Look for method start (handle* methods) - match the full signature including return type
    match = re.match(r'\s*private\s+async\s+(handle\w+)\s*\([^)]*\)', line)
    if match:
        method_name = match.group(1)
        method_lines = []

        # Skip the signature line(s) until we find the opening brace
        while i < len(lines) and '{' not in lines[i]:
            i += 1

        if i >= len(lines):
            break

        # Now we're at the line with the opening brace
        method_lines.append(lines[i])
        brace_count = lines[i].count('{') - lines[i].count('}')
        i += 1

        # Collect method body until braces balance
        while i < len(lines) and brace_count > 0:
            line = lines[i]
            method_lines.append(line)
            brace_count += line.count('{') - line.count('}')
            i += 1

        # Extract the method body (everything between first { and last })
        full_method = '\n'.join(method_lines)
        brace_start = full_method.find('{')
        brace_end = full_method.rfind('}')
        if brace_start != -1 and brace_end != -1:
            body = full_method[brace_start+1:brace_end]
            methods.append({
                'name': method_name,
                'body': body
            })
    else:
        i += 1

print(f"Found {len(methods)} methods")

# Generate handlers.ts
handler_functions = []

for method in methods:
    # Convert handleXxx to upstashXxx (e.g., handleGet → upstashGet)
    func_name = 'upstash' + method['name'][6:]  # Remove 'handle' prefix
    
    # Replace this.client with redisClient
    body = method['body'].replace('this.client.', 'redisClient.').replace('this.client', 'redisClient')
    
    # Replace this.currentDb with getCurrentDb()
    body = body.replace('this.currentDb', 'getCurrentDb()')
    
    handler_func = f"""export async function {func_name}(args: any) {{
  const redisClient = getRedisClient();{body}
}}"""
    
    handler_functions.append(handler_func)

# Write handlers.ts
handlers_ts = f"""/**
 * Upstash (Redis) Handler Methods
 * Extracted from temp-redis-mcp.ts
 * Total: {len(methods)} handlers
 */

import {{ createClient, RedisClientType }} from 'redis';

// Redis client setup
function createRedisClient(url: string): RedisClientType {{
  return createClient({{ url }});
}}

// Get Redis URL from environment
function getRedisUrl(): string {{
  const url = process.env.REDIS_URL || process.env.UPSTASH_REDIS_URL || '';
  if (!url) {{
    throw new Error('REDIS_URL or UPSTASH_REDIS_URL environment variable is not set');
  }}
  return url;
}}

// Create client instance (singleton)
let clientInstance: RedisClientType | null = null;
let isConnected = false;

async function getRedisClient(): Promise<RedisClientType> {{
  if (!clientInstance) {{
    clientInstance = createRedisClient(getRedisUrl());
  }}
  if (!isConnected) {{
    await clientInstance.connect();
    isConnected = true;
  }}
  return clientInstance;
}}

// Current database context
let currentDb: 'provider' | 'tenant' = 'provider';

function getCurrentDb(): 'provider' | 'tenant' {{
  return currentDb;
}}

function setCurrentDb(db: 'provider' | 'tenant'): void {{
  currentDb = db;
}}

{chr(10).join(handler_functions)}
"""

with open('src/categories/upstash/handlers.ts', 'w', encoding='utf-8') as f:
    f.write(handlers_ts)

print(f"✅ Wrote src/categories/upstash/handlers.ts ({len(methods)} handlers)")

