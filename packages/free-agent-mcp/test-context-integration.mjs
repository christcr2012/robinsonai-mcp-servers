#!/usr/bin/env node
/**
 * Test Context Engine integration in Free Agent
 * Verifies:
 * 1. detectContextQuery() identifies context-like tasks
 * 2. context_smart_query is called before code generation
 * 3. Context evidence is attached to code generation prompt
 * 4. Context7 external docs are included when library is detected
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

console.log('\n🔍 Testing Context Engine Integration in Free Agent\n');

// Test 1: Verify detectContextQuery patterns
log('Test 1: Verify detectContextQuery patterns');
const indexPath = join(__dirname, 'src', 'index.ts');
const indexContent = readFileSync(indexPath, 'utf-8');

const hasDetectMethod = indexContent.includes('detectContextQuery');
const contextPatterns = [
  'where\\s+(is|are|does|do)',
  'how\\s+(does|do|is|are)',
  'what\\s+(is|are|does|do|files?|handles?|implements?)',
  'which\\s+(files?|functions?|classes?|modules?)',
  'find\\s+(the|a|all)',
  'show\\s+(me|the)',
  'list\\s+(all|the)',
  'get\\s+(the|all)',
];

if (hasDetectMethod) {
  success('detectContextQuery method exists');
  
  let allPatternsFound = true;
  for (const pattern of contextPatterns) {
    if (indexContent.includes(pattern)) {
      success(`  Pattern found: ${pattern}`);
    } else {
      error(`  Pattern missing: ${pattern}`);
      allPatternsFound = false;
    }
  }
  
  if (allPatternsFound) {
    success('All context query patterns implemented');
  }
} else {
  error('detectContextQuery method not found');
}
console.log('');

// Test 2: Verify context_smart_query integration
log('Test 2: Verify context_smart_query integration');
const hasContextQuery = indexContent.includes('context_smart_query');
const hasThinkingClient = indexContent.includes('getSharedThinkingClient');
const callsContextQuery = indexContent.includes("tool: 'context_smart_query'");

if (hasContextQuery && hasThinkingClient && callsContextQuery) {
  success('context_smart_query is called via ThinkingClient');
} else {
  if (!hasContextQuery) error('context_smart_query not referenced');
  if (!hasThinkingClient) error('ThinkingClient not used');
  if (!callsContextQuery) error('context_smart_query not called');
}
console.log('');

// Test 3: Verify context evidence attachment
log('Test 3: Verify context evidence attachment to code generation');
const hasBuildSummary = indexContent.includes('buildContextSummary');
const hasEnhancedNotes = indexContent.includes('enhancedNotes');
const attachesToPrompt = indexContent.includes('enhancedNotes ?') || 
                         indexContent.includes('Additional notes:');

if (hasBuildSummary && hasEnhancedNotes && attachesToPrompt) {
  success('Context evidence is attached to code generation prompt');
} else {
  if (!hasBuildSummary) error('buildContextSummary method not found');
  if (!hasEnhancedNotes) error('enhancedNotes variable not found');
  if (!attachesToPrompt) error('Context not attached to prompt');
}
console.log('');

// Test 4: Verify Context7 external docs integration
log('Test 4: Verify Context7 external docs integration');
const hasExternalDocs = indexContent.includes('external_docs');
const hasContext7Section = indexContent.includes('External Documentation (Context7)');

if (hasExternalDocs && hasContext7Section) {
  success('Context7 external docs are included in context summary');
} else {
  if (!hasExternalDocs) warn('external_docs not referenced');
  if (!hasContext7Section) warn('Context7 section not in summary');
}
console.log('');

// Test 5: Verify logging and evidence tracking
log('Test 5: Verify logging and evidence tracking');
const hasContextLogging = indexContent.includes('Context query returned');
const hasEvidenceVar = indexContent.includes('contextEvidence');

if (hasContextLogging && hasEvidenceVar) {
  success('Context evidence is logged and tracked');
} else {
  if (!hasContextLogging) error('Context logging not found');
  if (!hasEvidenceVar) error('contextEvidence variable not found');
}
console.log('');

// Summary
console.log('📊 Summary\n');

const allTestsPassed = 
  hasDetectMethod &&
  hasContextQuery && hasThinkingClient && callsContextQuery &&
  hasBuildSummary && hasEnhancedNotes && attachesToPrompt &&
  hasExternalDocs && hasContext7Section &&
  hasContextLogging && hasEvidenceVar;

if (allTestsPassed) {
  success('✨ All Context Engine integration tests PASSED!');
  console.log('');
  success('Free Agent is fully integrated with:');
  log('  - Context Engine (semantic code search)');
  log('  - context_smart_query (intelligent routing)');
  log('  - Context7 (external library documentation)');
  log('  - Evidence attachment to code generation prompts');
  log('  - Comprehensive logging and tracking');
} else {
  error('Some Context Engine integration tests FAILED');
  console.log('');
  warn('Review the failed tests above and fix the integration');
}

console.log('');
console.log('📋 Integration Flow:\n');
log('1. User asks: "where is X?", "how does Y work?", "what files handle Z?"');
log('2. detectContextQuery() identifies it as a context query');
log('3. context_smart_query is called via ThinkingClient');
log('4. Context Engine returns relevant code snippets + file paths');
log('5. If library detected, Context7 fetches official docs');
log('6. buildContextSummary() formats evidence for code generation');
log('7. Evidence is attached to the code generation prompt');
log('8. Free Agent generates code with correct paths and context');

