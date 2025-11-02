#!/usr/bin/env node

/**
 * Test script to verify duplicate tool names are fixed
 */

import fs from 'fs';
import path from 'path';

console.log('🔍 Testing duplicate tool names fix...\n');

// Read the source files to check for duplicate tool definitions
const freeAgentPath = 'packages/free-agent-mcp/src/index.ts';
const paidAgentPath = 'packages/paid-agent-mcp/src/index.ts';

if (!fs.existsSync(freeAgentPath) || !fs.existsSync(paidAgentPath)) {
  console.error('❌ Source files not found');
  process.exit(1);
}

const freeAgentContent = fs.readFileSync(freeAgentPath, 'utf8');
const paidAgentContent = fs.readFileSync(paidAgentPath, 'utf8');

// Extract tool names from both files
const extractToolNames = (content) => {
  const toolNames = new Set();
  const matches = content.matchAll(/name:\s*['"]([\w_-]+)['"],?\s*$/gm);
  for (const match of matches) {
    const toolName = match[1];
    if (toolName && toolName.includes('_') && !toolName.startsWith('_')) {
      toolNames.add(toolName);
    }
  }
  return toolNames;
};

const freeAgentTools = extractToolNames(freeAgentContent);
const paidAgentTools = extractToolNames(paidAgentContent);

console.log(`📦 Free Agent MCP tools: ${freeAgentTools.size}`);
console.log(`📦 Paid Agent MCP tools: ${paidAgentTools.size}`);

// Check for duplicates
const duplicates = new Set();
for (const tool of freeAgentTools) {
  if (paidAgentTools.has(tool)) {
    duplicates.add(tool);
  }
}

console.log(`\n🔍 Duplicate tools found: ${duplicates.size}`);

if (duplicates.size > 0) {
  console.log('\n🚨 DUPLICATES STILL EXIST:');
  for (const dup of duplicates) {
    console.log(`  - ${dup}`);
  }
  console.log('\n❌ Fix not complete - duplicates still present');
  process.exit(1);
} else {
  console.log('\n✅ No duplicate tool names found!');
  console.log('✅ MCP servers should now work without conflicts');
  
  // Check if the problematic file tools were removed from paid-agent
  const fileTools = ['file_str_replace', 'file_insert', 'file_save', 'file_delete', 'file_read'];
  const removedFromPaid = fileTools.filter(tool => !paidAgentTools.has(tool));
  const stillInFree = fileTools.filter(tool => freeAgentTools.has(tool));
  
  console.log(`\n📋 File tools removed from paid-agent: ${removedFromPaid.length}/5`);
  console.log(`📋 File tools still in free-agent: ${stillInFree.length}/5`);
  
  if (removedFromPaid.length === 5 && stillInFree.length === 5) {
    console.log('✅ File tools successfully moved to free-agent-mcp only');
  } else {
    console.log('⚠️  File tool migration may be incomplete');
  }
}

console.log('\n🎯 Next steps:');
console.log('1. Rebuild the paid-agent-mcp package');
console.log('2. Restart Augment to reload MCP servers');
console.log('3. Test that all tools work without duplicate errors');
