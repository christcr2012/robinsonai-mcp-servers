#!/usr/bin/env node

/**
 * MCP Server Diagnostic Tool
 * 
 * Tests each MCP server individually to identify which ones are causing issues.
 * Run this to diagnose "service unavailable" errors.
 */

const { spawn } = require('child_process');
const path = require('path');

const servers = [
  {
    name: 'GitHub MCP',
    path: 'packages/github-mcp/dist/index.js',
    env: { GITHUB_TOKEN: process.env.GITHUB_TOKEN || 'test_token' },
    requiresService: false
  },
  {
    name: 'Vercel MCP',
    path: 'packages/vercel-mcp/dist/index.js',
    env: { VERCEL_TOKEN: process.env.VERCEL_TOKEN || 'test_token' },
    requiresService: false
  },
  {
    name: 'Neon MCP',
    path: 'packages/neon-mcp/dist/index.js',
    env: { NEON_API_KEY: process.env.NEON_API_KEY || 'test_key' },
    requiresService: false
  },
  {
    name: 'Resend MCP',
    path: 'packages/resend-mcp/dist/index.js',
    env: { RESEND_API_KEY: process.env.RESEND_API_KEY || 'test_key' },
    requiresService: false
  },
  {
    name: 'Twilio MCP',
    path: 'packages/twilio-mcp/dist/index.js',
    env: {
      TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID || 'test_sid',
      TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN || 'test_token'
    },
    requiresService: false
  },
  {
    name: 'Cloudflare MCP',
    path: 'packages/cloudflare-mcp/dist/index.js',
    env: {
      CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN || 'test_token',
      CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID || 'test_id'
    },
    requiresService: false
  },
  {
    name: 'OpenAI MCP',
    path: 'packages/openai-mcp/dist/index.js',
    env: { OPENAI_API_KEY: process.env.OPENAI_API_KEY || 'test_key' },
    requiresService: false
  },
  {
    name: 'Redis MCP',
    path: 'packages/redis-mcp/dist/index.js',
    env: { REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379' },
    requiresService: true,
    serviceName: 'Redis server at localhost:6379'
  },
  {
    name: 'Google Workspace MCP',
    path: 'packages/google-workspace-mcp/dist/index.js',
    env: {
      GOOGLE_SERVICE_ACCOUNT_KEY: process.env.GOOGLE_SERVICE_ACCOUNT_KEY || 'test.json',
      GOOGLE_USER_EMAIL: process.env.GOOGLE_USER_EMAIL || 'test@example.com'
    },
    requiresService: true,
    serviceName: 'Google Workspace service account'
  }
];

async function testServer(server) {
  return new Promise((resolve) => {
    console.log(`\n🧪 Testing ${server.name}...`);
    
    if (server.requiresService) {
      console.log(`   ⚠️  Requires: ${server.serviceName}`);
    }

    const serverPath = path.join(__dirname, server.path);
    const child = spawn('node', [serverPath], {
      env: { ...process.env, ...server.env },
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let output = '';
    let errorOutput = '';
    let timedOut = false;

    // Set timeout for initialization
    const timeout = setTimeout(() => {
      timedOut = true;
      child.kill();
    }, 5000); // 5 second timeout

    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    child.on('close', (code) => {
      clearTimeout(timeout);

      if (timedOut) {
        console.log(`   ❌ TIMEOUT - Server took >5s to initialize`);
        console.log(`   💡 This server may be hanging on startup`);
        if (server.requiresService) {
          console.log(`   💡 Check if ${server.serviceName} is available`);
        }
        resolve({ name: server.name, status: 'timeout', issue: 'Initialization timeout' });
      } else if (code === 0 || output.includes('MCP server') || output.includes('tools')) {
        console.log(`   ✅ OK - Server initialized successfully`);
        resolve({ name: server.name, status: 'ok' });
      } else {
        console.log(`   ❌ ERROR - Server failed to initialize`);
        if (errorOutput) {
          console.log(`   Error: ${errorOutput.substring(0, 200)}`);
        }
        resolve({ name: server.name, status: 'error', error: errorOutput });
      }
    });

    // Send a test request to trigger initialization
    setTimeout(() => {
      try {
        child.stdin.write(JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/list',
          params: {}
        }) + '\n');
      } catch (e) {
        // Ignore write errors
      }
    }, 1000);
  });
}

async function main() {
  console.log('🔍 MCP Server Diagnostic Tool');
  console.log('================================\n');
  console.log('Testing each MCP server individually...');
  console.log('This will help identify which servers are causing issues.\n');

  const results = [];

  for (const server of servers) {
    const result = await testServer(server);
    results.push(result);
    await new Promise(resolve => setTimeout(resolve, 500)); // Brief pause between tests
  }

  console.log('\n\n📊 DIAGNOSTIC SUMMARY');
  console.log('================================\n');

  const ok = results.filter(r => r.status === 'ok');
  const timeout = results.filter(r => r.status === 'timeout');
  const error = results.filter(r => r.status === 'error');

  console.log(`✅ Working: ${ok.length}/${results.length}`);
  ok.forEach(r => console.log(`   - ${r.name}`));

  if (timeout.length > 0) {
    console.log(`\n⏱️  Timeout (likely hanging): ${timeout.length}`);
    timeout.forEach(r => console.log(`   - ${r.name}: ${r.issue}`));
  }

  if (error.length > 0) {
    console.log(`\n❌ Errors: ${error.length}`);
    error.forEach(r => console.log(`   - ${r.name}`));
  }

  console.log('\n\n💡 RECOMMENDATIONS');
  console.log('================================\n');

  if (timeout.length > 0 || error.length > 0) {
    console.log('⚠️  Some servers have issues. Recommendations:\n');
    
    timeout.forEach(r => {
      console.log(`${r.name}:`);
      const server = servers.find(s => s.name === r.name);
      if (server.requiresService) {
        console.log(`  - Verify ${server.serviceName} is running and accessible`);
      }
      console.log(`  - Consider removing from MCP configuration until issue is resolved\n`);
    });

    error.forEach(r => {
      console.log(`${r.name}:`);
      console.log(`  - Check credentials and configuration`);
      console.log(`  - Review error messages above`);
      console.log(`  - Consider removing from MCP configuration until issue is resolved\n`);
    });
  }

  if (ok.length >= 3) {
    console.log('✅ Recommended minimal configuration (working servers):');
    console.log('   Load these servers first:\n');
    ok.slice(0, 5).forEach(r => console.log(`   - ${r.name}`));
    
    if (ok.length > 5) {
      console.log(`\n   Additional working servers (add if needed):\n`);
      ok.slice(5).forEach(r => console.log(`   - ${r.name}`));
    }
  }

  console.log('\n📖 For detailed troubleshooting, see MCP_TROUBLESHOOTING.md');
}

main().catch(console.error);

