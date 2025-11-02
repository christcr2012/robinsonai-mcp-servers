#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Robinson AI MCP Servers - Publishing with @robinson_ai_systems scope');
console.log('=====================================================================\n');

// Check npm login status
console.log('📋 Checking npm authentication...');
try {
    const whoami = execSync('npm whoami', { encoding: 'utf8' }).trim();
    console.log(`✅ Logged in as: ${whoami}`);
    
    if (whoami !== 'robinson_ai_systems') {
        console.log(`⚠️  Warning: You're logged in as '${whoami}' but publishing to @robinson_ai_systems`);
        console.log('   Make sure you have permission to publish to this organization.\n');
    } else {
        console.log('   Perfect! You have the right account.\n');
    }
} catch (error) {
    console.log('❌ Not logged in to npm. Please run "npm login" first.\n');
    process.exit(1);
}

// Define the 8 working MCP servers
const servers = [
    { name: 'free-agent-mcp', description: 'FREE models (0 credits)' },
    { name: 'paid-agent-mcp', description: 'PAID models for complex tasks' },
    { name: 'thinking-tools-mcp', description: '24 cognitive frameworks' },
    { name: 'credit-optimizer-mcp', description: 'Tool discovery & templates' },
    { name: 'github-mcp', description: 'GitHub integration (241 tools)' },
    { name: 'vercel-mcp', description: 'Vercel deployment integration' },
    { name: 'neon-mcp', description: 'Neon Postgres integration' },
    { name: 'openai-mcp', description: 'Direct OpenAI API access' }
];

console.log('📦 Publishing 8 MCP servers to @robinson_ai_systems...\n');

let published = 0;
let failed = 0;
let skipped = 0;

for (const server of servers) {
    const packageName = `@robinson_ai_systems/${server.name}`;
    const packageDir = path.join('packages', server.name);
    const distDir = path.join(packageDir, 'dist');
    
    console.log(`🔄 Publishing ${packageName}...`);
    console.log(`   📝 ${server.description}`);
    
    // Check if package directory exists
    if (!fs.existsSync(packageDir)) {
        console.log(`   ❌ Directory not found: ${packageDir}`);
        failed++;
        continue;
    }
    
    // Check if dist directory exists
    if (!fs.existsSync(distDir)) {
        console.log(`   ❌ Build artifacts not found: ${distDir}`);
        failed++;
        continue;
    }
    
    try {
        // Read local version
        const packageJsonPath = path.join(packageDir, 'package.json');
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        const localVersion = packageJson.version;
        
        // Check current published version
        let currentVersion;
        try {
            currentVersion = execSync(`npm view ${packageName} version`, { encoding: 'utf8' }).trim();
            console.log(`   📋 Current published version: ${currentVersion}`);
            
            if (currentVersion === localVersion) {
                console.log(`   ⚠️  Version ${localVersion} already published. Skipping.`);
                skipped++;
                continue;
            }
        } catch (error) {
            console.log(`   📋 Package not yet published`);
        }
        
        // Change to package directory and publish
        process.chdir(packageDir);
        console.log(`   🚀 Publishing v${localVersion}...`);
        
        execSync('npm publish --access public', { stdio: 'inherit' });
        
        console.log(`   ✅ Successfully published ${packageName} v${localVersion}`);
        published++;
        
    } catch (error) {
        console.log(`   ❌ Failed to publish ${packageName}: ${error.message}`);
        failed++;
    } finally {
        // Return to root directory
        process.chdir(path.join(__dirname));
    }
    
    console.log('');
}

// Summary
console.log('📊 PUBLISHING SUMMARY');
console.log('====================');
console.log(`✅ Successfully published: ${published} packages`);
console.log(`⚠️  Skipped (already published): ${skipped} packages`);
console.log(`❌ Failed: ${failed} packages`);
console.log(`📦 Total: ${servers.length} packages\n`);

if (published > 0) {
    console.log('🎉 SUCCESS! You can now install these MCP servers:');
    for (const server of servers) {
        console.log(`   npm install -g @robinson_ai_systems/${server.name}`);
    }
    console.log('');
    
    console.log('📋 MCP Configuration example:');
    console.log('   Add to your MCP client config:');
    console.log('   {');
    console.log('     "mcpServers": {');
    console.log('       "free-agent": {');
    console.log('         "command": "free-agent-mcp"');
    console.log('       },');
    console.log('       "paid-agent": {');
    console.log('         "command": "paid-agent-mcp"');
    console.log('       }');
    console.log('     }');
    console.log('   }');
}

console.log('\n✨ Done!');
