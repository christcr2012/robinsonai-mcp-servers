#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Robinson AI MCP Servers - Publishing Script');
console.log('==============================================\n');

// Check npm login status
console.log('📋 Checking npm authentication...');
try {
    const whoami = execSync('npm whoami', { encoding: 'utf8' }).trim();
    console.log(`✅ Logged in as: ${whoami}\n`);
} catch (error) {
    console.log('❌ Not logged in to npm. Please run "npm login" first.\n');
    process.exit(1);
}

// Define the 8 working MCP servers
const servers = [
    { name: 'free-agent-mcp', version: '0.1.1', description: 'FREE models (0 credits)' },
    { name: 'paid-agent-mcp', version: '0.2.0', description: 'PAID models for complex tasks' },
    { name: 'thinking-tools-mcp', version: '1.0.0', description: '24 cognitive frameworks' },
    { name: 'credit-optimizer-mcp', version: '0.1.1', description: 'Tool discovery & templates' },
    { name: 'github-mcp', version: '2.0.0', description: 'GitHub integration (241 tools)' },
    { name: 'vercel-mcp', version: '1.0.0', description: 'Vercel deployment integration' },
    { name: 'neon-mcp', version: '2.0.0', description: 'Neon Postgres integration' },
    { name: 'openai-mcp', version: '1.0.0', description: 'Direct OpenAI API access' }
];

console.log('📦 Publishing 8 MCP servers...\n');

let published = 0;
let failed = 0;
let skipped = 0;

for (const server of servers) {
    const packageName = `@robinsonai/${server.name}`;
    const packageDir = path.join('packages', server.name);
    const distDir = path.join(packageDir, 'dist');
    
    console.log(`🔄 Publishing ${packageName} v${server.version}...`);
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
        // Check current published version
        let currentVersion;
        try {
            currentVersion = execSync(`npm view ${packageName} version`, { encoding: 'utf8' }).trim();
            console.log(`   📋 Current published version: ${currentVersion}`);
            if (currentVersion === server.version) {
                console.log(`   ⚠️  Version ${server.version} already published. Skipping.`);
                skipped++;
                continue;
            }
        } catch (error) {
            console.log(`   📋 Package not yet published`);
        }
        
        // Change to package directory and publish
        process.chdir(packageDir);
        console.log(`   🚀 Publishing...`);
        
        execSync('npm publish --access public', { stdio: 'inherit' });
        
        console.log(`   ✅ Successfully published ${packageName} v${server.version}`);
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
        console.log(`   npm install -g @robinsonai/${server.name}`);
    }
    console.log('');
}

console.log('✨ Done!');
