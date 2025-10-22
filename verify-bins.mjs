#!/usr/bin/env node
/**
 * Verify Bins Script
 *
 * Scans all package.json files and verifies:
 * 1. bin field exists and points to dist/index.js
 * 2. dist/index.js exists
 * 3. dist/index.js has shebang
 * 4. Prints the exact npx commands Augment should use
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PACKAGES_DIR = path.join(__dirname, 'packages');

console.log('🔍 Verifying MCP Server Bins...\n');

const packages = fs.readdirSync(PACKAGES_DIR, { withFileTypes: true })
  .filter(dirent => dirent.isDirectory())
  .map(dirent => dirent.name);

const results = [];
const errors = [];

for (const pkg of packages) {
  const pkgPath = path.join(PACKAGES_DIR, pkg);
  const pkgJsonPath = path.join(pkgPath, 'package.json');
  
  if (!fs.existsSync(pkgJsonPath)) {
    errors.push(`❌ ${pkg}: package.json not found`);
    continue;
  }
  
  const pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8'));
  
  // Check for bin field
  if (!pkgJson.bin) {
    errors.push(`❌ ${pkg}: No "bin" field in package.json`);
    continue;
  }
  
  // Get bin name and path
  const binEntries = typeof pkgJson.bin === 'string' 
    ? { [pkg]: pkgJson.bin }
    : pkgJson.bin;
  
  for (const [binName, binPath] of Object.entries(binEntries)) {
    const fullBinPath = path.join(pkgPath, binPath);
    
    // Check if dist/index.js exists
    if (!fs.existsSync(fullBinPath)) {
      errors.push(`❌ ${pkg}: bin file not found at ${binPath} (run npm run build)`);
      continue;
    }
    
    // Check for shebang
    const firstLine = fs.readFileSync(fullBinPath, 'utf-8').split('\n')[0];
    const hasShebang = firstLine.startsWith('#!');
    
    if (!hasShebang) {
      errors.push(`❌ ${pkg}: Missing shebang in ${binPath}`);
      continue;
    }
    
    // Success!
    results.push({
      package: pkg,
      binName,
      binPath,
      shebang: firstLine,
      npxCommand: `npx ${binName}`
    });
  }
}

// Print results
console.log('✅ Valid MCP Servers:\n');
console.log('Package'.padEnd(30) + 'Bin Name'.padEnd(30) + 'npx Command');
console.log('─'.repeat(90));

for (const result of results) {
  console.log(
    result.package.padEnd(30) + 
    result.binName.padEnd(30) + 
    result.npxCommand
  );
}

console.log('\n');

// Print errors
if (errors.length > 0) {
  console.log('⚠️  Issues Found:\n');
  for (const error of errors) {
    console.log(error);
  }
  console.log('\n');
}

// Print Augment config snippets
console.log('📋 Augment Code Configuration Snippets:\n');

console.log('// LEAN CONFIG (4 core servers):');
console.log('{');
console.log('  "mcpServers": {');
const coreServers = results.filter(r => 
  ['architect-mcp', 'autonomous-agent-mcp', 'credit-optimizer-mcp', 'robinsons-toolkit-mcp']
    .includes(r.binName)
);
for (let i = 0; i < coreServers.length; i++) {
  const r = coreServers[i];
  const comma = i < coreServers.length - 1 ? ',' : '';
  console.log(`    "${r.binName}": { "command": "npx", "args": ["${r.binName}"] }${comma}`);
}
console.log('  }');
console.log('}\n');

console.log('// FIREHOSE CONFIG (all servers):');
console.log('{');
console.log('  "mcpServers": {');
for (let i = 0; i < results.length; i++) {
  const r = results[i];
  const comma = i < results.length - 1 ? ',' : '';
  console.log(`    "${r.binName}": { "command": "npx", "args": ["${r.binName}"] }${comma}`);
}
console.log('  }');
console.log('}\n');

// Summary
console.log('📊 Summary:');
console.log(`   ✅ Valid servers: ${results.length}`);
console.log(`   ❌ Issues: ${errors.length}`);
console.log(`   📦 Total packages scanned: ${packages.length}\n`);

// Exit code
process.exit(errors.length > 0 ? 1 : 0);

