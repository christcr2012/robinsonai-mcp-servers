#!/usr/bin/env node
/**
 * Verify Context Engine tools exist and are documented
 * Part of Overhaul.txt Section 2.2
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const log = (msg) => console.log(`ℹ️  ${msg}`);
const success = (msg) => console.log(`✅ ${msg}`);
const error = (msg) => console.log(`❌ ${msg}`);
const info = (msg) => console.log(`📊 ${msg}`);

// Required tools from Overhaul.txt Section 2.2
const requiredTools = [
  'context_index_repo',
  'context_index_full',
  'context_query',
  'context_stats',
  'context_reset',
  'context_neighborhood',
  'context_retrieve_code',
  'context_find_symbol',
  'context_find_callers',
  'context_smart_query', // Front door tool
  'context_refresh', // New tool we added
];

console.log('\n🔍 Verifying Context Engine Tools\n');

// Read the index.ts file
const indexPath = join(__dirname, 'src', 'index.ts');
const indexContent = readFileSync(indexPath, 'utf-8');

let allFound = true;
const results = [];

for (const toolName of requiredTools) {
  // Check if tool is registered in the registry
  const registryPattern = new RegExp(`registry\\.${toolName}\\s*=|\\[.*${toolName}.*Descriptor\\.name\\]`, 'm');
  const isRegistered = registryPattern.test(indexContent);

  // Check if tool has a description
  const descPattern = new RegExp(`${toolName}.*description:\\s*['"](.+?)['"]`, 's');
  const descMatch = indexContent.match(descPattern);
  const hasDescription = !!descMatch;

  // Check if tool has inputSchema
  const schemaPattern = new RegExp(`${toolName}.*inputSchema:\\s*\\{`, 's');
  const hasSchema = schemaPattern.test(indexContent);

  const status = isRegistered && hasDescription && hasSchema;
  results.push({
    name: toolName,
    registered: isRegistered,
    documented: hasDescription,
    schema: hasSchema,
    status
  });

  if (!status) {
    allFound = false;
  }
}

// Print results
info('Tool Verification Results:\n');
for (const result of results) {
  const icon = result.status ? '✅' : '❌';
  console.log(`${icon} ${result.name}`);
  if (!result.registered) console.log(`   ⚠️  Not registered in registry`);
  if (!result.documented) console.log(`   ⚠️  Missing description`);
  if (!result.schema) console.log(`   ⚠️  Missing inputSchema`);
}

console.log('');

// Summary
const passed = results.filter(r => r.status).length;
const total = results.length;

if (allFound) {
  success(`All ${total} Context Engine tools are properly registered and documented!`);
  console.log('');
  info('Next: Test performance on this monorepo');
  process.exit(0);
} else {
  error(`${total - passed} tool(s) missing or incomplete`);
  process.exit(1);
}

