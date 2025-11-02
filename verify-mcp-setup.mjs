#!/usr/bin/env node
/**
 * Verification script for Robinson AI Systems MCP Servers
 * Tests that all 6 servers are properly installed and accessible
 */

import { spawn } from 'child_process';
import { promises as fs } from 'fs';

const servers = [
    {
        name: 'Free Agent MCP',
        package: '@robinson_ai_systems/free-agent-mcp',
        command: 'free-agent-mcp',
        description: 'FREE local LLM execution (0 credits)'
    },
    {
        name: 'Paid Agent MCP', 
        package: '@robinson_ai_systems/paid-agent-mcp',
        command: 'paid-agent-mcp',
        description: 'Budget-controlled paid models'
    },
    {
        name: 'Thinking Tools MCP',
        package: '@robinson_ai_systems/thinking-tools-mcp', 
        command: 'thinking-tools-mcp',
        description: '24 cognitive frameworks + Context Engine'
    },
    {
        name: 'Credit Optimizer MCP',
        package: '@robinson_ai_systems/credit-optimizer-mcp',
        command: 'credit-optimizer-mcp', 
        description: 'Tool discovery & autonomous workflows'
    },
    {
        name: "Robinson's Toolkit MCP",
        package: '@robinson_ai_systems/robinsons-toolkit-mcp',
        command: 'robinsons-toolkit-mcp',
        description: '1165+ integration tools'
    },
    {
        name: 'OpenAI MCP',
        package: '@robinson_ai_systems/openai-mcp',
        command: 'openai-mcp', 
        description: 'Direct OpenAI API access'
    }
];

console.log('🔍 Verifying Robinson AI Systems MCP Servers...\n');

async function checkPackageInstalled(packageName) {
    try {
        const result = await new Promise((resolve, reject) => {
            const proc = spawn('npm', ['list', '-g', packageName], { 
                stdio: ['pipe', 'pipe', 'pipe'],
                shell: true 
            });
            
            let output = '';
            proc.stdout.on('data', (data) => output += data.toString());
            proc.stderr.on('data', (data) => output += data.toString());
            
            proc.on('close', (code) => {
                resolve({ code, output });
            });
            
            proc.on('error', reject);
        });
        
        return result.code === 0 && result.output.includes(packageName);
    } catch (error) {
        return false;
    }
}

async function checkCommandAvailable(command) {
    try {
        const result = await new Promise((resolve, reject) => {
            const proc = spawn('which', [command], { 
                stdio: ['pipe', 'pipe', 'pipe'],
                shell: true 
            });
            
            proc.on('close', (code) => {
                resolve(code === 0);
            });
            
            proc.on('error', () => resolve(false));
        });
        
        return result;
    } catch (error) {
        return false;
    }
}

async function checkConfigFile() {
    try {
        const configExists = await fs.access('augment-mcp-config-updated.json').then(() => true).catch(() => false);
        if (configExists) {
            const config = JSON.parse(await fs.readFile('augment-mcp-config-updated.json', 'utf8'));
            const serverCount = Object.keys(config.mcpServers || {}).length;
            return { exists: true, serverCount };
        }
        return { exists: false, serverCount: 0 };
    } catch (error) {
        return { exists: false, serverCount: 0 };
    }
}

async function main() {
    let allGood = true;
    
    // Check each server
    for (const server of servers) {
        process.stdout.write(`📦 ${server.name}... `);
        
        const installed = await checkPackageInstalled(server.package);
        const commandAvailable = await checkCommandAvailable(server.command);
        
        if (installed && commandAvailable) {
            console.log('✅ READY');
        } else if (installed) {
            console.log('⚠️  INSTALLED (command not in PATH)');
            allGood = false;
        } else {
            console.log('❌ NOT INSTALLED');
            allGood = false;
        }
        
        console.log(`   ${server.description}`);
    }
    
    console.log('\n📄 Configuration file...');
    const config = await checkConfigFile();
    if (config.exists) {
        console.log(`✅ Found augment-mcp-config-updated.json (${config.serverCount} servers configured)`);
    } else {
        console.log('❌ Configuration file not found');
        allGood = false;
    }
    
    console.log('\n🤖 Ollama models...');
    try {
        const result = await new Promise((resolve, reject) => {
            const proc = spawn('ollama', ['list'], { 
                stdio: ['pipe', 'pipe', 'pipe'],
                shell: true 
            });
            
            let output = '';
            proc.stdout.on('data', (data) => output += data.toString());
            
            proc.on('close', (code) => {
                resolve({ code, output });
            });
            
            proc.on('error', reject);
        });
        
        const requiredModels = ['qwen2.5:3b', 'qwen2.5-coder:7b', 'deepseek-coder:33b'];
        const availableModels = result.output;
        
        for (const model of requiredModels) {
            if (availableModels.includes(model)) {
                console.log(`✅ ${model}`);
            } else {
                console.log(`❌ ${model} (run: ollama pull ${model})`);
                allGood = false;
            }
        }
    } catch (error) {
        console.log('❌ Ollama not available or not running');
        allGood = false;
    }
    
    console.log('\n' + '='.repeat(60));
    if (allGood) {
        console.log('🎉 ALL SYSTEMS READY!');
        console.log('💡 Next: Copy augment-mcp-config-updated.json to your VS Code settings');
        console.log('🔄 Then restart VS Code to activate the servers');
        console.log('💰 Expected savings: 70-85% on Augment credits!');
    } else {
        console.log('⚠️  SETUP INCOMPLETE');
        console.log('🔧 Run: ./setup-improved-mcp-servers.ps1');
        console.log('📖 See: SETUP_GUIDE_LATEST.md for detailed instructions');
    }
}

main().catch(console.error);
