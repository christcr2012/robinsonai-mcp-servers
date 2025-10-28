#!/usr/bin/env python3
"""
Build full unified toolkit with all 957 tools from 13 integrations
"""

import re
import os

# Server paths and prefixes
servers = [
    ('github-mcp', 'github_', 240),
    ('vercel-mcp', 'vercel_', 150),
    ('neon-mcp', 'neon_', 173),
    ('google-workspace-mcp', 'google_', 193),
    ('fly-mcp', 'fly_', 84),
    ('redis-unified-mcp', 'redis_', 64),
    ('playwright-mcp', 'playwright_', 34),
    ('context7-mcp', 'context7_', 10),
    ('stripe-mcp', 'stripe_', 3),
    ('supabase-mcp', 'supabase_', 3),
    ('resend-mcp', 'resend_', 1),
    ('twilio-mcp', 'twilio_', 1),
    ('cloudflare-mcp', 'cloudflare_', 1),
]

print("Building unified toolkit with 957 tools...")
print("=" * 60)

total_tools = 0
for server, prefix, expected in servers:
    path = f'../{server}/src/index.ts'
    if os.path.exists(path):
        with open(path, 'r') as f:
            content = f.read()
            # Count tools
            count = content.count(f'name: "{prefix}') + content.count(f"name: '{prefix}")
            total_tools += count
            status = "✅" if count == expected else "⚠️"
            print(f"{status} {server:25} {count:3} tools (expected {expected})")
    else:
        print(f"❌ {server:25} NOT FOUND")

print("=" * 60)
print(f"Total tools found: {total_tools}")
print()
print("Next: Extract and combine all tool definitions...")

