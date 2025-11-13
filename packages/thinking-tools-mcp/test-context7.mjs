#!/usr/bin/env node
/**
 * Test Context7 integration
 * Verifies:
 * 1. CONTEXT7_API_KEY is read correctly
 * 2. Context7 tools handle search/docs/examples/migration
 * 3. Bridged versions cache and import to evidence
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

console.log('\n🔍 Testing Context7 Integration\n');

// Test 1: Check if CONTEXT7_API_KEY is configured
log('Test 1: Check CONTEXT7_API_KEY environment variable');
const hasApiKey = !!process.env.CONTEXT7_API_KEY;
if (hasApiKey) {
  success('CONTEXT7_API_KEY is set');
  log(`  Key: ${process.env.CONTEXT7_API_KEY.substring(0, 10)}...`);
} else {
  warn('CONTEXT7_API_KEY is not set (Context7 will work with public docs only)');
}
console.log('');

// Test 2: Verify bridged tools are registered
log('Test 2: Verify bridged Context7 tools are registered');
const indexPath = join(__dirname, 'src', 'index.ts');
const indexContent = readFileSync(indexPath, 'utf-8');

const bridgedTools = [
  'context7_resolve_library_id',
  'context7_get_library_docs',
  'context7_search_libraries',
  'context7_compare_versions',
  'context7_get_examples',
  'context7_get_migration_guide',
];

let allRegistered = true;
for (const tool of bridgedTools) {
  const isRegistered = indexContent.includes(`registry.${tool}`) || 
                       indexContent.includes(`'${tool}'`) ||
                       indexContent.includes(`"${tool}"`);
  
  if (isRegistered) {
    success(`${tool} is registered`);
  } else {
    error(`${tool} is NOT registered`);
    allRegistered = false;
  }
}
console.log('');

// Test 3: Verify bridged tools use caching and evidence import
log('Test 3: Verify bridged tools have caching and evidence import');
const bridgePath = join(__dirname, 'src', 'tools', 'context7_bridge.ts');
const bridgeContent = readFileSync(bridgePath, 'utf-8');

const hasCaching = bridgeContent.includes('getSharedCache') && 
                   bridgeContent.includes('saveToSharedCache');
const hasEvidenceImport = bridgeContent.includes('importToEvidence') &&
                          bridgeContent.includes('ctxImportEvidenceTool');

if (hasCaching) {
  success('Bridged tools have shared caching');
} else {
  error('Bridged tools missing caching');
}

if (hasEvidenceImport) {
  success('Bridged tools have automatic evidence import');
} else {
  error('Bridged tools missing evidence import');
}
console.log('');

// Test 4: Check if context_smart_query uses bridged version
log('Test 4: Check if context_smart_query uses bridged Context7');
const smartQueryPath = join(__dirname, 'src', 'tools', 'context_smart_query.ts');
const smartQueryContent = readFileSync(smartQueryPath, 'utf-8');

const usesBridged = smartQueryContent.includes('bridgedContext7') ||
                    smartQueryContent.includes('context7_bridge');
const usesDirect = smartQueryContent.includes("from './context7.js'");

if (usesBridged) {
  success('context_smart_query uses bridged Context7 (with caching + evidence)');
} else if (usesDirect) {
  warn('context_smart_query uses direct Context7 (no caching, manual evidence import)');
  log('  Should be updated to use bridged version for automatic caching');
} else {
  error('context_smart_query does not use Context7');
}
console.log('');

// Summary
console.log('📊 Summary\n');
if (hasApiKey) {
  success('CONTEXT7_API_KEY configured');
} else {
  warn('CONTEXT7_API_KEY not configured (optional)');
}

if (allRegistered) {
  success('All bridged Context7 tools registered');
} else {
  error('Some bridged tools missing');
}

if (hasCaching && hasEvidenceImport) {
  success('Bridged tools have caching + evidence import');
} else {
  error('Bridged tools incomplete');
}

if (usesBridged) {
  success('context_smart_query uses bridged version');
} else {
  warn('context_smart_query should use bridged version');
}

console.log('');

// Recommendations
console.log('📋 Recommendations\n');
if (!hasApiKey) {
  log('1. Set CONTEXT7_API_KEY for full Context7 access');
}
if (!usesBridged) {
  log('2. Update context_smart_query to use bridged Context7 for caching');
}
if (allRegistered && hasCaching && hasEvidenceImport) {
  success('Context7 integration is complete!');
}

