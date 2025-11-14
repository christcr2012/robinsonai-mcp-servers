#!/usr/bin/env tsx
/**
 * Run Agent Cortex Schema Migration
 * Extends RAD Memory with Agent Cortex tables
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

async function runCortexMigration() {
  console.log('🧠 Running Agent Cortex Schema Migration...\n');

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
    const migrationPath = join(__dirname, 'migrations', '001-agent-cortex-schema.sql');
    const migration = readFileSync(migrationPath, 'utf-8');
    console.log('✅ Migration loaded!\n');

    // Execute migration
    console.log('🔨 Creating Agent Cortex tables...');
    await client.query(migration);
    console.log('✅ Tables created!\n');

    // Verify tables
    console.log('🔍 Verifying tables...');
    const result = await client.query(`
      SELECT 
        table_name,
        (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
      FROM information_schema.tables t
      WHERE table_schema = 'public' 
        AND table_name IN (
          'thinking_playbooks',
          'tool_workflows',
          'code_patterns',
          'capability_registry',
          'knowledge_artifacts',
          'evidence_cache'
        )
      ORDER BY table_name;
    `);

    console.log('\n📊 Agent Cortex tables created:');
    result.rows.forEach(row => {
      console.log(`  ✓ ${row.table_name} (${row.column_count} columns)`);
    });

    // Show all RAD + Cortex tables
    console.log('\n📊 All RAD Memory + Agent Cortex tables:');
    const allTables = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    
    allTables.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });

    console.log('\n✅ Agent Cortex Schema Migration complete!');
    console.log('\n📝 Next steps:');
    console.log('  1. Implement Cortex repos in free-agent-core/src/cortex/');
    console.log('  2. Implement cortex-client.ts');
    console.log('  3. Hook Cortex into Agent Core flows');
    console.log('  4. Seed initial playbooks, workflows, patterns, capabilities\n');

  } catch (error) {
    console.error('❌ Error running migration:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run migration
runCortexMigration();

