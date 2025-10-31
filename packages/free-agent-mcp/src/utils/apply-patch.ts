#!/usr/bin/env node
/*
  apply-patch.ts – CLI for applying Fixer patches
  ------------------------------------------------
  Validates and applies a patch JSON file to the filesystem.

  Usage:
    npx ts-node apply-patch.ts patch.json
    npx ts-node apply-patch.ts patch.json --dry
    npx ts-node apply-patch.ts - < patch.json
    npx ts-node apply-patch.ts - --dry < patch.json

  Requires:
    - convention-score-patch.ts (applyPatch, validateFixerPatch, Patch)
*/

import * as fs from 'fs';
import * as path from 'path';
import { applyPatch, validateFixerPatch, Patch } from './convention-score-patch.js';

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage:
  npx ts-node apply-patch.ts <patch.json> [--dry]
  npx ts-node apply-patch.ts - [--dry] < patch.json

Options:
  --dry    Validate patch without applying (dry run)
  --help   Show this help message

Examples:
  # Apply patch from file
  npx ts-node apply-patch.ts patch.json

  # Dry run (validate only)
  npx ts-node apply-patch.ts patch.json --dry

  # Read from stdin
  cat patch.json | npx ts-node apply-patch.ts -

  # Dry run from stdin
  cat patch.json | npx ts-node apply-patch.ts - --dry
`);
    process.exit(0);
  }

  const isDryRun = args.includes('--dry');
  const patchFile = args.find(a => !a.startsWith('--'));

  if (!patchFile) {
    console.error('Error: No patch file specified');
    process.exit(1);
  }

  // Read patch
  let patchJson: string;
  if (patchFile === '-') {
    // Read from stdin
    patchJson = fs.readFileSync(0, 'utf8');
  } else {
    // Read from file
    if (!fs.existsSync(patchFile)) {
      console.error(`Error: Patch file not found: ${patchFile}`);
      process.exit(1);
    }
    patchJson = fs.readFileSync(patchFile, 'utf8');
  }

  // Parse patch
  let patch: Patch;
  try {
    patch = JSON.parse(patchJson);
  } catch (e) {
    console.error('Error: Invalid JSON in patch file');
    console.error(e);
    process.exit(1);
  }

  // Validate patch
  const validation = validateFixerPatch(patch);
  if (!validation.ok) {
    console.error('Error: Invalid patch format');
    console.error('Errors:');
    for (const err of validation.errors || []) {
      console.error(`  - ${err}`);
    }
    process.exit(1);
  }

  console.log(`✅ Patch validation passed`);
  console.log(`   Operations: ${patch.ops.length}`);
  
  // Show summary
  const summary = {
    add: patch.ops.filter(op => op.kind === 'add').length,
    remove: patch.ops.filter(op => op.kind === 'remove').length,
    edit: patch.ops.filter(op => op.kind === 'edit').length,
    splice: patch.ops.filter(op => op.kind === 'splice').length,
  };
  
  console.log(`   Add: ${summary.add}, Remove: ${summary.remove}, Edit: ${summary.edit}, Splice: ${summary.splice}`);

  if (isDryRun) {
    console.log('\n🔍 Dry run mode - showing operations without applying:\n');
    for (const [i, op] of patch.ops.entries()) {
      console.log(`${i + 1}. ${op.kind.toUpperCase()} ${op.path}`);
      if (op.kind === 'edit') {
        console.log(`   Find: ${op.find.substring(0, 50)}${op.find.length > 50 ? '...' : ''}`);
        console.log(`   Replace: ${op.replace.substring(0, 50)}${op.replace.length > 50 ? '...' : ''}`);
      } else if (op.kind === 'add') {
        console.log(`   Content: ${op.content.length} bytes`);
      } else if (op.kind === 'splice') {
        console.log(`   Start: ${op.start}, Delete: ${op.deleteCount}, Insert: ${op.insert?.length || 0} bytes`);
      }
    }
    console.log('\n✅ Dry run complete - no changes applied');
    process.exit(0);
  }

  // Apply patch
  console.log('\n📝 Applying patch...\n');
  try {
    applyPatch(process.cwd(), patch);
    console.log('✅ Patch applied successfully');
    process.exit(0);
  } catch (e) {
    console.error('❌ Error applying patch:');
    console.error(e);
    process.exit(1);
  }
}

main();

