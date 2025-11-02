#!/usr/bin/env node

/**
 * Verify Published Packages Script
 * 
 * Checks if all the fixed MCP packages have been published to npm
 */

import { execSync } from 'child_process';

const EXPECTED_PACKAGES = [
  { name: '@robinson_ai_systems/shared-llm', version: '0.1.1' },
  { name: '@robinson_ai_systems/free-agent-mcp', version: '0.1.8' },
  { name: '@robinson_ai_systems/credit-optimizer-mcp', version: '0.1.7' },
  { name: '@robinson_ai_systems/robinsons-toolkit-mcp', version: '1.0.6' },
  { name: '@robinson_ai_systems/thinking-tools-mcp', version: '1.4.2' }
];

async function checkPackage(pkg) {
  console.log(`🔍 Checking ${pkg.name}@${pkg.version}...`);
  
  try {
    const result = execSync(`npm view ${pkg.name}@${pkg.version} --json`, { 
      stdio: 'pipe',
      encoding: 'utf-8'
    });
    
    const packageInfo = JSON.parse(result);
    
    if (packageInfo.version === pkg.version) {
      console.log(`   ✅ Available on npm`);
      console.log(`   📅 Published: ${packageInfo.time[pkg.version]}`);
      return true;
    } else {
      console.log(`   ❌ Version mismatch: expected ${pkg.version}, got ${packageInfo.version}`);
      return false;
    }
    
  } catch (error) {
    if (error.message.includes('404')) {
      console.log(`   ❌ Not found on npm - needs to be published`);
    } else {
      console.log(`   ❌ Error checking package: ${error.message}`);
    }
    return false;
  }
}

async function main() {
  console.log('🚀 Verifying Published MCP Packages...\n');
  
  const results = [];
  
  for (const pkg of EXPECTED_PACKAGES) {
    const isAvailable = await checkPackage(pkg);
    results.push({ ...pkg, available: isAvailable });
    console.log(''); // Add spacing
  }
  
  console.log('='.repeat(60));
  console.log('📊 VERIFICATION RESULTS');
  console.log('='.repeat(60));
  
  const available = results.filter(r => r.available).length;
  const total = results.length;
  
  console.log(`\n✅ Available: ${available}/${total} packages`);
  
  if (available === total) {
    console.log('\n🎉 ALL PACKAGES ARE PUBLISHED AND AVAILABLE!');
    console.log('\n📋 Next Steps:');
    console.log('1. Test the fixes: node test-mcp-delegation.mjs');
    console.log('2. Start MCP servers with new versions');
    console.log('3. Verify delegation works and achieves 96% cost savings');
  } else {
    console.log('\n⚠️  Some packages are missing. Please publish them:');
    results.filter(r => !r.available).forEach(pkg => {
      console.log(`   • ${pkg.name}@${pkg.version}`);
    });
    console.log('\nSee manual-publish-commands.md for instructions.');
  }
  
  console.log('\n📦 Package Status:');
  results.forEach(pkg => {
    const status = pkg.available ? '✅' : '❌';
    console.log(`   ${status} ${pkg.name}@${pkg.version}`);
  });
  
  console.log('\n' + '='.repeat(60));
}

main().catch(console.error);
