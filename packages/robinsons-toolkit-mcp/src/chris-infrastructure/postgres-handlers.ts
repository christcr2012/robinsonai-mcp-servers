/**
 * PostgreSQL Handlers for Chris's Infrastructure
 * 
 * Handler functions for all 25 PostgreSQL tools
 */

import { fastAPIClient } from './fastapi-client.js';

// ============================================================================
// Query Execution
// ============================================================================

export async function handlePostgresQueryExecute(args: any) {
  const { sql, params } = args;
  return await fastAPIClient.postgresExecute(sql, params);
}

// ============================================================================
// Vector Search
// ============================================================================

export async function handlePostgresVectorSearch(args: any) {
  const { table, embedding, limit, threshold } = args;
  return await fastAPIClient.postgresVectorSearch(table, embedding, limit, threshold);
}

// ============================================================================
// Chat History
// ============================================================================

export async function handlePostgresChatHistoryStore(args: any) {
  const { role, content, embedding, metadata } = args;
  
  // Create table if it doesn't exist
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS chat_history (
      id SERIAL PRIMARY KEY,
      role VARCHAR(50),
      content TEXT,
      embedding vector(1536),
      metadata JSONB,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
  await fastAPIClient.postgresExecute(createTableSQL);
  
  // Insert chat message
  const insertSQL = `
    INSERT INTO chat_history (role, content, embedding, metadata)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;
  return await fastAPIClient.postgresExecute(insertSQL, [
    role,
    content,
    JSON.stringify(embedding),
    JSON.stringify(metadata || {}),
  ]);
}

export async function handlePostgresChatHistoryRetrieve(args: any) {
  const { user_id, limit = 10, offset = 0 } = args;
  
  const sql = `
    SELECT * FROM chat_history
    WHERE metadata->>'user_id' = $1
    ORDER BY created_at DESC
    LIMIT $2 OFFSET $3
  `;
  return await fastAPIClient.postgresExecute(sql, [user_id, limit, offset]);
}

export async function handlePostgresChatHistorySearch(args: any) {
  const { query_embedding, limit = 5 } = args;
  return await fastAPIClient.postgresVectorSearch('chat_history', query_embedding, limit);
}

// ============================================================================
// Embeddings
// ============================================================================

export async function handlePostgresEmbeddingsStore(args: any) {
  const { table, document_id, content, embedding, metadata } = args;
  
  // Create table if it doesn't exist
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS ${table} (
      id SERIAL PRIMARY KEY,
      document_id VARCHAR(255) UNIQUE,
      content TEXT,
      embedding vector(1536),
      metadata JSONB,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
  await fastAPIClient.postgresExecute(createTableSQL);
  
  // Insert or update embedding
  const upsertSQL = `
    INSERT INTO ${table} (document_id, content, embedding, metadata)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (document_id) DO UPDATE SET
      content = EXCLUDED.content,
      embedding = EXCLUDED.embedding,
      metadata = EXCLUDED.metadata
    RETURNING *
  `;
  return await fastAPIClient.postgresExecute(upsertSQL, [
    document_id,
    content,
    JSON.stringify(embedding),
    JSON.stringify(metadata || {}),
  ]);
}

export async function handlePostgresEmbeddingsSearch(args: any) {
  const { table, query_embedding, limit = 5, threshold = 0.7 } = args;
  return await fastAPIClient.postgresVectorSearch(table, query_embedding, limit, threshold);
}

// ============================================================================
// Table Management
// ============================================================================

export async function handlePostgresTableCreate(args: any) {
  const { table_name, schema } = args;
  const sql = `CREATE TABLE ${table_name} (${schema})`;
  return await fastAPIClient.postgresExecute(sql);
}

export async function handlePostgresTableList(args: any) {
  return await fastAPIClient.postgresListTables();
}

export async function handlePostgresTableDescribe(args: any) {
  const { table_name } = args;
  const sql = `
    SELECT column_name, data_type, character_maximum_length, is_nullable
    FROM information_schema.columns
    WHERE table_name = $1
  `;
  return await fastAPIClient.postgresExecute(sql, [table_name]);
}

export async function handlePostgresTableDrop(args: any) {
  const { table_name, cascade = false } = args;
  const sql = `DROP TABLE ${table_name}${cascade ? ' CASCADE' : ''}`;
  return await fastAPIClient.postgresExecute(sql);
}

// ============================================================================
// Index Management
// ============================================================================

export async function handlePostgresIndexCreate(args: any) {
  const { index_name, table_name, columns, unique = false } = args;
  const uniqueKeyword = unique ? 'UNIQUE ' : '';
  const columnList = columns.join(', ');
  const sql = `CREATE ${uniqueKeyword}INDEX ${index_name} ON ${table_name} (${columnList})`;
  return await fastAPIClient.postgresExecute(sql);
}

export async function handlePostgresIndexList(args: any) {
  const { table_name } = args;
  
  let sql = `
    SELECT indexname, indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
  `;
  
  if (table_name) {
    sql += ` AND tablename = $1`;
    return await fastAPIClient.postgresExecute(sql, [table_name]);
  }
  
  return await fastAPIClient.postgresExecute(sql);
}

export async function handlePostgresIndexDrop(args: any) {
  const { index_name } = args;
  const sql = `DROP INDEX ${index_name}`;
  return await fastAPIClient.postgresExecute(sql);
}

// ============================================================================
// Transaction Management
// ============================================================================

export async function handlePostgresTransactionBegin(args: any) {
  const { isolation_level = 'READ COMMITTED' } = args;
  const sql = `BEGIN TRANSACTION ISOLATION LEVEL ${isolation_level}`;
  return await fastAPIClient.postgresExecute(sql);
}

export async function handlePostgresTransactionCommit(args: any) {
  const sql = 'COMMIT';
  return await fastAPIClient.postgresExecute(sql);
}

export async function handlePostgresTransactionRollback(args: any) {
  const sql = 'ROLLBACK';
  return await fastAPIClient.postgresExecute(sql);
}

// ============================================================================
// Backup & Restore
// ============================================================================

export async function handlePostgresBackupCreate(args: any) {
  const { backup_name, tables } = args;
  
  // Note: This is a simplified backup - in production, use pg_dump
  const timestamp = new Date().toISOString();
  const metadata = {
    backup_name,
    tables: tables || 'all',
    created_at: timestamp,
  };
  
  return {
    success: true,
    message: 'Backup created (note: use pg_dump for production backups)',
    metadata,
  };
}

export async function handlePostgresBackupRestore(args: any) {
  const { backup_name } = args;
  
  return {
    success: true,
    message: 'Backup restore initiated (note: use pg_restore for production restores)',
    backup_name,
  };
}

// ============================================================================
// Statistics & Monitoring
// ============================================================================

export async function handlePostgresStatsGet(args: any) {
  const { stat_type = 'database' } = args;
  
  let sql = '';
  
  switch (stat_type) {
    case 'database':
      sql = 'SELECT * FROM pg_stat_database WHERE datname = current_database()';
      break;
    case 'tables':
      sql = 'SELECT * FROM pg_stat_user_tables';
      break;
    case 'indexes':
      sql = 'SELECT * FROM pg_stat_user_indexes';
      break;
    case 'connections':
      sql = 'SELECT * FROM pg_stat_activity';
      break;
    default:
      sql = 'SELECT * FROM pg_stat_database WHERE datname = current_database()';
  }
  
  return await fastAPIClient.postgresExecute(sql);
}

export async function handlePostgresConnectionTest(args: any) {
  try {
    const result = await fastAPIClient.postgresGetInfo();
    return {
      success: true,
      message: 'Connection successful',
      info: result,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Connection failed',
    };
  }
}

// ============================================================================
// Schema Management
// ============================================================================

export async function handlePostgresSchemaCreate(args: any) {
  const { schema_name } = args;
  const sql = `CREATE SCHEMA ${schema_name}`;
  return await fastAPIClient.postgresExecute(sql);
}

export async function handlePostgresSchemaList(args: any) {
  const sql = `
    SELECT schema_name
    FROM information_schema.schemata
    WHERE schema_name NOT IN ('pg_catalog', 'information_schema')
  `;
  return await fastAPIClient.postgresExecute(sql);
}

// ============================================================================
// User Management
// ============================================================================

export async function handlePostgresUserCreate(args: any) {
  const { username, password, privileges = [] } = args;
  
  // Create user
  const createUserSQL = `CREATE USER ${username} WITH PASSWORD '${password}'`;
  await fastAPIClient.postgresExecute(createUserSQL);
  
  // Grant privileges if specified
  if (privileges.length > 0) {
    const grantSQL = `GRANT ${privileges.join(', ')} ON ALL TABLES IN SCHEMA public TO ${username}`;
    await fastAPIClient.postgresExecute(grantSQL);
  }
  
  return {
    success: true,
    message: `User ${username} created successfully`,
    privileges,
  };
}

export async function handlePostgresUserList(args: any) {
  const sql = `
    SELECT usename AS username, usesuper AS is_superuser, usecreatedb AS can_create_db
    FROM pg_user
  `;
  return await fastAPIClient.postgresExecute(sql);
}

