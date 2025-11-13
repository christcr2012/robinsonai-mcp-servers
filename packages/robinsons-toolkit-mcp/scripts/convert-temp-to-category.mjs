#!/usr/bin/env node
/**
 * Convert temp-*.ts files to category structure
 * Extracts tools and handlers from standalone MCP server files
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

function extractTools(content, prefix) {
  const tools = [];
  const toolRegex = new RegExp(`\\{ name: '${prefix}_([^']+)',\\s*description: '([^']+)',\\s*inputSchema: (\\{[^}]+(?:\\{[^}]*\\})*[^}]*\\})`, 'g');
  
  let match;
  while ((match = toolRegex.exec(content)) !== null) {
    const [, toolName, description, schemaStr] = match;
    try {
      // Extract the full tool definition
      const fullToolMatch = content.substring(match.index).match(/\{ name:.*?\},/s);
      if (fullToolMatch) {
        tools.push({
          name: `${prefix}_${toolName}`,
          raw: fullToolMatch[0].slice(0, -1) // Remove trailing comma
        });
      }
    } catch (e) {
      console.warn(`Failed to parse tool ${prefix}_${toolName}:`, e.message);
    }
  }
  
  return tools;
}

function extractHandlers(content, prefix) {
  const handlers = [];
  
  // Find the CallToolRequestSchema handler
  const handlerMatch = content.match(/setRequestHandler\(CallToolRequestSchema,\s*async\s*\(request\)\s*=>\s*\{([\s\S]*?)\n\s*\}\);/);
  
  if (!handlerMatch) {
    console.warn(`No handler found for ${prefix}`);
    return handlers;
  }
  
  const handlerBody = handlerMatch[1];
  
  // Extract case statements
  const caseRegex = new RegExp(`case '${prefix}_([^']+)':[\\s\\S]*?(?=case '${prefix}_|default:|\\}\\s*\\})`, 'g');
  
  let match;
  while ((match = caseRegex.exec(handlerBody)) !== null) {
    const toolName = match[1];
    const caseBody = match[0];
    
    handlers.push({
      name: `${prefix}_${toolName}`,
      body: caseBody
    });
  }
  
  return handlers;
}

function generateToolsFile(tools, categoryName, exportName) {
  const toolsArray = tools.map(t => `  ${t.raw}`).join(',\n');
  
  return `/**
 * ${categoryName} Tool Definitions
 * Generated from temp-${categoryName.toLowerCase()}-mcp.ts
 * Total: ${tools.length} tools
 */

export const ${exportName} = [
${toolsArray}
];
`;
}

function generateHandlersFile(handlers, categoryName, prefix) {
  const handlerFunctions = handlers.map(h => {
    // Convert case statement to function
    const functionName = h.name.replace(`${prefix}_`, '');
    const camelCase = functionName.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    
    // Extract the logic from the case statement
    const logic = h.body
      .replace(/case '[^']+':/, '')
      .replace(/break;?\s*$/, '')
      .trim();
    
    return `export async function ${prefix}${camelCase.charAt(0).toUpperCase() + camelCase.slice(1)}(this: any, args: any) {
  ${logic}
}`;
  }).join('\n\n');
  
  return `/**
 * ${categoryName} Handler Methods
 * Generated from temp-${categoryName.toLowerCase()}-mcp.ts
 * Total: ${handlers.length} handlers
 */

${handlerFunctions}
`;
}

// Main conversion function
function convertTempFile(tempFile, categoryName, prefix, exportName) {
  console.log(`\n📦 Converting ${tempFile}...`);
  
  const content = readFileSync(join(ROOT, tempFile), 'utf-8');
  
  // Extract tools and handlers
  const tools = extractTools(content, prefix);
  const handlers = extractHandlers(content, prefix);
  
  console.log(`  ✅ Found ${tools.length} tools`);
  console.log(`  ✅ Found ${handlers.length} handlers`);
  
  // Generate files
  const toolsContent = generateToolsFile(tools, categoryName, exportName);
  const handlersContent = generateHandlersFile(handlers, categoryName, prefix);
  
  // Write files
  const categoryDir = join(ROOT, 'src', 'categories', categoryName.toLowerCase());
  writeFileSync(join(categoryDir, 'tools.ts'), toolsContent);
  writeFileSync(join(categoryDir, 'handlers.ts'), handlersContent);
  
  console.log(`  ✅ Wrote tools.ts (${tools.length} tools)`);
  console.log(`  ✅ Wrote handlers.ts (${handlers.length} handlers)`);
  
  return { tools: tools.length, handlers: handlers.length };
}

// Convert all temp files
const conversions = [
  { file: 'temp-github-mcp.ts', category: 'GitHub', prefix: 'github', exportName: 'GITHUB_TOOLS' },
  { file: 'temp-vercel-mcp.ts', category: 'Vercel', prefix: 'vercel', exportName: 'VERCEL_TOOLS' },
  { file: 'temp-neon-mcp.ts', category: 'Neon', prefix: 'neon', exportName: 'NEON_TOOLS' },
  { file: 'temp-redis-mcp.ts', category: 'Upstash', prefix: 'upstash', exportName: 'UPSTASH_TOOLS' },
  { file: 'temp-google-workspace-mcp.ts', category: 'Google', prefix: 'google', exportName: 'GOOGLE_TOOLS' },
];

console.log('🔄 Converting temp files to category structure...\n');

const results = conversions.map(c => ({
  ...c,
  ...convertTempFile(c.file, c.category, c.prefix, c.exportName)
}));

console.log('\n📊 Conversion Summary:');
results.forEach(r => {
  console.log(`  ${r.category}: ${r.tools} tools, ${r.handlers} handlers`);
});

console.log('\n✨ Conversion complete!');

