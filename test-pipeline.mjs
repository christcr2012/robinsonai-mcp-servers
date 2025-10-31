/**
 * Test the new Synthesize-Execute-Critique-Refine pipeline
 * 
 * This tests the battle-tested framework that should produce
 * real, working, production-quality code.
 */

import { iterateTask } from './packages/free-agent-mcp/src/pipeline/index.ts';

async function testPipeline() {
  console.log('🧪 Testing Synthesize-Execute-Critique-Refine Pipeline\n');
  
  // Test 1: Simple function (should pass easily)
  console.log('📝 Test 1: Simple addition function');
  const test1Spec = `Create a TypeScript function that adds two numbers.

Requirements:
- Function name: add
- Parameters: two numbers (a, b)
- Returns: sum of a and b
- Must handle negative numbers and zero
- Must be a pure function (no side effects)

Include comprehensive tests covering:
- Basic addition (2 + 3 = 5)
- Negative numbers (-1 + 1 = 0)
- Zero (0 + 0 = 0)
- Large numbers (1000000 + 2000000 = 3000000)
`;

  try {
    const result1 = await iterateTask(test1Spec, {
      maxAttempts: 3,
      acceptThreshold: 0.9,
      minCoverage: 80,
    });
    
    console.log('\n✅ Test 1 Result:');
    console.log(`  Success: ${result1.ok}`);
    console.log(`  Score: ${(result1.score * 100).toFixed(1)}%`);
    console.log(`  Attempts: ${result1.attempts}`);
    
    if (result1.ok) {
      console.log('\n📄 Generated Files:');
      for (const file of result1.files) {
        console.log(`\n  ${file.path}:`);
        console.log(file.content.split('\n').map(line => `    ${line}`).join('\n'));
      }
    } else {
      console.log('\n❌ Failed to generate working code');
      if (result1.verdict) {
        console.log(`  Root cause: ${result1.verdict.explanations.root_cause}`);
        console.log(`  Fix needed: ${result1.verdict.explanations.minimal_fix}`);
      }
    }
  } catch (error) {
    console.error('\n❌ Test 1 failed with error:', error);
  }
  
  // Test 2: More complex function (the one that previously failed)
  console.log('\n\n📝 Test 2: HTTP client (previously generated fake APIs)');
  const test2Spec = `Create a simple HTTP client function that fetches data from a URL.

Requirements:
- Function name: fetchData
- Parameter: url (string)
- Returns: Promise<string> with response body
- Use the built-in 'fetch' API (available in Node.js 18+)
- Handle errors gracefully
- Must be async

Include tests covering:
- Successful fetch (mock the fetch API)
- Network error handling
- Invalid URL handling
`;

  try {
    const result2 = await iterateTask(test2Spec, {
      maxAttempts: 5,
      acceptThreshold: 0.85,
      minCoverage: 75,
      allowedLibraries: [
        'node:*',
        '@types/*',
        'jest',
        'vitest',
      ],
    });
    
    console.log('\n✅ Test 2 Result:');
    console.log(`  Success: ${result2.ok}`);
    console.log(`  Score: ${(result2.score * 100).toFixed(1)}%`);
    console.log(`  Attempts: ${result2.attempts}`);
    
    if (result2.ok) {
      console.log('\n📄 Generated Files:');
      for (const file of result2.files) {
        console.log(`\n  ${file.path}:`);
        console.log(file.content.split('\n').slice(0, 30).map(line => `    ${line}`).join('\n'));
        if (file.content.split('\n').length > 30) {
          console.log('    ... (truncated)');
        }
      }
      
      // Check for fake APIs
      const allCode = result2.files.map(f => f.content).join('\n');
      const fakeAPIs = [
        'RestifyClient',
        'executeRequest',
        'AWS.RestifyClient',
        'sum from @aws-sdk',
      ];
      
      const foundFakeAPIs = fakeAPIs.filter(api => allCode.includes(api));
      
      if (foundFakeAPIs.length > 0) {
        console.log('\n⚠️  WARNING: Found potential fake APIs:');
        foundFakeAPIs.forEach(api => console.log(`    - ${api}`));
      } else {
        console.log('\n✅ No fake APIs detected!');
      }
    } else {
      console.log('\n❌ Failed to generate working code');
      if (result2.verdict) {
        console.log(`  Root cause: ${result2.verdict.explanations.root_cause}`);
        console.log(`  Fix needed: ${result2.verdict.explanations.minimal_fix}`);
      }
    }
  } catch (error) {
    console.error('\n❌ Test 2 failed with error:', error);
  }
  
  console.log('\n\n🎯 Pipeline Test Complete!');
}

testPipeline().catch(console.error);

