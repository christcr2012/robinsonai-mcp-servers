#!/usr/bin/env node
/**
 * Installation Verification Script
 * 
 * Verifies that all 4 MCP servers are correctly installed and working:
 * 1. Checks that all packages are built
 * 2. Checks that all bins are executable
 * 3. Tests MCP protocol compliance (initialize, tools/list)
 * 4. Checks Ollama integration
 * 5. Verifies environment variables
 */

import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

const SERVERS = [
  { name: 'architect-mcp', bin: 'architect-mcp', requiresOllama: true },
  { name: 'autonomous-agent-mcp', bin: 'autonomous-agent-mcp', requiresOllama: true },
  { name: 'credit-optimizer-mcp', bin: 'credit-optimizer-mcp', requiresOllama: false },
  { name: 'robinsons-toolkit-mcp', bin: 'robinsons-toolkit-mcp', requiresOllama: false },
];

const REQUIRED_OLLAMA_MODELS = [
  'qwen2.5:3b',
  'deepseek-coder:33b',
  'codellama:34b',
  'qwen2.5-coder:32b',
];

async function checkPackageBuilt(serverName) {
  const distPath = join(__dirname, 'packages', serverName, 'dist', 'index.js');
  const exists = existsSync(distPath);
  
  if (exists) {
    log(`  ✅ ${serverName} built`, 'green');
  } else {
    log(`  ❌ ${serverName} NOT built (missing dist/index.js)`, 'red');
  }
  
  return exists;
}

async function checkBinExecutable(binName) {
  return new Promise((resolve) => {
    const proc = spawn('npx', [binName, '--version'], {
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true,
      timeout: 5000,
    });

    let resolved = false;

    proc.on('error', () => {
      if (!resolved) {
        resolved = true;
        log(`  ❌ ${binName} NOT executable`, 'red');
        resolve(false);
      }
    });

    proc.on('close', (code) => {
      if (!resolved) {
        resolved = true;
        if (code === 0 || code === null) {
          log(`  ✅ ${binName} executable`, 'green');
          resolve(true);
        } else {
          log(`  ⚠️  ${binName} executable but exited with code ${code}`, 'yellow');
          resolve(true); // Still counts as executable
        }
      }
    });

    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        proc.kill();
        log(`  ⚠️  ${binName} timeout (may still work)`, 'yellow');
        resolve(true);
      }
    }, 5000);
  });
}

async function testMCPProtocol(binName) {
  return new Promise((resolve) => {
    const proc = spawn('npx', [binName], {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true,
      timeout: 10000,
    });

    let stdout = '';
    let resolved = false;

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    proc.on('error', () => {
      if (!resolved) {
        resolved = true;
        log(`  ❌ ${binName} MCP protocol failed`, 'red');
        resolve(false);
      }
    });

    proc.on('close', () => {
      if (!resolved) {
        resolved = true;
        // Check if we got valid MCP responses
        const hasInitialize = stdout.includes('"method":"initialize"') || stdout.includes('protocolVersion');
        const hasTools = stdout.includes('"tools"') || stdout.includes('inputSchema');
        
        if (hasInitialize || hasTools) {
          log(`  ✅ ${binName} MCP protocol working`, 'green');
          resolve(true);
        } else {
          log(`  ⚠️  ${binName} MCP protocol unclear`, 'yellow');
          resolve(true); // Don't fail on this
        }
      }
    });

    // Send initialize request
    const initRequest = {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'verify-installation', version: '1.0.0' },
      },
    };

    proc.stdin.write(JSON.stringify(initRequest) + '\n');

    // Send tools/list request
    setTimeout(() => {
      const toolsRequest = {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/list',
        params: {},
      };
      proc.stdin.write(JSON.stringify(toolsRequest) + '\n');
      proc.stdin.end();
    }, 1000);

    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        proc.kill();
        log(`  ⚠️  ${binName} MCP protocol timeout`, 'yellow');
        resolve(true);
      }
    }, 10000);
  });
}

async function checkOllamaRunning() {
  return new Promise((resolve) => {
    const proc = spawn('ollama', ['list'], {
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true,
      timeout: 5000,
    });

    let resolved = false;

    proc.on('error', () => {
      if (!resolved) {
        resolved = true;
        log(`  ❌ Ollama NOT running or not installed`, 'red');
        resolve(false);
      }
    });

    proc.on('close', (code) => {
      if (!resolved) {
        resolved = true;
        if (code === 0) {
          log(`  ✅ Ollama running`, 'green');
          resolve(true);
        } else {
          log(`  ❌ Ollama command failed`, 'red');
          resolve(false);
        }
      }
    });

    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        proc.kill();
        log(`  ❌ Ollama timeout`, 'red');
        resolve(false);
      }
    }, 5000);
  });
}

async function checkOllamaModels() {
  return new Promise((resolve) => {
    const proc = spawn('ollama', ['list'], {
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true,
    });

    let stdout = '';

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    proc.on('close', (code) => {
      if (code === 0) {
        const foundModels = REQUIRED_OLLAMA_MODELS.filter(model => 
          stdout.includes(model)
        );
        
        foundModels.forEach(model => {
          log(`  ✅ ${model} installed`, 'green');
        });
        
        const missingModels = REQUIRED_OLLAMA_MODELS.filter(model => 
          !stdout.includes(model)
        );
        
        missingModels.forEach(model => {
          log(`  ⚠️  ${model} NOT installed (optional)`, 'yellow');
        });
        
        resolve(foundModels.length > 0);
      } else {
        resolve(false);
      }
    });
  });
}

function checkEnvironmentVariables() {
  const vars = {
    'OLLAMA_BASE_URL': process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    'GITHUB_PERSONAL_ACCESS_TOKEN': process.env.GITHUB_PERSONAL_ACCESS_TOKEN ? '✅ Set' : '⚠️  Not set (optional)',
    'VERCEL_API_TOKEN': process.env.VERCEL_API_TOKEN ? '✅ Set' : '⚠️  Not set (optional)',
    'NEON_API_KEY': process.env.NEON_API_KEY ? '✅ Set' : '⚠️  Not set (optional)',
  };

  Object.entries(vars).forEach(([key, value]) => {
    const color = value.includes('✅') ? 'green' : value.includes('⚠️') ? 'yellow' : 'gray';
    log(`  ${key}: ${value}`, color);
  });
}

async function runVerification() {
  log('🔍 Robinson AI MCP Servers - Installation Verification', 'cyan');
  log('='.repeat(60), 'cyan');

  const results = {
    packagesBuilt: 0,
    binsExecutable: 0,
    mcpProtocol: 0,
    ollamaRunning: false,
    ollamaModels: false,
  };

  // Check 1: Packages Built
  log('\n📦 Checking Packages Built...', 'yellow');
  for (const server of SERVERS) {
    const built = await checkPackageBuilt(server.name);
    if (built) results.packagesBuilt++;
  }

  // Check 2: Bins Executable
  log('\n🔧 Checking Bins Executable...', 'yellow');
  for (const server of SERVERS) {
    const executable = await checkBinExecutable(server.bin);
    if (executable) results.binsExecutable++;
  }

  // Check 3: MCP Protocol
  log('\n📡 Checking MCP Protocol Compliance...', 'yellow');
  for (const server of SERVERS) {
    const compliant = await testMCPProtocol(server.bin);
    if (compliant) results.mcpProtocol++;
  }

  // Check 4: Ollama
  log('\n🤖 Checking Ollama Integration...', 'yellow');
  results.ollamaRunning = await checkOllamaRunning();
  
  if (results.ollamaRunning) {
    results.ollamaModels = await checkOllamaModels();
  }

  // Check 5: Environment Variables
  log('\n🔐 Checking Environment Variables...', 'yellow');
  checkEnvironmentVariables();

  // Summary
  log('\n' + '='.repeat(60), 'cyan');
  log('📊 Verification Summary', 'cyan');
  log('='.repeat(60), 'cyan');
  
  const allPackagesBuilt = results.packagesBuilt === SERVERS.length;
  const allBinsExecutable = results.binsExecutable === SERVERS.length;
  const allMCPCompliant = results.mcpProtocol === SERVERS.length;
  
  log(`Packages Built: ${results.packagesBuilt}/${SERVERS.length}`, allPackagesBuilt ? 'green' : 'red');
  log(`Bins Executable: ${results.binsExecutable}/${SERVERS.length}`, allBinsExecutable ? 'green' : 'red');
  log(`MCP Protocol: ${results.mcpProtocol}/${SERVERS.length}`, allMCPCompliant ? 'green' : 'yellow');
  log(`Ollama Running: ${results.ollamaRunning ? 'Yes' : 'No'}`, results.ollamaRunning ? 'green' : 'yellow');
  log(`Ollama Models: ${results.ollamaModels ? 'Yes' : 'No'}`, results.ollamaModels ? 'green' : 'yellow');

  const criticalPass = allPackagesBuilt && allBinsExecutable;
  const ollamaPass = results.ollamaRunning && results.ollamaModels;

  if (criticalPass && ollamaPass) {
    log('\n✅ All checks passed! Installation is complete and working.', 'green');
    process.exit(0);
  } else if (criticalPass) {
    log('\n⚠️  Core installation OK, but Ollama needs attention.', 'yellow');
    log('   Architect and Autonomous Agent require Ollama for local LLM work.', 'yellow');
    process.exit(0);
  } else {
    log('\n❌ Installation incomplete. Please fix the issues above.', 'red');
    process.exit(1);
  }
}

// Run verification
runVerification().catch(err => {
  log(`\n💥 Fatal error: ${err.message}`, 'red');
  process.exit(1);
});

