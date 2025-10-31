#!/usr/bin/env node
/**
 * Acceptance Test Runner
 * 
 * Runs acceptance checks defined in task spec files.
 * 
 * Usage: npm run accept .robinson/specs/<task-id>.md
 * 
 * Spec file format:
 * ```markdown
 * # Task Spec
 * - id: task-123
 * - scope: What this task does
 * - acceptance:
 *   - check1: node -e "console.log('test')"
 *   - check2: npm test
 * ```
 * 
 * Exit codes:
 *   0 = All checks passed
 *   1 = One or more checks failed
 */

import fs from 'fs';
import { spawnSync } from 'child_process';

const specPath = process.argv[2] || '.robinson/specs/current.md';

if (!fs.existsSync(specPath)) {
  console.error(`❌ Spec file not found: ${specPath}`);
  console.error('\nUsage: npm run accept <spec-file>');
  console.error('Example: npm run accept .robinson/specs/task-123.md\n');
  process.exit(1);
}

console.log(`🧪 Running acceptance checks from: ${specPath}\n`);

// Read and parse spec file
const spec = fs.readFileSync(specPath, 'utf8');
const lines = spec.split(/\r?\n/);

// Extract acceptance checks
const checks = [];
let inAcceptance = false;

for (const line of lines) {
  // Look for "- acceptance:" line
  if (/^\s*-\s*acceptance\s*:/i.test(line)) {
    inAcceptance = true;
    continue;
  }

  // Look for check lines (indented under acceptance)
  if (inAcceptance && /^\s+-\s*check\d+\s*:/i.test(line)) {
    const cmd = line.split(':').slice(1).join(':').trim();
    if (cmd) {
      checks.push(cmd);
    }
  }

  // Stop when we hit a non-indented line
  if (inAcceptance && /^[^\s-]/.test(line)) {
    inAcceptance = false;
  }
}

if (checks.length === 0) {
  console.error('❌ No acceptance checks found in spec file');
  console.error('\nExpected format:');
  console.error('- acceptance:');
  console.error('  - check1: <command>');
  console.error('  - check2: <command>\n');
  process.exit(1);
}

console.log(`Found ${checks.length} acceptance check(s)\n`);

// Run each check
let allPassed = true;
let passedCount = 0;
let failedCount = 0;

for (let i = 0; i < checks.length; i++) {
  const cmd = checks[i];
  console.log(`\n📋 Check ${i + 1}/${checks.length}: ${cmd}`);
  console.log('─'.repeat(60));

  // Parse command (handle quoted arguments)
  const args = [];
  let current = '';
  let inQuote = false;
  
  for (let j = 0; j < cmd.length; j++) {
    const char = cmd[j];
    
    if (char === '"' || char === "'") {
      inQuote = !inQuote;
    } else if (char === ' ' && !inQuote) {
      if (current) {
        args.push(current);
        current = '';
      }
    } else {
      current += char;
    }
  }
  
  if (current) {
    args.push(current);
  }

  if (args.length === 0) {
    console.error('❌ Empty command');
    allPassed = false;
    failedCount++;
    continue;
  }

  const exe = args[0];
  const cmdArgs = args.slice(1);

  // Add .cmd extension for Windows if needed
  const bin = process.platform === 'win32' && 
              !exe.endsWith('.cmd') && 
              !exe.endsWith('.exe') && 
              !exe.includes('/') && 
              !exe.includes('\\')
    ? exe + '.cmd'
    : exe;

  // Run the command
  const result = spawnSync(bin, cmdArgs, {
    stdio: 'inherit',
    shell: false,
    encoding: 'utf8',
  });

  if (result.status === 0) {
    console.log(`✅ Check ${i + 1} passed`);
    passedCount++;
  } else {
    console.error(`❌ Check ${i + 1} failed (exit code: ${result.status})`);
    allPassed = false;
    failedCount++;
  }
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('📊 Acceptance Test Summary');
console.log('='.repeat(60));
console.log(`Total checks: ${checks.length}`);
console.log(`✅ Passed: ${passedCount}`);
console.log(`❌ Failed: ${failedCount}`);

if (allPassed) {
  console.log('\n🎉 All acceptance checks passed!\n');
  process.exit(0);
} else {
  console.log('\n💡 Fix failing checks and run again.\n');
  process.exit(1);
}

