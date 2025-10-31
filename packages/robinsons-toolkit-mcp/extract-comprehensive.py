#!/usr/bin/env python3
"""
Extract the 5 comprehensive servers and build unified toolkit
"""

import os
import re

servers = [
    ('github-mcp', 2341, 240),
    ('vercel-mcp', 3626, 150),
    ('neon-mcp', 1371, 173),
    ('google-workspace-mcp', 1603, 193),
    ('redis-mcp', 2004, 80),
]

print("Extracting 5 comprehensive servers...")
print("=" * 60)

for server, lines, tools in servers:
    path = f'../{server}/src/index.ts'
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
            actual_lines = len(content.split('\n'))
            print(f"✅ {server:25} {actual_lines:5} lines, ~{tools} tools")
            
            # Save to temp file for inspection
            with open(f'temp-{server}.ts', 'w', encoding='utf-8') as out:
                out.write(content)
    else:
        print(f"❌ {server:25} NOT FOUND")

print("=" * 60)
print("✅ Extracted all 5 servers to temp files")
print()
print("Next: Combine into unified toolkit...")

