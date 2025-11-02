#!/usr/bin/env node

/**
 * Quick verification of MCP servers setup
 */

import { existsSync } from 'fs';
import { join } from 'path';

console.log('🔍 Quick MCP Servers Verification...\n');

const packages = [
  'packages/free-agent-mcp',
  'packages/paid-agent-mcp',
  'packages/robinsons-toolkit-mcp', 
  'packages/thinking-tools-mcp',
  'packages/credit-optimizer-mcp',
  'packages/openai-mcp'
];

const configFiles = [
  'FIXED_MCP_CONFIG.json',
  'test-mcp-servers.mjs',
  'MCP_SERVERS_SETUP_GUIDE.md'
];

let allGood = true;

// Check packages are built
console.log('📦 Checking packages...');
packages.forEach(pkg => {
  const distPath = join(pkg, 'dist', 'index.js');
  if (existsSync(distPath)) {
    console.log(`   ✅ ${pkg.split('/')[1]} - Built`);
  } else {
    console.log(`   ❌ ${pkg.split('/')[1]} - Not built`);
    allGood = false;
  }
});

// Check config files
console.log('\n📄 Checking config files...');
configFiles.forEach(file => {
  if (existsSync(file)) {
    console.log(`   ✅ ${file} - Ready`);
  } else {
    console.log(`   ❌ ${file} - Missing`);
    allGood = false;
  }
});

// Check Ollama
console.log('\n🦙 Checking Ollama...');
try {
  const response = await fetch('http://127.0.0.1:11434/api/tags');
  if (response.ok) {
    const data = await response.json();
    console.log(`   ✅ Ollama running with ${data.models?.length || 0} models`);
  } else {
    console.log('   ⚠️  Ollama API not responding');
  }
} catch (error) {
  console.log('   ❌ Ollama not running - start with: ollama serve');
  console.log('      (This will affect free-agent-mcp)');
}

// Summary
console.log('\n' + '='.repeat(50));
if (allGood) {
  console.log('🎉 Setup looks good!');
  console.log('\nNext steps:');
  console.log('1. Run: node test-mcp-servers.mjs');
  console.log('2. Import FIXED_MCP_CONFIG.json into Augment');
  console.log('3. Restart Augment Code');
} else {
  console.log('🔧 Some issues found. Please fix the errors above.');
  console.log('\nCommon fixes:');
  console.log('- Build packages: npm run build');
  console.log('- Start Ollama: ollama serve');
}

console.log('\nFor detailed instructions: MCP_SERVERS_SETUP_GUIDE.md');
