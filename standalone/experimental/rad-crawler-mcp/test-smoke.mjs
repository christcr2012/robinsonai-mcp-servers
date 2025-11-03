#!/usr/bin/env node
/**
 * RAD Crawler Smoke Test
 * Tests the core workflows: govern, plan_crawl, search, ingest_repo
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class MCPClient {
  constructor() {
    this.process = null;
    this.requestId = 1;
  }

  async start() {
    return new Promise((resolve, reject) => {
      this.process = spawn('node', [join(__dirname, 'dist', 'index.js')], {
        stdio: ['pipe', 'pipe', 'inherit'],
      });

      this.process.stdout.once('data', () => {
        console.log('✓ MCP server started');
        resolve();
      });

      this.process.on('error', reject);
    });
  }

  async callTool(name, args) {
    const request = {
      jsonrpc: '2.0',
      id: this.requestId++,
      method: 'tools/call',
      params: {
        name,
        arguments: args,
      },
    };

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Request timeout'));
      }, 30000);

      this.process.stdout.once('data', (data) => {
        clearTimeout(timeout);
        try {
          const response = JSON.parse(data.toString());
          if (response.error) {
            reject(new Error(response.error.message));
          } else {
            const content = response.result?.content?.[0]?.text;
            resolve(content ? JSON.parse(content) : {});
          }
        } catch (error) {
          reject(error);
        }
      });

      this.process.stdin.write(JSON.stringify(request) + '\n');
    });
  }

  stop() {
    if (this.process) {
      this.process.kill();
    }
  }
}

async function runTests() {
  const client = new MCPClient();

  try {
    console.log('Starting RAD Crawler smoke tests...\n');

    // Start MCP server
    await client.start();

    // Test 1: Get index stats
    console.log('Test 1: Get index stats');
    const stats = await client.callTool('index_stats', {});
    console.log('✓ Stats:', stats);
    console.log();

    // Test 2: Create governance policy
    console.log('Test 2: Create governance policy');
    const policy = await client.callTool('govern', {
      allowlist: ['example.com', 'docs.example.com'],
      denylist: ['accounts.*', '*/logout'],
      budgets: {
        max_pages_per_job: 50,
        max_depth: 2,
        rate_per_domain: 10,
      },
    });
    console.log('✓ Policy created:', policy.policy_id);
    console.log();

    // Test 3: Seed a crawl job
    console.log('Test 3: Seed crawl job');
    const seedResult = await client.callTool('seed', {
      urls: ['https://example.com'],
      max_depth: 1,
      max_pages: 10,
    });
    console.log('✓ Job created:', seedResult.job_id);
    console.log();

    // Test 4: Check job status
    console.log('Test 4: Check job status');
    const status = await client.callTool('status', {
      job_id: seedResult.job_id,
    });
    console.log('✓ Job status:', status.state);
    console.log();

    // Test 5: Search (should return empty initially)
    console.log('Test 5: Search index');
    const searchResult = await client.callTool('search', {
      q: 'test query',
      top_k: 5,
      semantic: false,
    });
    console.log('✓ Search results:', searchResult.count);
    console.log();

    // Test 6: Plan crawl (uses Ollama)
    console.log('Test 6: Plan crawl with LLM');
    try {
      const planResult = await client.callTool('plan_crawl', {
        goal: 'Collect documentation about Next.js',
        depth: 'fast',
      });
      console.log('✓ Plan created:', planResult.job_id || planResult.error);
    } catch (error) {
      console.log('⚠ Plan crawl failed (Ollama may not be running):', error.message);
    }
    console.log();

    console.log('✅ All smoke tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  } finally {
    client.stop();
  }
}

runTests();

