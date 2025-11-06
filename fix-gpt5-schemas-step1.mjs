#!/usr/bin/env node
/**
 * GPT-5 Schema Fix - Step 1: Add additionalProperties: false
 * 
 * SAFE, INCREMENTAL FIX:
 * - Only adds `additionalProperties: false` to top-level inputSchema objects
 * - Does NOT modify nested objects (that's step 2)
 * - Does NOT change optional property types (that's step 3)
 * - Creates backup before modifying
 * - Validates syntax after changes
 * - Reports all changes made
 * 
 * Usage:
 *   node fix-gpt5-schemas-step1.mjs <file-path> [--dry-run]
 * 
 * Example:
 *   node fix-gpt5-schemas-step1.mjs packages/free-agent-mcp/src/index.ts --dry-run
 *   node fix-gpt5-schemas-step1.mjs packages/free-agent-mcp/src/index.ts
 */

import { readFileSync, writeFileSync, copyFileSync } from 'fs';
import { join, dirname, basename } from 'path';

const args = process.argv.slice(2);
const filePath = args[0];
const dryRun = args.includes('--dry-run');

if (!filePath) {
  console.error('❌ Error: File path required');
  console.error('Usage: node fix-gpt5-schemas-step1.mjs <file-path> [--dry-run]');
  process.exit(1);
}

console.log('🔧 GPT-5 Schema Fix - Step 1: Add additionalProperties: false\n');
console.log(`📁 File: ${filePath}`);
console.log(`🔍 Mode: ${dryRun ? 'DRY RUN (no changes)' : 'LIVE (will modify file)'}\n`);

// Read file
let content;
try {
  content = readFileSync(filePath, 'utf8');
} catch (error) {
  console.error(`❌ Error reading file: ${error.message}`);
  process.exit(1);
}

// Find all inputSchema definitions
// Pattern: inputSchema: { type: 'object', properties: {
// We want to add additionalProperties: false after type: 'object',
const pattern = /(inputSchema:\s*\{\s*type:\s*'object',)(\s*properties:)/g;

let matches = 0;
let newContent = content.replace(pattern, (match, before, after) => {
  matches++;
  // Check if additionalProperties already exists
  const nextChars = content.substring(content.indexOf(match) + match.length, content.indexOf(match) + match.length + 100);
  if (nextChars.includes('additionalProperties')) {
    console.log(`⏭️  Match ${matches}: Already has additionalProperties, skipping`);
    return match;
  }
  
  console.log(`✅ Match ${matches}: Adding additionalProperties: false`);
  return `${before} additionalProperties: false,${after}`;
});

// Also handle the pattern without properties (empty schemas)
// Pattern: inputSchema: { type: 'object' }
const emptyPattern = /(inputSchema:\s*\{\s*type:\s*'object'\s*\})/g;
newContent = newContent.replace(emptyPattern, (match) => {
  // Check if this is truly empty (no properties)
  const nextChars = content.substring(content.indexOf(match) + match.length, content.indexOf(match) + match.length + 50);
  if (nextChars.includes('properties') || nextChars.includes('additionalProperties')) {
    return match;
  }
  
  matches++;
  console.log(`✅ Match ${matches}: Adding additionalProperties: false to empty schema`);
  return match.replace('}', ', additionalProperties: false }');
});

console.log(`\n📊 Summary:`);
console.log(`   Total matches found: ${matches}`);
console.log(`   Changes made: ${content !== newContent ? matches : 0}`);

if (content === newContent) {
  console.log('\n✅ No changes needed - all schemas already have additionalProperties');
  process.exit(0);
}

if (dryRun) {
  console.log('\n🔍 DRY RUN - No files modified');
  console.log('\nPreview of changes:');
  
  // Show first few changes
  const lines = newContent.split('\n');
  const originalLines = content.split('\n');
  let changesShown = 0;
  
  for (let i = 0; i < lines.length && changesShown < 3; i++) {
    if (lines[i] !== originalLines[i]) {
      console.log(`\nLine ${i + 1}:`);
      console.log(`  - ${originalLines[i]}`);
      console.log(`  + ${lines[i]}`);
      changesShown++;
    }
  }
  
  if (matches > 3) {
    console.log(`\n... and ${matches - 3} more changes`);
  }
  
  console.log('\n💡 Run without --dry-run to apply changes');
  process.exit(0);
}

// Create backup
const backupPath = `${filePath}.backup-step1`;
try {
  copyFileSync(filePath, backupPath);
  console.log(`\n💾 Backup created: ${backupPath}`);
} catch (error) {
  console.error(`❌ Error creating backup: ${error.message}`);
  process.exit(1);
}

// Write changes
try {
  writeFileSync(filePath, newContent, 'utf8');
  console.log(`✅ File updated: ${filePath}`);
} catch (error) {
  console.error(`❌ Error writing file: ${error.message}`);
  process.exit(1);
}

// Basic syntax validation (check for balanced braces)
const openBraces = (newContent.match(/\{/g) || []).length;
const closeBraces = (newContent.match(/\}/g) || []).length;

if (openBraces !== closeBraces) {
  console.error(`\n⚠️  WARNING: Brace mismatch detected!`);
  console.error(`   Open braces: ${openBraces}`);
  console.error(`   Close braces: ${closeBraces}`);
  console.error(`   Restoring from backup...`);
  
  try {
    copyFileSync(backupPath, filePath);
    console.error(`✅ File restored from backup`);
  } catch (error) {
    console.error(`❌ Error restoring backup: ${error.message}`);
  }
  
  process.exit(1);
}

console.log(`\n✅ Syntax validation passed`);
console.log(`\n🎉 Step 1 complete! ${matches} schemas updated.`);
console.log(`\n📝 Next steps:`);
console.log(`   1. Test the file: npm run build (in the package directory)`);
console.log(`   2. If successful, commit: git add ${filePath} && git commit -m "fix: Add additionalProperties to inputSchemas (GPT-5 compat step 1)"`);
console.log(`   3. Run step 2 to fix nested objects`);
console.log(`   4. Run step 3 to fix optional property types`);

