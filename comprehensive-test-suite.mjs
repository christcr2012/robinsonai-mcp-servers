#!/usr/bin/env node

import { spawn } from 'child_process';
import fs from 'fs';

const results = {
  timestamp: new Date().toISOString(),
  tests: [],
  summary: {}
};

async function testServer(name, pkg, tests) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`🧪 Testing: ${name}`);
  console.log(`${'='.repeat(70)}`);

  const serverResults = [];

  for (const test of tests) {
    const result = await runTest(name, pkg, test);
    serverResults.push(result);
    
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${test.name}`);
    if (result.error) {
      console.log(`   Error: ${result.error.substring(0, 100)}`);
    }
  }

  return { server: name, tests: serverResults };
}

async function runTest(serverName, pkg, test) {
  return new Promise((resolve) => {
    const server = spawn('npx', ['-y', pkg], {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true,
      timeout: 20000
    });

    let output = '';
    let stderr = '';

    server.stdout.on('data', (data) => { output += data.toString(); });
    server.stderr.on('data', (data) => { stderr += data.toString(); });

    // Initialize
    setTimeout(() => {
      server.stdin.write(JSON.stringify({
        jsonrpc: '2.0', id: 0, method: 'initialize',
        params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'test', version: '1.0' } }
      }) + '\n');
    }, 300);

    // Call tool
    setTimeout(() => {
      server.stdin.write(JSON.stringify({
        jsonrpc: '2.0', id: 1, method: 'tools/call',
        params: { name: test.tool, arguments: test.args }
      }) + '\n');
    }, 1000);

    // Collect results
    setTimeout(() => {
      server.kill();
      
      const success = output.includes('"result"') && !output.includes('"isError":true');
      const hasError = output.includes('Unknown tool') || output.includes('"isError":true');
      
      resolve({
        name: test.name,
        tool: test.tool,
        success,
        output: output.substring(0, 200),
        error: hasError ? output.substring(0, 150) : null
      });
    }, 8000);
  });
}

async function runAllTests() {
  console.log('\n╔════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                  COMPREHENSIVE COMPONENT TESTING                          ║');
  console.log('║              Robinson\'s Toolkit, Thinking Tools, Context Engine           ║');
  console.log('╚════════════════════════════════════════════════════════════════════════════╝');

  // Robinson's Toolkit Tests
  const toolkitTests = [
    { name: 'List Categories', tool: 'toolkit_list_categories', args: {} },
    { name: 'List GitHub Tools', tool: 'toolkit_list_tools', args: { category: 'github', limit: 5 } },
    { name: 'List Vercel Tools', tool: 'toolkit_list_tools', args: { category: 'vercel', limit: 5 } },
    { name: 'List Neon Tools', tool: 'toolkit_list_tools', args: { category: 'neon', limit: 5 } },
    { name: 'List Upstash Tools', tool: 'toolkit_list_tools', args: { category: 'upstash', limit: 5 } },
    { name: 'List Google Tools', tool: 'toolkit_list_tools', args: { category: 'google', limit: 5 } },
    { name: 'Discover Tools', tool: 'toolkit_discover', args: { query: 'deploy', limit: 5 } },
    { name: 'Health Check', tool: 'toolkit_health_check', args: {} },
  ];

  const toolkitResult = await testServer(
    'Robinson\'s Toolkit MCP',
    '@robinson_ai_systems/robinsons-toolkit-mcp@^1.1.0',
    toolkitTests
  );
  results.tests.push(toolkitResult);

  // Thinking Tools Tests
  const thinkingTests = [
    { name: 'Context Index Repo', tool: 'context_index_repo', args: {} },
    { name: 'Context Query', tool: 'context_query', args: { query: 'MCP server' } },
    { name: 'Context Stats', tool: 'context_stats', args: {} },
    { name: 'SWOT Analysis', tool: 'swot_analysis', args: { subject: 'Robinson AI', perspective: 'technical' } },
    { name: 'Devil\'s Advocate', tool: 'devils_advocate', args: { context: 'MCP servers are production ready' } },
    { name: 'First Principles', tool: 'first_principles', args: { problem: 'How to improve code quality?' } },
    { name: 'Root Cause', tool: 'root_cause', args: { problem: 'Tests are failing' } },
    { name: 'Sequential Thinking', tool: 'sequential_thinking', args: { thought: 'How to optimize performance?', nextThoughtNeeded: false, thoughtNumber: 1, totalThoughts: 1 } },
    { name: 'Decision Matrix', tool: 'decision_matrix', args: { options: ['Option A', 'Option B'], criteria: ['Cost', 'Quality'] } },
    { name: 'Premortem Analysis', tool: 'premortem_analysis', args: { project: 'Robinson AI Deployment' } },
  ];

  const thinkingResult = await testServer(
    'Thinking Tools MCP',
    '@robinson_ai_systems/thinking-tools-mcp@^1.19.0',
    thinkingTests
  );
  results.tests.push(thinkingResult);

  // FREE Agent Tests
  const freeAgentTests = [
    { name: 'Code Generation', tool: 'delegate_code_generation', args: { task: 'Create a function', context: 'TypeScript', complexity: 'simple' } },
    { name: 'Code Analysis', tool: 'delegate_code_analysis', args: { code: 'const x = 1;', question: 'Any issues?' } },
    { name: 'Test Generation', tool: 'delegate_test_generation', args: { code: 'function add(a,b) { return a+b; }', framework: 'jest' } },
  ];

  const freeAgentResult = await testServer(
    'FREE Agent MCP',
    '@robinson_ai_systems/free-agent-mcp@^0.2.0',
    freeAgentTests
  );
  results.tests.push(freeAgentResult);

  // Generate summary
  console.log(`\n${'='.repeat(70)}`);
  console.log('📊 COMPREHENSIVE TEST SUMMARY');
  console.log(`${'='.repeat(70)}\n`);

  let totalTests = 0;
  let passedTests = 0;

  for (const serverResult of results.tests) {
    const passed = serverResult.tests.filter(t => t.success).length;
    const total = serverResult.tests.length;
    totalTests += total;
    passedTests += passed;

    const percentage = Math.round((passed / total) * 100);
    const status = percentage === 100 ? '✅' : percentage >= 80 ? '⚠️' : '❌';
    
    console.log(`${status} ${serverResult.server}: ${passed}/${total} (${percentage}%)`);
  }

  const overallPercentage = Math.round((passedTests / totalTests) * 100);
  console.log(`\n📈 OVERALL: ${passedTests}/${totalTests} (${overallPercentage}%)`);

  // Save results
  results.summary = {
    totalTests,
    passedTests,
    failedTests: totalTests - passedTests,
    percentage: overallPercentage,
    status: overallPercentage === 100 ? 'PRODUCTION READY' : overallPercentage >= 80 ? 'MOSTLY READY' : 'NEEDS WORK'
  };

  fs.writeFileSync('comprehensive-test-results.json', JSON.stringify(results, null, 2));
  console.log('\n✅ Results saved to comprehensive-test-results.json');
}

runAllTests().catch(console.error);

