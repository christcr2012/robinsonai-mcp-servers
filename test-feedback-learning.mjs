#!/usr/bin/env node

/**
 * Test Feedback Learning System using Raw JSON-RPC
 * 
 * This test:
 * 1. Generates code with FREE agent
 * 2. Simulates feedback from primary agent (Augment)
 * 3. Submits feedback to learning system
 * 4. Checks feedback statistics
 */

import { spawn } from 'child_process';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Credit cost information
const CREDITS_PER_DOLLAR = 2080; // 208,000 credits/month ÷ $100/month
const AUGMENT_COST_PER_GENERATION = 13000;

console.log('🎓 Feedback Learning System Test\n');
console.log('='.repeat(80));
console.log('💰 Credit Cost Information:');
console.log(`   - Augment: ${AUGMENT_COST_PER_GENERATION} credits/generation ($${(AUGMENT_COST_PER_GENERATION / CREDITS_PER_DOLLAR).toFixed(2)})`);
console.log(`   - FREE Agent: 0 credits ($0.00)`);
console.log(`   - Savings: $${(AUGMENT_COST_PER_GENERATION / CREDITS_PER_DOLLAR).toFixed(2)} per generation`);
console.log('='.repeat(80));
console.log('');

// Spawn FREE agent MCP server
const agentPath = join(__dirname, 'packages', 'free-agent-mcp', 'dist', 'index.js');
const agent = spawn('node', [agentPath], {
  stdio: ['pipe', 'pipe', 'pipe'],
  env: {
    ...process.env,
    MAX_OLLAMA_CONCURRENCY: '1',
    OLLAMA_BASE_URL: 'http://localhost:11434',
  }
});

let output = '';
let requestId = 0;
let generatedCode = null;
let runId = null;
let feedbackData = null;

agent.stdout.on('data', (data) => {
  output += data.toString();
  const lines = output.split('\n');
  
  for (let i = 0; i < lines.length - 1; i++) {
    const line = lines[i].trim();
    if (!line || !line.startsWith('{')) continue;
    
    try {
      const response = JSON.parse(line);
      
      // Initialize response
      if (response.id === 1) {
        console.log('✅ Connected to FREE Agent\n');
      }
      
      // Code generation response (first attempt)
      else if (response.id === 2 && response.result) {
        const result = JSON.parse(response.result.content[0].text);
        generatedCode = result.code || result.output;
        runId = result.runId;
        
        console.log('✅ Code generated (Attempt 1)');
        console.log(`   Run ID: ${runId}`);
        console.log(`   Length: ${generatedCode.length} chars\n`);
        
        console.log('📄 Generated Code:');
        console.log('─'.repeat(80));
        console.log(generatedCode);
        console.log('─'.repeat(80));
        console.log('');
        
        writeFileSync('test-generated-v1.ts', generatedCode);
        
        // Now submit feedback
        console.log('🔧 Simulating Augment feedback...\n');
        
        const improvedCode = `/**
 * Calculates factorial of a non-negative integer
 * @param n - Number to calculate factorial for
 * @returns Factorial of n
 * @throws {Error} If n is not a non-negative integer
 */
function factorial(n: number): number {
  if (!Number.isInteger(n)) {
    throw new Error(\`Must be integer, got: \${n}\`);
  }
  if (n < 0) {
    throw new Error(\`Must be non-negative, got: \${n}\`);
  }
  if (n === 0 || n === 1) return 1;
  return n * factorial(n - 1);
}

export { factorial };
`;
        
        writeFileSync('test-generated-v2.ts', improvedCode);
        
        console.log('📤 Submitting feedback...\n');
        
        const feedbackRequest = {
          jsonrpc: '2.0',
          id: ++requestId,
          method: 'tools/call',
          params: {
            name: 'submit_feedback',
            arguments: {
              runId,
              agentOutput: generatedCode,
              userEdit: improvedCode,
              source: 'augment',
              metadata: {
                file: 'factorial.ts',
                language: 'typescript',
                improvements: ['JSDoc', 'validation', 'export'],
              },
            },
          },
        };
        
        agent.stdin.write(JSON.stringify(feedbackRequest) + '\n');
      }
      
      // Feedback submission response
      else if (response.id === 3 && response.result) {
        feedbackData = JSON.parse(response.result.content[0].text);
        
        console.log('✅ Feedback submitted!');
        console.log(`   Type: ${feedbackData.feedbackType}`);
        console.log(`   Severity: ${feedbackData.severity}`);
        console.log(`   Category: ${feedbackData.category}\n`);
        
        // Get feedback stats
        console.log('📊 Getting feedback stats...\n');
        
        const statsRequest = {
          jsonrpc: '2.0',
          id: ++requestId,
          method: 'tools/call',
          params: {
            name: 'get_feedback_stats',
            arguments: {},
          },
        };
        
        agent.stdin.write(JSON.stringify(statsRequest) + '\n');
      }
      
      // Feedback stats response
      else if (response.id === 4 && response.result) {
        const stats = JSON.parse(response.result.content[0].text);
        
        console.log('✅ Feedback Statistics:');
        console.log(`   Total: ${stats.total}`);
        
        if (stats.byType?.length > 0) {
          console.log('\n   By Type:');
          stats.byType.forEach(item => {
            console.log(`     - ${item.feedback_type}: ${item.count}`);
          });
        }
        
        if (stats.bySeverity?.length > 0) {
          console.log('\n   By Severity:');
          stats.bySeverity.forEach(item => {
            console.log(`     - ${item.severity}: ${item.count}`);
          });
        }
        
        console.log('');
        
        // Summary
        console.log('='.repeat(80));
        console.log('🎉 TEST COMPLETE!');
        console.log('='.repeat(80));
        console.log('');
        console.log('✅ All steps completed:');
        console.log('   1. Generated code with FREE agent');
        console.log('   2. Simulated Augment feedback');
        console.log('   3. Submitted feedback to learning system');
        console.log('   4. Retrieved feedback statistics');
        console.log('');
        console.log('💰 Credits Saved:');
        console.log(`   - ${AUGMENT_COST_PER_GENERATION} credits ($${(AUGMENT_COST_PER_GENERATION / CREDITS_PER_DOLLAR).toFixed(2)})`);
        console.log('');
        console.log('📊 Feedback Learning:');
        console.log(`   - Total feedback events: ${stats.total}`);
        console.log(`   - Latest feedback type: ${feedbackData.feedbackType}`);
        console.log(`   - Latest severity: ${feedbackData.severity}`);
        console.log('');
        console.log('📁 Files Created:');
        console.log('   - test-generated-v1.ts (original)');
        console.log('   - test-generated-v2.ts (with feedback)');
        console.log('');
        console.log('💡 The feedback has been recorded and will improve future generations!');
        console.log('='.repeat(80));
        
        agent.kill();
        process.exit(0);
      }
    } catch (err) {
      // Ignore parse errors
    }
  }
  
  output = lines[lines.length - 1];
});

agent.stderr.on('data', (data) => {
  const msg = data.toString();
  if (!msg.includes('ExperimentalWarning') && !msg.includes('[Autonomous Agent]')) {
    process.stderr.write(data);
  }
});

agent.on('close', (code) => {
  if (code !== 0 && code !== null) {
    console.error(`\n❌ Agent exited with code ${code}`);
    process.exit(1);
  }
});

// Start the test
setTimeout(() => {
  console.log('📝 STEP 1: Generating code...\n');
  
  // Initialize
  const initRequest = {
    jsonrpc: '2.0',
    id: ++requestId,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'test-client', version: '1.0.0' }
    }
  };
  
  agent.stdin.write(JSON.stringify(initRequest) + '\n');
  
  // Generate code
  setTimeout(() => {
    const genRequest = {
      jsonrpc: '2.0',
      id: ++requestId,
      method: 'tools/call',
      params: {
        name: 'delegate_code_generation',
        arguments: {
          task: 'Create a TypeScript factorial function with error handling',
          context: 'TypeScript, recursive, handle edge cases',
          quality: 'fast',
        },
      },
    };
    
    agent.stdin.write(JSON.stringify(genRequest) + '\n');
  }, 1000);
}, 2000);

// Timeout
setTimeout(() => {
  console.error('\n❌ Test timed out after 3 minutes');
  agent.kill();
  process.exit(1);
}, 180000);

