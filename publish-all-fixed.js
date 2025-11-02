#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Robinson AI MCP Servers - Publishing Script (Fixed Names)');
console.log('===========================================================\n');

// Check npm login status
console.log('📋 Checking npm authentication...');
try {
    const whoami = execSync('npm whoami', { encoding: 'utf8' }).trim();
    console.log(`✅ Logged in as: ${whoami}\n`);
} catch (error) {
    console.log('❌ Not logged in to npm. Please run "npm login" first.\n');
    process.exit(1);
}

// Define the 8 working MCP servers (with fixed names)
const servers = [
    { name: 'free-agent-mcp', newName: 'robinsonai-free-agent-mcp', description: 'FREE models (0 credits)' },
    { name: 'paid-agent-mcp', newName: 'robinsonai-paid-agent-mcp', description: 'PAID models for complex tasks' },
    { name: 'thinking-tools-mcp', newName: 'robinsonai-thinking-tools-mcp', description: '24 cognitive frameworks' },
    { name: 'credit-optimizer-mcp', newName: 'robinsonai-credit-optimizer-mcp', description: 'Tool discovery & templates' },
    { name: 'github-mcp', newName: 'robinsonai-github-mcp', description: 'GitHub integration (241 tools)' },
    { name: 'vercel-mcp', newName: 'robinsonai-vercel-mcp', description: 'Vercel deployment integration' },
    { name: 'neon-mcp', newName: 'robinsonai-neon-mcp', description: 'Neon Postgres integration' },
    { name: 'openai-mcp', newName: 'robinsonai-openai-mcp', description: 'Direct OpenAI API access' }
];

console.log('📦 Publishing 8 MCP servers...\n');

let published = 0;
let failed = 0;
let skipped = 0;

for (const server of servers) {
    const packageDir = path.join('packages', server.name);
    const distDir = path.join(packageDir, 'dist');
    
    console.log(`🔄 Publishing ${server.newName}...`);
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
            currentVersion = execSync(`npm view ${server.newName} version`, { encoding: 'utf8' }).trim();
            console.log(`   📋 Current published version: ${currentVersion}`);
            
            // Read local version
            const packageJsonPath = path.join(packageDir, 'package.json');
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
            
            if (currentVersion === packageJson.version) {
                console.log(`   ⚠️  Version ${packageJson.version} already published. Skipping.`);
                skipped++;
                continue;
            }
        } catch (error) {
            console.log(`   📋 Package not yet published`);
        }
        
        // Change to package directory and publish
        process.chdir(packageDir);
        console.log(`   🚀 Publishing...`);
        
        execSync('npm publish', { stdio: 'inherit' });
        
        console.log(`   ✅ Successfully published ${server.newName}`);
        published++;
        
    } catch (error) {
        console.log(`   ❌ Failed to publish ${server.newName}: ${error.message}`);
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
        console.log(`   npm install -g ${server.newName}`);
    }
    console.log('');
}

console.log('✨ Done!');
