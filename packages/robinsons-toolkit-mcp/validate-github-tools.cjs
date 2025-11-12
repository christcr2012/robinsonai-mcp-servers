#!/usr/bin/env node
/**
 * Comprehensive validation of GitHub tools
 * Checks: definitions, handlers, implementations, naming
 */

const fs = require('fs');
const path = require('path');

const indexFile = path.join(__dirname, 'src/index.ts');
const content = fs.readFileSync(indexFile, 'utf8');

console.log('='.repeat(70));
console.log('GITHUB TOOLS VALIDATION');
console.log('='.repeat(70));
console.log('');

// Extract tool definitions
const defRegex = /name: 'github_([^']+)'/g;
const definitions = [];
let match;
while ((match = defRegex.exec(content)) !== null) {
  definitions.push('github_' + match[1]);
}

// Extract handler cases
const handlerRegex = /case 'github_([^']+)':/g;
const handlers = [];
while ((match = handlerRegex.exec(content)) !== null) {
  handlers.push('github_' + match[1]);
}

// Extract method implementations
const methodRegex = /private async (\w+)\(args: any\)/g;
const methods = [];
while ((match = methodRegex.exec(content)) !== null) {
  methods.push(match[1]);
}

console.log('📊 COUNTS:');
console.log(`  Definitions: ${definitions.length}`);
console.log(`  Handlers:    ${handlers.length}`);
console.log(`  Methods:     ${methods.length}`);
console.log('');

// Check for perfect match
if (definitions.length === handlers.length) {
  console.log('✅ Definitions and handlers match!');
} else {
  console.log('❌ MISMATCH: Definitions and handlers do not match!');
}
console.log('');

// Find orphaned definitions (no handler)
const orphanedDefs = definitions.filter(d => !handlers.includes(d));
if (orphanedDefs.length > 0) {
  console.log('❌ ORPHANED DEFINITIONS (no handler):');
  orphanedDefs.forEach(d => console.log(`  - ${d}`));
  console.log('');
} else {
  console.log('✅ No orphaned definitions');
  console.log('');
}

// Find orphaned handlers (no definition)
const orphanedHandlers = handlers.filter(h => !definitions.includes(h));
if (orphanedHandlers.length > 0) {
  console.log('❌ ORPHANED HANDLERS (no definition):');
  orphanedHandlers.forEach(h => console.log(`  - ${h}`));
  console.log('');
} else {
  console.log('✅ No orphaned handlers');
  console.log('');
}

// Check naming standard
console.log('📝 NAMING VALIDATION:');
const standardVerbs = new Set([
  // CRUD
  'create', 'get', 'list', 'update', 'delete',
  // Search & Query
  'search', 'find',
  // Data Operations
  'send', 'download', 'upload', 'generate', 'replace',
  // Execution & Control
  'execute', 'start', 'stop', 'cancel', 'trigger', 'deploy',
  // Collection Management
  'add', 'remove',
  // Status & Validation
  'check', 'test', 'ping', 'submit',
  // Lifecycle
  'archive', 'restore', 'enable', 'disable',
  // Configuration
  'set',
  // GitHub-specific
  'merge', 'compare', 'convert', 'fork', 'star', 'unstar',
  'follow', 'unfollow', 'watch', 'unwatch', 'lock', 'unlock',
  'pin', 'unpin', 'transfer', 'rename', 'sync',
  'request', 'approve', 'reject', 'dismiss', 'rerun'
]);

let namingIssues = 0;
definitions.forEach(toolName => {
  const parts = toolName.split('_');
  if (parts.length < 3) {
    console.log(`  ⚠️  ${toolName} - Too few parts (expected: github_verb_noun)`);
    namingIssues++;
    return;
  }
  
  const [category, verb, ...nounParts] = parts;
  
  if (category !== 'github') {
    console.log(`  ❌ ${toolName} - Wrong category (expected: github)`);
    namingIssues++;
    return;
  }
  
  if (!standardVerbs.has(verb)) {
    console.log(`  ⚠️  ${toolName} - Non-standard verb: ${verb}`);
    namingIssues++;
  }
});

if (namingIssues === 0) {
  console.log('  ✅ All tool names follow standard pattern');
} else {
  console.log(`  ⚠️  Found ${namingIssues} naming issues`);
}
console.log('');

// Check for handler implementations
console.log('🔍 IMPLEMENTATION CHECK:');
const handlerMethodMap = {};

// Parse handler to method mapping
const handlerImplRegex = /case 'github_([^']+)':\s*return await this\.(\w+)\(args\)/g;
while ((match = handlerImplRegex.exec(content)) !== null) {
  handlerMethodMap['github_' + match[1]] = match[2];
}

let missingImpl = 0;
handlers.forEach(handler => {
  const methodName = handlerMethodMap[handler];
  if (!methodName) {
    console.log(`  ❌ ${handler} - No method call found`);
    missingImpl++;
  } else if (!methods.includes(methodName)) {
    console.log(`  ❌ ${handler} - Method ${methodName} not implemented`);
    missingImpl++;
  }
});

if (missingImpl === 0) {
  console.log('  ✅ All handlers have implementations');
} else {
  console.log(`  ❌ Found ${missingImpl} missing implementations`);
}
console.log('');

// Summary
console.log('='.repeat(70));
console.log('SUMMARY');
console.log('='.repeat(70));
console.log(`Total GitHub Tools: ${definitions.length}`);
console.log(`Orphaned Definitions: ${orphanedDefs.length}`);
console.log(`Orphaned Handlers: ${orphanedHandlers.length}`);
console.log(`Naming Issues: ${namingIssues}`);
console.log(`Missing Implementations: ${missingImpl}`);
console.log('');

const totalIssues = orphanedDefs.length + orphanedHandlers.length + namingIssues + missingImpl;
if (totalIssues === 0) {
  console.log('✅ ALL CHECKS PASSED! GitHub tools are clean and complete.');
} else {
  console.log(`❌ FOUND ${totalIssues} ISSUES - Fix before proceeding!`);
}
console.log('='.repeat(70));

process.exit(totalIssues > 0 ? 1 : 0);

