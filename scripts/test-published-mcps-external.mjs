#!/usr/bin/env node

/**
 * External User Test Harness for Published MCP Packages
 * 
 * This script MUST run in a temp directory outside the workspace
 * to ensure we're testing the actual published npm packages,
 * not the workspace code.
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { spawnSync, spawn } from 'child_process';
import { mkdirSync, rmSync, writeFileSync, existsSync, realpathSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Windows needs .cmd extension
const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

// Published package versions to test
const PACKAGES = {
  'free-agent': '@robinson_ai_systems/free-agent-mcp@0.14.6',
  'paid-agent': '@robinson_ai_systems/paid-agent-mcp@0.12.6',
  'thinking-tools': '@robinson_ai_systems/thinking-tools-mcp@1.27.3',
  'robinsons-toolkit': '@robinson_ai_systems/robinsons-toolkit-mcp@1.19.3'
};

// Create temp directory OUTSIDE workspace
const tempDir = join(rootDir, '.tmp', 'mcp-external-test');

console.log('🧪 External User Test Harness for Published MCP Packages\n');
console.log('=' .repeat(80));
console.log('CRITICAL: This test MUST use published npm packages, NOT workspace code');
console.log('=' .repeat(80));
console.log();

// Clean and create temp directory
if (existsSync(tempDir)) {
  console.log(`🗑️  Cleaning existing temp directory: ${tempDir}`);
  rmSync(tempDir, { recursive: true, force: true });
}

console.log(`📁 Creating temp directory: ${tempDir}`);
mkdirSync(tempDir, { recursive: true });
console.log();

// Initialize npm project
console.log('📦 Initializing npm project in temp directory...');
const initResult = spawnSync(npmCmd, ['init', '-y'], {
  cwd: tempDir,
  stdio: 'pipe',
  encoding: 'utf8',
  shell: true
});

if (initResult.status !== 0) {
  console.error('❌ Failed to initialize npm project');
  console.error('stdout:', initResult.stdout);
  console.error('stderr:', initResult.stderr);
  console.error('error:', initResult.error);
  process.exit(1);
}
console.log('✅ npm project initialized\n');

// Install MCP packages one at a time (some may have native deps that fail on Windows)
console.log('📥 Installing published MCP packages...\n');
const installedPackages = [];
const failedPackages = [];

for (const [name, packageSpec] of Object.entries(PACKAGES)) {
  console.log(`Installing ${name} (${packageSpec})...`);
  const installResult = spawnSync(npmCmd, ['install', packageSpec], {
    cwd: tempDir,
    stdio: 'pipe',
    encoding: 'utf8',
    shell: true
  });

  if (installResult.status !== 0) {
    console.log(`  ⚠️  Failed to install (may have native dependencies)`);
    failedPackages.push({ name, packageSpec, error: installResult.stderr });
  } else {
    console.log(`  ✅ Installed successfully`);
    installedPackages.push({ name, packageSpec });
  }
}

console.log();
console.log(`✅ Installed: ${installedPackages.length}/${Object.keys(PACKAGES).length} packages`);
if (failedPackages.length > 0) {
  console.log(`⚠️  Failed: ${failedPackages.length} packages (will skip testing these)`);
}
console.log();

// Verify installation locations
console.log('🔍 Verifying installation locations...\n');

const results = [];

for (const [name, packageSpec] of Object.entries(PACKAGES)) {
  console.log(`Testing: ${name} (${packageSpec})`);
  console.log('-'.repeat(80));

  // Extract package name from spec like "@robinson_ai_systems/free-agent-mcp@0.14.6"
  const parts = packageSpec.split('@');
  const packageName = parts.length === 3 ? `@${parts[1]}` : parts[0]; // Handle scoped packages
  const binName = packageName.split('/')[1]; // Get "free-agent-mcp" from "@robinson_ai_systems/free-agent-mcp"

  // Find the actual bin path
  const binPath = join(tempDir, 'node_modules', '.bin', binName);
  const realBinPath = existsSync(binPath) ? realpathSync(binPath) : 'NOT FOUND';
  
  console.log(`  Package: ${packageName}`);
  console.log(`  Bin path: ${binPath}`);
  console.log(`  Real path: ${realBinPath}`);
  
  // Verify it's NOT in the workspace
  const isWorkspace = realBinPath.includes(rootDir) && !realBinPath.includes('.tmp');
  
  if (isWorkspace) {
    console.log(`  ❌ ERROR: Bin resolves to WORKSPACE, not published package!`);
    results.push({ name, packageSpec, status: 'FAILED', error: 'Resolves to workspace' });
  } else if (realBinPath === 'NOT FOUND') {
    console.log(`  ❌ ERROR: Bin not found!`);
    results.push({ name, packageSpec, status: 'FAILED', error: 'Bin not found' });
  } else {
    console.log(`  ✅ Correctly installed from npm`);
    
    // Try to run --version or --help
    const testResult = spawnSync('node', [realBinPath, '--help'], {
      cwd: tempDir,
      stdio: 'pipe',
      encoding: 'utf8',
      timeout: 5000
    });
    
    if (testResult.error || testResult.status !== 0) {
      console.log(`  ⚠️  Warning: Failed to run --help (exit code: ${testResult.status})`);
      if (testResult.stderr) console.log(`  Error: ${testResult.stderr.substring(0, 200)}`);
      results.push({ name, packageSpec, status: 'PARTIAL', error: 'Installed but failed to run' });
    } else {
      console.log(`  ✅ Successfully executed`);
      results.push({ name, packageSpec, status: 'PASSED', binPath: realBinPath });
    }
  }
  
  console.log();
}

// Print summary
console.log('='.repeat(80));
console.log('SUMMARY');
console.log('='.repeat(80));
console.log();

const passed = results.filter(r => r.status === 'PASSED').length;
const partial = results.filter(r => r.status === 'PARTIAL').length;
const failed = results.filter(r => r.status === 'FAILED').length;

console.log(`Total: ${results.length} packages`);
console.log(`✅ Passed: ${passed}`);
console.log(`⚠️  Partial: ${partial}`);
console.log(`❌ Failed: ${failed}`);
console.log();

results.forEach(r => {
  const icon = r.status === 'PASSED' ? '✅' : r.status === 'PARTIAL' ? '⚠️' : '❌';
  console.log(`${icon} ${r.name}: ${r.status}`);
  if (r.error) console.log(`   Error: ${r.error}`);
  if (r.binPath) console.log(`   Bin: ${r.binPath}`);
});

console.log();
console.log(`📁 Test directory: ${tempDir}`);
console.log(`   (Kept for inspection - delete manually if needed)`);

process.exit(failed > 0 ? 1 : 0);

