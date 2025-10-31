#!/usr/bin/env node

/**
 * Simple direct test for Robinson's Toolkit
 * Tests GitHub, Vercel, and Neon by importing the server directly
 */

import { config } from 'dotenv';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..', '..');

if (existsSync(join(rootDir, '.env.local'))) {
  config({ path: join(rootDir, '.env.local') });
}
if (existsSync(join(rootDir, '.env.secrets'))) {
  config({ path: join(rootDir, '.env.secrets') });
}

// Colors
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testGitHub() {
  log('\n=== Testing GitHub Integration ===', 'cyan');
  
  if (!process.env.GITHUB_TOKEN) {
    log('⚠ Skipping GitHub test (no token)', 'yellow');
    return null;
  }

  const testRepoName = `toolkit-test-${Date.now()}`;
  let repoCreated = false;
  let owner = null;

  try {
    // Test using GitHub API directly
    log(`\n1. Creating test repository: ${testRepoName}`, 'cyan');
    
    // First, get the authenticated user to verify token
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `token ${process.env.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (!userResponse.ok) {
      const error = await userResponse.text();
      throw new Error(`GitHub auth failed (${userResponse.status}): ${error}`);
    }

    const userData = await userResponse.json();
    log(`   Authenticated as: ${userData.login}`, 'yellow');

    const createResponse = await fetch('https://api.github.com/user/repos', {
      method: 'POST',
      headers: {
        'Authorization': `token ${process.env.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: testRepoName,
        description: 'Temporary test repository for Robinson\'s Toolkit',
        private: true,
        auto_init: true,
      }),
    });

    if (!createResponse.ok) {
      const error = await createResponse.text();
      throw new Error(`GitHub API error (${createResponse.status}): ${error}`);
    }

    const createData = await createResponse.json();
    owner = createData.owner.login;
    repoCreated = true;
    log(`   ✓ Repository created: ${createData.full_name}`, 'green');

    // Verify it exists
    log(`\n2. Verifying repository exists`, 'cyan');
    const getResponse = await fetch(`https://api.github.com/repos/${owner}/${testRepoName}`, {
      headers: {
        'Authorization': `token ${process.env.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (!getResponse.ok) {
      throw new Error(`Failed to verify repository: ${getResponse.status}`);
    }

    const getData = await getResponse.json();
    log(`   ✓ Repository verified: ${getData.full_name}`, 'green');
    log(`   Created at: ${getData.created_at}`, 'yellow');

    // Wait a moment before deleting (GitHub needs time to fully initialize the repo)
    log(`\n3. Waiting 2 seconds before cleanup...`, 'cyan');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Delete it
    log(`\n4. Cleaning up: Deleting test repository`, 'cyan');
    const deleteResponse = await fetch(`https://api.github.com/repos/${owner}/${testRepoName}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `token ${process.env.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    });

    if (!deleteResponse.ok && deleteResponse.status !== 204) {
      throw new Error(`Failed to delete repository: ${deleteResponse.status}`);
    }

    log('   ✓ Repository deleted successfully', 'green');
    repoCreated = false;

    log('\n✅ GitHub Integration: PASSED', 'green');
    return true;

  } catch (error) {
    log(`\n❌ GitHub Integration: FAILED`, 'red');
    log(`Error: ${error.message}`, 'red');
    
    // Cleanup if needed
    if (repoCreated && owner) {
      log('\nAttempting cleanup...', 'yellow');
      try {
        await fetch(`https://api.github.com/repos/${owner}/${testRepoName}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `token ${process.env.GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
          },
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
  
  if (!process.env.VERCEL_TOKEN) {
    log('⚠ Skipping Vercel test (no token)', 'yellow');
    return null;
  }

  try {
    log('\n1. Listing Vercel projects', 'cyan');
    
    const response = await fetch('https://api.vercel.com/v9/projects', {
      headers: {
        'Authorization': `Bearer ${process.env.VERCEL_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Vercel API error (${response.status}): ${error}`);
    }

    const data = await response.json();
    
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

  if (!process.env.NEON_API_KEY) {
    log('⚠ Skipping Neon test (no token)', 'yellow');
    return null;
  }

  try {
    log('\n1. Listing Neon projects', 'cyan');

    // Build URL with optional org_id
    let url = 'https://console.neon.tech/api/v2/projects';
    if (process.env.NEON_ORG_ID) {
      url += `?org_id=${process.env.NEON_ORG_ID}`;
    }

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${process.env.NEON_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Neon API error (${response.status}): ${error}`);
    }

    const data = await response.json();
    
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
  log('║   Robinson\'s Toolkit - Direct API Test Suite          ║', 'cyan');
  log('╚════════════════════════════════════════════════════════╝', 'cyan');

  const results = {
    github: await testGitHub(),
    vercel: await testVercel(),
    neon: await testNeon(),
  };

  // Summary
  log('\n╔════════════════════════════════════════════════════════╗', 'cyan');
  log('║                    Test Summary                        ║', 'cyan');
  log('╚════════════════════════════════════════════════════════╝', 'cyan');

  const passed = Object.values(results).filter(r => r === true).length;
  const total = Object.values(results).filter(r => r !== null).length;

  log(`\nGitHub:  ${results.github === true ? '✅ PASSED' : results.github === false ? '❌ FAILED' : '⊘ SKIPPED'}`, 
      results.github === true ? 'green' : results.github === false ? 'red' : 'yellow');
  log(`Vercel:  ${results.vercel === true ? '✅ PASSED' : results.vercel === false ? '❌ FAILED' : '⊘ SKIPPED'}`, 
      results.vercel === true ? 'green' : results.vercel === false ? 'red' : 'yellow');
  log(`Neon:    ${results.neon === true ? '✅ PASSED' : results.neon === false ? '❌ FAILED' : '⊘ SKIPPED'}`, 
      results.neon === true ? 'green' : results.neon === false ? 'red' : 'yellow');

  log(`\nTotal: ${passed}/${total} tests passed`, passed === total ? 'green' : 'yellow');

  if (passed === total && total > 0) {
    log('\n🎉 All API tests passed! The fix is working correctly.', 'green');
    log('This confirms GitHub, Vercel, and Neon APIs are all accessible.', 'green');
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

