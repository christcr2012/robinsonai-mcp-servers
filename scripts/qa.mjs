#!/usr/bin/env node
/**
 * QA Script - Enforces Definition of Done
 * 
 * Checks:
 * 1. No placeholders/stubs/TODOs in source code
 * 2. No empty files
 * 3. TypeScript compiles with 0 errors
 * 
 * Usage: npm run qa
 * Exit codes:
 *   0 = All checks passed
 *   1 = TypeScript errors
 *   2 = Placeholders/empty files found
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { spawnSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repo = path.resolve(__dirname, '..');

// Directories to ignore
const ignoreDirs = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  '.turbo',
  '.next',
  'coverage',
  '.nyc_output',
  'out',
  '.cache',
  '.husky',
  '.backups',
  '.augment',
  '.vscode',
  '.idea',
]);

// File extensions to check
const textExt = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.json',
  '.md',
  '.yml',
  '.yaml',
  '.sql',
  '.py',
  '.sh',
  '.ps1',
  '.toml',
]);

// Patterns that indicate placeholders/stubs
const badPatterns = [
  /PLACEHOLDER/i,
  /\bSTUB\b/i,
  /\bMOCKED?\b/i,
  /\bTBD\b/i,
  /TO\s*DO/i,
  /FIXME/i,
  /FAKE[_\s]CODE/i,
  /implement\s+this\s+later/i,
  /not\s+implemented/i,
  /throw\s+new\s+Error\s*\(\s*['"]Not\s+implemented/i,
];

let badFiles = [];
let totalFilesChecked = 0;

/**
 * Walk directory tree and check files
 */
function walk(dir) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (err) {
    // Skip directories we can't read
    return;
  }

  for (const entry of entries) {
    if (ignoreDirs.has(entry.name)) continue;

    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      walk(fullPath);
    } else {
      const ext = path.extname(entry.name);
      if (!textExt.has(ext)) continue;

      totalFilesChecked++;

      let content;
      try {
        content = fs.readFileSync(fullPath, 'utf8');
      } catch (err) {
        // Skip files we can't read
        continue;
      }

      // Check for empty files
      if (content.trim().length === 0) {
        badFiles.push({
          file: path.relative(repo, fullPath),
          reason: 'EMPTY FILE',
          line: 0,
        });
        continue;
      }

      // Check for bad patterns
      const lines = content.split(/\r?\n/);
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        for (const pattern of badPatterns) {
          if (pattern.test(line)) {
            badFiles.push({
              file: path.relative(repo, fullPath),
              reason: pattern.source,
              line: i + 1,
              content: line.trim(),
            });
            break; // Only report first match per line
          }
        }
      }
    }
  }
}

console.log('🔍 Running QA checks...\n');

// Step 1: Check for placeholders and empty files
console.log('📋 Step 1: Checking for placeholders and empty files...');
walk(repo);

if (badFiles.length > 0) {
  console.error(`\n❌ Found ${badFiles.length} issue(s) in ${totalFilesChecked} files:\n`);
  
  // Group by file
  const byFile = {};
  for (const issue of badFiles) {
    if (!byFile[issue.file]) {
      byFile[issue.file] = [];
    }
    byFile[issue.file].push(issue);
  }

  // Print grouped results
  for (const [file, issues] of Object.entries(byFile)) {
    console.error(`\n  ${file}:`);
    for (const issue of issues) {
      if (issue.reason === 'EMPTY FILE') {
        console.error(`    Line ${issue.line}: ${issue.reason}`);
      } else {
        console.error(`    Line ${issue.line}: ${issue.reason}`);
        console.error(`      ${issue.content}`);
      }
    }
  }

  console.error('\n💡 Fix these issues and run `npm run qa` again.\n');
  process.exit(2);
}

console.log(`✅ No placeholders or empty files found (checked ${totalFilesChecked} files)\n`);

// Step 2: TypeScript compilation check
console.log('📋 Step 2: Checking TypeScript compilation...');

// Find tsconfig.json files
const tsconfigPaths = [];
function findTsconfigs(dir) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (err) {
    return;
  }

  for (const entry of entries) {
    if (ignoreDirs.has(entry.name)) continue;

    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      findTsconfigs(fullPath);
    } else if (entry.name === 'tsconfig.json') {
      tsconfigPaths.push(fullPath);
    }
  }
}

findTsconfigs(repo);

if (tsconfigPaths.length === 0) {
  console.log('⚠️  No tsconfig.json found, skipping TypeScript check\n');
} else {
  console.log(`Found ${tsconfigPaths.length} tsconfig.json file(s)\n`);

  // Run tsc --noEmit for each tsconfig
  let tsErrors = false;
  for (const tsconfigPath of tsconfigPaths) {
    const relPath = path.relative(repo, tsconfigPath);
    console.log(`  Checking ${relPath}...`);

    const result = spawnSync(
      process.platform === 'win32' ? 'npx.cmd' : 'npx',
      ['tsc', '--noEmit', '--project', tsconfigPath],
      {
        cwd: repo,
        encoding: 'utf8',
        stdio: 'pipe',
      }
    );

    if (result.status !== 0) {
      tsErrors = true;
      console.error(`\n❌ TypeScript errors in ${relPath}:\n`);
      console.error(result.stdout || result.stderr);
    } else {
      console.log(`  ✅ ${relPath} OK`);
    }
  }

  if (tsErrors) {
    console.error('\n💡 Fix TypeScript errors and run `npm run qa` again.\n');
    process.exit(1);
  }

  console.log('\n✅ TypeScript compilation successful\n');
}

// All checks passed!
console.log('🎉 All QA checks passed!\n');
console.log('✅ No placeholders or empty files');
console.log('✅ TypeScript compiles successfully');
console.log('\nYou can now commit your changes.\n');

process.exit(0);

