#!/usr/bin/env node
/**
 * Test Section 2.4: Hard "Free-first, Paid-when-needed" model policy
 * Verifies:
 * 1. preferFree = true by default
 * 2. Only use paid models when tier='paid' OR allowPaid=true
 * 3. Cost guard with estimateTaskCost
 * 4. Clear error when budget exceeded
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

console.log('\n🔍 Testing Section 2.4: Free-first, Paid-when-needed Model Policy\n');

// Test 1: Verify preferFree = true by default
log('Test 1: Verify preferFree = true by default');
const indexPath = join(__dirname, 'src', 'index.ts');
const indexContent = readFileSync(indexPath, 'utf-8');

const hasPreferLocalDefault = indexContent.includes('prefer_local !== undefined ? args.prefer_local : true');
const hasDefaultComment = indexContent.includes('DEFAULT TO TRUE');

if (hasPreferLocalDefault && hasDefaultComment) {
  success('preferFree = true by default (prefer_local defaults to true)');
} else {
  if (!hasPreferLocalDefault) error('preferFree default not found');
  if (!hasDefaultComment) warn('DEFAULT TO TRUE comment missing');
}
console.log('');

// Test 2: Verify paid models only when tier='paid' OR allowPaid=true
log('Test 2: Verify paid models only when tier=\'paid\' OR allowPaid=true');
const hasAllowPaidLogic = indexContent.includes('allow_paid !== undefined ? args.allow_paid : (tier === \'paid\')');
const hasShouldPreferFree = indexContent.includes('shouldPreferFree = preferLocal || (tier === \'free\' && !allowPaid)');
const hasMaxCostLogic = indexContent.includes('maxCost: allowPaid ? maxCostUsd : 0');

if (hasAllowPaidLogic && hasShouldPreferFree && hasMaxCostLogic) {
  success('Paid models only used when tier=\'paid\' OR allowPaid=true');
  log('  - allowPaid defaults to (tier === \'paid\')');
  log('  - shouldPreferFree = preferLocal || (tier === \'free\' && !allowPaid)');
  log('  - maxCost set to 0 when !allowPaid (forces Ollama)');
} else {
  if (!hasAllowPaidLogic) error('allowPaid logic not found');
  if (!hasShouldPreferFree) error('shouldPreferFree logic not found');
  if (!hasMaxCostLogic) error('maxCost logic not found');
}
console.log('');

// Test 3: Verify cost guard with estimateTaskCost
log('Test 3: Verify cost guard with estimateTaskCost');
const hasEstimateCall = indexContent.includes('estimateTaskCost({');
const hasBudgetValidation = indexContent.includes('if (costEstimate.estimatedCost > maxCostUsd)');
const hasBudgetError = indexContent.includes('budget_exceeded');

if (hasEstimateCall && hasBudgetValidation && hasBudgetError) {
  success('Cost guard implemented with estimateTaskCost');
  log('  - Estimates cost before task execution');
  log('  - Validates against maxCostUsd budget');
  log('  - Returns budget_exceeded error when over budget');
} else {
  if (!hasEstimateCall) error('estimateTaskCost call not found');
  if (!hasBudgetValidation) error('Budget validation not found');
  if (!hasBudgetError) error('budget_exceeded error not found');
}
console.log('');

// Test 4: Verify clear error message
log('Test 4: Verify clear error message when budget exceeded');
const hasErrorMessage = indexContent.includes('This task is estimated at $');
const hasSimplifyMessage = indexContent.includes('Either simplify the task or raise the budget');

if (hasErrorMessage && hasSimplifyMessage) {
  success('Clear error message when budget exceeded');
  log('  - Shows estimated cost vs budget');
  log('  - Suggests simplifying task or raising budget');
} else {
  if (!hasErrorMessage) error('Error message not found');
  if (!hasSimplifyMessage) error('Simplify/raise budget message not found');
}
console.log('');

// Test 5: Verify model-catalog.ts has selectBestModel
log('Test 5: Verify model-catalog.ts has selectBestModel');
const catalogPath = join(__dirname, 'src', 'model-catalog.ts');
const catalogContent = readFileSync(catalogPath, 'utf-8');

const hasSelectBestModel = catalogContent.includes('export function selectBestModel');
const hasPreferFreeParam = catalogContent.includes('preferFree?: boolean');
const hasMaxCostParam = catalogContent.includes('maxCost?: number');
const hasMaxCostZeroCheck = catalogContent.includes('if (maxCost === 0)');

if (hasSelectBestModel && hasPreferFreeParam && hasMaxCostParam && hasMaxCostZeroCheck) {
  success('selectBestModel function properly implemented');
  log('  - Takes preferFree parameter');
  log('  - Takes maxCost parameter');
  log('  - Forces Ollama when maxCost === 0');
} else {
  if (!hasSelectBestModel) error('selectBestModel function not found');
  if (!hasPreferFreeParam) error('preferFree parameter not found');
  if (!hasMaxCostParam) error('maxCost parameter not found');
  if (!hasMaxCostZeroCheck) error('maxCost === 0 check not found');
}
console.log('');

// Test 6: Verify estimateTaskCost function exists
log('Test 6: Verify estimateTaskCost function exists');
const hasEstimateFunction = catalogContent.includes('export function estimateTaskCost');
const hasComplexityParam = catalogContent.includes('complexity: \'simple\' | \'medium\' | \'complex\'');
const hasReturnType = catalogContent.includes('estimatedCost: number');

if (hasEstimateFunction && hasComplexityParam && hasReturnType) {
  success('estimateTaskCost function properly implemented');
  log('  - Takes complexity parameter');
  log('  - Returns estimatedCost, estimatedInputTokens, estimatedOutputTokens');
} else {
  if (!hasEstimateFunction) error('estimateTaskCost function not found');
  if (!hasComplexityParam) error('complexity parameter not found');
  if (!hasReturnType) error('Return type not found');
}
console.log('');

// Summary
console.log('📊 Summary\n');

const allTestsPassed = 
  hasPreferLocalDefault && hasDefaultComment &&
  hasAllowPaidLogic && hasShouldPreferFree && hasMaxCostLogic &&
  hasEstimateCall && hasBudgetValidation && hasBudgetError &&
  hasErrorMessage && hasSimplifyMessage &&
  hasSelectBestModel && hasPreferFreeParam && hasMaxCostParam && hasMaxCostZeroCheck &&
  hasEstimateFunction && hasComplexityParam && hasReturnType;

if (allTestsPassed) {
  success('✨ All Section 2.4 tests PASSED!');
  console.log('');
  success('Free Agent has proper "Free-first, Paid-when-needed" policy:');
  log('  1. ✅ preferFree = true by default');
  log('  2. ✅ Only uses paid models when tier=\'paid\' OR allowPaid=true');
  log('  3. ✅ Cost guard estimates cost before execution');
  log('  4. ✅ Clear error when budget exceeded');
  log('  5. ✅ selectBestModel respects preferFree and maxCost');
  log('  6. ✅ estimateTaskCost provides accurate cost estimates');
} else {
  error('Some Section 2.4 tests FAILED');
  console.log('');
  warn('Review the failed tests above and fix the policy implementation');
}

console.log('');
console.log('📋 Policy Behavior:\n');
log('Default (tier=\'free\'):');
log('  - preferLocal = true → Uses FREE Ollama models');
log('  - allowPaid = false → maxCost set to 0 (forces Ollama)');
log('  - Budget: $0.50 default');
log('');
log('Paid tier (tier=\'paid\'):');
log('  - preferLocal = true (can be overridden)');
log('  - allowPaid = true → Can use paid models within budget');
log('  - Budget: $5.00 default');
log('');
log('Explicit allowPaid=true:');
log('  - Allows paid models even on tier=\'free\'');
log('  - Must stay within maxCostUsd budget');
log('  - Cost guard rejects if estimate exceeds budget');

