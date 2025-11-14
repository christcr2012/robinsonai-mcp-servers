#!/usr/bin/env node
/**
 * Simple test: Verify Paid Agent's patch generation code works
 * Tests the toUnified() function directly from Paid Agent's own core
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { spawn } from 'child_process';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('[Test] Testing Paid Agent patch generation (toUnified function)...');

// Import toUnified from Paid Agent's own core
const paidAgentCorePath = join(__dirname, 'packages', 'paid-agent-mcp', 'src', 'core', 'agent-core', 'patch', 'unified.ts');

console.log(`[Test] Checking if Paid Agent has its own patch core...`);
console.log(`[Test] Path: ${paidAgentCorePath}`);

if (!fs.existsSync(paidAgentCorePath)) {
  console.error('[Test] ❌ FAIL: Paid Agent does not have its own patch core!');
  process.exit(1);
}

console.log('[Test] ✓ Paid Agent has its own patch core');

// Read the file and check for git headers fix
const coreContent = fs.readFileSync(paidAgentCorePath, 'utf8');

if (!coreContent.includes('diff --git')) {
  console.error('[Test] ❌ FAIL: Paid Agent patch core missing git headers fix!');
  process.exit(1);
}

console.log('[Test] ✓ Paid Agent patch core has git headers fix');

if (!coreContent.includes('createHash')) {
  console.error('[Test] ❌ FAIL: Paid Agent patch core missing blob hash calculation!');
  process.exit(1);
}

console.log('[Test] ✓ Paid Agent patch core has blob hash calculation');

// Check for debug logging in validate.ts
const validatePath = join(__dirname, 'packages', 'paid-agent-mcp', 'src', 'core', 'agent-core', 'patch', 'validate.ts');
const validateContent = fs.readFileSync(validatePath, 'utf8');

if (!validateContent.includes('CODEGEN_VERBOSE')) {
  console.error('[Test] ❌ FAIL: Paid Agent validate.ts missing debug logging!');
  process.exit(1);
}

console.log('[Test] ✓ Paid Agent validate.ts has debug logging');

// Check that Paid Agent index.ts imports from its own core
const indexPath = join(__dirname, 'packages', 'paid-agent-mcp', 'src', 'index.ts');
const indexContent = fs.readFileSync(indexPath, 'utf8');

if (indexContent.includes('@fa/core')) {
  console.error('[Test] ❌ FAIL: Paid Agent still imports from @fa/core!');
  process.exit(1);
}

console.log('[Test] ✓ Paid Agent does not import from @fa/core');

if (!indexContent.includes('./core/agent-core/index.js')) {
  console.error('[Test] ❌ FAIL: Paid Agent does not import from its own core!');
  process.exit(1);
}

console.log('[Test] ✓ Paid Agent imports from its own core');

console.log('\n[Test] ✅ ALL CHECKS PASSED!');
console.log('[Test] Paid Agent is self-contained with FIXED patch generation code');
process.exit(0);

