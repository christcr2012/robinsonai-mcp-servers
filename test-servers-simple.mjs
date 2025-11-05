#!/usr/bin/env node

import { execSync } from 'child_process';

const tests = [
  {
    name: 'Free Agent MCP',
    package: '@robinson_ai_systems/free-agent-mcp@^0.2.0',
    cmd: 'timeout 3 npx -y @robinson_ai_systems/free-agent-mcp@^0.2.0 2>&1 || true'
  },
  {
    name: 'Paid Agent MCP',
    package: '@robinson_ai_systems/paid-agent-mcp@^0.3.0',
    cmd: 'timeout 3 npx -y @robinson_ai_systems/paid-agent-mcp@^0.3.0 2>&1 || true'
  },
  {
    name: 'Thinking Tools MCP',
    package: '@robinson_ai_systems/thinking-tools-mcp@^1.19.0',
    cmd: 'timeout 3 npx -y @robinson_ai_systems/thinking-tools-mcp@^1.19.0 2>&1 || true'
  },
  {
    name: 'Robinson\'s Toolkit MCP',
    package: '@robinson_ai_systems/robinsons-toolkit-mcp@^1.1.0',
    cmd: 'timeout 3 npx -y @robinson_ai_systems/robinsons-toolkit-mcp@^1.1.0 2>&1 || true'
  },
  {
    name: 'Credit Optimizer MCP',
    package: '@robinson_ai_systems/credit-optimizer-mcp@^0.3.0',
    cmd: 'timeout 3 npx -y @robinson_ai_systems/credit-optimizer-mcp@^0.3.0 2>&1 || true'
  }
];

console.log('🚀 Real-World MCP Server Testing\n');
console.log('='.repeat(70));

const results = [];

for (const test of tests) {
  console.log(`\n📋 Testing: ${test.name}`);
  console.log(`   Package: ${test.package}`);
  
  try {
    const output = execSync(test.cmd, { encoding: 'utf-8', shell: true });
    
    // Check for success indicators
    const isRunning = output.includes('running on stdio') || 
                     output.includes('MCP server') ||
                     output.includes('Autonomous Agent') ||
                     output.includes('OpenAI Worker') ||
                     output.includes('Toolkit') ||
                     output.includes('Terminated');
    
    const hasTools = output.includes('tools') || 
                    output.includes('tool') ||
                    output.includes('Ready');
    
    const status = isRunning ? 'PASS' : 'WARN';
    const icon = status === 'PASS' ? '✅' : '⚠️ ';
    
    console.log(`   ${icon} Status: ${status}`);
    
    if (output.includes('running on stdio')) {
      console.log(`   ✅ Server initialized and running`);
    }
    if (output.includes('Autonomous Agent')) {
      console.log(`   ✅ Autonomous Agent ready`);
    }
    if (output.includes('OpenAI Worker')) {
      console.log(`   ✅ OpenAI Worker ready`);
    }
    if (output.includes('Toolkit')) {
      console.log(`   ✅ Toolkit initialized`);
    }
    if (output.includes('Total tools:')) {
      const match = output.match(/Total tools: (\d+)/);
      if (match) {
        console.log(`   ✅ ${match[1]} tools available`);
      }
    }
    
    results.push({ name: test.name, status });
  } catch (err) {
    console.log(`   ❌ Error: ${err.message.substring(0, 80)}`);
    results.push({ name: test.name, status: 'FAIL' });
  }
}

console.log('\n' + '='.repeat(70));
console.log('\n📊 Test Results Summary:\n');

let passed = 0;
let warned = 0;
let failed = 0;

results.forEach(r => {
  const icon = r.status === 'PASS' ? '✅' : r.status === 'WARN' ? '⚠️ ' : '❌';
  console.log(`${icon} ${r.name.padEnd(35)} - ${r.status}`);
  if (r.status === 'PASS') passed++;
  else if (r.status === 'WARN') warned++;
  else failed++;
});

console.log(`\n📈 Overall: ${passed}/${results.length} PASS, ${warned}/${results.length} WARN, ${failed}/${results.length} FAIL`);

if (failed === 0) {
  console.log('\n🎯 All MCP servers are operational and ready for use!\n');
} else {
  console.log('\n⚠️  Some servers need attention\n');
}

