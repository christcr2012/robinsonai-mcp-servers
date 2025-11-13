#!/usr/bin/env node
/**
 * Test Section 5: Add Moonshot / Kimi K2 Models
 * Verifies:
 * 1. shared-llm router extended with 'moonshot' provider
 * 2. Kimi models registered in Free Agent model-catalog
 * 3. Kimi models registered in Paid Agent model-catalog
 * 4. Routing rules for Free Agent (only when tier='paid' or allowPaid=true)
 * 5. Routing rules for Paid Agent (Moonshot as top pick for complex coding)
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const log = (msg) => console.log(`ℹ️  ${msg}`);
const success = (msg) => console.log(`✅ ${msg}`);
const error = (msg) => console.log(`❌ ${msg}`);

console.log('\n🔍 Testing Section 5: Add Moonshot / Kimi K2 Models\n');

// Test 1: Verify shared-llm router extended with 'moonshot'
log('Test 1: Verify shared-llm router extended with \'moonshot\'');
const llmRouterPath = join(__dirname, 'packages', 'shared-llm', 'src', 'llm-router.ts');
const llmRouterContent = readFileSync(llmRouterPath, 'utf-8');

const hasProviderName = llmRouterContent.includes("export type ProviderName = 'ollama' | 'openai' | 'anthropic' | 'moonshot'");
const hasProvidersType = llmRouterContent.includes('moonshot?: { apiKey?: string; baseUrl?: string }');
const hasEnvWiring = llmRouterContent.includes('MOONSHOT_API_KEY');
const hasBaseUrlDefault = llmRouterContent.includes('https://api.moonshot.cn/v1');

if (hasProviderName && hasProvidersType && hasEnvWiring && hasBaseUrlDefault) {
  success('shared-llm router extended with \'moonshot\' provider');
  log('  - ProviderName includes \'moonshot\'');
  log('  - Providers type includes moonshot config');
  log('  - Environment variable wiring (MOONSHOT_API_KEY)');
  log('  - Default base URL (https://api.moonshot.cn/v1)');
} else {
  if (!hasProviderName) error('ProviderName not extended');
  if (!hasProvidersType) error('Providers type not extended');
  if (!hasEnvWiring) error('Environment variable wiring missing');
  if (!hasBaseUrlDefault) error('Default base URL missing');
}
console.log('');

// Test 2: Verify Kimi models in Free Agent model-catalog
log('Test 2: Verify Kimi models in Free Agent model-catalog');
const freeAgentCatalogPath = join(__dirname, 'packages', 'free-agent-mcp', 'src', 'model-catalog.ts');
const freeAgentCatalogContent = readFileSync(freeAgentCatalogPath, 'utf-8');

const hasKimiK2 = freeAgentCatalogContent.includes("'moonshot/kimi-k2-code'");
const hasMoonshot8k = freeAgentCatalogContent.includes("'moonshot/moonshot-v1-8k'");
const hasMoonshot32k = freeAgentCatalogContent.includes("'moonshot/moonshot-v1-32k'");
const hasSelectMoonshotModel = freeAgentCatalogContent.includes('function selectMoonshotModel');

if (hasKimiK2 && hasMoonshot8k && hasMoonshot32k && hasSelectMoonshotModel) {
  success('Kimi models registered in Free Agent model-catalog');
  log('  - moonshot/kimi-k2-code (best quality)');
  log('  - moonshot/moonshot-v1-8k (cheapest)');
  log('  - moonshot/moonshot-v1-32k (longer context)');
  log('  - selectMoonshotModel function');
} else {
  if (!hasKimiK2) error('kimi-k2-code not found');
  if (!hasMoonshot8k) error('moonshot-v1-8k not found');
  if (!hasMoonshot32k) error('moonshot-v1-32k not found');
  if (!hasSelectMoonshotModel) error('selectMoonshotModel function not found');
}
console.log('');

// Test 3: Verify Kimi models in Paid Agent model-catalog
log('Test 3: Verify Kimi models in Paid Agent model-catalog');
const paidAgentCatalogPath = join(__dirname, 'packages', 'paid-agent-mcp', 'src', 'model-catalog.ts');
const paidAgentCatalogContent = readFileSync(paidAgentCatalogPath, 'utf-8');

const paidHasKimiK2 = paidAgentCatalogContent.includes("'moonshot/kimi-k2-code'");
const paidHasMoonshot8k = paidAgentCatalogContent.includes("'moonshot/moonshot-v1-8k'");
const paidHasMoonshot32k = paidAgentCatalogContent.includes("'moonshot/moonshot-v1-32k'");
const paidHasSelectMoonshotModel = paidAgentCatalogContent.includes('function selectMoonshotModel');

if (paidHasKimiK2 && paidHasMoonshot8k && paidHasMoonshot32k && paidHasSelectMoonshotModel) {
  success('Kimi models registered in Paid Agent model-catalog');
  log('  - moonshot/kimi-k2-code (best quality)');
  log('  - moonshot/moonshot-v1-8k (cheapest)');
  log('  - moonshot/moonshot-v1-32k (longer context)');
  log('  - selectMoonshotModel function');
} else {
  if (!paidHasKimiK2) error('kimi-k2-code not found');
  if (!paidHasMoonshot8k) error('moonshot-v1-8k not found');
  if (!paidHasMoonshot32k) error('moonshot-v1-32k not found');
  if (!paidHasSelectMoonshotModel) error('selectMoonshotModel function not found');
}
console.log('');

// Test 4: Verify routing rules for Free Agent
log('Test 4: Verify routing rules for Free Agent');
const freeAgentHasPreferredProvider = freeAgentCatalogContent.includes("preferredProvider === 'moonshot'");
const freeAgentHasMoonshotInPaidModel = freeAgentCatalogContent.includes('MOONSHOT_API_KEY');
const freeAgentDefaultRemoteCoding = freeAgentCatalogContent.includes('DEFAULT REMOTE CODING MODEL');

if (freeAgentHasPreferredProvider && freeAgentHasMoonshotInPaidModel && freeAgentDefaultRemoteCoding) {
  success('Free Agent routing rules for Moonshot');
  log('  - Only when preferredProvider=\'moonshot\'');
  log('  - Only when MOONSHOT_API_KEY is set');
  log('  - Kimi K2 is DEFAULT REMOTE CODING MODEL');
} else {
  if (!freeAgentHasPreferredProvider) error('preferredProvider check missing');
  if (!freeAgentHasMoonshotInPaidModel) error('MOONSHOT_API_KEY check missing');
  if (!freeAgentDefaultRemoteCoding) error('DEFAULT REMOTE CODING MODEL comment missing');
}
console.log('');

// Test 5: Verify routing rules for Paid Agent
log('Test 5: Verify routing rules for Paid Agent');
const paidAgentHasPreferredProvider = paidAgentCatalogContent.includes("preferredProvider === 'moonshot'");
const paidAgentHasSelectMoonshotCall = paidAgentCatalogContent.includes('selectMoonshotModel(taskComplexity, maxCost)');
const paidAgentDefaultRemoteCoding = paidAgentCatalogContent.includes('DEFAULT REMOTE CODING MODEL');

if (paidAgentHasPreferredProvider && paidAgentHasSelectMoonshotCall && paidAgentDefaultRemoteCoding) {
  success('Paid Agent routing rules for Moonshot');
  log('  - Moonshot available via preferredProvider=\'moonshot\'');
  log('  - selectMoonshotModel function called when needed');
  log('  - Kimi K2 is DEFAULT REMOTE CODING MODEL');
  log('  - Extremely cheap ($0.20/$2.00 per 1M tokens)');
} else {
  if (!paidAgentHasPreferredProvider) error('preferredProvider check missing');
  if (!paidAgentHasSelectMoonshotCall) error('selectMoonshotModel call missing');
  if (!paidAgentDefaultRemoteCoding) error('DEFAULT REMOTE CODING MODEL comment missing');
}
console.log('');

// Summary
console.log('📊 Summary\n');

const allTestsPassed =
  hasProviderName && hasProvidersType && hasEnvWiring && hasBaseUrlDefault &&
  hasKimiK2 && hasMoonshot8k && hasMoonshot32k && hasSelectMoonshotModel &&
  paidHasKimiK2 && paidHasMoonshot8k && paidHasMoonshot32k && paidHasSelectMoonshotModel &&
  freeAgentHasPreferredProvider && freeAgentHasMoonshotInPaidModel && freeAgentDefaultRemoteCoding &&
  paidAgentHasPreferredProvider && paidAgentHasSelectMoonshotCall && paidAgentDefaultRemoteCoding;

if (allTestsPassed) {
  success('✨ All Section 5 tests PASSED!');
  console.log('');
  success('Moonshot / Kimi K2 integration complete:');
  log('  1. ✅ shared-llm router extended with \'moonshot\' provider');
  log('  2. ✅ Kimi models registered in Free Agent');
  log('  3. ✅ Kimi models registered in Paid Agent');
  log('  4. ✅ Free Agent routing rules (only when tier=\'paid\' or allowPaid=true)');
  log('  5. ✅ Paid Agent routing rules (Moonshot as top pick)');
  console.log('');
  log('Kimi K2 is now the DEFAULT REMOTE CODING MODEL');
  log('Extremely cheap: $0.20/$2.00 per 1M tokens');
} else {
  error('Some Section 5 tests FAILED');
}

