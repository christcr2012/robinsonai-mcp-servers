#!/usr/bin/env node
/**
 * Live Audit Script for Robinson's Toolkit
 * 
 * Directly parses src/index.ts to find:
 * 1. Tool definitions (from getOriginalToolDefinitions)
 * 2. Case statements (from executeToolInternal)
 * 3. Handler method implementations
 * 
 * Compares them to find missing components.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INDEX_PATH = path.join(__dirname, '..', 'src', 'index.ts');

console.log('🔍 Starting Live Audit of Robinson\'s Toolkit...\n');

// Read the source file
const source = fs.readFileSync(INDEX_PATH, 'utf-8');
const lines = source.split('\n');

// ============================================================
// STEP 1: Extract Tool Definitions
// ============================================================
console.log('📋 Step 1: Extracting tool definitions from getOriginalToolDefinitions()...');

const toolDefinitions = [];
let inToolDefinitions = false;
let braceCount = 0;
let currentTool = '';

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // Start of getOriginalToolDefinitions
  if (line.includes('private getOriginalToolDefinitions()')) {
    inToolDefinitions = true;
    continue;
  }
  
  if (inToolDefinitions) {
    // Track braces to know when we're done
    braceCount += (line.match(/\{/g) || []).length;
    braceCount -= (line.match(/\}/g) || []).length;
    
    // Extract tool names from { name: 'tool_name', ... }
    const nameMatch = line.match(/\{\s*name:\s*['"]([^'"]+)['"]/);
    if (nameMatch) {
      toolDefinitions.push(nameMatch[1]);
    }
    
    // End of method
    if (braceCount < 0) {
      break;
    }
  }
}

console.log(`   ✅ Found ${toolDefinitions.length} tool definitions\n`);

// ============================================================
// STEP 2: Extract Case Statements
// ============================================================
console.log('🔀 Step 2: Extracting case statements from executeToolInternal()...');

const caseStatements = [];
let inCaseStatements = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // Start of executeToolInternal
  if (line.includes('private async executeToolInternal')) {
    inCaseStatements = true;
    continue;
  }
  
  if (inCaseStatements) {
    // Extract case statements
    const caseMatch = line.match(/case\s+['"]([^'"]+)['"]/);
    if (caseMatch) {
      caseStatements.push(caseMatch[1]);
    }
    
    // End of switch statement
    if (line.includes('default:') || line.includes('throw new Error')) {
      break;
    }
  }
}

console.log(`   ✅ Found ${caseStatements.length} case statements\n`);

// ============================================================
// STEP 3: Extract Handler Methods
// ============================================================
console.log('⚙️  Step 3: Extracting handler method implementations...');

const handlerMethods = [];
const handlerMethodRegex = /private async (\w+)\(/g;

let match;
while ((match = handlerMethodRegex.exec(source)) !== null) {
  const methodName = match[1];
  // Skip internal methods
  if (!['executeToolInternal', 'getOriginalToolDefinitions', 'setupHandlers', 'validateTools'].includes(methodName)) {
    handlerMethods.push(methodName);
  }
}

console.log(`   ✅ Found ${handlerMethods.length} handler methods\n`);

// ============================================================
// STEP 4: Compare and Find Mismatches
// ============================================================
console.log('🔍 Step 4: Comparing components...\n');

// Convert tool names to expected method names
function toolNameToMethodName(toolName) {
  // github_list_repos -> listRepos
  const parts = toolName.split('_');
  parts.shift(); // Remove category prefix (github, vercel, etc.)
  return parts.map((part, i) => 
    i === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)
  ).join('');
}

// Find missing components
const missingCases = [];
const missingHandlers = [];
const missingDefinitions = [];
const complete = [];

for (const toolName of toolDefinitions) {
  const expectedMethod = toolNameToMethodName(toolName);
  const hasCase = caseStatements.includes(toolName);
  const hasHandler = handlerMethods.includes(expectedMethod);
  
  if (!hasCase) {
    missingCases.push({ toolName, expectedMethod });
  }
  if (!hasHandler) {
    missingHandlers.push({ toolName, expectedMethod });
  }
  if (hasCase && hasHandler) {
    complete.push(toolName);
  }
}

// Check for orphaned case statements (case without definition)
for (const caseName of caseStatements) {
  if (!toolDefinitions.includes(caseName)) {
    missingDefinitions.push(caseName);
  }
}

// ============================================================
// STEP 5: Categorize by Integration
// ============================================================
console.log('📊 Step 5: Categorizing by integration...\n');

function categorize(tools) {
  const categories = {
    github: [],
    vercel: [],
    neon: [],
    upstash: [],
    google: [],
    gmail: [],
    drive: [],
    calendar: [],
    sheets: [],
    docs: [],
    slides: [],
    forms: [],
    admin: [],
    classroom: [],
    chat: [],
    people: [],
    tasks: [],
    reports: [],
    openai: [],
    other: []
  };
  
  for (const tool of tools) {
    const toolName = typeof tool === 'string' ? tool : tool.toolName;
    const prefix = toolName.split('_')[0];
    if (categories[prefix]) {
      categories[prefix].push(tool);
    } else {
      categories.other.push(tool);
    }
  }
  
  return categories;
}

const missingHandlersByCategory = categorize(missingHandlers);
const missingCasesByCategory = categorize(missingCases);

// ============================================================
// STEP 6: Generate Report
// ============================================================
console.log('📝 Step 6: Generating report...\n');

const report = {
  timestamp: new Date().toISOString(),
  summary: {
    totalDefinitions: toolDefinitions.length,
    totalCases: caseStatements.length,
    totalHandlers: handlerMethods.length,
    complete: complete.length,
    missingCases: missingCases.length,
    missingHandlers: missingHandlers.length,
    missingDefinitions: missingDefinitions.length,
    completionRate: ((complete.length / toolDefinitions.length) * 100).toFixed(2) + '%'
  },
  missingHandlersByCategory,
  missingCasesByCategory,
  missingDefinitions,
  sampleComplete: complete.slice(0, 10)
};

// Save report
const reportPath = path.join(__dirname, '..', 'LIVE-AUDIT-REPORT.json');
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

console.log('═══════════════════════════════════════════════════════════');
console.log('                    AUDIT SUMMARY                          ');
console.log('═══════════════════════════════════════════════════════════');
console.log(`Total Tool Definitions:    ${report.summary.totalDefinitions}`);
console.log(`Total Case Statements:     ${report.summary.totalCases}`);
console.log(`Total Handler Methods:     ${report.summary.totalHandlers}`);
console.log(`Complete Tools:            ${report.summary.complete}`);
console.log(`Missing Case Statements:   ${report.summary.missingCases}`);
console.log(`Missing Handler Methods:   ${report.summary.missingHandlers}`);
console.log(`Orphaned Case Statements:  ${report.summary.missingDefinitions}`);
console.log(`Completion Rate:           ${report.summary.completionRate}`);
console.log('═══════════════════════════════════════════════════════════\n');

// Print top issues by category
console.log('🔴 TOP ISSUES BY CATEGORY:\n');
for (const [category, tools] of Object.entries(missingHandlersByCategory)) {
  if (tools.length > 0) {
    console.log(`   ${category.toUpperCase()}: ${tools.length} missing handlers`);
  }
}

console.log(`\n✅ Full report saved to: ${reportPath}\n`);

