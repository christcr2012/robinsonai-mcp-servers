#!/usr/bin/env node

/**
 * Real-world test for Robinson's Toolkit
 * Tests GitHub, Vercel, and Neon integrations
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';
import { existsSync } from 'fs';

// Load environment variables from root directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..', '..');

// Try to load .env.local first, then .env.secrets
if (existsSync(join(rootDir, '.env.local'))) {
  config({ path: join(rootDir, '.env.local') });
}
if (existsSync(join(rootDir, '.env.secrets'))) {
  config({ path: join(rootDir, '.env.secrets') });
}

// Colors for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function callTool(toolName, args = {}) {
  return new Promise((resolve, reject) => {
    const serverPath = join(__dirname, 'dist', 'index.js');
    const child = spawn('node', [serverPath], {
      stdio: ['pipe', 'pipe', 'inherit'],
      env: process.env,
    });

    const request = JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: args,
      },
    }) + '\n';

    let output = '';
    let errorOutput = '';

    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Process exited with code ${code}\n${errorOutput}`));
        return;
      }

      try {
        // Parse the JSON-RPC response
        const lines = output.split('\n').filter(line => line.trim());
        for (const line of lines) {
          try {
            const parsed = JSON.parse(line);
            if (parsed.result) {
              resolve(parsed.result);
              return;
            }
          } catch (e) {
            // Skip non-JSON lines
          }
        }
        reject(new Error('No valid response found'));
      } catch (error) {
        reject(error);
      }
    });

    child.stdin.write(request);
    child.stdin.end();
  });
}

async function testGitHub() {
  log('\n=== Testing GitHub Integration ===', 'cyan');
  
  const testRepoName = `toolkit-test-${Date.now()}`;
  let repoCreated = false;

  try {
    // Step 1: Create a test repository
    log(`\n1. Creating test repository: ${testRepoName}`, 'blue');
    const createResult = await callTool('github_create_repo', {
      name: testRepoName,
      description: 'Temporary test repository for Robinson\'s Toolkit',
      private: true,
      auto_init: true,
    });
    
    log('   ✓ Repository created successfully', 'green');
    repoCreated = true;

    // Extract owner from the response
    const responseText = createResult.content[0].text;
    const responseData = JSON.parse(responseText);
    const owner = responseData.owner.login;
    
    log(`   Owner: ${owner}`, 'yellow');

    // Step 2: Verify the repository exists
    log(`\n2. Verifying repository exists`, 'blue');
    const getResult = await callTool('github_get_repo', {
      owner: owner,
      repo: testRepoName,
    });
    
    const repoData = JSON.parse(getResult.content[0].text);
    log(`   ✓ Repository verified: ${repoData.full_name}`, 'green');
    log(`   Created at: ${repoData.created_at}`, 'yellow');

    // Step 3: Delete the test repository
    log(`\n3. Cleaning up: Deleting test repository`, 'blue');
    await callTool('github_delete_repo', {
      owner: owner,
      repo: testRepoName,
    });
    
    log('   ✓ Repository deleted successfully', 'green');
    repoCreated = false;

    log('\n✅ GitHub Integration: PASSED', 'green');
    return true;

  } catch (error) {
    log(`\n❌ GitHub Integration: FAILED`, 'red');
    log(`Error: ${error.message}`, 'red');
    
    // Attempt cleanup if repo was created
    if (repoCreated) {
      log('\nAttempting cleanup...', 'yellow');
      try {
        const owner = process.env.GITHUB_TOKEN ? 'your-username' : 'unknown';
        await callTool('github_delete_repo', {
          owner: owner,
          repo: testRepoName,
        });
        log('✓ Cleanup successful', 'green');
      } catch (cleanupError) {
        log(`⚠ Cleanup failed: ${cleanupError.message}`, 'yellow');
        log(`Please manually delete repository: ${testRepoName}`, 'yellow');
      }
    }
    return false;
  }
}

async function testVercel() {
  log('\n=== Testing Vercel Integration ===', 'cyan');
  
  try {
    // List projects (read-only operation)
    log('\n1. Listing Vercel projects', 'blue');
    const result = await callTool('vercel_list_projects', {});
    
    const responseText = result.content[0].text;
    const data = JSON.parse(responseText);
    
    if (data.projects && Array.isArray(data.projects)) {
      log(`   ✓ Successfully retrieved ${data.projects.length} projects`, 'green');
      
      if (data.projects.length > 0) {
        log(`   First project: ${data.projects[0].name}`, 'yellow');
      }
    } else {
      log('   ✓ API call successful (no projects found)', 'green');
    }

    log('\n✅ Vercel Integration: PASSED', 'green');
    return true;

  } catch (error) {
    log(`\n❌ Vercel Integration: FAILED`, 'red');
    log(`Error: ${error.message}`, 'red');
    return false;
  }
}

async function testNeon() {
  log('\n=== Testing Neon Integration ===', 'cyan');
  
  try {
    // List projects (read-only operation)
    log('\n1. Listing Neon projects', 'blue');
    const result = await callTool('neon_list_projects', {});
    
    const responseText = result.content[0].text;
    const data = JSON.parse(responseText);
    
    if (data.projects && Array.isArray(data.projects)) {
      log(`   ✓ Successfully retrieved ${data.projects.length} projects`, 'green');
      
      if (data.projects.length > 0) {
        log(`   First project: ${data.projects[0].name}`, 'yellow');
      }
    } else {
      log('   ✓ API call successful (no projects found)', 'green');
    }

    log('\n✅ Neon Integration: PASSED', 'green');
    return true;

  } catch (error) {
    log(`\n❌ Neon Integration: FAILED`, 'red');
    log(`Error: ${error.message}`, 'red');
    return false;
  }
}

async function main() {
  log('╔════════════════════════════════════════════════════════╗', 'cyan');
  log('║   Robinson\'s Toolkit - Integration Test Suite         ║', 'cyan');
  log('╚════════════════════════════════════════════════════════╝', 'cyan');

  // Check environment variables
  log('\nChecking environment variables...', 'blue');
  const hasGitHub = !!process.env.GITHUB_TOKEN;
  const hasVercel = !!process.env.VERCEL_TOKEN;
  const hasNeon = !!process.env.NEON_API_KEY;

  log(`  GitHub Token: ${hasGitHub ? '✓' : '✗'}`, hasGitHub ? 'green' : 'red');
  log(`  Vercel Token: ${hasVercel ? '✓' : '✗'}`, hasVercel ? 'green' : 'red');
  log(`  Neon API Key: ${hasNeon ? '✓' : '✗'}`, hasNeon ? 'green' : 'red');

  if (!hasGitHub && !hasVercel && !hasNeon) {
    log('\n❌ No API tokens found. Please set environment variables.', 'red');
    process.exit(1);
  }

  const results = {
    github: false,
    vercel: false,
    neon: false,
  };

  // Run tests
  if (hasGitHub) {
    results.github = await testGitHub();
  } else {
    log('\n⚠ Skipping GitHub test (no token)', 'yellow');
  }

  if (hasVercel) {
    results.vercel = await testVercel();
  } else {
    log('\n⚠ Skipping Vercel test (no token)', 'yellow');
  }

  if (hasNeon) {
    results.neon = await testNeon();
  } else {
    log('\n⚠ Skipping Neon test (no token)', 'yellow');
  }

  // Summary
  log('\n╔════════════════════════════════════════════════════════╗', 'cyan');
  log('║                    Test Summary                        ║', 'cyan');
  log('╚════════════════════════════════════════════════════════╝', 'cyan');

  const passed = Object.values(results).filter(r => r === true).length;
  const total = Object.values(results).filter(r => r !== null).length;

  log(`\nGitHub:  ${results.github ? '✅ PASSED' : hasGitHub ? '❌ FAILED' : '⊘ SKIPPED'}`, 
      results.github ? 'green' : hasGitHub ? 'red' : 'yellow');
  log(`Vercel:  ${results.vercel ? '✅ PASSED' : hasVercel ? '❌ FAILED' : '⊘ SKIPPED'}`, 
      results.vercel ? 'green' : hasVercel ? 'red' : 'yellow');
  log(`Neon:    ${results.neon ? '✅ PASSED' : hasNeon ? '❌ FAILED' : '⊘ SKIPPED'}`, 
      results.neon ? 'green' : hasNeon ? 'red' : 'yellow');

  log(`\nTotal: ${passed}/${total} tests passed`, passed === total ? 'green' : 'yellow');

  if (passed === total && total > 0) {
    log('\n🎉 All tests passed! Robinson\'s Toolkit is working correctly.', 'green');
    process.exit(0);
  } else {
    log('\n⚠ Some tests failed. Please check the errors above.', 'yellow');
    process.exit(1);
  }
}

main().catch((error) => {
  log(`\n💥 Fatal error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});

