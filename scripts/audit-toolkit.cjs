#!/usr/bin/env node

/**
 * Comprehensive Audit Script for Robinson's Toolkit MCP
 * 
 * This script audits the toolkit to find:
 * 1. All tool definitions in getOriginalToolDefinitions()
 * 2. All case statements in executeToolInternal()
 * 3. All handler methods in the UnifiedToolkit class
 * 4. Missing case statements (tools without handlers)
 * 5. Missing handler methods (case statements without implementations)
 */

const fs = require('fs');
const path = require('path');

const sourceFile = path.join(__dirname, '../packages/robinsons-toolkit-mcp/src/index.ts');
const content = fs.readFileSync(sourceFile, 'utf8');

console.log('🔍 Starting comprehensive audit of Robinson\'s Toolkit MCP...\n');

// ============================================================
// STEP 1: Extract all tool definitions
// ============================================================
console.log('📋 Step 1: Extracting tool definitions from getOriginalToolDefinitions()...');

const toolDefMatch = content.match(/private getOriginalToolDefinitions\(\)[\s\S]*?const tools: any\[\] = \[([\s\S]*?)\n\s{4}\];/);
if (!toolDefMatch) {
  console.error('❌ ERROR: Could not find getOriginalToolDefinitions');
  process.exit(1);
}

const toolsSection = toolDefMatch[1];
const toolNameMatches = toolsSection.matchAll(/\{\s*name:\s*'([^']+)'/g);
const definedTools = Array.from(toolNameMatches).map(m => m[1]);

console.log(`✅ Found ${definedTools.length} tool definitions\n`);

// ============================================================
// STEP 2: Extract all case statements
// ============================================================
console.log('🔀 Step 2: Extracting case statements from executeToolInternal()...');

const executeMatch = content.match(/private async executeToolInternal\([^)]+\)[^{]*\{[\s\S]*?switch \(name\) \{([\s\S]*?)\n\s+default:/);
if (!executeMatch) {
  console.error('❌ ERROR: Could not find executeToolInternal switch statement');
  process.exit(1);
}

const switchSection = executeMatch[1];
const caseMatches = switchSection.matchAll(/case '([^']+)':/g);
const caseStatements = Array.from(caseMatches).map(m => m[1]);

console.log(`✅ Found ${caseStatements.length} case statements\n`);

// ============================================================
// STEP 3: Extract all handler methods
// ============================================================
console.log('🔧 Step 3: Extracting handler methods from UnifiedToolkit class...');

const methodMatches = content.matchAll(/private async (\w+)\(args: any\): Promise<\{ content:/g);
const handlerMethods = Array.from(methodMatches).map(m => m[1]);

console.log(`✅ Found ${handlerMethods.length} handler methods\n`);

// ============================================================
// STEP 4: Find missing case statements
// ============================================================
console.log('🔍 Step 4: Finding tools with missing case statements...');

const missingCases = definedTools.filter(tool => !caseStatements.includes(tool));

console.log(`Found ${missingCases.length} tools without case statements:`);
if (missingCases.length > 0) {
  const grouped = {};
  missingCases.forEach(tool => {
    const prefix = tool.split('_')[0];
    if (!grouped[prefix]) grouped[prefix] = [];
    grouped[prefix].push(tool);
  });
  
  Object.keys(grouped).sort().forEach(prefix => {
    console.log(`  ${prefix}: ${grouped[prefix].length} tools`);
    grouped[prefix].slice(0, 5).forEach(tool => console.log(`    - ${tool}`));
    if (grouped[prefix].length > 5) {
      console.log(`    ... and ${grouped[prefix].length - 5} more`);
    }
  });
}
console.log();

// ============================================================
// STEP 5: Find case statements without handler methods
// ============================================================
console.log('🔍 Step 5: Finding case statements without handler methods...');

// Convert tool names to expected method names
const toolToMethod = (toolName) => {
  // Convert snake_case to camelCase
  return toolName.split('_').map((part, i) => 
    i === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)
  ).join('');
};

const casesWithoutHandlers = caseStatements.filter(caseName => {
  const expectedMethod = toolToMethod(caseName);
  return !handlerMethods.includes(expectedMethod);
});

console.log(`Found ${casesWithoutHandlers.length} case statements without handler methods:`);
if (casesWithoutHandlers.length > 0) {
  casesWithoutHandlers.slice(0, 20).forEach(caseName => {
    const expectedMethod = toolToMethod(caseName);
    console.log(`  - ${caseName} → ${expectedMethod}()`);
  });
  if (casesWithoutHandlers.length > 20) {
    console.log(`  ... and ${casesWithoutHandlers.length - 20} more`);
  }
}
console.log();

// ============================================================
// STEP 6: Generate summary report
// ============================================================
console.log('📊 AUDIT SUMMARY');
console.log('='.repeat(60));
console.log(`Total tool definitions:        ${definedTools.length}`);
console.log(`Total case statements:         ${caseStatements.length}`);
console.log(`Total handler methods:         ${handlerMethods.length}`);
console.log(`Missing case statements:       ${missingCases.length}`);
console.log(`Missing handler methods:       ${casesWithoutHandlers.length}`);
console.log('='.repeat(60));

// Calculate coverage
const coverage = ((caseStatements.length / definedTools.length) * 100).toFixed(1);
console.log(`\n📈 Coverage: ${coverage}% of tools have case statements`);

// ============================================================
// STEP 7: Save detailed reports
// ============================================================
console.log('\n💾 Saving detailed reports...');

const outputDir = path.join(__dirname, '../packages/robinsons-toolkit-mcp');

fs.writeFileSync(
  path.join(outputDir, 'audit-defined-tools.json'),
  JSON.stringify(definedTools.sort(), null, 2)
);

fs.writeFileSync(
  path.join(outputDir, 'audit-case-statements.json'),
  JSON.stringify(caseStatements.sort(), null, 2)
);

fs.writeFileSync(
  path.join(outputDir, 'audit-handler-methods.json'),
  JSON.stringify(handlerMethods.sort(), null, 2)
);

fs.writeFileSync(
  path.join(outputDir, 'audit-missing-cases.json'),
  JSON.stringify(missingCases.sort(), null, 2)
);

fs.writeFileSync(
  path.join(outputDir, 'audit-missing-handlers.json'),
  JSON.stringify(casesWithoutHandlers.sort(), null, 2)
);

// Generate detailed report
const report = {
  timestamp: new Date().toISOString(),
  summary: {
    totalToolDefinitions: definedTools.length,
    totalCaseStatements: caseStatements.length,
    totalHandlerMethods: handlerMethods.length,
    missingCaseStatements: missingCases.length,
    missingHandlerMethods: casesWithoutHandlers.length,
    coverage: parseFloat(coverage)
  },
  missingCases: missingCases.sort(),
  missingHandlers: casesWithoutHandlers.sort().map(caseName => ({
    toolName: caseName,
    expectedMethod: toolToMethod(caseName)
  }))
};

fs.writeFileSync(
  path.join(outputDir, 'audit-report.json'),
  JSON.stringify(report, null, 2)
);

console.log('✅ Reports saved:');
console.log('  - audit-defined-tools.json');
console.log('  - audit-case-statements.json');
console.log('  - audit-handler-methods.json');
console.log('  - audit-missing-cases.json');
console.log('  - audit-missing-handlers.json');
console.log('  - audit-report.json');

console.log('\n✨ Audit complete!\n');

// Exit with error code if there are missing implementations
if (missingCases.length > 0 || casesWithoutHandlers.length > 0) {
  console.log('⚠️  WARNING: Missing implementations detected!');
  process.exit(1);
} else {
  console.log('✅ All tools have complete implementations!');
  process.exit(0);
}

