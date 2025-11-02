#!/usr/bin/env node

/**
 * Build and Publish Workspace Root Fixes
 * 
 * This script builds and publishes all MCP packages with comprehensive workspace root detection.
 * 
 * Fixes Applied:
 * 1. shared-llm: Dynamic workspace root detection in FileEditor
 * 2. thinking-tools-mcp: Cognitive operators use workspace-aware file reading
 * 3. free-agent-mcp: Wrapper script for workspace root
 * 4. paid-agent-mcp: Wrapper script for workspace root
 * 5. credit-optimizer-mcp: Wrapper script for workspace root
 * 6. robinsons-toolkit-mcp: Wrapper script for workspace root
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';

const packages = [
  { name: 'shared-llm', path: 'packages/shared-llm', bump: 'patch' },
  { name: 'thinking-tools-mcp', path: 'packages/thinking-tools-mcp', bump: 'patch' },
  { name: 'free-agent-mcp', path: 'packages/free-agent-mcp', bump: 'patch' },
  { name: 'paid-agent-mcp', path: 'packages/paid-agent-mcp', bump: 'patch' },
  { name: 'credit-optimizer-mcp', path: 'packages/credit-optimizer-mcp', bump: 'patch' },
  { name: 'robinsons-toolkit-mcp', path: 'packages/robinsons-toolkit-mcp', bump: 'patch' },
];

console.log('🔧 Building and Publishing Workspace Root Fixes\n');

const results = [];

for (const pkg of packages) {
  console.log(`\n📦 Processing ${pkg.name}...`);
  
  try {
    // Build
    console.log(`  ⚙️  Building...`);
    execSync(`npm run build -w ${pkg.path}`, { stdio: 'inherit' });
    
    // Bump version
    console.log(`  📈 Bumping version (${pkg.bump})...`);
    execSync(`npm version ${pkg.bump} -w ${pkg.path}`, { stdio: 'inherit' });
    
    // Get new version
    const packageJson = JSON.parse(readFileSync(`${pkg.path}/package.json`, 'utf-8'));
    const newVersion = packageJson.version;
    
    // Publish
    console.log(`  🚀 Publishing v${newVersion}...`);
    execSync(`npm publish -w ${pkg.path} --access public`, { stdio: 'inherit' });
    
    results.push({
      name: pkg.name,
      version: newVersion,
      status: '✅ Published',
    });
    
    console.log(`  ✅ ${pkg.name}@${newVersion} published successfully!`);
  } catch (error) {
    console.error(`  ❌ Failed to publish ${pkg.name}:`, error.message);
    results.push({
      name: pkg.name,
      status: '❌ Failed',
      error: error.message,
    });
  }
}

console.log('\n\n📊 PUBLISHING SUMMARY\n');
console.log('═'.repeat(80));

for (const result of results) {
  if (result.status === '✅ Published') {
    console.log(`${result.status} ${result.name}@${result.version}`);
  } else {
    console.log(`${result.status} ${result.name}: ${result.error}`);
  }
}

console.log('═'.repeat(80));

const successCount = results.filter(r => r.status === '✅ Published').length;
const failCount = results.filter(r => r.status === '❌ Failed').length;

console.log(`\n✅ Success: ${successCount}/${packages.length}`);
console.log(`❌ Failed: ${failCount}/${packages.length}`);

if (successCount === packages.length) {
  console.log('\n🎉 ALL PACKAGES PUBLISHED SUCCESSFULLY!\n');
  console.log('📝 Next Steps:');
  console.log('1. Update augment-mcp-config.json with new versions');
  console.log('2. Add --workspace-root argument to all server configs');
  console.log('3. Restart Augment');
  console.log('4. Test comprehensive audit\n');
} else {
  console.log('\n⚠️  Some packages failed to publish. Please review errors above.\n');
  process.exit(1);
}

