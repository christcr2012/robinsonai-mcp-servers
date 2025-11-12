#!/usr/bin/env node
/**
 * Analyze GitHub tool names against the standard pattern
 * Pattern: github_{verb}_{noun}
 */

const fs = require('fs');
const path = require('path');

// Standard verbs
const STANDARD_VERBS = new Set([
  'create', 'get', 'list', 'update', 'delete', 'search', 
  'send', 'execute', 'add', 'remove', 'check', 'cancel', 
  'archive', 'restore', 'enable', 'disable', 'merge', 
  'compare', 'convert', 'fork', 'star', 'unstar', 
  'follow', 'unfollow', 'watch', 'unwatch', 'lock', 'unlock',
  'pin', 'unpin', 'transfer', 'rename', 'sync', 'trigger',
  'request', 'approve', 'reject', 'dismiss', 'rerun'
]);

// Read tool names
const toolNamesFile = path.join(__dirname, 'github-tool-names.txt');
const toolNames = fs.readFileSync(toolNamesFile, 'utf8')
  .split('\n')
  .map(line => line.trim())
  .filter(line => line.length > 0);

console.log(`Analyzing ${toolNames.length} GitHub tools...\n`);

const results = {
  summary: {
    total: toolNames.length,
    correct: 0,
    needs_review: 0,
    incorrect: 0
  },
  migrations: {},
  analysis: []
};

// Analyze each tool
for (const toolName of toolNames) {
  const parts = toolName.split('_');
  
  if (parts.length < 3) {
    results.analysis.push({
      current: toolName,
      status: 'incorrect',
      suggested: null,
      reason: 'Tool name has fewer than 3 parts (category_verb_noun)'
    });
    results.summary.incorrect++;
    continue;
  }

  const [category, verb, ...nounParts] = parts;
  const noun = nounParts.join('_');

  // Check category
  if (category !== 'github') {
    results.analysis.push({
      current: toolName,
      status: 'incorrect',
      suggested: null,
      reason: `Category should be 'github', got '${category}'`
    });
    results.summary.incorrect++;
    continue;
  }

  // Check verb
  if (!STANDARD_VERBS.has(verb)) {
    results.analysis.push({
      current: toolName,
      status: 'needs_review',
      suggested: null,
      reason: `Verb '${verb}' is not in standard verb list. May need to add to standard or rename.`
    });
    results.summary.needs_review++;
    continue;
  }

  // Check noun (should be singular except for list_*)
  if (verb === 'list' && !noun.endsWith('s')) {
    results.analysis.push({
      current: toolName,
      status: 'needs_review',
      suggested: `github_list_${noun}s`,
      reason: `List operations should use plural nouns. Suggested: github_list_${noun}s`
    });
    results.summary.needs_review++;
    results.migrations[toolName] = `github_list_${noun}s`;
    continue;
  }

  if (verb !== 'list' && noun.endsWith('s') && !noun.endsWith('ss') && !noun.endsWith('status')) {
    // Might be plural when it should be singular
    const singularNoun = noun.slice(0, -1);
    results.analysis.push({
      current: toolName,
      status: 'needs_review',
      suggested: `github_${verb}_${singularNoun}`,
      reason: `Non-list operations should use singular nouns. Suggested: github_${verb}_${singularNoun}`
    });
    results.summary.needs_review++;
    results.migrations[toolName] = `github_${verb}_${singularNoun}`;
    continue;
  }

  // Tool looks correct!
  results.analysis.push({
    current: toolName,
    status: 'correct',
    suggested: null,
    reason: 'Follows standard pattern: github_{verb}_{noun}'
  });
  results.summary.correct++;
}

// Write results
const outputFile = path.join(__dirname, 'github-name-migrations.json');
fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));

// Print summary
console.log('='.repeat(60));
console.log('SUMMARY');
console.log('='.repeat(60));
console.log(`Total tools:      ${results.summary.total}`);
console.log(`✅ Correct:       ${results.summary.correct} (${Math.round(results.summary.correct / results.summary.total * 100)}%)`);
console.log(`⚠️  Needs review:  ${results.summary.needs_review} (${Math.round(results.summary.needs_review / results.summary.total * 100)}%)`);
console.log(`❌ Incorrect:     ${results.summary.incorrect} (${Math.round(results.summary.incorrect / results.summary.total * 100)}%)`);
console.log('');

// Print issues
if (results.summary.needs_review > 0) {
  console.log('='.repeat(60));
  console.log('NEEDS REVIEW');
  console.log('='.repeat(60));
  results.analysis
    .filter(item => item.status === 'needs_review')
    .slice(0, 10)
    .forEach(item => {
      console.log(`⚠️  ${item.current}`);
      console.log(`   → ${item.suggested || 'No suggestion'}`);
      console.log(`   Reason: ${item.reason}`);
      console.log('');
    });
  if (results.summary.needs_review > 10) {
    console.log(`... and ${results.summary.needs_review - 10} more`);
  }
}

if (results.summary.incorrect > 0) {
  console.log('='.repeat(60));
  console.log('INCORRECT');
  console.log('='.repeat(60));
  results.analysis
    .filter(item => item.status === 'incorrect')
    .slice(0, 10)
    .forEach(item => {
      console.log(`❌ ${item.current}`);
      console.log(`   Reason: ${item.reason}`);
      console.log('');
    });
  if (results.summary.incorrect > 10) {
    console.log(`... and ${results.summary.incorrect - 10} more`);
  }
}

console.log('='.repeat(60));
console.log(`Results written to: ${outputFile}`);
console.log('='.repeat(60));

