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


