#!/usr/bin/env node

/**
 * Simple Quality Test for FREE Agent
 * Tests code generation and feedback learning system
 */

import { spawn } from 'child_process';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Credit cost information
const CREDITS_PER_DOLLAR = 2080; // 208,000 credits/month ÷ $100/month = 2,080 credits per dollar
const AUGMENT_COST_PER_GENERATION = 13000; // Estimated credits per generation

console.log('💰 Credit Cost Information:');
console.log(`   - Augment: ${AUGMENT_COST_PER_GENERATION} credits per generation ($${(AUGMENT_COST_PER_GENERATION / CREDITS_PER_DOLLAR).toFixed(2)})`);
console.log(`   - FREE Agent: 0 credits ($0.00)`);
console.log(`   - Savings: ${AUGMENT_COST_PER_GENERATION} credits ($${(AUGMENT_COST_PER_GENERATION / CREDITS_PER_DOLLAR).toFixed(2)}) per generation\n`);

// Test case
const testCase = {
  task: 'Create a TypeScript function that calculates factorial with proper error handling and type safety',
  context: 'TypeScript, recursive implementation, handle edge cases (negative numbers, 0, large numbers)',
  quality: 'fast',
};

console.log('🧪 Test Case:');
console.log(`   Task: ${testCase.task}`);
console.log(`   Context: ${testCase.context}`);
console.log(`   Quality: ${testCase.quality}\n`);

// Step 1: Generate code with FREE agent
console.log('📝 Step 1: Generating code with FREE agent...\n');

const agent = spawn('free-agent-mcp', [], {
  stdio: ['pipe', 'pipe', 'pipe'],
  shell: true,
  env: {
    ...process.env,
    OLLAMA_BASE_URL: 'http://localhost:11434',
  }
});

let requestId = 0;
let output = '';
let generatedCode = null;
let runId = null;
let startTime = Date.now();

// Send initialize request
const initRequest = {
  jsonrpc: '2.0',
  id: ++requestId,
  method: 'initialize',
  params: {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: {
      name: 'test-client',
      version: '1.0.0',
    },
  },
};

agent.stdin.write(JSON.stringify(initRequest) + '\n');

// Wait for initialize response, then send initialized notification
setTimeout(() => {
  const initializedNotification = {
    jsonrpc: '2.0',
    method: 'notifications/initialized',
  };
  agent.stdin.write(JSON.stringify(initializedNotification) + '\n');

  // Send code generation request
  setTimeout(() => {
    const generateRequest = {
      jsonrpc: '2.0',
      id: ++requestId,
      method: 'tools/call',
      params: {
        name: 'delegate_code_generation_free-agent-mcp',
        arguments: {
          task: testCase.task,
          context: testCase.context,
          quality: testCase.quality,
        },
      },
    };
    agent.stdin.write(JSON.stringify(generateRequest) + '\n');
  }, 100);
}, 100);

agent.stdout.on('data', (data) => {
  output += data.toString();
  const lines = output.split('\n');
  
  for (let i = 0; i < lines.length - 1; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    try {
      const response = JSON.parse(line);
      
      if (response.id === 2 && response.result) {
        // Code generation response
        const result = response.result;
        if (result.content && result.content[0] && result.content[0].text) {
          const resultData = JSON.parse(result.content[0].text);
          generatedCode = resultData.code || resultData.output;
          runId = resultData.runId;
          
          const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
          console.log(`✅ Code generated in ${elapsed}s`);
          console.log(`   Run ID: ${runId}`);
          console.log(`   Code length: ${generatedCode?.length || 0} characters\n`);
          
          if (generatedCode) {
            console.log('📄 Generated Code:');
            console.log('─'.repeat(80));
            console.log(generatedCode);
            console.log('─'.repeat(80));
            console.log('');
            
            // Save generated code
            writeFileSync('test-generated-code.ts', generatedCode);
            
            // Step 2: Simulate feedback (improve the code)
            console.log('🔧 Step 2: Simulating feedback from primary agent...\n');
            
            // Improved version with better error handling and JSDoc
            const improvedCode = generatedCode.replace(
              /function factorial/,
              `/**
 * Calculates the factorial of a number
 * @param n - The number to calculate factorial for
 * @returns The factorial of n
 * @throws Error if n is negative
 */
function factorial`
            ).replace(
              /if \(n < 0\)/,
              'if (!Number.isInteger(n)) throw new Error("Input must be an integer");\n  if (n < 0)'
            );
            
            console.log('📄 Improved Code (with feedback):');
            console.log('─'.repeat(80));
            console.log(improvedCode);
            console.log('─'.repeat(80));
            console.log('');
            
            // Step 3: Submit feedback
            console.log('📤 Step 3: Submitting feedback...\n');
            
            const feedbackRequest = {
              jsonrpc: '2.0',
              id: ++requestId,
              method: 'tools/call',
              params: {
                name: 'submit_feedback',
                arguments: {
                  runId: runId,
                  agentOutput: generatedCode,
                  userEdit: improvedCode,
                  source: 'augment',
                  metadata: {
                    file: 'test-generated-code.ts',
                    language: 'typescript',
                    taskType: 'code_generation',
                  },
                },
              },
            };
            
            agent.stdin.write(JSON.stringify(feedbackRequest) + '\n');
          }
        }
      } else if (response.id === 3 && response.result) {
        // Feedback submission response
        const result = response.result;
        if (result.content && result.content[0] && result.content[0].text) {
          const feedbackData = JSON.parse(result.content[0].text);
          console.log('✅ Feedback submitted successfully!');
          console.log(`   Feedback ID: ${feedbackData.feedbackId}`);
          console.log(`   Type: ${feedbackData.feedbackType}`);
          console.log(`   Severity: ${feedbackData.severity}`);
          console.log(`   Category: ${feedbackData.category}\n`);
          
          // Step 4: Get feedback stats
          console.log('📊 Step 4: Getting feedback statistics...\n');
          
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
      } else if (response.id === 4 && response.result) {
        // Feedback stats response
        const result = response.result;
        if (result.content && result.content[0] && result.content[0].text) {
          const stats = JSON.parse(result.content[0].text);
          console.log('✅ Feedback Statistics:');
          console.log(`   Total feedback events: ${stats.total}`);
          
          if (stats.byType && stats.byType.length > 0) {
            console.log('\n   By Type:');
            stats.byType.forEach(item => {
              console.log(`     - ${item.feedback_type}: ${item.count}`);
            });
          }
          
          if (stats.bySeverity && stats.bySeverity.length > 0) {
            console.log('\n   By Severity:');
            stats.bySeverity.forEach(item => {
              console.log(`     - ${item.severity}: ${item.count}`);
            });
          }
          
          if (stats.bySource && stats.bySource.length > 0) {
            console.log('\n   By Source:');
            stats.bySource.forEach(item => {
              console.log(`     - ${item.source}: ${item.count}`);
            });
          }
          
          console.log('\n');
          
          // Save results
          const results = {
            timestamp: new Date().toISOString(),
            testCase,
            generatedCode,
            improvedCode: readFileSync('test-generated-code.ts', 'utf-8'),
            feedback: feedbackData,
            stats,
            creditsSaved: AUGMENT_COST_PER_GENERATION,
            dollarsSaved: (AUGMENT_COST_PER_GENERATION / CREDITS_PER_DOLLAR).toFixed(2),
          };
          
          writeFileSync('test-results.json', JSON.stringify(results, null, 2));
          console.log('💾 Results saved to test-results.json\n');
          
          // Summary
          console.log('🎉 Test Complete!');
          console.log('─'.repeat(80));
          console.log(`✅ Code generated successfully`);
          console.log(`✅ Feedback submitted successfully`);
          console.log(`✅ Feedback stats retrieved successfully`);
          console.log(`💰 Credits saved: ${AUGMENT_COST_PER_GENERATION} ($${(AUGMENT_COST_PER_GENERATION / CREDITS_PER_DOLLAR).toFixed(2)})`);
          console.log('─'.repeat(80));
          
          agent.kill();
          process.exit(0);
        }
      }
    } catch (err) {
      // Ignore parse errors for partial lines
    }
  }
  
  output = lines[lines.length - 1];
});

agent.stderr.on('data', (data) => {
  const msg = data.toString();
  if (!msg.includes('ExperimentalWarning')) {
    console.error('Error:', msg);
  }
});

agent.on('close', (code) => {
  if (code !== 0) {
    console.error(`\n❌ Agent exited with code ${code}`);
    process.exit(1);
  }
});

// Timeout after 3 minutes
setTimeout(() => {
  console.error('\n❌ Test timed out after 3 minutes');
  agent.kill();
  process.exit(1);
}, 180000);

