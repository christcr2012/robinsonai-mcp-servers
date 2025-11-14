#!/usr/bin/env python3
"""
Fix OpenAI handlers - replace all `openai.` with `getOpenAIClient().`
but NOT in the declaration line or the helper function
"""

import re

file_path = 'packages/robinsons-toolkit-mcp/src/categories/openai/handlers.ts'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

output_lines = []
for i, line in enumerate(lines):
    # Skip the declaration line and helper function
    if 'const openai = API_KEY' in line or 'function getOpenAIClient' in line or 'if (!openai)' in line or 'return openai;' in line:
        output_lines.append(line)
        continue
    
    # Replace openai. with getOpenAIClient().
    # But be careful with await openai. - need to keep await
    if 'openai.' in line:
        # Replace patterns like "await openai." with "await getOpenAIClient()."
        line = re.sub(r'await\s+openai\.', 'await getOpenAIClient().', line)
        # Replace patterns like "const x = openai." with "const x = getOpenAIClient()."
        line = re.sub(r'=\s*openai\.', '= getOpenAIClient().', line)
        # Replace standalone "openai." with "getOpenAIClient()."
        line = re.sub(r'(?<!await\s)(?<!=\s)openai\.', 'getOpenAIClient().', line)
    
    output_lines.append(line)

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(output_lines)

print("✅ Fixed all OpenAI handlers")

