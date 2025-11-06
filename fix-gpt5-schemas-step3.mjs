#!/usr/bin/env node
/**
 * GPT-5 Schema Fix - Step 3: Fix optional property types
 * 
 * SAFE, INCREMENTAL FIX:
 * - Changes optional properties from `type: 'string'` to `type: ['string', 'null']`
 * - Only affects properties NOT in the required array
 * - Handles all types: string, number, boolean, object, array
 * - Creates backup before modifying
 * - Validates syntax after changes
 * - Reports all changes made
 * 
 * Usage:
 *   node fix-gpt5-schemas-step3.mjs <file-path> [--dry-run]
 * 
 * Example:
 *   node fix-gpt5-schemas-step3.mjs packages/free-agent-mcp/src/index.ts --dry-run
 *   node fix-gpt5-schemas-step3.mjs packages/free-agent-mcp/src/index.ts
 */

import { readFileSync, writeFileSync, copyFileSync } from 'fs';

const args = process.argv.slice(2);
const filePath = args[0];
const dryRun = args.includes('--dry-run');

if (!filePath) {
  console.error('❌ Error: File path required');
  console.error('Usage: node fix-gpt5-schemas-step3.mjs <file-path> [--dry-run]');
  process.exit(1);
}

console.log('🔧 GPT-5 Schema Fix - Step 3: Fix optional property types\n');
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

// Strategy: TWO-PASS approach
// Pass 1: Find all inputSchema blocks and extract their required arrays
// Pass 2: Fix optional properties based on required arrays

const lines = content.split('\n');

// PASS 1: Extract all required arrays
const inputSchemas = [];
let braceDepth = 0;
let inInputSchema = false;
let currentSchemaStart = -1;
let currentSchemaEnd = -1;
let inputSchemaStartDepth = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const trimmed = line.trim();

  // Track brace depth
  const openBraces = (line.match(/\{/g) || []).length;
  const closeBraces = (line.match(/\}/g) || []).length;
  braceDepth += openBraces - closeBraces;

  // Detect inputSchema start
  if (trimmed.includes('inputSchema:')) {
    inInputSchema = true;
    currentSchemaStart = i;
    inputSchemaStartDepth = braceDepth;
  }

  // Detect inputSchema end
  if (inInputSchema && braceDepth <= inputSchemaStartDepth && trimmed.includes('},')) {
    currentSchemaEnd = i;

    // Extract required array from this schema
    let requiredFields = [];
    for (let j = currentSchemaStart; j <= currentSchemaEnd; j++) {
      const schemaLine = lines[j].trim();
      if (schemaLine.includes('required:')) {
        // Extract required field names
        let requiredLine = schemaLine;
        let k = j;

        // Handle multi-line required arrays
        while (!requiredLine.includes(']') && k < lines.length - 1) {
          k++;
          requiredLine += ' ' + lines[k].trim();
        }

        // Extract field names
        const match = requiredLine.match(/required:\s*\[(.*?)\]/);
        if (match) {
          requiredFields = match[1]
            .split(',')
            .map(s => s.trim().replace(/['"]/g, ''))
            .filter(s => s.length > 0);
        }
        break;
      }
    }

    inputSchemas.push({
      start: currentSchemaStart,
      end: currentSchemaEnd,
      required: requiredFields
    });

    console.log(`📋 Schema ${inputSchemas.length}: lines ${currentSchemaStart}-${currentSchemaEnd}, required: [${requiredFields.join(', ')}]`);

    inInputSchema = false;
  }
}

console.log(`\n✅ Found ${inputSchemas.length} inputSchema blocks\n`);

// PASS 2: Fix optional properties
let matches = 0;
const newLines = [];
let currentSchemaIndex = -1;
let currentRequired = [];
let currentPropertyName = null;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const trimmed = line.trim();

  // Check if we're in an inputSchema block
  for (let j = 0; j < inputSchemas.length; j++) {
    if (i >= inputSchemas[j].start && i <= inputSchemas[j].end) {
      currentSchemaIndex = j;
      currentRequired = inputSchemas[j].required;
      break;
    } else if (i > inputSchemas[j].end) {
      if (currentSchemaIndex === j) {
        currentSchemaIndex = -1;
        currentRequired = [];
      }
    }
  }

  // Only process if we're in an inputSchema
  if (currentSchemaIndex >= 0) {
    // Match property name: { or property: {
    const propMatch = trimmed.match(/^(\w+):\s*\{/);
    if (propMatch) {
      currentPropertyName = propMatch[1];
    }

    // Match type: 'string' or type: 'number' etc (but not type: ['string', 'null'])
    const typeMatch = trimmed.match(/type:\s*'(\w+)'(?!.*\[)/);

    if (typeMatch && currentPropertyName && !currentRequired.includes(currentPropertyName)) {
      const type = typeMatch[1];

      // This is an optional property with a single type - needs fixing
      matches++;
      console.log(`✅ Match ${matches}: Fixing optional property '${currentPropertyName}' (${type} → [${type}, null]) - NOT in required`);

      // Replace type: 'string' with type: ['string', 'null']
      const fixedLine = line.replace(
        `type: '${type}'`,
        `type: ['${type}', 'null']`
      );

      newLines.push(fixedLine);
      currentPropertyName = null;
      continue;
    }

    // Reset property name if we see a closing brace
    if (trimmed.includes('},')) {
      currentPropertyName = null;
    }
  }

  newLines.push(line);
}

const newContent = newLines.join('\n');

console.log(`\n📊 Summary:`);
console.log(`   Total optional properties found: ${matches}`);
console.log(`   Changes made: ${content !== newContent ? matches : 0}`);

if (content === newContent) {
  console.log('\n✅ No changes needed - all optional properties already properly typed');
  process.exit(0);
}

if (dryRun) {
  console.log('\n🔍 DRY RUN - No files modified');
  console.log('\nPreview of changes:');
  
  // Show first few changes
  const originalLines = content.split('\n');
  let changesShown = 0;
  
  for (let i = 0; i < newLines.length && changesShown < 5; i++) {
    if (newLines[i] !== originalLines[i]) {
      console.log(`\nLine ${i + 1}:`);
      console.log(`  - ${originalLines[i]}`);
      console.log(`  + ${newLines[i]}`);
      changesShown++;
    }
  }
  
  if (matches > 5) {
    console.log(`\n... and ${matches - 5} more changes`);
  }
  
  console.log('\n💡 Run without --dry-run to apply changes');
  process.exit(0);
}

// Create backup
const backupPath = `${filePath}.backup-step3`;
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
const openBrackets = (newContent.match(/\[/g) || []).length;
const closeBrackets = (newContent.match(/\]/g) || []).length;

if (openBraces !== closeBraces || openBrackets !== closeBrackets) {
  console.error(`\n⚠️  WARNING: Syntax mismatch detected!`);
  console.error(`   Open braces: ${openBraces}, Close braces: ${closeBraces}`);
  console.error(`   Open brackets: ${openBrackets}, Close brackets: ${closeBrackets}`);
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
console.log(`\n🎉 Step 3 complete! ${matches} optional properties updated.`);
console.log(`\n📝 Next steps:`);
console.log(`   1. Test the file: npm run build (in the package directory)`);
console.log(`   2. If successful, commit: git add ${filePath} && git commit -m "fix: Fix optional property types (GPT-5 compat step 3)"`);
console.log(`   3. Test with GPT-5 in Augment!`);

