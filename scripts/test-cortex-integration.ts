#!/usr/bin/env tsx
/**
 * Test Agent Cortex integration
 * Verify that Cortex is accessible and working
 */

import { getCortexClient } from '../packages/free-agent-core/src/cortex/index.js';

async function testCortexIntegration() {
  console.log('🧠 Testing Agent Cortex Integration...\n');

  const cortex = getCortexClient();

  if (!cortex.isEnabled()) {
    console.error('❌ Cortex is not enabled (RAD_DATABASE_URL not set)');
    process.exit(1);
  }

  console.log('✅ Cortex is enabled\n');

  try {
    // Test 1: Get Cortex context for a sample task
    console.log('📋 Test 1: Getting Cortex context for "Fix authentication bug"...');
    const context = await cortex.getCortexContext({
      task: 'Fix authentication bug in login endpoint',
      kind: 'bugfix',
    });

    console.log(`✅ Retrieved Cortex context:`);
    console.log(`  - Playbooks: ${context.playbooks.length}`);
    console.log(`  - Workflows: ${context.workflows.length}`);
    console.log(`  - Patterns: ${context.patterns.length}`);
    console.log(`  - Capabilities: ${context.capabilities.length}`);
    console.log(`  - Artifacts: ${context.artifacts.length}`);
    console.log(`  - Related Knowledge: ${context.relatedKnowledge.length}\n`);

    if (context.playbooks.length > 0) {
      console.log(`  📚 Top playbook: "${context.playbooks[0].name}"`);
      console.log(`     Success rate: ${(context.playbooks[0].successRate * 100).toFixed(1)}%`);
      console.log(`     Usage count: ${context.playbooks[0].usageCount}\n`);
    }

    // Test 2: Check if embeddings exist
    console.log('📋 Test 2: Checking for embeddings...');
    const playbooksWithEmbeddings = await cortex.pool.query(
      `SELECT COUNT(*) as count FROM thinking_playbooks WHERE embedding IS NOT NULL`
    );
    const workflowsWithEmbeddings = await cortex.pool.query(
      `SELECT COUNT(*) as count FROM tool_workflows WHERE embedding IS NOT NULL`
    );
    const patternsWithEmbeddings = await cortex.pool.query(
      `SELECT COUNT(*) as count FROM code_patterns WHERE embedding IS NOT NULL`
    );
    const capabilitiesWithEmbeddings = await cortex.pool.query(
      `SELECT COUNT(*) as count FROM capability_registry WHERE embedding IS NOT NULL`
    );

    console.log(`✅ Embeddings status:`);
    console.log(`  - Playbooks: ${playbooksWithEmbeddings.rows[0].count}`);
    console.log(`  - Workflows: ${workflowsWithEmbeddings.rows[0].count}`);
    console.log(`  - Patterns: ${patternsWithEmbeddings.rows[0].count}`);
    console.log(`  - Capabilities: ${capabilitiesWithEmbeddings.rows[0].count}\n`);

    const totalEmbeddings = 
      parseInt(playbooksWithEmbeddings.rows[0].count) +
      parseInt(workflowsWithEmbeddings.rows[0].count) +
      parseInt(patternsWithEmbeddings.rows[0].count) +
      parseInt(capabilitiesWithEmbeddings.rows[0].count);

    if (totalEmbeddings === 0) {
      console.log('⚠️  No embeddings found. Run: npx tsx scripts/generate-cortex-embeddings.ts\n');
    } else {
      console.log(`✅ Total embeddings: ${totalEmbeddings}\n`);
    }

    // Test 3: Check evidence cache
    console.log('📋 Test 3: Checking evidence cache...');
    const cacheEntries = await cortex.pool.query(
      `SELECT COUNT(*) as count FROM evidence_cache`
    );
    console.log(`✅ Evidence cache entries: ${cacheEntries.rows[0].count}\n`);

    // Test 4: Check knowledge artifacts
    console.log('📋 Test 4: Checking knowledge artifacts...');
    const artifacts = await cortex.pool.query(
      `SELECT COUNT(*) as count FROM knowledge_artifacts`
    );
    console.log(`✅ Knowledge artifacts: ${artifacts.rows[0].count}\n`);

    console.log('✅ All Cortex integration tests passed!\n');
    console.log('📝 Summary:');
    console.log('  - Cortex is enabled and accessible');
    console.log('  - Context retrieval working');
    console.log('  - Database tables accessible');
    console.log(`  - Embeddings: ${totalEmbeddings > 0 ? 'Ready' : 'Need generation'}`);
    console.log('\n🎉 Agent Cortex is ready to use!\n');

  } catch (error) {
    console.error('❌ Error testing Cortex integration:', error);
    process.exit(1);
  }
}

// Run test
testCortexIntegration();

