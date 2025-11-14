#!/usr/bin/env tsx
/**
 * Run RAD Crawler schema migration
 * Extends RAD database with crawler + document tables
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Neon connection details (same as RAD setup)
const CONNECTION_URI = 'postgresql://neondb_owner:npg_dMv0ArX1TGYP@ep-broad-recipe-ae1wjh66.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require';

async function runMigration() {
  console.log('🚀 Running RAD Crawler schema migration...\n');

  const client = new Client({
    connectionString: CONNECTION_URI,
  });

  try {
    await client.connect();
    console.log('✅ Connected to Neon database\n');

    // Read migration SQL
    const migrationPath = join(__dirname, 'migrations', '004-rad-crawler-schema.sql');
    const sql = readFileSync(migrationPath, 'utf-8');

    console.log('📝 Executing migration...');
    await client.query(sql);
    console.log('✅ Migration completed successfully!\n');

    // Verify tables
    console.log('🔍 Verifying tables...');
    const result = await client.query(`
      SELECT 
        'rad_sources' as table_name, 
        COUNT(*) as row_count 
      FROM rad_sources
      UNION ALL
      SELECT 
        'rad_crawls' as table_name, 
        COUNT(*) as row_count 
      FROM rad_crawls
      UNION ALL
      SELECT 
        'rad_documents' as table_name, 
        COUNT(*) as row_count 
      FROM rad_documents
      UNION ALL
      SELECT 
        'rad_chunks' as table_name, 
        COUNT(*) as row_count 
      FROM rad_chunks
    `);

    console.log('\n📊 Table verification:');
    result.rows.forEach(row => {
      console.log(`  ✅ ${row.table_name}: ${row.row_count} rows`);
    });

    // Check views
    console.log('\n🔍 Verifying views...');
    const viewsResult = await client.query(`
      SELECT table_name 
      FROM information_schema.views 
      WHERE table_schema = 'public' 
        AND table_name LIKE 'rad_%_summary'
      ORDER BY table_name
    `);

    console.log('\n📊 Views created:');
    viewsResult.rows.forEach(row => {
      console.log(`  ✅ ${row.table_name}`);
    });

    console.log('\n✅ RAD Crawler schema migration complete!');
    console.log('\n📝 Next steps:');
    console.log('  1. Implement rad-crawler-core package');
    console.log('  2. Implement rad-crawler-cli package');
    console.log('  3. Add RAD category to Robinson\'s Toolkit');
    console.log('  4. Integrate with Agent Core evidence gathering');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await client.end();
  }
}

runMigration().catch(console.error);

