#!/usr/bin/env tsx
/**
 * Generate embeddings for all Agent Cortex seed data
 * Uses Voyage AI (free tier: 100M tokens/month)
 */

import { config } from 'dotenv';
import { getCortexClient } from '../packages/free-agent-core/src/cortex/index.js';

// Load .env file
config();

async function generateAllEmbeddings() {
  console.log('🧠 Generating embeddings for Agent Cortex seed data...\n');

  const cortex = getCortexClient();

  if (!cortex.isEnabled()) {
    console.error('❌ Cortex is not enabled (RAD_DATABASE_URL not set)');
    process.exit(1);
  }

  try {
    // Generate embeddings for playbooks
    console.log('📚 Generating embeddings for thinking playbooks...');
    const playbooksCount = await cortex.playbooks.generateAllEmbeddings();
    console.log(`✅ Generated ${playbooksCount} playbook embeddings\n`);

    // Generate embeddings for workflows
    console.log('🔧 Generating embeddings for tool workflows...');
    const workflowsCount = await cortex.workflows.generateAllEmbeddings();
    console.log(`✅ Generated ${workflowsCount} workflow embeddings\n`);

    // Generate embeddings for patterns
    console.log('📝 Generating embeddings for code patterns...');
    const patternsCount = await cortex.patterns.generateAllEmbeddings();
    console.log(`✅ Generated ${patternsCount} pattern embeddings\n`);

    // Generate embeddings for capabilities
    console.log('⚡ Generating embeddings for capabilities...');
    const capabilitiesCount = await cortex.capabilities.generateAllEmbeddings();
    console.log(`✅ Generated ${capabilitiesCount} capability embeddings\n`);

    console.log('✅ All embeddings generated successfully!');
    console.log('\n📊 Summary:');
    console.log(`  - Playbooks: ${playbooksCount}`);
    console.log(`  - Workflows: ${workflowsCount}`);
    console.log(`  - Patterns: ${patternsCount}`);
    console.log(`  - Capabilities: ${capabilitiesCount}`);
    console.log(`  - Total: ${playbooksCount + workflowsCount + patternsCount + capabilitiesCount}`);
    console.log('\n📝 Next steps:');
    console.log('  1. Test semantic search with real queries');
    console.log('  2. Verify embeddings are being used in getCortexContext()');
    console.log('  3. Implement background jobs for pattern detection');
    console.log('  4. Monitor usage and success rates\n');

  } catch (error) {
    console.error('❌ Error generating embeddings:', error);
    process.exit(1);
  }
}

// Run embedding generation
generateAllEmbeddings();

