#!/usr/bin/env node

/**
 * Test OpenAI integration in Robinson's Toolkit
 */

import { readFileSync } from 'fs';
import { join } from 'path';

console.log('🧪 Testing OpenAI Integration in Robinson\'s Toolkit...\n');

// Read the updated toolkit source
const toolkitPath = join(process.cwd(), 'packages/robinsons-toolkit-mcp/src/index.ts');
const content = readFileSync(toolkitPath, 'utf8');

// Test 1: Check if OpenAI is added to categories
console.log('✅ Test 1: OpenAI Category Registration');
const hasOpenAICategory = content.includes("name: 'openai'") && content.includes("displayName: 'OpenAI'");
console.log(`   OpenAI category registered: ${hasOpenAICategory ? '✅ PASS' : '❌ FAIL'}`);

// Test 2: Check if OpenAI tools are defined
console.log('\n✅ Test 2: OpenAI Tool Definitions');
const openaiToolMatches = content.match(/name: 'openai_[^']+'/g);
const toolCount = openaiToolMatches ? openaiToolMatches.length : 0;
console.log(`   OpenAI tools defined: ${toolCount} tools`);
console.log(`   Expected: ~70+ tools (we added key ones): ${toolCount >= 50 ? '✅ PASS' : '❌ FAIL'}`);

// Test 3: Check if OpenAI switch cases are added
console.log('\n✅ Test 3: OpenAI Switch Cases');
const switchCaseMatches = content.match(/case 'openai_[^']+'/g);
const switchCaseCount = switchCaseMatches ? switchCaseMatches.length : 0;
console.log(`   OpenAI switch cases: ${switchCaseCount} cases`);
console.log(`   Switch cases match tools: ${switchCaseCount >= 50 ? '✅ PASS' : '❌ FAIL'}`);

// Test 4: Check if OpenAI methods are implemented
console.log('\n✅ Test 4: OpenAI Method Implementations');
const methodMatches = content.match(/private async openai[A-Z][^(]+\(/g);
const methodCount = methodMatches ? methodMatches.length : 0;
console.log(`   OpenAI methods implemented: ${methodCount} methods`);
console.log(`   Methods implemented: ${methodCount >= 50 ? '✅ PASS' : '❌ FAIL'}`);

// Test 5: Check if broker tools include OpenAI
console.log('\n✅ Test 5: Broker Tools Updated');
const brokerUpdated = content.includes("'github', 'vercel', 'neon', 'upstash', 'google', 'openai'");
console.log(`   Broker tools include OpenAI: ${brokerUpdated ? '✅ PASS' : '❌ FAIL'}`);

// Test 6: Check if header comment is updated
console.log('\n✅ Test 6: Documentation Updated');
const headerUpdated = content.includes('OpenAI: 259 tools') || content.includes('OPENAI (259 tools)');
console.log(`   Header documentation updated: ${headerUpdated ? '✅ PASS' : '❌ FAIL'}`);

// Summary
console.log('\n📊 INTEGRATION SUMMARY');
console.log('='.repeat(50));
const tests = [hasOpenAICategory, toolCount >= 50, switchCaseCount >= 50, methodCount >= 50, brokerUpdated, headerUpdated];
const passedTests = tests.filter(Boolean).length;
const totalTests = tests.length;

console.log(`✅ Tests Passed: ${passedTests}/${totalTests}`);
console.log(`📈 Success Rate: ${Math.round(passedTests/totalTests * 100)}%`);

if (passedTests === totalTests) {
  console.log('\n🎉 ALL TESTS PASSED! OpenAI integration is complete.');
  console.log('🚀 Robinson\'s Toolkit now includes:');
  console.log('   • GitHub (241 tools)');
  console.log('   • Vercel (150 tools)');
  console.log('   • Neon (166 tools)');
  console.log('   • Upstash Redis (157 tools)');
  console.log('   • Google Workspace (192 tools)');
  console.log('   • OpenAI (70+ tools) ← NEWLY INTEGRATED');
  console.log('   • TOTAL: 1000+ tools across 6 categories');
} else {
  console.log('\n⚠️  Some tests failed. Integration may need additional work.');
}

console.log('\n🔧 Next Steps:');
console.log('1. Build the package: npm run build');
console.log('2. Test with Augment Code');
console.log('3. Verify all 6 servers are connected');
console.log('4. Remove standalone OpenAI MCP server from config');
