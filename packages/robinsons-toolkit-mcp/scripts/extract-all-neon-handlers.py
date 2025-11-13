#!/usr/bin/env python3
"""
Extract ALL Neon handler methods from temp-neon-mcp.ts
Properly handles multi-line method bodies with nested braces
"""

import re
import json

# Read the temp file
with open('temp-neon-mcp.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Find all private async methods
# Pattern: private async methodName(args: any) { ... }
# We need to handle nested braces properly

methods = []
lines = content.split('\n')
i = 0

while i < len(lines):
    line = lines[i]

    # Look for method start (brace might be on same line or next line)
    match = re.match(r'\s*private\s+async\s+(\w+)\s*\(args:\s*any\)', line)
    if match:
        method_name = match.group(1)
        method_lines = [line]
        i += 1

        # Check if opening brace is on the same line
        if '{' in line:
            brace_count = line.count('{') - line.count('}')
        else:
            # Opening brace is on next line
            if i < len(lines):
                method_lines.append(lines[i])
                brace_count = lines[i].count('{') - lines[i].count('}')
                i += 1

        # Collect method body until braces balance
        while i < len(lines) and brace_count > 0:
            line = lines[i]
            method_lines.append(line)

            # Count braces (simple approach - doesn't handle strings/comments perfectly)
            brace_count += line.count('{') - line.count('}')
            i += 1

        # Extract the method body (everything between first { and last })
        full_method = '\n'.join(method_lines)

        # Find the opening brace and extract everything after it until the last closing brace
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
    # Convert camelCase to neonCamelCase
    func_name = 'neon' + method['name'][0].upper() + method['name'][1:]

    # Replace this.client with neonClient
    body = method['body'].replace('this.client.', 'neonClient.').replace('this.client', 'neonClient')

    # Replace this.isEnabled with a check for API key
    body = body.replace('this.isEnabled', '(process.env.NEON_API_KEY || \'\')')

    # Replace this.apiKey with process.env.NEON_API_KEY
    body = body.replace('this.apiKey', 'process.env.NEON_API_KEY')

    handler_func = f"""export async function {func_name}(args: any) {{
  const neonClient = getNeonClient();{body}
}}"""

    handler_functions.append(handler_func)

# Write handlers.ts
handlers_ts = f"""/**
 * Neon Database Handler Methods
 * Extracted from temp-neon-mcp.ts
 * Total: {len(methods)} handlers
 */

import axios, {{ AxiosInstance }} from 'axios';

// Neon API client setup
function createNeonClient(apiKey: string): AxiosInstance {{
  return axios.create({{
    baseURL: 'https://console.neon.tech/api/v2',
    headers: {{
      'Authorization': `Bearer ${{apiKey}}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }}
  }});
}}

// Get API key from environment
function getNeonApiKey(): string {{
  const apiKey = process.env.NEON_API_KEY || '';
  if (!apiKey) {{
    throw new Error('NEON_API_KEY environment variable is not set');
  }}
  return apiKey;
}}

// Create client instance (singleton)
let clientInstance: AxiosInstance | null = null;

function getNeonClient(): AxiosInstance {{
  if (!clientInstance) {{
    clientInstance = createNeonClient(getNeonApiKey());
  }}
  return clientInstance;
}}

{chr(10).join(handler_functions)}
"""

with open('src/categories/neon/handlers.ts', 'w', encoding='utf-8') as f:
    f.write(handlers_ts)

print(f"✅ Wrote src/categories/neon/handlers.ts ({len(methods)} handlers)")

