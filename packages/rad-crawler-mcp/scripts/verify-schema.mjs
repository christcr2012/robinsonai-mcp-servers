#!/usr/bin/env node
/**
 * RAD Crawler - Schema Verification Script
 * 
 * Verifies that the Neon database schema is correctly deployed
 * with all tables, indexes, and extensions.
 */

import pg from 'pg';

const { Pool } = pg;

// ANSI colors
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

// Expected schema
const EXPECTED_TABLES = {
  sources: ['source_id', 'kind', 'uri', 'domain', 'repo', 'created_at'],
  documents: ['doc_id', 'source_id', 'uri', 'title', 'lang', 'hash_sha1', 'fetched_at', 'updated_at', 'is_active'],
  doc_blobs: ['doc_id', 'part_ix', 'content'],
  chunks: ['chunk_id', 'doc_id', 'ix', 'text', 'ts', 'embedding', 'meta'],
  jobs: ['job_id', 'kind', 'params', 'state', 'progress', 'created_at', 'started_at', 'finished_at', 'error'],
  policy: ['policy_id', 'allowlist', 'denylist', 'budgets', 'created_at', 'active'],
};

const EXPECTED_INDEXES = [
  'sources_kind_idx',
  'sources_domain_idx',
  'documents_source_idx',
  'documents_hash_idx',
  'documents_active_idx',
  'chunks_doc_ix',
  'chunks_fts_ix',
  'jobs_state_idx',
  'jobs_created_idx',
  'policy_active_idx',
];

async function verifySchema() {
  log('\n🔍 Verifying RAD Crawler schema...', 'blue');

  const connectionString = process.env.NEON_DATABASE_URL;
  if (!connectionString) {
    log('❌ Error: NEON_DATABASE_URL environment variable not set', 'red');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  let client;
  let allPassed = true;

  try {
    client = await pool.connect();

    // Check pgvector extension
    const extResult = await client.query(`
      SELECT * FROM pg_extension WHERE extname = 'vector'
    `);
    if (extResult.rows.length > 0) {
      log('✅ pgvector extension enabled', 'green');
    } else {
      log('❌ pgvector extension NOT enabled', 'red');
      log('   Run in Neon SQL Editor: CREATE EXTENSION IF NOT EXISTS vector;', 'yellow');
      allPassed = false;
    }

    // Check tables
    for (const [tableName, expectedColumns] of Object.entries(EXPECTED_TABLES)) {
      const tableResult = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = $1
        ORDER BY ordinal_position
      `, [tableName]);

      if (tableResult.rows.length === 0) {
        log(`❌ Table '${tableName}' does NOT exist`, 'red');
        allPassed = false;
      } else {
        const actualColumns = tableResult.rows.map(r => r.column_name);
        const missingColumns = expectedColumns.filter(c => !actualColumns.includes(c));
        
        if (missingColumns.length > 0) {
          log(`⚠️  Table '${tableName}' exists but missing columns: ${missingColumns.join(', ')}`, 'yellow');
          allPassed = false;
        } else {
          log(`✅ Table '${tableName}' exists (${actualColumns.length} columns)`, 'green');
        }
      }
    }

    // Check indexes
    const indexResult = await client.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE schemaname = 'public'
    `);
    const actualIndexes = indexResult.rows.map(r => r.indexname);
    
    let indexCount = 0;
    for (const expectedIndex of EXPECTED_INDEXES) {
      if (actualIndexes.includes(expectedIndex)) {
        indexCount++;
      }
    }

    if (indexCount === EXPECTED_INDEXES.length) {
      log(`✅ All expected indexes created (${indexCount}/${EXPECTED_INDEXES.length})`, 'green');
    } else {
      log(`⚠️  Some indexes missing (${indexCount}/${EXPECTED_INDEXES.length})`, 'yellow');
      const missing = EXPECTED_INDEXES.filter(i => !actualIndexes.includes(i));
      log(`   Missing: ${missing.join(', ')}`, 'yellow');
    }

    // Check vector index (may not exist yet)
    if (actualIndexes.includes('chunks_embedding_idx')) {
      log('✅ Vector similarity index exists', 'green');
    } else {
      log('⚠️  Vector similarity index not created yet (will be created on first use)', 'yellow');
    }

    // Check default policy
    const policyResult = await client.query(`
      SELECT * FROM policy WHERE active = TRUE
    `);
    if (policyResult.rows.length > 0) {
      log(`✅ Default governance policy exists`, 'green');
      const policy = policyResult.rows[0];
      log(`   Budgets: ${JSON.stringify(policy.budgets)}`, 'blue');
      
      // Verify safety limits
      const budgets = policy.budgets;
      if (budgets.max_pages_per_job && budgets.max_time_minutes && budgets.max_repo_files) {
        log('✅ Safety limits configured', 'green');
      } else {
        log('⚠️  Safety limits incomplete', 'yellow');
        allPassed = false;
      }
    } else {
      log('❌ No active governance policy found', 'red');
      allPassed = false;
    }

    // Database size check
    const sizeResult = await client.query(`
      SELECT pg_size_pretty(pg_database_size(current_database())) as size
    `);
    log(`\n📊 Database size: ${sizeResult.rows[0].size}`, 'blue');

    // Table sizes
    const tableSizes = await client.query(`
      SELECT 
        tablename,
        pg_size_pretty(pg_total_relation_size('public.'||tablename)) AS size
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY pg_total_relation_size('public.'||tablename) DESC
    `);
    log('📊 Table sizes:', 'blue');
    tableSizes.rows.forEach(row => {
      log(`   ${row.tablename}: ${row.size}`, 'blue');
    });

    // Row counts
    log('\n📊 Row counts:', 'blue');
    for (const tableName of Object.keys(EXPECTED_TABLES)) {
      const countResult = await client.query(`SELECT COUNT(*) as count FROM ${tableName}`);
      log(`   ${tableName}: ${countResult.rows[0].count} rows`, 'blue');
    }

    // Final result
    if (allPassed) {
      log('\n🎉 Schema verification successful!', 'green');
      log('   All tables, indexes, and policies are correctly configured.', 'green');
      log('   Ready to start using RAD Crawler!\n', 'green');
      process.exit(0);
    } else {
      log('\n⚠️  Schema verification completed with warnings', 'yellow');
      log('   Some components may be missing or incomplete.', 'yellow');
      log('   Review the output above and re-run deployment if needed.\n', 'yellow');
      process.exit(1);
    }

  } catch (err) {
    log(`\n❌ Verification failed: ${err.message}`, 'red');
    log(`   Stack: ${err.stack}`, 'red');
    process.exit(1);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

// Run verification
verifySchema().catch(err => {
  log(`\n❌ Unexpected error: ${err.message}`, 'red');
  process.exit(1);
});

