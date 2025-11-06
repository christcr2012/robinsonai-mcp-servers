#!/usr/bin/env node

/**
 * Comprehensive Audit of Robinson's Toolkit
 * 
 * Checks:
 * 1. Handler methods (private async methods)
 * 2. Tool definitions (in getOriginalToolDefinitions)
 * 3. Case statements (in callTool switch)
 * 4. Finds mismatches and missing implementations
 */

const fs = require('fs');
const path = require('path');

const INDEX_PATH = path.join(__dirname, '../src/index.ts');

console.log('🔍 COMPREHENSIVE AUDIT OF ROBINSON\'S TOOLKIT\n');
console.log('='.repeat(80) + '\n');

// Read index.ts
const content = fs.readFileSync(INDEX_PATH, 'utf-8');

// 1. Extract all handler methods
console.log('📊 STEP 1: Extracting handler methods...\n');
const handlerRegex = /private async ([a-zA-Z0-9_]+)\(args: any\)/g;
const handlers = new Map();
let match;

while ((match = handlerRegex.exec(content)) !== null) {
  const handlerName = match[1];
  handlers.set(handlerName, { name: handlerName, hasDefinition: false, hasCase: false });
}

console.log(`✅ Found ${handlers.size} handler methods\n`);

// 2. Extract all tool definitions
console.log('📊 STEP 2: Extracting tool definitions...\n');
const toolDefRegex = /\{ name: '([a-z_]+)',/g;
const toolDefinitions = new Map();

while ((match = toolDefRegex.exec(content)) !== null) {
  const toolName = match[1];
  toolDefinitions.set(toolName, { name: toolName, hasHandler: false, hasCase: false });
}

console.log(`✅ Found ${toolDefinitions.size} tool definitions\n`);

// 3. Extract all case statements
console.log('📊 STEP 3: Extracting case statements...\n');
const caseRegex = /case '([a-z_]+)':\s*return await this\.([a-zA-Z0-9_]+)\(/g;
const caseStatements = new Map();

while ((match = caseRegex.exec(content)) !== null) {
  const toolName = match[1];
  const handlerName = match[2];
  caseStatements.set(toolName, { toolName, handlerName });
}

console.log(`✅ Found ${caseStatements.size} case statements\n`);

// 4. Cross-reference everything
console.log('📊 STEP 4: Cross-referencing...\n');

// Mark handlers that have case statements
for (const [toolName, caseInfo] of caseStatements) {
  if (handlers.has(caseInfo.handlerName)) {
    handlers.get(caseInfo.handlerName).hasCase = true;
  }
}

// Mark handlers that have tool definitions
// Convert tool name (snake_case) to handler name (camelCase)
function toolNameToHandlerName(toolName) {
  return toolName.split('_').map((part, i) => 
    i === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)
  ).join('');
}

for (const [toolName, toolInfo] of toolDefinitions) {
  const expectedHandler = toolNameToHandlerName(toolName);
  if (handlers.has(expectedHandler)) {
    handlers.get(expectedHandler).hasDefinition = true;
    toolInfo.hasHandler = true;
  }
  
  // Check if has case statement
  if (caseStatements.has(toolName)) {
    toolInfo.hasCase = true;
  }
}

// 5. Find issues
console.log('🔍 STEP 5: Finding issues...\n');
console.log('='.repeat(80) + '\n');

// Issue 1: Handlers without tool definitions
const handlersWithoutDefinitions = Array.from(handlers.values())
  .filter(h => !h.hasDefinition);

console.log(`⚠️  ISSUE 1: Handlers WITHOUT tool definitions (${handlersWithoutDefinitions.length})\n`);
if (handlersWithoutDefinitions.length > 0) {
  console.log('Sample (first 30):');
  handlersWithoutDefinitions.slice(0, 30).forEach(h => {
    console.log(`  - ${h.name}`);
  });
  if (handlersWithoutDefinitions.length > 30) {
    console.log(`  ... and ${handlersWithoutDefinitions.length - 30} more\n`);
  }
} else {
  console.log('✅ All handlers have tool definitions!\n');
}

// Issue 2: Handlers without case statements
const handlersWithoutCases = Array.from(handlers.values())
  .filter(h => !h.hasCase);

console.log(`⚠️  ISSUE 2: Handlers WITHOUT case statements (${handlersWithoutCases.length})\n`);
if (handlersWithoutCases.length > 0) {
  console.log('Sample (first 30):');
  handlersWithoutCases.slice(0, 30).forEach(h => {
    console.log(`  - ${h.name}`);
  });
  if (handlersWithoutCases.length > 30) {
    console.log(`  ... and ${handlersWithoutCases.length - 30} more\n`);
  }
} else {
  console.log('✅ All handlers have case statements!\n');
}

// Issue 3: Tool definitions without handlers
const definitionsWithoutHandlers = Array.from(toolDefinitions.values())
  .filter(t => !t.hasHandler);

console.log(`⚠️  ISSUE 3: Tool definitions WITHOUT handlers (${definitionsWithoutHandlers.length})\n`);
if (definitionsWithoutHandlers.length > 0) {
  console.log('Sample (first 30):');
  definitionsWithoutHandlers.slice(0, 30).forEach(t => {
    const expectedHandler = toolNameToHandlerName(t.name);
    console.log(`  - ${t.name} → expected handler: ${expectedHandler}`);
  });
  if (definitionsWithoutHandlers.length > 30) {
    console.log(`  ... and ${definitionsWithoutHandlers.length - 30} more\n`);
  }
} else {
  console.log('✅ All tool definitions have handlers!\n');
}

// Issue 4: Tool definitions without case statements
const definitionsWithoutCases = Array.from(toolDefinitions.values())
  .filter(t => !t.hasCase);

console.log(`⚠️  ISSUE 4: Tool definitions WITHOUT case statements (${definitionsWithoutCases.length})\n`);
if (definitionsWithoutCases.length > 0) {
  console.log('Sample (first 30):');
  definitionsWithoutCases.slice(0, 30).forEach(t => {
    console.log(`  - ${t.name}`);
  });
  if (definitionsWithoutCases.length > 30) {
    console.log(`  ... and ${definitionsWithoutCases.length - 30} more\n`);
  }
} else {
  console.log('✅ All tool definitions have case statements!\n');
}

// 6. Category analysis
console.log('='.repeat(80) + '\n');
console.log('📊 STEP 6: Category Analysis\n');

const categories = {};
for (const [toolName] of toolDefinitions) {
  const prefix = toolName.split('_')[0];
  if (!categories[prefix]) {
    categories[prefix] = { count: 0, tools: [] };
  }
  categories[prefix].count++;
  categories[prefix].tools.push(toolName);
}

console.log('Tool counts by prefix:\n');
Object.keys(categories).sort().forEach(prefix => {
  console.log(`  ${prefix}: ${categories[prefix].count} tools`);
});

console.log('\n' + '='.repeat(80) + '\n');
console.log('📊 SUMMARY\n');
console.log(`Total handlers: ${handlers.size}`);
console.log(`Total tool definitions: ${toolDefinitions.size}`);
console.log(`Total case statements: ${caseStatements.size}`);
console.log(`\nIssues found:`);
console.log(`  - Handlers without definitions: ${handlersWithoutDefinitions.length}`);
console.log(`  - Handlers without cases: ${handlersWithoutCases.length}`);
console.log(`  - Definitions without handlers: ${definitionsWithoutHandlers.length}`);
console.log(`  - Definitions without cases: ${definitionsWithoutCases.length}`);

console.log('\n✨ Audit complete!\n');

// Write detailed report to file
const report = {
  timestamp: new Date().toISOString(),
  stats: {
    totalHandlers: handlers.size,
    totalDefinitions: toolDefinitions.size,
    totalCases: caseStatements.size
  },
  issues: {
    handlersWithoutDefinitions: handlersWithoutDefinitions.map(h => h.name),
    handlersWithoutCases: handlersWithoutCases.map(h => h.name),
    definitionsWithoutHandlers: definitionsWithoutHandlers.map(t => t.name),
    definitionsWithoutCases: definitionsWithoutCases.map(t => t.name)
  },
  categories
};

fs.writeFileSync(
  path.join(__dirname, '../audit-report.json'),
  JSON.stringify(report, null, 2)
);

console.log('📝 Detailed report written to: audit-report.json\n');

