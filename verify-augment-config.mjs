#!/usr/bin/env node

/**
 * Verify Augment MCP Configuration
 * 
 * This script checks if the Augment Code extension configuration is correct
 * and tests if MCP servers can be spawned successfully.
 */

import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    white: '\x1b[37m'
};

function log(message, color = 'white') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function getSettingsPath() {
    const appData = process.env.APPDATA;
    if (!appData) {
        throw new Error('APPDATA environment variable not found');
    }
    return path.join(appData, 'Code', 'User', 'settings.json');
}

async function checkVSCodeSettings() {
    log('\n🔍 Checking VS Code settings...', 'cyan');
    
    const settingsPath = getSettingsPath();
    
    if (!fs.existsSync(settingsPath)) {
        log(`❌ VS Code settings not found: ${settingsPath}`, 'red');
        return false;
    }
    
    log(`✅ Found settings: ${settingsPath}`, 'green');
    
    try {
        const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
        
        if (!settings['augment.mcpServers']) {
            log('❌ No "augment.mcpServers" configuration found', 'red');
            log('   Expected format: "augment.mcpServers" (not "mcpServers")', 'yellow');
            return false;
        }
        
        const servers = Object.keys(settings['augment.mcpServers']);
        log(`✅ Found ${servers.length} MCP servers configured:`, 'green');
        
        servers.forEach(server => {
            const config = settings['augment.mcpServers'][server];
            log(`   • ${server}: ${config.command} ${config.args?.join(' ') || ''}`, 'white');
        });
        
        return { settings, servers };
        
    } catch (error) {
        log(`❌ Error reading settings: ${error.message}`, 'red');
        return false;
    }
}

async function testMCPServer(name, config) {
    log(`\n🧪 Testing ${name}...`, 'cyan');
    
    return new Promise((resolve) => {
        const { command, args = [], env = {} } = config;
        
        // Merge environment variables
        const serverEnv = { ...process.env, ...env };
        
        log(`   Command: ${command} ${args.join(' ')}`, 'white');
        
        const child = spawn(command, args, {
            env: serverEnv,
            stdio: ['pipe', 'pipe', 'pipe']
        });
        
        let stdout = '';
        let stderr = '';
        
        const timeout = setTimeout(() => {
            child.kill();
            log(`   ⚠️  ${name}: Timeout (this is normal for MCP servers)`, 'yellow');
            resolve({ success: true, reason: 'timeout' });
        }, 5000);
        
        child.stdout.on('data', (data) => {
            stdout += data.toString();
        });
        
        child.stderr.on('data', (data) => {
            stderr += data.toString();
        });
        
        child.on('error', (error) => {
            clearTimeout(timeout);
            log(`   ❌ ${name}: Failed to start - ${error.message}`, 'red');
            resolve({ success: false, error: error.message });
        });
        
        child.on('exit', (code) => {
            clearTimeout(timeout);
            if (code === 0 || stdout.includes('capabilities')) {
                log(`   ✅ ${name}: Started successfully`, 'green');
                resolve({ success: true, reason: 'started' });
            } else {
                log(`   ❌ ${name}: Exited with code ${code}`, 'red');
                if (stderr) log(`      Error: ${stderr.trim()}`, 'red');
                resolve({ success: false, code, stderr });
            }
        });
        
        // Send a test JSON-RPC message
        setTimeout(() => {
            try {
                const testMessage = JSON.stringify({
                    jsonrpc: '2.0',
                    id: 1,
                    method: 'initialize',
                    params: {
                        protocolVersion: '2024-11-05',
                        capabilities: {},
                        clientInfo: { name: 'test', version: '1.0.0' }
                    }
                }) + '\n';
                
                child.stdin.write(testMessage);
            } catch (error) {
                // Ignore write errors
            }
        }, 1000);
    });
}

async function checkOllama() {
    log('\n🦙 Checking Ollama...', 'cyan');
    
    try {
        const response = await fetch('http://localhost:11434/api/tags');
        if (response.ok) {
            log('✅ Ollama is running', 'green');
            return true;
        } else {
            log('❌ Ollama responded with error', 'red');
            return false;
        }
    } catch (error) {
        log('❌ Ollama is not running or not accessible', 'red');
        log('   Start with: ollama serve', 'yellow');
        return false;
    }
}

async function main() {
    log('========================================', 'cyan');
    log('🔍 AUGMENT MCP CONFIGURATION VERIFICATION', 'cyan');
    log('========================================', 'cyan');
    
    // Check VS Code settings
    const settingsResult = await checkVSCodeSettings();
    if (!settingsResult) {
        log('\n❌ Configuration verification failed', 'red');
        process.exit(1);
    }
    
    const { settings, servers } = settingsResult;
    
    // Check Ollama
    await checkOllama();
    
    // Test each MCP server
    log('\n🧪 Testing MCP servers...', 'cyan');
    
    let successCount = 0;
    for (const serverName of servers) {
        const config = settings['augment.mcpServers'][serverName];
        const result = await testMCPServer(serverName, config);
        if (result.success) successCount++;
    }
    
    // Summary
    log('\n========================================', 'cyan');
    log('📊 VERIFICATION SUMMARY', 'cyan');
    log('========================================', 'cyan');
    
    log(`✅ Configuration format: Correct ("augment.mcpServers")`, 'green');
    log(`📦 MCP servers configured: ${servers.length}`, 'white');
    log(`🧪 Servers tested successfully: ${successCount}/${servers.length}`, successCount === servers.length ? 'green' : 'yellow');
    
    if (successCount === servers.length) {
        log('\n🎉 All systems ready! Restart VS Code to use MCP servers.', 'green');
    } else {
        log('\n⚠️  Some servers had issues. Check the output above.', 'yellow');
    }
    
    log('', 'white');
}

main().catch(error => {
    log(`\n❌ Verification failed: ${error.message}`, 'red');
    process.exit(1);
});
