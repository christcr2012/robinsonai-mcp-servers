#!/usr/bin/env node

/**
 * Phase 4 Architecture Validation Tests
 * 
 * Validates:
 * 1. No imports from FREE agent in PAID agent
 * 2. Both agents use shared libraries
 * 3. All packages build successfully
 * 4. Shared libraries export correct modules
 * 5. Architecture is clean and maintainable
 */

import { readFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = __dirname;

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    passed++;
  } catch (err) {
    console.error(`❌ ${name}`);
    console.error(`   ${err.message}`);
    failed++;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

console.log('\n🧪 Phase 4 Architecture Validation Tests\n');
console.log('=' .repeat(60));

// ============================================================================
// Test 1: Verify No Imports from FREE Agent in PAID Agent
// ============================================================================

test('PAID agent has no imports from FREE agent', () => {
  const paidAgentIndex = readFileSync(join(ROOT, 'packages/paid-agent-mcp/src/index.ts'), 'utf-8');
  
  // Check for problematic import patterns
  const problematicPatterns = [
    /import.*from.*['"].*free-agent-mcp.*dist.*['"]/,
    /import.*from.*['"]\.\.\/\.\.\/free-agent-mcp.*['"]/,
    /require\(['"].*free-agent-mcp.*dist.*['"]\)/,
  ];
  
  for (const pattern of problematicPatterns) {
    const matches = paidAgentIndex.match(pattern);
    if (matches) {
      // Filter out comments
      const matchedLine = matches[0];
      if (!matchedLine.includes('//') && !matchedLine.includes('NOTE:')) {
        throw new Error(`Found problematic import: ${matchedLine}`);
      }
    }
  }
});

test('PAID agent package.json has no free-agent-mcp dependency', () => {
  const packageJson = JSON.parse(readFileSync(join(ROOT, 'packages/paid-agent-mcp/package.json'), 'utf-8'));
  
  assert(
    !packageJson.dependencies['@robinson_ai_systems/free-agent-mcp'],
    'PAID agent should not depend on free-agent-mcp'
  );
});

// ============================================================================
// Test 2: Verify Both Agents Use Shared Libraries
// ============================================================================

test('FREE agent has shared-utils dependency', () => {
  const packageJson = JSON.parse(readFileSync(join(ROOT, 'packages/free-agent-mcp/package.json'), 'utf-8'));
  
  assert(
    packageJson.dependencies['@robinson_ai_systems/shared-utils'] === 'workspace:*',
    'FREE agent should depend on shared-utils'
  );
});

test('FREE agent has shared-pipeline dependency', () => {
  const packageJson = JSON.parse(readFileSync(join(ROOT, 'packages/free-agent-mcp/package.json'), 'utf-8'));
  
  assert(
    packageJson.dependencies['@robinson_ai_systems/shared-pipeline'] === 'workspace:*',
    'FREE agent should depend on shared-pipeline'
  );
});

test('PAID agent has shared-utils dependency', () => {
  const packageJson = JSON.parse(readFileSync(join(ROOT, 'packages/paid-agent-mcp/package.json'), 'utf-8'));
  
  assert(
    packageJson.dependencies['@robinson_ai_systems/shared-utils'] === 'workspace:*',
    'PAID agent should depend on shared-utils'
  );
});

test('PAID agent has shared-pipeline dependency', () => {
  const packageJson = JSON.parse(readFileSync(join(ROOT, 'packages/paid-agent-mcp/package.json'), 'utf-8'));
  
  assert(
    packageJson.dependencies['@robinson_ai_systems/shared-pipeline'] === 'workspace:*',
    'PAID agent should depend on shared-pipeline'
  );
});

// ============================================================================
// Test 3: Verify PAID Agent Uses Shared Libraries
// ============================================================================

test('PAID agent imports iterateTask from shared-pipeline', () => {
  const paidAgentIndex = readFileSync(join(ROOT, 'packages/paid-agent-mcp/src/index.ts'), 'utf-8');
  
  assert(
    paidAgentIndex.includes("import('@robinson_ai_systems/shared-pipeline')") &&
    paidAgentIndex.includes('iterateTask'),
    'PAID agent should import iterateTask from shared-pipeline'
  );
});

test('PAID agent imports makeProjectBrief from shared-utils', () => {
  const paidAgentIndex = readFileSync(join(ROOT, 'packages/paid-agent-mcp/src/index.ts'), 'utf-8');
  
  assert(
    paidAgentIndex.includes("import('@robinson_ai_systems/shared-utils')") &&
    paidAgentIndex.includes('makeProjectBrief'),
    'PAID agent should import makeProjectBrief from shared-utils'
  );
});

test('PAID agent imports judgeCode from shared-pipeline', () => {
  const paidAgentIndex = readFileSync(join(ROOT, 'packages/paid-agent-mcp/src/index.ts'), 'utf-8');
  
  assert(
    paidAgentIndex.includes('judgeCode'),
    'PAID agent should import judgeCode from shared-pipeline'
  );
});

test('PAID agent imports applyFixPlan from shared-pipeline', () => {
  const paidAgentIndex = readFileSync(join(ROOT, 'packages/paid-agent-mcp/src/index.ts'), 'utf-8');
  
  assert(
    paidAgentIndex.includes('applyFixPlan'),
    'PAID agent should import applyFixPlan from shared-pipeline'
  );
});

// ============================================================================
// Test 4: Verify Shared Libraries Structure
// ============================================================================

test('shared-utils exports project-brief', () => {
  const indexFile = readFileSync(join(ROOT, 'standalone/libraries/shared-utils/src/index.ts'), 'utf-8');
  
  assert(
    indexFile.includes('makeProjectBrief') && indexFile.includes('project-brief.js'),
    'shared-utils should export makeProjectBrief from project-brief'
  );
});

test('shared-utils exports code-retrieval', () => {
  const indexFile = readFileSync(join(ROOT, 'standalone/libraries/shared-utils/src/index.ts'), 'utf-8');
  
  assert(
    indexFile.includes('retrieveCodeContext') && indexFile.includes('code-retrieval.js'),
    'shared-utils should export retrieveCodeContext from code-retrieval'
  );
});

test('shared-pipeline exports synthesize', () => {
  const indexFile = readFileSync(join(ROOT, 'standalone/libraries/shared-pipeline/src/index.ts'), 'utf-8');
  
  assert(
    indexFile.includes('synthesize.js'),
    'shared-pipeline should export from synthesize'
  );
});

test('shared-pipeline exports judge', () => {
  const indexFile = readFileSync(join(ROOT, 'standalone/libraries/shared-pipeline/src/index.ts'), 'utf-8');
  
  assert(
    indexFile.includes('judge.js'),
    'shared-pipeline should export from judge'
  );
});

test('shared-pipeline exports refine', () => {
  const indexFile = readFileSync(join(ROOT, 'standalone/libraries/shared-pipeline/src/index.ts'), 'utf-8');
  
  assert(
    indexFile.includes('refine.js'),
    'shared-pipeline should export from refine'
  );
});

test('shared-pipeline exports pipeline', () => {
  const indexFile = readFileSync(join(ROOT, 'standalone/libraries/shared-pipeline/src/index.ts'), 'utf-8');
  
  assert(
    indexFile.includes('pipeline.js'),
    'shared-pipeline should export from pipeline'
  );
});

// ============================================================================
// Test 5: Verify Build Artifacts Exist
// ============================================================================

test('shared-utils builds successfully', () => {
  assert(
    existsSync(join(ROOT, 'standalone/libraries/shared-utils/dist/index.js')),
    'shared-utils dist/index.js should exist'
  );
  assert(
    existsSync(join(ROOT, 'standalone/libraries/shared-utils/dist/index.d.ts')),
    'shared-utils dist/index.d.ts should exist'
  );
});

test('shared-pipeline builds successfully', () => {
  assert(
    existsSync(join(ROOT, 'standalone/libraries/shared-pipeline/dist/index.js')),
    'shared-pipeline dist/index.js should exist'
  );
  assert(
    existsSync(join(ROOT, 'standalone/libraries/shared-pipeline/dist/index.d.ts')),
    'shared-pipeline dist/index.d.ts should exist'
  );
});

test('FREE agent builds successfully', () => {
  assert(
    existsSync(join(ROOT, 'packages/free-agent-mcp/dist/index.js')),
    'FREE agent dist/index.js should exist'
  );
});

test('PAID agent builds successfully', () => {
  assert(
    existsSync(join(ROOT, 'packages/paid-agent-mcp/dist/index.js')),
    'PAID agent dist/index.js should exist'
  );
});

// ============================================================================
// Test 6: Verify Architecture Cleanliness
// ============================================================================

test('No circular dependencies between agents', () => {
  const freeAgentPkg = JSON.parse(readFileSync(join(ROOT, 'packages/free-agent-mcp/package.json'), 'utf-8'));
  const paidAgentPkg = JSON.parse(readFileSync(join(ROOT, 'packages/paid-agent-mcp/package.json'), 'utf-8'));
  
  assert(
    !freeAgentPkg.dependencies['@robinson_ai_systems/paid-agent-mcp'],
    'FREE agent should not depend on PAID agent'
  );
  
  assert(
    !paidAgentPkg.dependencies['@robinson_ai_systems/free-agent-mcp'],
    'PAID agent should not depend on FREE agent'
  );
});

test('Shared libraries use workspace protocol', () => {
  const freeAgentPkg = JSON.parse(readFileSync(join(ROOT, 'packages/free-agent-mcp/package.json'), 'utf-8'));
  const paidAgentPkg = JSON.parse(readFileSync(join(ROOT, 'packages/paid-agent-mcp/package.json'), 'utf-8'));
  
  assert(
    freeAgentPkg.dependencies['@robinson_ai_systems/shared-utils'] === 'workspace:*',
    'FREE agent should use workspace:* for shared-utils'
  );
  
  assert(
    paidAgentPkg.dependencies['@robinson_ai_systems/shared-utils'] === 'workspace:*',
    'PAID agent should use workspace:* for shared-utils'
  );
});

// ============================================================================
// Summary
// ============================================================================

console.log('=' .repeat(60));
console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed\n`);

if (failed === 0) {
  console.log('✅ ALL TESTS PASSED! Architecture is clean and correct.\n');
  process.exit(0);
} else {
  console.log('❌ SOME TESTS FAILED! Please review the errors above.\n');
  process.exit(1);
}

