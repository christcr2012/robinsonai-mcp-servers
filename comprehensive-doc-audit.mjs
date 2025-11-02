#!/usr/bin/env node

/**
 * Comprehensive Documentation Audit
 * 
 * Uses Context Engine to analyze ALL documentation and determine:
 * 1. What plans are complete
 * 2. What plans are in progress
 * 3. What plans are outdated/no longer apply
 * 4. What plans have evolved
 * 5. What the current state actually is
 */

import { indexRepo } from './packages/thinking-tools-mcp/dist/context/indexer.js';
import { hybridQuery } from './packages/thinking-tools-mcp/dist/context/search.js';
import fs from 'fs';
import path from 'path';

console.log('🔍 COMPREHENSIVE DOCUMENTATION AUDIT\n');
console.log('=' .repeat(80));

// Step 1: Index the repository
console.log('\n📚 Step 1: Indexing repository...\n');
await indexRepo(process.cwd());

console.log('\n' + '='.repeat(80));

// Step 2: Query for all planning documents
console.log('\n📋 Step 2: Finding all planning documents...\n');

const planningQueries = [
  'roadmap phases milestones timeline',
  'comprehensive toolkit expansion specification',
  'RAD crawler master plan architecture',
  'Phase 0 Phase 1 Phase 2 Phase 3 Phase 4',
  'agent coordination versatile execution',
  'OpenAI MCP tools Agents SDK Responses API',
  'what is complete what is in progress',
  'handoff to new agent execution order'
];

const allResults = [];

for (const query of planningQueries) {
  console.log(`  🔎 Querying: "${query}"`);
  const results = await hybridQuery(query, 10);
  allResults.push(...results);
}

// Deduplicate by path
const uniquePaths = [...new Set(allResults.map(r => r?.path).filter(Boolean))];
console.log(`\n  ✅ Found ${uniquePaths.length} unique planning documents`);

console.log('\n' + '='.repeat(80));

// Step 3: Analyze each document
console.log('\n📊 Step 3: Analyzing documents...\n');

const analysis = {
  complete: [],
  inProgress: [],
  notStarted: [],
  outdated: [],
  evolved: [],
  unknown: []
};

for (const docPath of uniquePaths) {
  if (!docPath.endsWith('.md')) continue;
  
  const fullPath = path.join(process.cwd(), docPath);
  if (!fs.existsSync(fullPath)) continue;
  
  const content = fs.readFileSync(fullPath, 'utf8');
  const firstLines = content.split('\n').slice(0, 50).join('\n').toLowerCase();
  
  const doc = {
    path: docPath,
    name: path.basename(docPath, '.md')
  };
  
  // Categorize based on content markers
  if (firstLines.includes('complete') || firstLines.includes('✅') || firstLines.includes('100%')) {
    analysis.complete.push(doc);
  } else if (firstLines.includes('in progress') || firstLines.includes('⏳') || firstLines.includes('30%') || firstLines.includes('50%')) {
    analysis.inProgress.push(doc);
  } else if (firstLines.includes('not started') || firstLines.includes('ready for execution') || firstLines.includes('⏸️')) {
    analysis.notStarted.push(doc);
  } else if (firstLines.includes('outdated') || firstLines.includes('deprecated') || firstLines.includes('superseded')) {
    analysis.outdated.push(doc);
  } else if (firstLines.includes('evolved') || firstLines.includes('updated') || firstLines.includes('revised')) {
    analysis.evolved.push(doc);
  } else {
    analysis.unknown.push(doc);
  }
}

// Step 4: Print analysis
console.log('✅ COMPLETE:');
analysis.complete.forEach(d => console.log(`   - ${d.name}`));

console.log('\n⏳ IN PROGRESS:');
analysis.inProgress.forEach(d => console.log(`   - ${d.name}`));

console.log('\n⏸️ NOT STARTED:');
analysis.notStarted.forEach(d => console.log(`   - ${d.name}`));

console.log('\n🗑️ OUTDATED:');
analysis.outdated.forEach(d => console.log(`   - ${d.name}`));

console.log('\n🔄 EVOLVED:');
analysis.evolved.forEach(d => console.log(`   - ${d.name}`));

console.log('\n❓ UNKNOWN STATUS:');
analysis.unknown.forEach(d => console.log(`   - ${d.name}`));

console.log('\n' + '='.repeat(80));

// Step 5: Query for specific status
console.log('\n🎯 Step 4: Querying for current state...\n');

const statusQueries = [
  { q: 'what is the current architecture how many servers', label: 'Current Architecture' },
  { q: 'Phase 0.5 agent coordination complete status', label: 'Phase 0.5 Status' },
  { q: 'OpenAI MCP 259 tools complete or not', label: 'OpenAI MCP Status' },
  { q: 'Robinson Toolkit 1000 tools expansion status', label: 'Toolkit Expansion Status' },
  { q: 'RAD crawler self-replicating Fly.io deployment', label: 'RAD Crawler Status' },
  { q: 'Context Engine semantic search indexing', label: 'Context Engine Status' }
];

for (const { q, label } of statusQueries) {
  console.log(`  📌 ${label}:`);
  const results = await hybridQuery(q, 3);
  results.forEach(r => {
    const snippet = r.text.substring(0, 150).replace(/\n/g, ' ');
    console.log(`     ${r.path} (score: ${r.score.toFixed(2)})`);
    console.log(`     "${snippet}..."\n`);
  });
}

console.log('\n' + '='.repeat(80));
console.log('\n✅ AUDIT COMPLETE!\n');
console.log('📝 Summary:');
console.log(`   - Complete: ${analysis.complete.length} documents`);
console.log(`   - In Progress: ${analysis.inProgress.length} documents`);
console.log(`   - Not Started: ${analysis.notStarted.length} documents`);
console.log(`   - Outdated: ${analysis.outdated.length} documents`);
console.log(`   - Evolved: ${analysis.evolved.length} documents`);
console.log(`   - Unknown: ${analysis.unknown.length} documents`);
console.log(`   - Total: ${uniquePaths.length} planning documents`);
console.log('\n');

