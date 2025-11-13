#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';

const content = readFileSync('temp-neon-mcp.ts', 'utf-8');

// Find the tools array in ListToolsRequestSchema handler
const toolsMatch = content.match(/tools:\s*\[([\s\S]*?)\n\s*\]\s*\}\)\);/);
if (!toolsMatch) {
  console.error('Could not find tools array');
  process.exit(1);
}

const toolsContent = toolsMatch[1];

// Extract individual tool objects - split by lines and process
const tools = [];
const lines = toolsContent.split('\n');

for (const line of lines) {
  const trimmed = line.trim();

  // Skip comments and empty lines
  if (!trimmed || trimmed.startsWith('//')) {
    continue;
  }

  // Check if this line contains a complete tool definition
  if (trimmed.startsWith('{ name:')) {
    // Remove trailing comma if present
    const toolDef = trimmed.replace(/,\s*$/, '');
    tools.push(toolDef);
  }
}

console.log(`✅ Found ${tools.length} tools`);

// Generate tools.ts content
const toolsTs = `/**
 * Neon Database Tool Definitions
 * Extracted from temp-neon-mcp.ts
 * Total: ${tools.length} tools
 */

export const NEON_TOOLS = [
${tools.join(',\n')}
];
`;

writeFileSync('src/categories/neon/tools.ts', toolsTs);
console.log(`✅ Wrote src/categories/neon/tools.ts (${tools.length} tools)`);

