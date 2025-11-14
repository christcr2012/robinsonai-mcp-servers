#!/usr/bin/env tsx
/**
 * Enable pgvector and add embedding columns to Agent Cortex tables
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

async function runPgvectorMigration() {
  console.log('🧠 Enabling pgvector for Agent Cortex...\n');

  const client = new Client({
    connectionString: CONNECTION_URI,
  });

  try {
    // Connect to database
    console.log('📡 Connecting to Neon...');
    await client.connect();
    console.log('✅ Connected!\n');

    // Read migration SQL file
    console.log('📄 Reading migration file...');
    const migrationPath = join(__dirname, 'migrations', '003-agent-cortex-pgvector.sql');
    const migration = readFileSync(migrationPath, 'utf-8');
    console.log('✅ Migration loaded!\n');

    // Execute migration
    console.log('🔧 Running pgvector migration...');
    await client.query(migration);
    console.log('✅ Migration complete!\n');

    // Verify pgvector extension
    console.log('🔍 Verifying pgvector extension...');
    const extResult = await client.query(`
      SELECT 
        extname as extension_name,
        extversion as version
      FROM pg_extension
      WHERE extname = 'vector';
    `);

    if (extResult.rows.length > 0) {
      console.log(`✅ pgvector ${extResult.rows[0].version} enabled!\n`);
    } else {
      console.log('❌ pgvector not found!\n');
    }

    // Verify embedding columns
    console.log('🔍 Verifying embedding columns...');
    const colResult = await client.query(`
      SELECT 
        table_name,
        column_name,
        data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND column_name = 'embedding'
        AND table_name IN (
          'thinking_playbooks',
          'tool_workflows',
          'code_patterns',
          'capability_registry',
          'knowledge_artifacts'
        )
      ORDER BY table_name;
    `);

    console.log('\n📊 Embedding columns:');
    colResult.rows.forEach(row => {
      console.log(`  ✓ ${row.table_name}.${row.column_name} (${row.data_type})`);
    });

    // Verify indexes
    console.log('\n🔍 Verifying vector indexes...');
    const idxResult = await client.query(`
      SELECT 
        tablename,
        indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND indexname LIKE '%embedding_idx'
      ORDER BY tablename;
    `);

    console.log('\n📊 Vector indexes:');
    idxResult.rows.forEach(row => {
      console.log(`  ✓ ${row.tablename}: ${row.indexname}`);
    });

    console.log('\n✅ pgvector migration complete!');
    console.log('\n📝 Next steps:');
    console.log('  1. Implement embedding generation in cortex repos');
    console.log('  2. Add semantic search methods (findSimilarToTask, etc.)');
    console.log('  3. Implement background jobs for pattern detection');
    console.log('  4. Test semantic search with real queries\n');

  } catch (error) {
    console.error('❌ Error running migration:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run migration
runPgvectorMigration();

