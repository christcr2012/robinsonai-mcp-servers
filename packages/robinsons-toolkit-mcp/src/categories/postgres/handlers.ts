/**
 * PostgreSQL Handlers for Chris's Infrastructure
 *
 * Handler functions for all 8 PostgreSQL tools
 */

import { fastAPIClient } from '../../util/fastapi-client.js';

// ============================================================================
// Database Info
// ============================================================================

export async function handlePostgresInfo(args: any) {
  return await fastAPIClient.request('/postgres/info', {
    method: 'GET',
  });
}

// ============================================================================
// Schema Management
// ============================================================================

export async function handlePostgresSchemas(args: any) {
  return await fastAPIClient.request('/postgres/schemas', {
    method: 'GET',
  });
}

// ============================================================================
// Table Management
// ============================================================================

export async function handlePostgresTables(args: any) {
  const { schema = 'public' } = args;

  let url = '/postgres/tables';
  if (schema) {
    url += `?schema=${schema}`;
  }

  return await fastAPIClient.request(url, {
    method: 'GET',
  });
}

export async function handlePostgresTableColumns(args: any) {
  const { table_name, schema = 'public' } = args;

  let url = `/postgres/tables/${table_name}/columns`;
  if (schema) {
    url += `?schema=${schema}`;
  }

  return await fastAPIClient.request(url, {
    method: 'GET',
  });
}

export async function handlePostgresTableIndexes(args: any) {
  const { table_name, schema = 'public' } = args;

  let url = `/postgres/tables/${table_name}/indexes`;
  if (schema) {
    url += `?schema=${schema}`;
  }

  return await fastAPIClient.request(url, {
    method: 'GET',
  });
}

// ============================================================================
// Query Execution
// ============================================================================

export async function handlePostgresQuery(args: any) {
  const { sql } = args;

  return await fastAPIClient.request(`/postgres/query?sql=${encodeURIComponent(sql)}`, {
    method: 'GET',
  });
}

export async function handlePostgresExecute(args: any) {
  const { sql } = args;

  return await fastAPIClient.request('/postgres/execute', {
    method: 'POST',
    body: JSON.stringify({ sql }),
  });
}

// ============================================================================
// Vector Search
// ============================================================================

export async function handlePostgresVectorSearch(args: any) {
  const { table_name, vector_column, query_vector, limit = 10, schema = 'public' } = args;

  let url = `/postgres/vector/search?table_name=${table_name}&vector_column=${vector_column}&query_vector=${query_vector}&limit=${limit}&schema=${schema}`;

  return await fastAPIClient.request(url, {
    method: 'GET',
  });
}

// ============================================================================
// Normalized exports for audit compatibility
// ============================================================================

/**
 * Get PostgreSQL database information
 * @see https://api.srv823383.hstgr.cloud/docs#/PostgreSQL/get_postgres_info_postgres_info_get
 */
export const fastapiPostgresInfo = handlePostgresInfo;

/**
 * List all schemas in PostgreSQL database
 * @see https://api.srv823383.hstgr.cloud/docs#/PostgreSQL/get_postgres_schemas_postgres_schemas_get
 */
export const fastapiPostgresSchemas = handlePostgresSchemas;

/**
 * List all tables in PostgreSQL database
 * @see https://api.srv823383.hstgr.cloud/docs#/PostgreSQL/get_postgres_tables_postgres_tables_get
 */
export const fastapiPostgresTables = handlePostgresTables;

/**
 * Get column information for a specific table
 * @see https://api.srv823383.hstgr.cloud/docs#/PostgreSQL/get_table_columns_postgres_tables__table_name__columns_get
 */
export const fastapiPostgresTableColumns = handlePostgresTableColumns;

/**
 * Get index information for a specific table
 * @see https://api.srv823383.hstgr.cloud/docs#/PostgreSQL/get_table_indexes_postgres_tables__table_name__indexes_get
 */
export const fastapiPostgresTableIndexes = handlePostgresTableIndexes;

/**
 * Execute read-only SQL query on PostgreSQL
 * @see https://api.srv823383.hstgr.cloud/docs#/PostgreSQL/query_postgres_query_get
 */
export const fastapiPostgresQuery = handlePostgresQuery;

/**
 * Execute write SQL query on PostgreSQL (INSERT, UPDATE, DELETE)
 * @see https://api.srv823383.hstgr.cloud/docs#/PostgreSQL/execute_postgres_execute_post
 */
export const fastapiPostgresExecute = handlePostgresExecute;

/**
 * Perform vector similarity search using pgvector
 * @see https://api.srv823383.hstgr.cloud/docs#/PostgreSQL/vector_search_postgres_vector_search_get
 */
export const fastapiPostgresVectorSearch = handlePostgresVectorSearch;


