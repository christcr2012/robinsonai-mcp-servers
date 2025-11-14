#!/usr/bin/env tsx
/**
 * Setup RAD (Repository Agent Database) schema in Neon
 * 
 * This script creates the necessary tables for agent long-term memory:
 * - tasks: Completed agent tasks with outcomes
 * - decisions: Planning decisions and reasoning
 * - lessons: Lessons learned from task outcomes
 * - repo_metadata: Repository-level metadata
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Neon connection details
const CONNECTION_URI = 'postgresql://neondb_owner:npg_dMv0ArX1TGYP@ep-broad-recipe-ae1wjh66.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require';

async function setupRadDatabase() {
  console.log('🚀 Setting up RAD Memory Database...\n');

  const client = new Client({
    connectionString: CONNECTION_URI,
  });

  try {
    // Connect to database
    console.log('📡 Connecting to Neon...');
    await client.connect();
    console.log('✅ Connected!\n');

    // Read SQL schema file
    console.log('📄 Reading schema file...');
    const schemaPath = join(__dirname, 'setup-rad-schema.sql');
    const schema = readFileSync(schemaPath, 'utf-8');
    console.log('✅ Schema loaded!\n');

    // Execute schema
    console.log('🔨 Creating tables...');
    await client.query(schema);
    console.log('✅ Tables created!\n');

    // Verify tables
    console.log('🔍 Verifying tables...');
    const result = await client.query(`
      SELECT 
        table_name,
        (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
      FROM information_schema.tables t
      WHERE table_schema = 'public' 
        AND table_name IN ('tasks', 'decisions', 'lessons', 'repo_metadata')
      ORDER BY table_name;
    `);

    console.log('\n📊 Tables created:');
    result.rows.forEach(row => {
      console.log(`  ✓ ${row.table_name} (${row.column_count} columns)`);
    });

    console.log('\n✅ RAD Memory Database setup complete!');
    console.log('\n📝 Connection URI for agents:');
    console.log(`   ${CONNECTION_URI}\n`);
    console.log('💡 Add to your .env files:');
    console.log(`   RAD_ENABLED=true`);
    console.log(`   RAD_DATABASE_URL=${CONNECTION_URI}\n`);

  } catch (error) {
    console.error('❌ Error setting up database:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run setup
setupRadDatabase();

