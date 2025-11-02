#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Robinson AI MCP Servers - NPM Status Check');
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

console.log('📦 Checking package status...\n');

let readyToPublish = 0;
let alreadyPublished = 0;
let needsWork = 0;

for (const server of servers) {
    const packageName = `@robinsonai/${server.name}`;
    const packageDir = path.join('packages', server.name);
    const distDir = path.join(packageDir, 'dist');
    
    console.log(`🔍 ${packageName} v${server.version}`);
    console.log(`   📝 ${server.description}`);
    
    // Check if package directory exists
    if (!fs.existsSync(packageDir)) {
        console.log(`   ❌ Directory not found: ${packageDir}`);
        needsWork++;
        continue;
    }
    
    // Check if dist directory exists
    if (!fs.existsSync(distDir)) {
        console.log(`   ❌ Build artifacts not found: ${distDir}`);
        needsWork++;
        continue;
    }
    
    // Check current published version
    try {
        const currentVersion = execSync(`npm view ${packageName} version`, { encoding: 'utf8' }).trim();
        console.log(`   📋 Current published version: ${currentVersion}`);
        if (currentVersion === server.version) {
            console.log(`   ⚠️  Version ${server.version} already published`);
            alreadyPublished++;
        } else {
            console.log(`   ✅ Ready to publish (${currentVersion} → ${server.version})`);
            readyToPublish++;
        }
    } catch (error) {
        console.log(`   📋 Package not yet published`);
        console.log(`   ✅ Ready to publish (new package)`);
        readyToPublish++;
    }
    
    console.log('');
}

// Summary
console.log('📊 STATUS SUMMARY');
console.log('================');
console.log(`✅ Ready to publish: ${readyToPublish} packages`);
console.log(`⚠️  Already published: ${alreadyPublished} packages`);
console.log(`❌ Need work: ${needsWork} packages`);
console.log(`📦 Total: ${servers.length} packages\n`);

if (readyToPublish > 0) {
    console.log('🚀 READY TO PUBLISH! Run this command to publish all:');
    console.log('   node publish-all.js\n');
    
    console.log('Or publish individually:');
    for (const server of servers) {
        console.log(`   cd packages/${server.name} && npm publish --access public`);
    }
}

console.log('\n✨ Done!');
