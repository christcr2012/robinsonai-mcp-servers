/**
 * Smoke Test for Robinson's Toolkit MCP
 * 
 * Validates:
 * 1. Registry loads successfully
 * 2. Has expected number of tools and categories
 * 3. All tools have valid names and schemas
 * 4. Handler paths are valid
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

async function main() {
  console.log('🧪 Running smoke test for Robinson\'s Toolkit MCP...\n');

  // Test 1: Registry files exist and are valid JSON
  console.log('📋 Test 1: Loading registry files...');
  let registry, categories;
  try {
    registry = JSON.parse(readFileSync(join(ROOT, 'dist', 'registry.json'), 'utf8'));
    categories = JSON.parse(readFileSync(join(ROOT, 'dist', 'categories.json'), 'utf8'));
    console.log('✅ Registry files loaded successfully');
  } catch (error) {
    console.error('❌ Failed to load registry files:', error.message);
    process.exit(1);
  }

  // Test 2: Registry has tools
  console.log('\n📋 Test 2: Validating registry content...');
  if (!Array.isArray(registry) || registry.length === 0) {
    console.error('❌ Registry is empty or not an array');
    process.exit(1);
  }
  console.log(`✅ Registry contains ${registry.length} tools`);

  // Test 3: Categories are valid
  console.log('\n📋 Test 3: Validating categories...');
  if (!categories || typeof categories !== 'object') {
    console.error('❌ Categories is not an object');
    process.exit(1);
  }
  const categoryCount = Object.keys(categories).length;
  if (categoryCount === 0) {
    console.error('❌ No categories found');
    process.exit(1);
  }
  console.log(`✅ Found ${categoryCount} categories:`, Object.keys(categories).join(', '));

  // Test 4: All tools have required fields
  console.log('\n📋 Test 4: Validating tool structure...');
  const NAME_RE = /^[A-Za-z0-9:_-]{1,64}$/;
  const invalid = [];
  
  for (const tool of registry) {
    if (!tool.name || !NAME_RE.test(tool.name)) {
      invalid.push({ name: tool.name || '(unnamed)', reason: 'Invalid name' });
    }
    if (!tool.category) {
      invalid.push({ name: tool.name, reason: 'Missing category' });
    }
    if (!tool.handler) {
      invalid.push({ name: tool.name, reason: 'Missing handler' });
    }
    if (!tool.inputSchema || typeof tool.inputSchema !== 'object') {
      invalid.push({ name: tool.name, reason: 'Invalid inputSchema' });
    }
  }

  if (invalid.length > 0) {
    console.error(`❌ Found ${invalid.length} invalid tools:`);
    invalid.slice(0, 5).forEach(t => console.error(`  - ${t.name}: ${t.reason}`));
    process.exit(1);
  }
  console.log('✅ All tools have valid structure');

  // Test 5: Category counts match
  console.log('\n📋 Test 5: Validating category counts...');
  const toolsByCategory = {};
  for (const tool of registry) {
    toolsByCategory[tool.category] = (toolsByCategory[tool.category] || 0) + 1;
  }

  let countMismatch = false;
  for (const [category, info] of Object.entries(categories)) {
    const actualCount = toolsByCategory[category] || 0;
    const expectedCount = info.toolCount;
    if (actualCount !== expectedCount) {
      console.error(`❌ Category ${category}: expected ${expectedCount} tools, found ${actualCount}`);
      countMismatch = true;
    }
  }

  if (countMismatch) {
    process.exit(1);
  }
  console.log('✅ Category counts match registry');

  // Test 6: Sample tools from each category
  console.log('\n📋 Test 6: Sampling tools from each category...');
  for (const category of Object.keys(categories)) {
    const categoryTools = registry.filter(t => t.category === category);
    if (categoryTools.length === 0) {
      console.error(`❌ Category ${category} has no tools`);
      process.exit(1);
    }
    const sample = categoryTools[0];
    console.log(`  ✅ ${category}: ${sample.name} (${categoryTools.length} tools)`);
  }

  // Test 7: Check for duplicate tool names
  console.log('\n📋 Test 7: Checking for duplicate tool names...');
  const toolNames = new Set();
  const duplicates = [];
  for (const tool of registry) {
    if (toolNames.has(tool.name)) {
      duplicates.push(tool.name);
    }
    toolNames.add(tool.name);
  }

  if (duplicates.length > 0) {
    console.error(`❌ Found ${duplicates.length} duplicate tool names:`);
    duplicates.slice(0, 5).forEach(name => console.error(`  - ${name}`));
    process.exit(1);
  }
  console.log('✅ No duplicate tool names');

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('🎉 All smoke tests passed!');
  console.log('='.repeat(60));
  console.log(`📊 Summary:`);
  console.log(`   - Total tools: ${registry.length}`);
  console.log(`   - Total categories: ${categoryCount}`);
  console.log(`   - All tools validated: ✅`);
  console.log(`   - No duplicates: ✅`);
  console.log(`   - Category counts match: ✅`);
  console.log('='.repeat(60));
}

main().catch(err => {
  console.error('\n💥 Smoke test failed:', err);
  process.exit(1);
});

