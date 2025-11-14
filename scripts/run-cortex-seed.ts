#!/usr/bin/env tsx
/**
 * Run Agent Cortex Seeding
 * Seeds initial playbooks, workflows, patterns, and capabilities
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Neon connection details (same as RAD)
const CONNECTION_URI = process.env.RAD_DATABASE_URL || 
  'postgresql://neondb_owner:npg_dMv0ArX1TGYP@ep-broad-recipe-ae1wjh66.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require';

async function runCortexSeed() {
  console.log('🧠 Running Agent Cortex Seeding...\n');

  const client = new Client({
    connectionString: CONNECTION_URI,
  });

  try {
    // Connect to database
    console.log('📡 Connecting to Neon...');
    await client.connect();
    console.log('✅ Connected!\n');

    // Read seeding SQL file
    console.log('📄 Reading seed file...');
    const seedPath = join(__dirname, 'migrations', '002-agent-cortex-seed.sql');
    const seed = readFileSync(seedPath, 'utf-8');
    console.log('✅ Seed loaded!\n');

    // Execute seeding
    console.log('🌱 Seeding Agent Cortex tables...');
    await client.query(seed);
    console.log('✅ Seeding complete!\n');

    // Verify seeding
    console.log('🔍 Verifying seed data...');
    const result = await client.query(`
      SELECT 
        'thinking_playbooks' as table_name,
        COUNT(*) as record_count
      FROM thinking_playbooks
      UNION ALL
      SELECT 
        'tool_workflows',
        COUNT(*)
      FROM tool_workflows
      UNION ALL
      SELECT 
        'code_patterns',
        COUNT(*)
      FROM code_patterns
      UNION ALL
      SELECT 
        'capability_registry',
        COUNT(*)
      FROM capability_registry
      ORDER BY table_name;
    `);

    console.log('\n📊 Seed data summary:');
    result.rows.forEach(row => {
      console.log(`  ✓ ${row.table_name}: ${row.record_count} records`);
    });

    console.log('\n✅ Agent Cortex Seeding complete!');
    console.log('\n📝 Starter brain includes:');
    console.log('  - 4 thinking playbooks (Hot Bugfix, Difficult Refactor, New Feature, Repo-wide Audit)');
    console.log('  - 3 tool workflows (Full Stack Deployment, Knowledge Base Indexing, Batch Analysis)');
    console.log('  - 4 code patterns (MCP Handler, Toolkit Handler, RAD Repository, Error Wrapper)');
    console.log('  - 4 capabilities (Provision DB, Deploy Web Service, Index Knowledge Base, Code Review)');
    console.log('\n📝 Next steps:');
    console.log('  1. Test Cortex integration with a real task');
    console.log('  2. Verify playbooks are matched correctly');
    console.log('  3. Add more playbooks/workflows/patterns as needed');
    console.log('  4. Implement Phase AC.5 (semantic search with pgvector)\n');

  } catch (error) {
    console.error('❌ Error running seed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run seeding
runCortexSeed();

