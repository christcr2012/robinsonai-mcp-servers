#!/usr/bin/env node
/**
 * Fix malformed inputSchema formatting
 * 
 * PROBLEM: Our Step 1 script created malformed schemas like:
 *   inputSchema: {
 *     type: 'object'
 *       , additionalProperties: false },
 * 
 * SHOULD BE:
 *   inputSchema: {
 *     type: 'object',
 *     additionalProperties: false
 *   },
 */

import fs from 'fs';
import path from 'path';

const filePath = process.argv[2];
const dryRun = process.argv.includes('--dry-run');

if (!filePath) {
  console.error('Usage: node fix-malformed-schemas.mjs <file-path> [--dry-run]');
  process.exit(1);
}

console.log(`\n${'='.repeat(60)}`);
console.log(`Fixing malformed schemas in: ${filePath}`);
console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`);
console.log(`${'='.repeat(60)}\n`);

let content = fs.readFileSync(filePath, 'utf-8');
const originalContent = content;

// Pattern to match malformed schemas
// Matches:
//   type: 'object'
//     , additionalProperties: false },
const malformedPattern = /(\s+type:\s*'object'\s*)\n\s*,\s*additionalProperties:\s*false\s*\}/g;

let matchCount = 0;
content = content.replace(malformedPattern, (match, before) => {
  matchCount++;
  // Extract indentation from the 'type:' line
  const indent = before.match(/^(\s+)/)?.[1] || '  ';
  return `${before.trim()},\n${indent}additionalProperties: false\n${indent.slice(0, -2)}}`;
});

console.log(`Found ${matchCount} malformed schemas`);

if (matchCount === 0) {
  console.log('✅ No malformed schemas found - file is clean!');
  process.exit(0);
}

if (dryRun) {
  console.log('\n📋 DRY RUN - Changes that would be made:\n');
  
  // Show diff
  const originalLines = originalContent.split('\n');
  const newLines = content.split('\n');
  
  for (let i = 0; i < Math.max(originalLines.length, newLines.length); i++) {
    if (originalLines[i] !== newLines[i]) {
      console.log(`Line ${i + 1}:`);
      console.log(`  - ${originalLines[i] || '(empty)'}`);
      console.log(`  + ${newLines[i] || '(empty)'}`);
    }
  }
  
  console.log(`\n✅ Would fix ${matchCount} malformed schemas`);
  console.log('Run without --dry-run to apply changes');
} else {
  // Create backup
  const backupPath = `${filePath}.backup-malformed`;
  fs.writeFileSync(backupPath, originalContent);
  console.log(`✅ Backup created: ${backupPath}`);
  
  // Write fixed content
  fs.writeFileSync(filePath, content);
  console.log(`✅ Fixed ${matchCount} malformed schemas`);
  console.log(`✅ File updated: ${filePath}`);
}

console.log('');

