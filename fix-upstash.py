#!/usr/bin/env python3
"""
Fix Upstash handlers - replace all `redisClient` with `await getRedisClient()`
"""

file_path = 'packages/robinsons-toolkit-mcp/src/categories/upstash/handlers.ts'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Simple replacement: redisClient -> await getRedisClient()
# This works because all usages are already awaited
content = content.replace('await redisClient.', 'const client = await getRedisClient();\n    await client.')
content = content.replace('for await (const key of redisClient.', 'const client = await getRedisClient();\n    for await (const key of client.')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Fixed all Upstash handlers")

