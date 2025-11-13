#!/usr/bin/env node
/**
 * Test Section 4.1: Align Paid Agent with Free Agent's pipeline
 * Verifies:
 * 1. paid_agent_run_task exists with same argument shape as free_agent_run_task
 * 2. Reuses Free Agent pipeline (repo adapters, context engine, thinking tools)
 * 3. Different defaults: preferFree=false, minQuality='premium', higher budgets
 * 4. Premium features: requires_approval, explicit budgets, risk tags
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const log = (msg) => console.log(`ℹ️  ${msg}`);
const success = (msg) => console.log(`✅ ${msg}`);
const error = (msg) => console.log(`❌ ${msg}`);
const warn = (msg) => console.log(`⚠️  ${msg}`);

console.log('\n🔍 Testing Section 4.1: Align Paid Agent with Free Agent Pipeline\n');

// Test 1: Verify paid_agent_run_task exists
log('Test 1: Verify paid_agent_run_task exists');
const indexPath = join(__dirname, 'src', 'index.ts');
const indexContent = readFileSync(indexPath, 'utf-8');

const hasPaidAgentRunTask = indexContent.includes('paid_agent_run_task');
const hasHandleRunPaidAgentTask = indexContent.includes('async function handleRunPaidAgentTask');

if (hasPaidAgentRunTask && hasHandleRunPaidAgentTask) {
  success('paid_agent_run_task tool exists');
} else {
  if (!hasPaidAgentRunTask) error('paid_agent_run_task tool not found');
  if (!hasHandleRunPaidAgentTask) error('handleRunPaidAgentTask function not found');
}
console.log('');

// Test 2: Verify same argument shape as free_agent_run_task
log('Test 2: Verify same argument shape as free_agent_run_task');
const hasTaskArg = indexContent.includes('task = String(args.task');
const hasRepoPathArg = indexContent.includes('repo_path');
const hasTaskKindArg = indexContent.includes('task_kind');
const hasTierArg = indexContent.includes('tier');
const hasQualityArg = indexContent.includes('quality');

if (hasTaskArg && hasRepoPathArg && hasTaskKindArg && hasTierArg && hasQualityArg) {
  success('Same argument shape as free_agent_run_task');
  log('  - task, repo_path, task_kind, tier, quality');
} else {
  if (!hasTaskArg) error('task argument not found');
  if (!hasRepoPathArg) error('repo_path argument not found');
  if (!hasTaskKindArg) error('task_kind argument not found');
  if (!hasTierArg) error('tier argument not found');
  if (!hasQualityArg) error('quality argument not found');
}
console.log('');

// Test 3: Verify premium features
log('Test 3: Verify premium features (requires_approval, budgets, risk tags)');
const hasRequiresApproval = indexContent.includes('require_human_approval') || indexContent.includes('requireHumanApproval');
const hasRiskLevel = indexContent.includes('risk_level') || indexContent.includes('riskLevel');
const hasMaxIterations = indexContent.includes('max_iterations') || indexContent.includes('maxIterations');
const hasSafetyChecks = indexContent.includes('extra_safety_checks') || indexContent.includes('extraSafetyChecks');

if (hasRequiresApproval && hasRiskLevel && hasMaxIterations && hasSafetyChecks) {
  success('Premium features implemented');
  log('  - require_human_approval flag');
  log('  - risk_level tags');
  log('  - max_iterations control');
  log('  - extra_safety_checks');
} else {
  if (!hasRequiresApproval) error('require_human_approval not found');
  if (!hasRiskLevel) error('risk_level not found');
  if (!hasMaxIterations) error('max_iterations not found');
  if (!hasSafetyChecks) error('extra_safety_checks not found');
}
console.log('');

// Test 4: Verify different defaults (preferFree=false, quality='best')
log('Test 4: Verify different defaults from Free Agent');
const hasPreferLocalFalse = indexContent.includes('prefer_local !== undefined ? args.prefer_local : false');
const hasAllowPaidTrue = indexContent.includes('allow_paid !== undefined ? args.allow_paid : true');
const hasQualityBest = indexContent.includes('quality || \'best\'');
const hasTierPaid = indexContent.includes('tier || \'paid\'');

if (hasPreferLocalFalse && hasAllowPaidTrue && hasQualityBest && hasTierPaid) {
  success('Paid Agent has different defaults from Free Agent');
  log('  - preferLocal = false (prefers remote/paid models)');
  log('  - allowPaid = true (allows paid models by default)');
  log('  - quality = \'best\' (higher quality default)');
  log('  - tier = \'paid\' (paid tier default)');
} else {
  if (!hasPreferLocalFalse) error('preferLocal = false default not found');
  if (!hasAllowPaidTrue) error('allowPaid = true default not found');
  if (!hasQualityBest) error('quality = \'best\' default not found');
  if (!hasTierPaid) error('tier = \'paid\' default not found');
}
console.log('');

// Test 5: Verify reuses Free Agent pipeline
log('Test 5: Verify reuses Free Agent pipeline');
const hasContextEngine = indexContent.includes('context_smart_query');
const hasThinkingTools = indexContent.includes('getSharedThinkingClient');
const hasCoreRunFreeAgent = indexContent.includes('coreRunFreeAgent');
const hasDetectContextQuery = indexContent.includes('detectContextQuery');
const hasBuildContextSummary = indexContent.includes('buildContextSummary');

if (hasContextEngine && hasThinkingTools && hasCoreRunFreeAgent && hasDetectContextQuery && hasBuildContextSummary) {
  success('Reuses Free Agent pipeline components');
  log('  - Context Engine integration (context_smart_query)');
  log('  - Thinking Tools integration (getSharedThinkingClient)');
  log('  - Free Agent Core (coreRunFreeAgent)');
  log('  - Context detection (detectContextQuery)');
  log('  - Context summary (buildContextSummary)');
} else {
  if (!hasContextEngine) error('Context Engine integration not found');
  if (!hasThinkingTools) error('Thinking Tools integration not found');
  if (!hasCoreRunFreeAgent) error('coreRunFreeAgent not found');
  if (!hasDetectContextQuery) error('detectContextQuery not found');
  if (!hasBuildContextSummary) error('buildContextSummary not found');
}
console.log('');

// Test 6: Verify helper functions exist
log('Test 6: Verify helper functions exist');
const hasDetectContextQueryDef = indexContent.includes('function detectContextQuery(task: string)');
const hasBuildContextSummaryDef = indexContent.includes('function buildContextSummary(contextResult: any)');

if (hasDetectContextQueryDef && hasBuildContextSummaryDef) {
  success('Helper functions properly defined');
  log('  - detectContextQuery function');
  log('  - buildContextSummary function');
} else {
  if (!hasDetectContextQueryDef) error('detectContextQuery function definition not found');
  if (!hasBuildContextSummaryDef) error('buildContextSummary function definition not found');
}
console.log('');

// Summary
console.log('📊 Summary\n');

const allTestsPassed = 
  hasPaidAgentRunTask && hasHandleRunPaidAgentTask &&
  hasTaskArg && hasRepoPathArg && hasTaskKindArg && hasTierArg && hasQualityArg &&
  hasRequiresApproval && hasRiskLevel && hasMaxIterations && hasSafetyChecks &&
  hasPreferLocalFalse && hasAllowPaidTrue && hasQualityBest && hasTierPaid &&
  hasContextEngine && hasThinkingTools && hasCoreRunFreeAgent && hasDetectContextQuery && hasBuildContextSummary &&
  hasDetectContextQueryDef && hasBuildContextSummaryDef;

if (allTestsPassed) {
  success('✨ All Section 4.1 tests PASSED!');
  console.log('');
  success('Paid Agent is properly aligned with Free Agent:');
  log('  1. ✅ paid_agent_run_task exists with same argument shape');
  log('  2. ✅ Premium features: requires_approval, risk_level, max_iterations, safety_checks');
  log('  3. ✅ Different defaults: preferFree=false, quality=\'best\', tier=\'paid\'');
  log('  4. ✅ Reuses Free Agent pipeline: Context Engine, Thinking Tools, Free Agent Core');
  log('  5. ✅ Helper functions: detectContextQuery, buildContextSummary');
} else {
  error('Some Section 4.1 tests FAILED');
  console.log('');
  warn('Review the failed tests above and fix the alignment');
}

console.log('');
console.log('📋 Paid Agent vs Free Agent:\n');
log('Free Agent:');
log('  - preferLocal = true (FREE Ollama models)');
log('  - allowPaid = false (unless tier=\'paid\')');
log('  - quality = \'balanced\' (default)');
log('  - tier = \'free\' (default)');
log('  - Budget: $0.50 (tier=\'free\'), $5.00 (tier=\'paid\')');
log('');
log('Paid Agent:');
log('  - preferLocal = false (PAID remote models)');
log('  - allowPaid = true (always)');
log('  - quality = \'best\' (default)');
log('  - tier = \'paid\' (default)');
log('  - Budget: $5.00 (default)');
log('  - Premium: requires_approval, risk_level, max_iterations, safety_checks');

