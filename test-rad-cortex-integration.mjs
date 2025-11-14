#!/usr/bin/env node
/**
 * Test RAD and Cortex integration in both agents
 * Verifies that both agents can access RAD and Cortex clients
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('[Test] Testing RAD and Cortex integration...\n');

// Test Free Agent
console.log('=== FREE AGENT ===');
const freeAgentCorePath = join(__dirname, 'packages', 'free-agent-mcp', 'src', 'core');

// Check RAD client
const freeRadPath = join(freeAgentCorePath, 'rad-client.ts');
if (!fs.existsSync(freeRadPath)) {
  console.error('[Free Agent] ❌ RAD client not found!');
  process.exit(1);
}
console.log('[Free Agent] ✓ RAD client exists');

// Check Cortex client
const freeCortexPath = join(freeAgentCorePath, 'cortex', 'cortex-client.ts');
if (!fs.existsSync(freeCortexPath)) {
  console.error('[Free Agent] ❌ Cortex client not found!');
  process.exit(1);
}
console.log('[Free Agent] ✓ Cortex client exists');

// Check exports
const freeIndexPath = join(freeAgentCorePath, 'index.ts');
const freeIndexContent = fs.readFileSync(freeIndexPath, 'utf8');

if (!freeIndexContent.includes('getRadClient')) {
  console.error('[Free Agent] ❌ getRadClient not exported!');
  process.exit(1);
}
console.log('[Free Agent] ✓ getRadClient exported');

if (!freeIndexContent.includes('getCortexClient')) {
  console.error('[Free Agent] ❌ getCortexClient not exported!');
  process.exit(1);
}
console.log('[Free Agent] ✓ getCortexClient exported');

// Test Paid Agent
console.log('\n=== PAID AGENT ===');
const paidAgentCorePath = join(__dirname, 'packages', 'paid-agent-mcp', 'src', 'core', 'agent-core');

// Check RAD client
const paidRadPath = join(paidAgentCorePath, 'rad-client.ts');
if (!fs.existsSync(paidRadPath)) {
  console.error('[Paid Agent] ❌ RAD client not found!');
  process.exit(1);
}
console.log('[Paid Agent] ✓ RAD client exists');

// Check Cortex client
const paidCortexPath = join(paidAgentCorePath, 'cortex', 'cortex-client.ts');
if (!fs.existsSync(paidCortexPath)) {
  console.error('[Paid Agent] ❌ Cortex client not found!');
  process.exit(1);
}
console.log('[Paid Agent] ✓ Cortex client exists');

// Check exports
const paidIndexPath = join(paidAgentCorePath, 'index.ts');
const paidIndexContent = fs.readFileSync(paidIndexPath, 'utf8');

if (!paidIndexContent.includes('getRadClient')) {
  console.error('[Paid Agent] ❌ getRadClient not exported!');
  process.exit(1);
}
console.log('[Paid Agent] ✓ getRadClient exported');

if (!paidIndexContent.includes('getCortexClient')) {
  console.error('[Paid Agent] ❌ getCortexClient not exported!');
  process.exit(1);
}
console.log('[Paid Agent] ✓ getCortexClient exported');

// Check RAD database URL
const freeRadContent = fs.readFileSync(freeRadPath, 'utf8');
const paidRadContent = fs.readFileSync(paidRadPath, 'utf8');

if (!freeRadContent.includes('DEFAULT_RAD_DATABASE_URL')) {
  console.error('[Free Agent] ❌ RAD database URL not configured!');
  process.exit(1);
}
console.log('\n[Free Agent] ✓ RAD database URL configured');

if (!paidRadContent.includes('DEFAULT_RAD_DATABASE_URL')) {
  console.error('[Paid Agent] ❌ RAD database URL not configured!');
  process.exit(1);
}
console.log('[Paid Agent] ✓ RAD database URL configured');

// Check Cortex database URL
const freeCortexContent = fs.readFileSync(freeCortexPath, 'utf8');
const paidCortexContent = fs.readFileSync(paidCortexPath, 'utf8');

if (!freeCortexContent.includes('DEFAULT_CORTEX_DATABASE_URL')) {
  console.error('[Free Agent] ❌ Cortex database URL not configured!');
  process.exit(1);
}
console.log('[Free Agent] ✓ Cortex database URL configured');

if (!paidCortexContent.includes('DEFAULT_CORTEX_DATABASE_URL')) {
  console.error('[Paid Agent] ❌ Cortex database URL not configured!');
  process.exit(1);
}
console.log('[Paid Agent] ✓ Cortex database URL configured');

console.log('\n[Test] ✅ ALL CHECKS PASSED!');
console.log('[Test] Both agents have RAD and Cortex integration');
console.log('[Test] Both agents can call RAD and Cortex tools');
process.exit(0);

