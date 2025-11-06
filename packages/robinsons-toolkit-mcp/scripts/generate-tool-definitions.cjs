#!/usr/bin/env node

/**
 * Generate Tool Definitions Dynamically
 * 
 * Scans index.ts for all handler methods and generates tool definitions.
 * This ensures ALL implemented handlers are exposed through the broker pattern.
 */

const fs = require('fs');
const path = require('path');

const INDEX_PATH = path.join(__dirname, '../src/index.ts');

console.log('🔍 Scanning index.ts for handler methods...\n');

// Read index.ts
const content = fs.readFileSync(INDEX_PATH, 'utf-8');

// Extract all handler methods
const handlerRegex = /private async ([a-zA-Z0-9_]+)\(args: any\)/g;
const handlers = [];
let match;

while ((match = handlerRegex.exec(content)) !== null) {
  handlers.push(match[1]);
}

console.log(`✅ Found ${handlers.length} handler methods\n`);

// Group by category (prefix)
const categories = {};
handlers.forEach(handler => {
  // Convert camelCase to snake_case and extract category
  const snakeCase = handler.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
  
  // Determine category from common prefixes
  let category = 'unknown';
  if (snakeCase.startsWith('github_') || handler.startsWith('list') || handler.startsWith('get') || handler.startsWith('create')) {
    // Need to analyze the handler name more carefully
    if (handler.includes('Repo') || handler.includes('Branch') || handler.includes('Commit') || 
        handler.includes('Issue') || handler.includes('Pull') || handler.includes('Workflow') ||
        handler.includes('Release') || handler.includes('Gist')) {
      category = 'github';
    } else if (handler.includes('Vercel') || handler.includes('Deploy') || handler.includes('Project') ||
               handler.includes('Domain') || handler.includes('Env')) {
      category = 'vercel';
    } else if (handler.includes('Neon') || handler.includes('Database') || handler.includes('Endpoint') ||
               handler.includes('Branch') && !handler.includes('github')) {
      category = 'neon';
    } else if (handler.includes('Upstash') || handler.includes('Redis')) {
      category = 'upstash';
    } else if (handler.includes('Gmail') || handler.includes('Drive') || handler.includes('Calendar') ||
               handler.includes('Sheets') || handler.includes('Docs') || handler.includes('Slides') ||
               handler.includes('Forms') || handler.includes('Admin') || handler.includes('People')) {
      category = 'google';
    } else if (handler.includes('Openai') || handler.includes('Chat') || handler.includes('Embedding') ||
               handler.includes('Image') || handler.includes('Audio')) {
      category = 'openai';
    }
  }
  
  if (!categories[category]) {
    categories[category] = [];
  }
  categories[category].push({
    handlerName: handler,
    toolName: snakeCase
  });
});

// Print summary
console.log('📊 Handlers by Category:\n');
Object.keys(categories).sort().forEach(cat => {
  console.log(`  ${cat}: ${categories[cat].length} handlers`);
});

console.log('\n📝 Sample handlers from each category:\n');
Object.keys(categories).sort().forEach(cat => {
  console.log(`  ${cat}:`);
  categories[cat].slice(0, 5).forEach(h => {
    console.log(`    - ${h.handlerName} → ${h.toolName}`);
  });
  if (categories[cat].length > 5) {
    console.log(`    ... and ${categories[cat].length - 5} more`);
  }
  console.log('');
});

// Check for handlers not in case statements
console.log('\n🔍 Checking for handlers not exposed in case statements...\n');

const caseRegex = /case '([a-z_]+)': return await this\.([a-zA-Z0-9_]+)\(/g;
const exposedHandlers = new Set();

while ((match = caseRegex.exec(content)) !== null) {
  exposedHandlers.push(match[2]);
}

const notExposed = handlers.filter(h => !exposedHandlers.has(h));

if (notExposed.length > 0) {
  console.log(`⚠️  Found ${notExposed.length} handlers NOT exposed in case statements:\n`);
  notExposed.slice(0, 20).forEach(h => {
    console.log(`  - ${h}`);
  });
  if (notExposed.length > 20) {
    console.log(`  ... and ${notExposed.length - 20} more`);
  }
} else {
  console.log('✅ All handlers are exposed in case statements!');
}

console.log('\n✨ Done!\n');

