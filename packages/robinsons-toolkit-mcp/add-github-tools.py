#!/usr/bin/env python3
"""
Extract all GitHub tools from github-mcp and add them to unified toolkit
"""

import re
import json

# Read github-mcp source
with open('../github-mcp/src/index.ts', 'r') as f:
    github_src = f.read()

# Extract tool definitions (the array in ListToolsRequestSchema handler)
# Find the tools array
tools_match = re.search(r'tools: \[(.*?)\]', github_src, re.DOTALL)
if tools_match:
    tools_str = tools_match.group(1)
    # Count tools
    tool_count = tools_str.count('{ name:')
    print(f"Found {tool_count} GitHub tools")
    
    # Save to file for inspection
    with open('github-tools-extracted.txt', 'w') as f:
        f.write(tools_str)
    print("✅ Extracted GitHub tools to github-tools-extracted.txt")
else:
    print("❌ Could not find tools array")

