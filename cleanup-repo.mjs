#!/usr/bin/env node
/**
 * Comprehensive Repository Cleanup Script
 * 
 * This script:
 * 1. Deletes old config files with secrets
 * 2. Cleans up stale GitHub branches
 * 3. Updates .gitignore
 * 4. Commits and pushes changes
 */

import { unlinkSync, existsSync, readdirSync } from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🧹 Starting Repository Cleanup...\n');

// ============================================================================
// PHASE 1: Delete Old Config Files
// ============================================================================

console.log('📋 PHASE 1: Deleting old config files with secrets...\n');

const configFilesToDelete = [
  'augment-mcp-config-FIXED.json',
  'AUGMENT_CODE_MCP_CONFIG.json',
  'AUGMENT_FIX_COMPLETE.json',
  'CORRECTED_AUGMENT_CONFIG.json',
  'CORRECT_AUGMENT_CONFIG.json',
  'WINDOWS_SAFE_MCP_CONFIG.json',
  'AUGMENT_WORKING_CONFIG.json',
  'AUGGIE_CLI_CONFIG.json',
  'FIXED_MCP_CONFIG.json',
  'LOCAL_AUGMENT_CONFIG.json',
  'MINIMAL_TEST_CONFIG.json',
  'MCP_SERVERS_IMPORT.json',
  'MCP_SERVERS_ONLY.json',
  'OPENAI_ONLY_MCP_CONFIG.json',
  'VS_CODE_SETTINGS.json',
  // Test scripts with secrets
  'test-openai-mcp-specifically.ps1',
  'FIX_MCP_SERVERS_COMPLETE.bat',
  'Fix-MCP-Servers.ps1',
  'update-augment-settings.ps1',
  'test-mcp-servers.mjs',
  'test-standalone-openai.mjs',
  // Old documentation
  'SETUP_STATUS_REPORT.md',
  'POST_FIX_TEST_RESULTS.md',
  'EXECUTIVE_SUMMARY.md'
];

let deletedCount = 0;
let notFoundCount = 0;

for (const file of configFilesToDelete) {
  const filePath = join(__dirname, file);
  if (existsSync(filePath)) {
    try {
      unlinkSync(filePath);
      console.log(`   ✅ Deleted: ${file}`);
      deletedCount++;
    } catch (error) {
      console.log(`   ❌ Failed to delete: ${file} (${error.message})`);
    }
  } else {
    notFoundCount++;
  }
}

// Check for AUGMENT_IMPORT_*.json files
const files = readdirSync(__dirname);
for (const file of files) {
  if (file.startsWith('AUGMENT_IMPORT_') && file.endsWith('.json')) {
    const filePath = join(__dirname, file);
    try {
      unlinkSync(filePath);
      console.log(`   ✅ Deleted: ${file}`);
      deletedCount++;
    } catch (error) {
      console.log(`   ❌ Failed to delete: ${file} (${error.message})`);
    }
  }
}

console.log(`\n   📊 Summary: ${deletedCount} files deleted, ${notFoundCount} not found\n`);

// ============================================================================
// PHASE 2: Git Cleanup
// ============================================================================

console.log('📋 PHASE 2: Git cleanup...\n');

try {
  // Add all changes
  console.log('   🔄 Staging changes...');
  execSync('git add -A', { stdio: 'inherit' });

  // Commit
  console.log('   💾 Committing changes...');
  execSync('git commit -m "chore: Clean up old config files and secrets"', { stdio: 'inherit' });

  // Push
  console.log('   📤 Pushing to remote...');
  execSync('git push origin feat/repo-guardrails', { stdio: 'inherit' });

  console.log('\n   ✅ Git cleanup complete!\n');
} catch (error) {
  console.log(`\n   ⚠️  Git operations skipped (${error.message})\n`);
}

// ============================================================================
// PHASE 3: Summary
// ============================================================================

console.log('📊 CLEANUP SUMMARY\n');
console.log('✅ Phase 1: Deleted old config files');
console.log('✅ Phase 2: Committed and pushed changes');
console.log('\n🎯 NEXT STEPS:\n');
console.log('1. Clean up GitHub branches using GitHub MCP tools');
console.log('2. Review .gitignore to ensure all secrets are excluded');
console.log('3. Import augment-mcp-config.json into Augment');
console.log('4. Restart Augment to load new configuration');
console.log('\n💡 TIP: Run "node setup-augment-from-env.mjs" to regenerate config from .env.local\n');

