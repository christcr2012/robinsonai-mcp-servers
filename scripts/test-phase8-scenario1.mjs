#!/usr/bin/env node

/**
 * Test Phase 8 Scenario 1 using LOCAL workspace packages
 * This bypasses MCP and tests the agents directly
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { spawnSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const testRepo = join(rootDir, 'test-repos', 'agent-playground');

console.log('🧪 Phase 8 Scenario 1: Add Subtract Command\n');

// Reset test repo
console.log('🔄 Resetting test repo...');
const reset = spawnSync('git', ['reset', '--hard', '930e7ed'], {
  cwd: testRepo,
  stdio: 'inherit'
});

if (reset.status !== 0) {
  console.error('❌ Failed to reset test repo');
  process.exit(1);
}

console.log('✅ Test repo reset\n');

// Test Free Agent
console.log('=' .repeat(80));
console.log('FREE AGENT - Scenario 1');
console.log('='.repeat(80));
console.log();

const freeAgentResult = spawnSync('node', [
  join(rootDir, 'packages', 'free-agent-mcp', 'dist', 'cli.js'),
  'run',
  '--repo', testRepo,
  '--task', 'Add a subtract command to the calculator CLI. It should accept two numbers and return their difference.',
  '--kind', 'feature'
], {
  cwd: rootDir,
  stdio: 'inherit',
  env: {
    ...process.env,
    OLLAMA_BASE_URL: 'http://localhost:11434',
    FREE_AGENT_QUALITY: 'balanced',
    FREE_AGENT_TIER: 'free'
  }
});

console.log();
if (freeAgentResult.status === 0) {
  console.log('✅ FREE AGENT PASSED');
} else {
  console.log(`❌ FREE AGENT FAILED (exit code: ${freeAgentResult.status})`);
}

console.log();
console.log('Test complete!');
console.log();
console.log('Next steps:');
console.log('1. Check test-repos/agent-playground for changes');
console.log('2. Run: cd test-repos/agent-playground && npm install && npm run build && npm test');
console.log('3. Verify the subtract command works');

