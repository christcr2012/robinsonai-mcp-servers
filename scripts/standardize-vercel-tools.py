#!/usr/bin/env python3
"""
Standardize Vercel tools to single-line compact format
Converts from multi-line format to match GitHub/Neon/Upstash style
"""

import re
import json

def convert_to_single_line(tool_text):
    """Convert a multi-line Vercel tool to single-line format"""
    # Extract name
    name_match = re.search(r'name:\s*"([^"]+)"', tool_text)
    if not name_match:
        return None
    name = name_match.group(1)
    
    # Extract description
    desc_match = re.search(r'description:\s*"([^"]+)"', tool_text)
    if not desc_match:
        return None
    description = desc_match.group(1)
    
    # Extract properties (simplified - just get the properties object)
    props_match = re.search(r'properties:\s*\{([^}]+(?:\{[^}]+\}[^}]*)*)\}', tool_text, re.DOTALL)
    if not props_match:
        # No properties
        props_str = "{}"
    else:
        props_content = props_match.group(1)
        # Build properties dict
        props_str = "{ " + props_content.strip().replace('\n', ' ').replace('  ', ' ') + " }"
    
    # Extract required array
    required_match = re.search(r'required:\s*\[([^\]]+)\]', tool_text)
    required_str = ""
    if required_match:
        required_content = required_match.group(1).strip()
        required_str = f", required: [{required_content}]"
    
    # Build single-line format
    single_line = f"{{ name: '{name}', description: '{description}', inputSchema: {{ type: 'object', properties: {props_str}{required_str} }} }}"
    
    # Clean up extra spaces
    single_line = re.sub(r'\s+', ' ', single_line)
    single_line = single_line.replace('{ ', '{').replace(' }', '}').replace(': {', ': { ').replace('},', ' },')
    
    return single_line

# Read file
with open('packages/robinsons-toolkit-mcp/src/index.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Find all Vercel tools (multi-line format starting with { and ending with },)
# Pattern: starts with whitespace + {, has name: "vercel_", ends with },
pattern = r'(\s+)\{\s*name:\s*"(vercel_[^"]+)"[^}]+\},?'

matches = list(re.finditer(pattern, content, re.DOTALL))
print(f"Found {len(matches)} Vercel tools to convert")

# Process in reverse order to maintain positions
replacements = 0
for match in reversed(matches):
    full_match = match.group(0)
    indent = match.group(1)
    
    # Convert to single-line
    single_line = convert_to_single_line(full_match)
    
    if single_line:
        # Add proper indentation
        formatted = f"{indent}{single_line},"
        
        # Replace in content
        start, end = match.span()
        content = content[:start] + formatted + content[end:]
        replacements += 1

print(f"Converted {replacements} tools")

# Write back
with open('packages/robinsons-toolkit-mcp/src/index.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ File updated successfully")

