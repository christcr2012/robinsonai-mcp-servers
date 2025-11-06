#!/usr/bin/env node
/**
 * GPT-5 Schema Fix - Step 2: Add additionalProperties to nested objects
 * 
 * SAFE, INCREMENTAL FIX:
 * - Adds `additionalProperties: false` to nested object definitions
 * - Handles objects like designCard, caps, signals, etc.
 * - Does NOT change optional property types (that's step 3)
 * - Creates backup before modifying
 * - Validates syntax after changes
 * - Reports all changes made
 * 
 * Usage:
 *   node fix-gpt5-schemas-step2.mjs <file-path> [--dry-run]
 * 
 * Example:
 *   node fix-gpt5-schemas-step2.mjs packages/free-agent-mcp/src/index.ts --dry-run
 *   node fix-gpt5-schemas-step2.mjs packages/free-agent-mcp/src/index.ts
 */

import { readFileSync, writeFileSync, copyFileSync } from 'fs';

const args = process.argv.slice(2);
const filePath = args[0];
const dryRun = args.includes('--dry-run');

if (!filePath) {
  console.error('❌ Error: File path required');
  console.error('Usage: node fix-gpt5-schemas-step2.mjs <file-path> [--dry-run]');
  process.exit(1);
}

console.log('🔧 GPT-5 Schema Fix - Step 2: Add additionalProperties to nested objects\n');
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

// Find nested objects within inputSchema that need additionalProperties
// Pattern: property: { type: 'object', properties: {
// But NOT if it already has additionalProperties
// And NOT the top-level inputSchema (that's step 1)

let matches = 0;
const lines = content.split('\n');
const newLines = [];
let inInputSchema = false;
let braceDepth = 0;
let inputSchemaStartDepth = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const trimmed = line.trim();
  
  // Track when we enter an inputSchema
  if (trimmed.includes('inputSchema:')) {
    inInputSchema = true;
    inputSchemaStartDepth = braceDepth;
  }
  
  // Track brace depth
  const openBraces = (line.match(/\{/g) || []).length;
  const closeBraces = (line.match(/\}/g) || []).length;
  braceDepth += openBraces - closeBraces;
  
  // Exit inputSchema when we return to original depth
  if (inInputSchema && braceDepth <= inputSchemaStartDepth && trimmed.includes('}')) {
    inInputSchema = false;
  }
  
  // Look for nested object definitions within inputSchema
  // Pattern: someProperty: { type: 'object', properties: {
  if (inInputSchema && 
      trimmed.match(/^\w+:\s*\{\s*$/) && 
      i + 1 < lines.length) {
    
    const nextLine = lines[i + 1].trim();
    
    // Check if next line is type: 'object' and line after has properties
    if (nextLine.includes("type: 'object'") || nextLine.includes('type: "object"')) {
      // Look ahead to see if this object has properties
      let hasProperties = false;
      let hasAdditionalProperties = false;
      
      for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
        const lookAhead = lines[j].trim();
        if (lookAhead.includes('properties:')) {
          hasProperties = true;
        }
        if (lookAhead.includes('additionalProperties')) {
          hasAdditionalProperties = true;
          break;
        }
        if (lookAhead.includes('},')) {
          break;
        }
      }
      
      // If it has properties but no additionalProperties, we need to add it
      if (hasProperties && !hasAdditionalProperties) {
        newLines.push(line);
        
        // Add the type: 'object' line
        i++;
        const typeObjectLine = lines[i];
        
        // Add additionalProperties after type: 'object',
        if (typeObjectLine.includes(',')) {
          newLines.push(typeObjectLine);
          matches++;
          console.log(`✅ Match ${matches}: Adding additionalProperties to nested object at line ${i + 1}`);
          
          // Insert additionalProperties line with proper indentation
          const indent = typeObjectLine.match(/^\s*/)[0];
          newLines.push(`${indent}additionalProperties: false,`);
        } else {
          // No comma after type: 'object', add it
          newLines.push(typeObjectLine.replace("'object'", "'object',"));
          matches++;
          console.log(`✅ Match ${matches}: Adding additionalProperties to nested object at line ${i + 1}`);
          
          const indent = typeObjectLine.match(/^\s*/)[0];
          newLines.push(`${indent}additionalProperties: false,`);
        }
        continue;
      }
    }
  }
  
  newLines.push(line);
}

const newContent = newLines.join('\n');

console.log(`\n📊 Summary:`);
console.log(`   Total nested objects found: ${matches}`);
console.log(`   Changes made: ${content !== newContent ? matches : 0}`);

if (content === newContent) {
  console.log('\n✅ No changes needed - all nested objects already have additionalProperties');
  process.exit(0);
}

if (dryRun) {
  console.log('\n🔍 DRY RUN - No files modified');
  console.log('\nPreview of changes:');
  
  // Show first few changes
  const originalLines = content.split('\n');
  let changesShown = 0;
  
  for (let i = 0; i < newLines.length && changesShown < 3; i++) {
    if (newLines[i] !== originalLines[i]) {
      console.log(`\nLine ${i + 1}:`);
      if (originalLines[i]) {
        console.log(`  - ${originalLines[i]}`);
      }
      console.log(`  + ${newLines[i]}`);
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
const backupPath = `${filePath}.backup-step2`;
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

// Basic syntax validation
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
console.log(`\n🎉 Step 2 complete! ${matches} nested objects updated.`);
console.log(`\n📝 Next steps:`);
console.log(`   1. Test the file: npm run build (in the package directory)`);
console.log(`   2. If successful, commit: git add ${filePath} && git commit -m "fix: Add additionalProperties to nested objects (GPT-5 compat step 2)"`);
console.log(`   3. Run step 3 to fix optional property types`);

