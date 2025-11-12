#!/usr/bin/env node
/**
 * CI Smoke Test: Verify Free Agent routing
 * Ensures that free_agent_run is the only path (no delegate_code_generation)
 */

const { spawnSync } = require('child_process');

console.log('🧪 Testing Free Agent routing...\n');

// Set environment variables for the test
const env = {
  ...process.env,
  FREE_AGENT_GENERATOR: 'packages/free-agent-mcp/dist/generation/mcp-generator.js',
  FREE_AGENT_TIER: 'paid',
  FREE_AGENT_QUALITY: 'best',
  FA_DISABLE_DELEGATE: '1',
  CODEGEN_VERBOSE: '1',
};

// Run a no-op task to test routing
const result = spawnSync(
  'pnpm',
  ['free-agent', '--repo', 'packages/robinsons-toolkit-mcp', '--task', 'noop'],
  {
    shell: true,
    encoding: 'utf8',
    env,
  }
);

const output = result.stdout + result.stderr;

// Check 1: Should use free_agent_run
if (!/free_agent_run/.test(output)) {
  console.error('❌ FAILED: free_agent_run not found in output');
  console.error('Output:', output);
  process.exit(1);
}

// Check 2: Should NOT use delegate_code_generation
if (/delegate_code_generation/.test(output)) {
  console.error('❌ FAILED: delegate_code_generation found in output (should be disabled)');
  console.error('Output:', output);
  process.exit(2);
}

// Check 3: Should use quality gates
if (!/quality=best/.test(output)) {
  console.error('❌ FAILED: quality=best not found in output');
  console.error('Output:', output);
  process.exit(3);
}

// Check 4: Should use sandbox
if (!/sandbox=true/.test(output)) {
  console.error('❌ FAILED: sandbox=true not found in output');
  console.error('Output:', output);
  process.exit(4);
}

console.log('✅ PASSED: Free Agent routing is correct');
console.log('  - Uses free_agent_run ✓');
console.log('  - Does NOT use delegate_code_generation ✓');
console.log('  - Uses quality=best ✓');
console.log('  - Uses sandbox=true ✓');
console.log('\n🎉 All checks passed!');

