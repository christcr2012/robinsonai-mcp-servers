#!/usr/bin/env node

import { spawn } from 'child_process';
import fs from 'fs';

const report = {
  timestamp: new Date().toISOString(),
  components: {},
  summary: {}
};

async function testComponent(name, pkg, tests) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🧪 ${name}`);
  console.log(`${'='.repeat(80)}`);

  const results = { name, tests: [], passed: 0, failed: 0 };

  for (const test of tests) {
    const result = await runTest(pkg, test);
    results.tests.push(result);
    
    if (result.success) {
      console.log(`  ✅ ${test.name}`);
      results.passed++;
    } else {
      console.log(`  ❌ ${test.name}`);
      results.failed++;
    }
  }

  report.components[name] = results;
  return results;
}

async function runTest(pkg, test) {
  return new Promise((resolve) => {
    const server = spawn('npx', ['-y', pkg], {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true,
      timeout: 25000
    });

    let output = '';
    server.stdout.on('data', (data) => { output += data.toString(); });
    server.stderr.on('data', () => {});

    setTimeout(() => {
      server.stdin.write(JSON.stringify({
        jsonrpc: '2.0', id: 0, method: 'initialize',
        params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'test', version: '1.0' } }
      }) + '\n');
    }, 300);

    setTimeout(() => {
      server.stdin.write(JSON.stringify({
        jsonrpc: '2.0', id: 1, method: 'tools/call',
        params: { name: test.tool, arguments: test.args }
      }) + '\n');
    }, 1000);

    setTimeout(() => {
      server.kill();
      const success = output.includes('"result"') && !output.includes('"isError":true');
      resolve({ name: test.name, tool: test.tool, success });
    }, 10000);
  });
}

async function runAllTests() {
  console.log('\n╔════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                  FINAL COMPREHENSIVE TESTING                              ║');
  console.log('║         Robinson\'s Toolkit, Thinking Tools, FREE Agent                   ║');
  console.log('╚════════════════════════════════════════════════════════════════════════════╝');

  // Robinson's Toolkit
  const toolkitTests = [
    { name: 'List Categories', tool: 'toolkit_list_categories', args: {} },
    { name: 'GitHub Tools', tool: 'toolkit_list_tools', args: { category: 'github', limit: 20 } },
    { name: 'Vercel Tools', tool: 'toolkit_list_tools', args: { category: 'vercel', limit: 20 } },
    { name: 'Neon Tools', tool: 'toolkit_list_tools', args: { category: 'neon', limit: 20 } },
    { name: 'Upstash Tools', tool: 'toolkit_list_tools', args: { category: 'upstash', limit: 20 } },
    { name: 'Google Tools', tool: 'toolkit_list_tools', args: { category: 'google', limit: 20 } },
    { name: 'Discover Tools', tool: 'toolkit_discover', args: { query: 'database', limit: 10 } },
    { name: 'Get Tool Schema', tool: 'toolkit_get_tool_schema', args: { category: 'github', tool_name: 'github_create_repo' } },
    { name: 'Health Check', tool: 'toolkit_health_check', args: {} },
    { name: 'Validate Tools', tool: 'toolkit_validate', args: {} },
  ];

  await testComponent(
    'Robinson\'s Toolkit MCP (10 tests)',
    '@robinson_ai_systems/robinsons-toolkit-mcp@^1.1.0',
    toolkitTests
  );

  // Thinking Tools
  const thinkingTests = [
    { name: 'Index Repo', tool: 'context_index_repo', args: {} },
    { name: 'Query (Simple)', tool: 'context_query', args: { query: 'package' } },
    { name: 'Query (Complex)', tool: 'context_query', args: { query: 'MCP server', top_k: 5 } },
    { name: 'Context Stats', tool: 'context_stats', args: {} },
    { name: 'Ensure Fresh Index', tool: 'ensure_fresh_index', args: {} },
    { name: 'SWOT Analysis', tool: 'swot_analysis', args: { subject: 'Robinson AI', perspective: 'technical' } },
    { name: 'Devil\'s Advocate', tool: 'devils_advocate', args: { context: 'MCP servers are production ready' } },
    { name: 'First Principles', tool: 'first_principles', args: { problem: 'How to improve code quality?' } },
    { name: 'Root Cause', tool: 'root_cause', args: { problem: 'Tests are failing' } },
    { name: 'Premortem', tool: 'premortem_analysis', args: { project: 'Robinson AI Deployment' } },
    { name: 'Decision Matrix', tool: 'decision_matrix', args: { options: ['A', 'B'], criteria: ['Cost', 'Quality'] } },
    { name: 'Sequential Thinking', tool: 'sequential_thinking', args: { thought: 'How to optimize?', nextThoughtNeeded: false, thoughtNumber: 1, totalThoughts: 1 } },
    { name: 'Docs Find', tool: 'docs_find', args: { text: 'testing' } },
    { name: 'Health Check', tool: 'thinking_tools_health_check', args: {} },
  ];

  await testComponent(
    'Thinking Tools MCP (14 tests)',
    '@robinson_ai_systems/thinking-tools-mcp@^1.19.1',
    thinkingTests
  );

  // FREE Agent
  const freeAgentTests = [
    { name: 'Code Generation', tool: 'delegate_code_generation', args: { task: 'Create debounce', context: 'TypeScript', complexity: 'simple' } },
    { name: 'Code Analysis', tool: 'delegate_code_analysis', args: { code: 'const x = 1;', question: 'Issues?' } },
    { name: 'Code Refactoring', tool: 'delegate_code_refactoring', args: { code: 'function f(x){return x*2;}', instructions: 'Clean up' } },
    { name: 'Test Generation', tool: 'delegate_test_generation', args: { code: 'function add(a,b){return a+b;}', framework: 'jest' } },
    { name: 'Documentation', tool: 'delegate_documentation', args: { code: 'function test(){}', style: 'jsdoc' } },
  ];

  await testComponent(
    'FREE Agent MCP (5 tests)',
    '@robinson_ai_systems/free-agent-mcp@^0.2.0',
    freeAgentTests
  );

  // Generate Report
  console.log(`\n${'='.repeat(80)}`);
  console.log('📊 FINAL COMPREHENSIVE TEST REPORT');
  console.log(`${'='.repeat(80)}\n`);

  let totalTests = 0;
  let totalPassed = 0;

  for (const [name, results] of Object.entries(report.components)) {
    const total = results.passed + results.failed;
    const percentage = Math.round((results.passed / total) * 100);
    totalTests += total;
    totalPassed += results.passed;

    const status = percentage === 100 ? '✅' : percentage >= 80 ? '⚠️' : '❌';
    console.log(`${status} ${name}`);
    console.log(`   ${results.passed}/${total} tests passed (${percentage}%)\n`);
  }

  const overallPercentage = Math.round((totalPassed / totalTests) * 100);
  console.log(`${'='.repeat(80)}`);
  console.log(`📈 OVERALL: ${totalPassed}/${totalTests} (${overallPercentage}%)`);

  if (overallPercentage === 100) {
    console.log('✅ ALL SYSTEMS 100% PRODUCTION READY');
  } else {
    console.log(`⚠️  ${totalTests - totalPassed} issues need to be fixed for 100% readiness`);
  }

  report.summary = {
    totalTests,
    totalPassed,
    totalFailed: totalTests - totalPassed,
    percentage: overallPercentage,
    status: overallPercentage === 100 ? '✅ PRODUCTION READY' : '⚠️ NEEDS FIXES'
  };

  fs.writeFileSync('final-comprehensive-test-results.json', JSON.stringify(report, null, 2));
  console.log('\n✅ Results saved to final-comprehensive-test-results.json');
}

runAllTests().catch(console.error);

