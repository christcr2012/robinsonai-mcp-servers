#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing package names to remove @robinsonai scope');
console.log('================================================\n');

// Define the 8 working MCP servers
const servers = [
    'free-agent-mcp',
    'paid-agent-mcp', 
    'thinking-tools-mcp',
    'credit-optimizer-mcp',
    'github-mcp',
    'vercel-mcp',
    'neon-mcp',
    'openai-mcp'
];

let fixed = 0;
let failed = 0;

for (const server of servers) {
    const packageDir = path.join('packages', server);
    const packageJsonPath = path.join(packageDir, 'package.json');
    
    console.log(`🔄 Fixing ${server}...`);
    
    try {
        // Read package.json
        if (!fs.existsSync(packageJsonPath)) {
            console.log(`   ❌ package.json not found: ${packageJsonPath}`);
            failed++;
            continue;
        }
        
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        
        // Change name from @robinsonai/package-name to robinsonai-package-name
        const oldName = packageJson.name;
        const newName = `robinsonai-${server}`;
        
        if (oldName === newName) {
            console.log(`   ⚠️  Already fixed: ${newName}`);
            continue;
        }
        
        packageJson.name = newName;
        
        // Also fix the bin entry if it exists
        if (packageJson.bin) {
            const binKey = Object.keys(packageJson.bin)[0];
            if (binKey.startsWith('@robinsonai/')) {
                const newBinKey = binKey.replace('@robinsonai/', 'robinsonai-');
                packageJson.bin[newBinKey] = packageJson.bin[binKey];
                delete packageJson.bin[binKey];
            }
        }
        
        // Write back to file
        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
        
        console.log(`   ✅ Fixed: ${oldName} → ${newName}`);
        fixed++;
        
    } catch (error) {
        console.log(`   ❌ Error fixing ${server}: ${error.message}`);
        failed++;
    }
}

// Summary
console.log('\n📊 FIXING SUMMARY');
console.log('================');
console.log(`✅ Successfully fixed: ${fixed} packages`);
console.log(`❌ Failed: ${failed} packages`);
console.log(`📦 Total: ${servers.length} packages\n`);

if (fixed > 0) {
    console.log('🎉 SUCCESS! Package names fixed. Now you can publish:');
    console.log('   node publish-all-fixed.js\n');
    
    console.log('Or publish individually:');
    for (const server of servers) {
        console.log(`   cd packages/${server} && npm publish`);
    }
}

console.log('\n✨ Done!');
