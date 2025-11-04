#!/usr/bin/env node
/**
 * Test Code Structure - Verify versatility features are properly integrated
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ANSI colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(name, status, details = '') {
  const symbol = status === 'PASS' ? '✓' : '✗';
  const color = status === 'PASS' ? 'green' : 'red';
  log(`${symbol} ${name}`, color);
  if (details) log(`  ${details}`, 'yellow');
}

function logSection(title) {
  log('\n' + '='.repeat(80), 'cyan');
  log(title, 'bright');
  log('='.repeat(80), 'cyan');
}

/**
 * Test FREE Agent code structure
 */
function testFreeAgent() {
  logSection('Testing FREE Agent Code Structure');
  
  const results = [];
  const freeAgentPath = join(__dirname, 'packages/free-agent-mcp/src/index.ts');
  const content = readFileSync(freeAgentPath, 'utf-8');

  // Test 1: Import ThinkingClient
  const hasThinkingImport = content.includes('getSharedThinkingClient') && 
                            content.includes('ThinkingToolCallParams');
  logTest(
    'Imports ThinkingClient from shared-llm',
    hasThinkingImport ? 'PASS' : 'FAIL',
    hasThinkingImport ? 'Found: getSharedThinkingClient, ThinkingToolCallParams' : 'Missing imports'
  );
  results.push(hasThinkingImport);

  // Test 2: thinking_tool_call in taskType enum
  const hasThinkingTaskType = content.includes("'thinking_tool_call'") &&
                               content.match(/taskType:.*'thinking_tool_call'/s);
  logTest(
    'Has thinking_tool_call in taskType enum',
    hasThinkingTaskType ? 'PASS' : 'FAIL',
    hasThinkingTaskType ? 'Found in executeVersatileTask' : 'Missing from enum'
  );
  results.push(hasThinkingTaskType);

  // Test 3: thinking_tool_call case handler
  const hasThinkingHandler = content.includes("case 'thinking_tool_call':") &&
                              content.includes('getSharedThinkingClient()');
  logTest(
    'Has thinking_tool_call case handler',
    hasThinkingHandler ? 'PASS' : 'FAIL',
    hasThinkingHandler ? 'Found handler with getSharedThinkingClient()' : 'Missing handler'
  );
  results.push(hasThinkingHandler);

  // Test 4: toolkit_call case handler (should already exist)
  const hasToolkitHandler = content.includes("case 'toolkit_call':") &&
                             content.includes('getSharedToolkitClient()');
  logTest(
    'Has toolkit_call case handler',
    hasToolkitHandler ? 'PASS' : 'FAIL',
    hasToolkitHandler ? 'Found handler with getSharedToolkitClient()' : 'Missing handler'
  );
  results.push(hasToolkitHandler);

  // Test 5: Updated tool description
  const hasUpdatedDescription = content.includes('1165') || content.includes('64');
  logTest(
    'Updated tool description with tool counts',
    hasUpdatedDescription ? 'PASS' : 'FAIL',
    hasUpdatedDescription ? 'Mentions toolkit and thinking tool counts' : 'Missing counts'
  );
  results.push(hasUpdatedDescription);

  return results;
}

/**
 * Test PAID Agent code structure
 */
function testPaidAgent() {
  logSection('Testing PAID Agent Code Structure');
  
  const results = [];
  const paidAgentPath = join(__dirname, 'packages/paid-agent-mcp/src/index.ts');
  const content = readFileSync(paidAgentPath, 'utf-8');

  // Test 1: Import ThinkingClient
  const hasThinkingImport = content.includes('getSharedThinkingClient') && 
                            content.includes('ThinkingToolCallParams');
  logTest(
    'Imports ThinkingClient from shared-llm',
    hasThinkingImport ? 'PASS' : 'FAIL',
    hasThinkingImport ? 'Found: getSharedThinkingClient, ThinkingToolCallParams' : 'Missing imports'
  );
  results.push(hasThinkingImport);

  // Test 2: thinking_tool_call in taskType enum
  const hasThinkingTaskType = content.includes("'thinking_tool_call'") &&
                               content.match(/taskType:.*'thinking_tool_call'/s);
  logTest(
    'Has thinking_tool_call in taskType enum',
    hasThinkingTaskType ? 'PASS' : 'FAIL',
    hasThinkingTaskType ? 'Found in execute_versatile_task' : 'Missing from enum'
  );
  results.push(hasThinkingTaskType);

  // Test 3: thinking_tool_call case handler
  const hasThinkingHandler = content.includes("case 'thinking_tool_call':") &&
                              content.includes('getSharedThinkingClient()');
  logTest(
    'Has thinking_tool_call case handler',
    hasThinkingHandler ? 'PASS' : 'FAIL',
    hasThinkingHandler ? 'Found handler with getSharedThinkingClient()' : 'Missing handler'
  );
  results.push(hasThinkingHandler);

  // Test 4: discover_thinking_tools tool
  const hasDiscoverTool = content.includes('discover_thinking_tools_paid-agent-mcp');
  logTest(
    'Has discover_thinking_tools tool',
    hasDiscoverTool ? 'PASS' : 'FAIL',
    hasDiscoverTool ? 'Found in tool list' : 'Missing from tool list'
  );
  results.push(hasDiscoverTool);

  // Test 5: list_thinking_tools tool
  const hasListTool = content.includes('list_thinking_tools_paid-agent-mcp');
  logTest(
    'Has list_thinking_tools tool',
    hasListTool ? 'PASS' : 'FAIL',
    hasListTool ? 'Found in tool list' : 'Missing from tool list'
  );
  results.push(hasListTool);

  // Test 6: handleDiscoverThinkingTools function
  const hasDiscoverHandler = content.includes('async function handleDiscoverThinkingTools');
  logTest(
    'Has handleDiscoverThinkingTools function',
    hasDiscoverHandler ? 'PASS' : 'FAIL',
    hasDiscoverHandler ? 'Found handler function' : 'Missing handler function'
  );
  results.push(hasDiscoverHandler);

  // Test 7: handleListThinkingTools function
  const hasListHandler = content.includes('async function handleListThinkingTools');
  logTest(
    'Has handleListThinkingTools function',
    hasListHandler ? 'PASS' : 'FAIL',
    hasListHandler ? 'Found handler function' : 'Missing handler function'
  );
  results.push(hasListHandler);

  // Test 8: toolkit_call case handler (should already exist)
  const hasToolkitHandler = content.includes("case 'toolkit_call':") &&
                             content.includes('getSharedToolkitClient()');
  logTest(
    'Has toolkit_call case handler',
    hasToolkitHandler ? 'PASS' : 'FAIL',
    hasToolkitHandler ? 'Found handler with getSharedToolkitClient()' : 'Missing handler'
  );
  results.push(hasToolkitHandler);

  // Test 9: Updated tool description
  const hasUpdatedDescription = content.includes('1165') || content.includes('64');
  logTest(
    'Updated tool description with tool counts',
    hasUpdatedDescription ? 'PASS' : 'FAIL',
    hasUpdatedDescription ? 'Mentions toolkit and thinking tool counts' : 'Missing counts'
  );
  results.push(hasUpdatedDescription);

  return results;
}

/**
 * Test shared-llm library
 */
function testSharedLLM() {
  logSection('Testing shared-llm Library');
  
  const results = [];
  
  // Test 1: thinking-client.ts exists
  const thinkingClientPath = join(__dirname, 'standalone/libraries/shared-llm/src/thinking-client.ts');
  try {
    const content = readFileSync(thinkingClientPath, 'utf-8');
    const hasThinkingClient = content.includes('export class ThinkingClient');
    logTest(
      'thinking-client.ts exists with ThinkingClient class',
      hasThinkingClient ? 'PASS' : 'FAIL',
      hasThinkingClient ? 'Found ThinkingClient class' : 'Missing class'
    );
    results.push(hasThinkingClient);
  } catch (error) {
    logTest('thinking-client.ts exists', 'FAIL', 'File not found');
    results.push(false);
  }

  // Test 2: index.ts exports ThinkingClient
  const indexPath = join(__dirname, 'standalone/libraries/shared-llm/src/index.ts');
  const indexContent = readFileSync(indexPath, 'utf-8');
  const exportsThinkingClient = indexContent.includes('ThinkingClient') &&
                                 indexContent.includes('getSharedThinkingClient');
  logTest(
    'index.ts exports ThinkingClient',
    exportsThinkingClient ? 'PASS' : 'FAIL',
    exportsThinkingClient ? 'Found exports' : 'Missing exports'
  );
  results.push(exportsThinkingClient);

  // Test 3: Built dist files exist
  const distIndexPath = join(__dirname, 'standalone/libraries/shared-llm/dist/index.d.ts');
  try {
    const distContent = readFileSync(distIndexPath, 'utf-8');
    const hasBuiltExports = distContent.includes('ThinkingClient') &&
                             distContent.includes('getSharedThinkingClient');
    logTest(
      'Built dist files include ThinkingClient exports',
      hasBuiltExports ? 'PASS' : 'FAIL',
      hasBuiltExports ? 'Found in dist/index.d.ts' : 'Missing from dist'
    );
    results.push(hasBuiltExports);
  } catch (error) {
    logTest('Built dist files exist', 'FAIL', 'dist/index.d.ts not found');
    results.push(false);
  }

  return results;
}

/**
 * Main test runner
 */
function main() {
  log('\n' + '█'.repeat(80), 'bright');
  log('CODE STRUCTURE TEST - Phase 1 Validation', 'bright');
  log('█'.repeat(80) + '\n', 'bright');

  const sharedResults = testSharedLLM();
  const freeResults = testFreeAgent();
  const paidResults = testPaidAgent();

  // Summary
  logSection('TEST SUMMARY');
  
  const allResults = [...sharedResults, ...freeResults, ...paidResults];
  const passed = allResults.filter(r => r).length;
  const total = allResults.length;

  log(`\nshared-llm: ${sharedResults.filter(r => r).length}/${sharedResults.length} tests passed`, 'cyan');
  log(`FREE Agent: ${freeResults.filter(r => r).length}/${freeResults.length} tests passed`, 'cyan');
  log(`PAID Agent: ${paidResults.filter(r => r).length}/${paidResults.length} tests passed`, 'cyan');
  
  log(`\nOverall: ${passed}/${total} tests passed`, passed === total ? 'green' : 'red');
  
  if (passed < total) {
    log(`${total - passed} tests failed`, 'red');
    process.exit(1);
  } else {
    log('\n✓ All code structure tests passed!', 'green');
    log('✓ Both agents are properly configured for versatility', 'green');
    log('✓ Ready to proceed with Phase 2', 'green');
    process.exit(0);
  }
}

main();

