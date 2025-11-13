#!/usr/bin/env python3
"""
Extract Upstash (Redis) tool definitions from temp-redis-mcp.ts
"""

import re
import json

# Read the temp file
with open('temp-redis-mcp.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Extract the tools array (lines 64-1104)
lines = content.split('\n')
tools_lines = lines[63:1104]  # 0-indexed, so 63 = line 64

# Extract individual tool definitions
tools = []
i = 0
while i < len(tools_lines):
    line = tools_lines[i]
    
    # Look for tool start
    if re.search(r'^\s*\{\s*$', line) or re.search(r'^\s*\{$', line):
        tool_lines = [line]
        brace_count = line.count('{') - line.count('}')
        i += 1
        
        # Collect tool definition until braces balance
        while i < len(tools_lines) and brace_count > 0:
            line = tools_lines[i]
            tool_lines.append(line)
            brace_count += line.count('{') - line.count('}')
            i += 1
        
        # Parse the tool definition
        tool_text = '\n'.join(tool_lines)
        
        # Extract name
        name_match = re.search(r'name:\s*"([^"]+)"', tool_text)
        if name_match:
            name = name_match.group(1)
            
            # Extract description
            desc_match = re.search(r'description:\s*"([^"]+)"', tool_text)
            description = desc_match.group(1) if desc_match else ''
            
            # Extract inputSchema (everything between inputSchema: { and the closing })
            schema_match = re.search(r'inputSchema:\s*(\{[\s\S]*\})\s*,?\s*$', tool_text, re.MULTILINE)
            if schema_match:
                schema_text = schema_match.group(1)
                # Clean up the schema text
                schema_text = re.sub(r',(\s*[}\]])', r'\1', schema_text)  # Remove trailing commas
                
                tools.append({
                    'name': name,
                    'description': description,
                    'schema': schema_text
                })
    else:
        i += 1

print(f"Found {len(tools)} tools")

# Generate tools.ts with proper formatting
tool_defs = []
for tool in tools:
    # Convert schema to single-line JSON-like format
    schema = tool['schema'].replace('\n', ' ').replace('  ', ' ')
    schema = re.sub(r'\s+', ' ', schema)
    
    tool_def = f"  {{ name: '{tool['name']}', description: '{tool['description']}', inputSchema: {schema} }}"
    tool_defs.append(tool_def)

tools_ts = f"""/**
 * Upstash (Redis) Tool Definitions
 * Extracted from temp-redis-mcp.ts
 * Total: {len(tools)} tools
 */

export const UPSTASH_TOOLS = [
{',\n'.join(tool_defs)}
];
"""

# Create directory if it doesn't exist
import os
os.makedirs('src/categories/upstash', exist_ok=True)

with open('src/categories/upstash/tools.ts', 'w', encoding='utf-8') as f:
    f.write(tools_ts)

print(f"✅ Wrote src/categories/upstash/tools.ts ({len(tools)} tools)")

# Also write a JSON file for reference
with open('src/categories/upstash/tools.json', 'w', encoding='utf-8') as f:
    json.dump(tools, f, indent=2)

print(f"✅ Wrote src/categories/upstash/tools.json (reference)")

