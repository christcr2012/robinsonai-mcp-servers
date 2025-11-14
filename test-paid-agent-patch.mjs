#!/usr/bin/env node
/**
 * Test Paid Agent patch generation end-to-end
 * Verifies that Paid Agent can generate valid patches using its own agent-core
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const testRepo = join(__dirname, 'test-paid-agent-patch');

console.log('[Test] Testing Paid Agent patch generation...');
console.log(`[Test] Test repo: ${testRepo}`);

// Simple task: Add a comment to hello.ts
const task = 'Add a comment at the top of hello.ts that says "// Greeting function"';

console.log(`[Test] Task: ${task}`);

// Call Paid Agent's free_agent_run tool
// This will use Paid Agent's own agent-core (not Free Agent)
const paidAgentPath = join(__dirname, 'packages', 'paid-agent-mcp', 'dist', 'index.js');

console.log(`[Test] Paid Agent path: ${paidAgentPath}`);

// Create a simple test by importing and calling the handler directly
async function testPaidAgent() {
  try {
    // Import Paid Agent (use file:// URL for Windows)
    const paidAgentUrl = new URL(`file:///${paidAgentPath.replace(/\\/g, '/')}`);
    const paidAgent = await import(paidAgentUrl.href);
    
    // Find the free_agent_run tool
    const tools = paidAgent.default?.tools || [];
    const freeAgentRunTool = tools.find(t => t.name === 'free_agent_run');
    
    if (!freeAgentRunTool) {
      console.error('[Test] ❌ free_agent_run tool not found in Paid Agent!');
      process.exit(1);
    }
    
    console.log('[Test] ✓ Found free_agent_run tool');
    
    // Call the handler
    console.log('[Test] Calling handler...');
    const result = await freeAgentRunTool.handler({
      repo: testRepo,
      task: task,
      kind: 'feature'
    });
    
    console.log('[Test] Result:', JSON.stringify(result, null, 2));
    
    // Check if patch was generated
    const helloContent = fs.readFileSync(join(testRepo, 'hello.ts'), 'utf8');
    console.log('[Test] hello.ts content after patch:');
    console.log(helloContent);
    
    if (helloContent.includes('// Greeting function')) {
      console.log('[Test] ✅ SUCCESS: Patch applied correctly!');
      process.exit(0);
    } else {
      console.log('[Test] ❌ FAIL: Patch not applied');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('[Test] ❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testPaidAgent();

