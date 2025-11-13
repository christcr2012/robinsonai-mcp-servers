#!/usr/bin/env python3
"""
Extract tools and handlers from temp-*.ts files
Converts standalone MCP servers to toolkit category structure
"""

import re
import sys
import json
from pathlib import Path

def extract_tools(content, prefix):
    """Extract tool definitions from ListToolsRequestSchema handler"""
    tools = []
    
    # Find the tools array in ListToolsRequestSchema
    tools_match = re.search(r'ListToolsRequestSchema.*?tools:\s*\[(.*?)\]', content, re.DOTALL)
    if not tools_match:
        print(f"Warning: No tools array found for {prefix}")
        return tools
    
    tools_content = tools_match.group(1)
    
    # Extract individual tool objects
    # Match { name: '...', description: '...', inputSchema: {...} }
    tool_pattern = r'\{\s*name:\s*[\'"]' + prefix + r'_([^\'"]+)[\'"],\s*description:\s*[\'"]([^\'"]+)[\'"],\s*inputSchema:\s*(\{(?:[^{}]|\{[^{}]*\})*\})\s*\}'
    
    for match in re.finditer(tool_pattern, tools_content):
        tool_name = match.group(1)
        description = match.group(2)
        schema = match.group(3)
        
        tools.append({
            'name': f'{prefix}_{tool_name}',
            'description': description,
            'inputSchema': schema
        })
    
    return tools

def extract_handlers(content, prefix):
    """Extract handler methods from class"""
    handlers = []
    
    # Find all private async methods
    method_pattern = r'private\s+async\s+(\w+)\s*\([^)]*\)\s*\{([^}]*(?:\{[^}]*\}[^}]*)*)\}'
    
    for match in re.finditer(method_pattern, content, re.DOTALL):
        method_name = match.group(1)
        method_body = match.group(2)
        
        # Convert camelCase to snake_case for tool name matching
        tool_name = re.sub(r'([a-z0-9])([A-Z])', r'\1_\2', method_name).lower()
        
        handlers.append({
            'method_name': method_name,
            'tool_name': f'{prefix}_{tool_name}',
            'body': method_body.strip()
        })
    
    return handlers

def generate_tools_file(tools, category_name, export_name):
    """Generate tools.ts file"""
    tools_array = []
    
    for tool in tools:
        tools_array.append(f"""  {{
    name: '{tool['name']}',
    description: '{tool['description']}',
    inputSchema: {tool['inputSchema']}
  }}""")
    
    content = f"""/**
 * {category_name} Tool Definitions
 * Extracted from temp-{category_name.lower()}-mcp.ts
 * Total: {len(tools)} tools
 */

export const {export_name} = [
{',\\n'.join(tools_array)}
];
"""
    return content

def generate_handlers_file(handlers, category_name, prefix):
    """Generate handlers.ts file"""
    handler_functions = []
    
    for handler in handlers:
        # Convert method name to exported function name
        func_name = prefix + handler['method_name'][0].upper() + handler['method_name'][1:]
        
        handler_functions.append(f"""export async function {func_name}(this: any, args: any) {{
{handler['body']}
}}""")
    
    content = f"""/**
 * {category_name} Handler Methods
 * Extracted from temp-{category_name.lower()}-mcp.ts
 * Total: {len(handlers)} handlers
 */

{chr(10).join(handler_functions)}
"""
    return content

def convert_file(temp_file, category_name, prefix, export_name):
    """Convert a temp file to category structure"""
    print(f"\\n📦 Converting {temp_file}...")
    
    content = Path(temp_file).read_text()
    
    # Extract tools and handlers
    tools = extract_tools(content, prefix)
    handlers = extract_handlers(content, prefix)
    
    print(f"  ✅ Found {len(tools)} tools")
    print(f"  ✅ Found {len(handlers)} handlers")
    
    # Generate files
    tools_content = generate_tools_file(tools, category_name, export_name)
    handlers_content = generate_handlers_file(handlers, category_name, prefix)
    
    # Write files
    category_dir = Path('src/categories') / category_name.lower()
    category_dir.mkdir(parents=True, exist_ok=True)
    
    (category_dir / 'tools.ts').write_text(tools_content)
    (category_dir / 'handlers.ts').write_text(handlers_content)
    
    print(f"  ✅ Wrote tools.ts ({len(tools)} tools)")
    print(f"  ✅ Wrote handlers.ts ({len(handlers)} handlers)")
    
    return len(tools), len(handlers)

if __name__ == '__main__':
    conversions = [
        ('temp-neon-mcp.ts', 'Neon', 'neon', 'NEON_TOOLS'),
    ]
    
    print('🔄 Converting temp files to category structure...\\n')
    
    for temp_file, category, prefix, export_name in conversions:
        try:
            tools_count, handlers_count = convert_file(temp_file, category, prefix, export_name)
            print(f"  {category}: {tools_count} tools, {handlers_count} handlers")
        except Exception as e:
            print(f"  ❌ Error converting {category}: {e}")
    
    print('\\n✨ Conversion complete!')

