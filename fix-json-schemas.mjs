#!/usr/bin/env node
/**
 * Fix JSON Schema validation issues for GPT-5 compatibility
 * 
 * GPT-5 REJECTS empty properties: {}. This script removes empty properties
 * from inputSchema definitions to comply with GPT-5's strict validation.
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const files = [
  'packages/robinsons-toolkit-mcp/src/index.ts',
  'packages/thinking-tools-mcp/src/index.ts',
  'packages/thinking-tools-mcp/src/tools/docs_duplicates.ts',
  'packages/thinking-tools-mcp/src/tools/validate_artifacts.ts',
  'packages/thinking-tools-mcp/src/tools/health_check.ts',
  'packages/paid-agent-mcp/src/index.ts',
  'packages/free-agent-mcp/src/index.ts',
  'packages/credit-optimizer-mcp/src/index.ts',
  'packages/credit-optimizer-mcp/src/tools/ollama_health.ts',
  'packages/credit-optimizer-mcp/src/tools/optimizer_health.ts',
];

function fixInputSchemas(content) {
  // Pattern 1: Remove empty properties from single-line schemas with single quotes
  // inputSchema: { type: 'object', properties: {} } -> inputSchema: { type: 'object' }
  content = content.replace(
    /inputSchema:\s*\{\s*type:\s*'object'\s*,\s*properties:\s*\{\s*\}\s*\}/g,
    "inputSchema: { type: 'object' }"
  );
  
  // Pattern 2: Remove empty properties from single-line schemas with double quotes
  // inputSchema: { type: "object", properties: {} } -> inputSchema: { type: "object" }
  content = content.replace(
    /inputSchema:\s*\{\s*type:\s*"object"\s*,\s*properties:\s*\{\s*\}\s*\}/g,
    'inputSchema: { type: "object" }'
  );
  
  // Pattern 3: Multi-line format - remove empty properties line
  content = content.replace(
    /inputSchema:\s*\{\s*\n\s*type:\s*['"]object['"]\s*,\s*\n\s*properties:\s*\{\s*\}\s*,?\s*\n/g,
    (match) => {
      const typeMatch = match.match(/type:\s*(['"])object\1/);
      const quote = typeMatch ? typeMatch[1] : "'";
      return `inputSchema: {\n      type: ${quote}object${quote}\n`;
    }
  );
  
  // Pattern 4: Remove trailing comma after type when properties is removed
  content = content.replace(
    /inputSchema:\s*\{\s*\n\s*type:\s*['"]object['"]\s*,\s*\n\s*\}/g,
    (match) => {
      const typeMatch = match.match(/type:\s*(['"])object\1/);
      const quote = typeMatch ? typeMatch[1] : "'";
      return `inputSchema: {\n      type: ${quote}object${quote}\n    }`;
    }
  );
  
  return content;
}

let totalFixed = 0;

console.log('🔧 Fixing JSON Schema issues for GPT-5 compatibility...\n');

for (const file of files) {
  try {
    const filePath = join(__dirname, file);
    
    let content = readFileSync(filePath, 'utf-8');
    const originalContent = content;
    
    content = fixInputSchemas(content);
    
    if (content !== originalContent) {
      writeFileSync(filePath, content, 'utf-8');
      // Count how many "properties: {}" were removed
      const beforeCount = (originalContent.match(/properties:\s*\{\s*\}/g) || []).length;
      const afterCount = (content.match(/properties:\s*\{\s*\}/g) || []).length;
      const fixes = beforeCount - afterCount;
      totalFixed += fixes;
      console.log(`✅ ${file}`);
      console.log(`   Removed ${fixes} empty properties: {} field(s)`);
    } else {
      console.log(`✓  ${file} (no changes needed)`);
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log(`⚠️  ${file} (file not found, skipping)`);
    } else {
      console.error(`❌ Error processing ${file}:`, error.message);
    }
  }
}

console.log(`\n🎉 Total empty properties removed: ${totalFixed}`);
console.log(`\n📚 What was fixed:`);
console.log(`   - Removed "properties: {}" from inputSchema objects`);
console.log(`   - GPT-5 requires that properties either have at least one field OR be omitted`);
console.log(`   - Changed: inputSchema: { type: 'object', properties: {} }`);
console.log(`   - To:      inputSchema: { type: 'object' }`);
console.log(`\n💡 Next steps:`);
console.log(`   1. Build the affected packages: npm run build`);
console.log(`   2. Restart Augment VS Code extension`);
console.log(`   3. Try using GPT-5 model again`);
console.log(`\n   The error should now be resolved! ✨`);
