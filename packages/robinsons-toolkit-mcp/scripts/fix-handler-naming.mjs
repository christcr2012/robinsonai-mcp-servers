#!/usr/bin/env node
/**
 * Fix handler function naming to match broker expectations
 * Converts lowercase-after-category to proper camelCase
 * e.g., githublistRepos → githubListRepos
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Categories to fix (with their expected prefix length)
const categories = {
  'github': 6,      // 'github' = 6 chars
  'vercel': 6,      // 'vercel' = 6 chars
  'neon': 4,        // 'neon' = 4 chars
  'openai': 6,      // 'openai' = 6 chars
  'stripe': 6,      // 'stripe' = 6 chars
  'supabase': 8,    // 'supabase' = 8 chars
  'twilio': 6,      // 'twilio' = 6 chars
  'cloudflare': 10, // 'cloudflare' = 10 chars
  'resend': 6,      // 'resend' = 6 chars
  'playwright': 10, // 'playwright' = 10 chars
};

function fixHandlerFile(category, categoryPath) {
  const handlerFile = path.join(categoryPath, 'handlers.ts');

  if (!fs.existsSync(handlerFile)) {
    console.log(`⚠️  Skipping ${handlerFile} (not found)`);
    return 0;
  }

  let content = fs.readFileSync(handlerFile, 'utf-8');
  let fixes = 0;
  const prefixLen = categories[category];

  // Find all export async function declarations starting with category name
  const regex = new RegExp(`export async function ${category}([a-z])`, 'g');

  content = content.replace(regex, (match, firstChar) => {
    // Capitalize the first character after the category prefix
    const fixed = `export async function ${category}${firstChar.toUpperCase()}`;
    console.log(`  ✓ ${category}${firstChar}... → ${category}${firstChar.toUpperCase()}...`);
    fixes++;
    return fixed;
  });

  if (fixes > 0) {
    fs.writeFileSync(handlerFile, content, 'utf-8');
    console.log(`✅ Fixed ${fixes} handlers in ${path.relative(rootDir, handlerFile)}`);
  } else {
    console.log(`✓ No fixes needed in ${path.relative(rootDir, handlerFile)}`);
  }

  return fixes;
}

console.log('🔧 Fixing handler function naming...\n');

let totalFixes = 0;

for (const [category, prefixLen] of Object.entries(categories)) {
  const categoryPath = path.join(rootDir, 'src', 'categories', category);
  console.log(`\n📁 ${category} (prefix length: ${prefixLen}):`);
  totalFixes += fixHandlerFile(category, categoryPath);
}

console.log(`\n✅ Total fixes: ${totalFixes}`);
console.log('\n🔨 Run "npm run build" to rebuild with fixed handlers');

