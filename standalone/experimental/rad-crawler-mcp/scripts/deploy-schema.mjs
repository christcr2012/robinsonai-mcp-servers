#!/usr/bin/env node
/**
 * RAD Crawler - Neon Schema Deployment Script
 * 
 * Deploys the complete database schema to Neon PostgreSQL
 * including tables, indexes, and default governance policy.
 */

import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pg from 'pg';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ANSI colors for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function deploySchema() {
  log('\n🚀 Deploying RAD Crawler schema to Neon...', 'blue');

  // Check environment variable
  const connectionString = process.env.NEON_DATABASE_URL;
  if (!connectionString) {
    log('❌ Error: NEON_DATABASE_URL environment variable not set', 'red');
    log('   Set it with your Neon connection string:', 'yellow');
    log('   export NEON_DATABASE_URL="postgresql://user:pass@host.neon.tech/db?sslmode=require"', 'yellow');
    process.exit(1);
  }

  // Create connection pool
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  let client;

  try {
    // Connect
    client = await pool.connect();
    log('✅ Connected to Neon database', 'green');

    // Start transaction
    await client.query('BEGIN');

    // Enable pgvector extension
    log('📦 Enabling pgvector extension...', 'blue');
    await client.query('CREATE EXTENSION IF NOT EXISTS vector');
    log('✅ pgvector extension enabled', 'green');

    // Read schema file
    const schemaPath = join(__dirname, '..', 'schema.sql');
    const schema = await readFile(schemaPath, 'utf-8');

    // Split into statements (simple split on semicolon)
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('CREATE EXTENSION'));

    // Execute each statement
    for (const statement of statements) {
      // Skip comments
      if (statement.startsWith('--')) continue;

      // Determine what we're creating
      let action = 'Executing';
      if (statement.includes('CREATE TABLE')) {
        const match = statement.match(/CREATE TABLE IF NOT EXISTS (\w+)/);
        if (match) {
          action = `Creating table: ${match[1]}`;
        }
      } else if (statement.includes('CREATE INDEX')) {
        action = 'Creating index';
      } else if (statement.includes('INSERT INTO')) {
        action = 'Inserting default data';
      }

      try {
        await client.query(statement);
        if (action !== 'Executing') {
          log(`✅ ${action}`, 'green');
        }
      } catch (err) {
        // Ignore "already exists" errors
        if (err.message.includes('already exists')) {
          log(`⚠️  ${action} (already exists)`, 'yellow');
        } else {
          throw err;
        }
      }
    }

    // Create vector index (separate because it needs pgvector)
    log('📦 Creating vector similarity index...', 'blue');
    try {
      await client.query(`
        CREATE INDEX IF NOT EXISTS chunks_embedding_idx 
        ON chunks USING ivfflat (embedding vector_cosine_ops) 
        WITH (lists = 100)
      `);
      log('✅ Vector index created', 'green');
    } catch (err) {
      if (err.message.includes('already exists')) {
        log('⚠️  Vector index already exists', 'yellow');
      } else {
        log(`⚠️  Could not create vector index: ${err.message}`, 'yellow');
        log('   This is OK - index will be created when first embeddings are added', 'yellow');
      }
    }

    // Update default policy with safety limits
    log('📦 Updating governance policy with safety limits...', 'blue');
    await client.query(`
      UPDATE policy 
      SET budgets = jsonb_set(
        budgets,
        '{max_pages_per_job}',
        '1000'
      )
      WHERE active = TRUE
    `);
    await client.query(`
      UPDATE policy 
      SET budgets = jsonb_set(
        budgets,
        '{max_time_minutes}',
        '120'
      )
      WHERE active = TRUE
    `);
    await client.query(`
      UPDATE policy 
      SET budgets = jsonb_set(
        budgets,
        '{max_repo_files}',
        '5000'
      )
      WHERE active = TRUE
    `);
    await client.query(`
      UPDATE policy 
      SET budgets = jsonb_set(
        budgets,
        '{max_chunk_size_kb}',
        '100'
      )
      WHERE active = TRUE
    `);
    log('✅ Safety limits configured', 'green');

    // Commit transaction
    await client.query('COMMIT');

    // Verify deployment
    log('\n🔍 Verifying deployment...', 'blue');
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    log(`✅ Created ${tables.rows.length} tables:`, 'green');
    tables.rows.forEach(row => {
      log(`   - ${row.table_name}`, 'green');
    });

    const indexes = await client.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE schemaname = 'public'
    `);
    log(`✅ Created ${indexes.rows.length} indexes`, 'green');

    const policies = await client.query(`
      SELECT COUNT(*) as count 
      FROM policy 
      WHERE active = TRUE
    `);
    log(`✅ Active governance policies: ${policies.rows[0].count}`, 'green');

    log('\n🎉 Schema deployment successful!', 'green');
    log('   Next step: Run verification script', 'blue');
    log('   node scripts/verify-schema.mjs\n', 'blue');

  } catch (err) {
    // Rollback on error
    if (client) {
      await client.query('ROLLBACK');
    }
    log(`\n❌ Deployment failed: ${err.message}`, 'red');
    log(`   Stack: ${err.stack}`, 'red');
    process.exit(1);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

// Run deployment
deploySchema().catch(err => {
  log(`\n❌ Unexpected error: ${err.message}`, 'red');
  process.exit(1);
});

