#!/usr/bin/env tsx
/**
 * Test RAD Memory Connection
 * Verifies that RAD is working and shows recent tasks
 */

import pg from 'pg';

const { Client } = pg;

// Default RAD database URL (same as in free-agent-core)
const RAD_DATABASE_URL = process.env.RAD_DATABASE_URL || 
  'postgresql://neondb_owner:npg_dMv0ArX1TGYP@ep-broad-recipe-ae1wjh66.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require';

async function testRadConnection() {
  console.log('🧠 Testing RAD Memory Connection...\n');

  const client = new Client({
    connectionString: RAD_DATABASE_URL,
  });

  try {
    // Connect
    console.log('📡 Connecting to Neon...');
    await client.connect();
    console.log('✅ Connected!\n');

    // Check tables exist
    console.log('🔍 Checking tables...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('tasks', 'decisions', 'lessons', 'repo_metadata')
      ORDER BY table_name;
    `);
    
    console.log(`✅ Found ${tablesResult.rows.length} tables:`);
    tablesResult.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    console.log();

    // Count records in each table
    console.log('📊 Record counts:');
    
    const tasksCount = await client.query('SELECT COUNT(*) FROM tasks');
    console.log(`   - tasks: ${tasksCount.rows[0].count}`);
    
    const decisionsCount = await client.query('SELECT COUNT(*) FROM decisions');
    console.log(`   - decisions: ${decisionsCount.rows[0].count}`);
    
    const lessonsCount = await client.query('SELECT COUNT(*) FROM lessons');
    console.log(`   - lessons: ${lessonsCount.rows[0].count}`);
    
    const repoCount = await client.query('SELECT COUNT(*) FROM repo_metadata');
    console.log(`   - repo_metadata: ${repoCount.rows[0].count}`);
    console.log();

    // Show recent tasks
    const recentTasks = await client.query(`
      SELECT 
        task_description,
        task_kind,
        agent_tier,
        success,
        created_at
      FROM tasks
      ORDER BY created_at DESC
      LIMIT 5;
    `);

    if (recentTasks.rows.length > 0) {
      console.log('📝 Recent tasks:');
      recentTasks.rows.forEach((task, i) => {
        console.log(`\n   ${i + 1}. ${task.task_description}`);
        console.log(`      Kind: ${task.task_kind} | Tier: ${task.agent_tier} | Success: ${task.success}`);
        console.log(`      Created: ${task.created_at}`);
      });
    } else {
      console.log('📝 No tasks recorded yet.');
      console.log('   💡 Run a task with Free or Paid Agent to see it recorded here!');
    }

    console.log('\n✅ RAD Memory is working correctly!');

  } catch (error) {
    console.error('❌ Error testing RAD connection:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run test
testRadConnection();

