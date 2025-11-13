/**
 * Neo4j Handlers for Chris's Infrastructure
 *
 * Handler functions for all 6 Neo4j tools
 */

import { fastAPIClient } from '../../util/fastapi-client.js';

// ============================================================================
// Database Info
// ============================================================================

export async function handleNeo4jInfo(args: any) {
  return await fastAPIClient.request('/neo4j/info', {
    method: 'GET',
  });
}

// ============================================================================
// Query Execution
// ============================================================================

export async function handleNeo4jQuery(args: any) {
  const { cypher } = args;

  return await fastAPIClient.request(`/neo4j/query?cypher=${encodeURIComponent(cypher)}`, {
    method: 'GET',
  });
}

export async function handleNeo4jExecute(args: any) {
  const { cypher, parameters } = args;

  return await fastAPIClient.request('/neo4j/execute', {
    method: 'POST',
    body: JSON.stringify({
      cypher,
      parameters,
    }),
  });
}

// ============================================================================
// Node Operations
// ============================================================================

export async function handleNeo4jNodes(args: any) {
  const { label, limit = 100 } = args;

  let url = `/neo4j/nodes?limit=${limit}`;
  if (label) {
    url += `&label=${label}`;
  }

  return await fastAPIClient.request(url, {
    method: 'GET',
  });
}

// ============================================================================
// Relationship Operations
// ============================================================================

export async function handleNeo4jRelationships(args: any) {
  const { type, limit = 100 } = args;

  let url = `/neo4j/relationships?limit=${limit}`;
  if (type) {
    url += `&type=${type}`;
  }

  return await fastAPIClient.request(url, {
    method: 'GET',
  });
}

// ============================================================================
// Normalized exports for audit compatibility
// ============================================================================

/**
 * Get Neo4j database information
 * @see https://api.srv823383.hstgr.cloud/docs#/Neo4j/get_neo4j_info_neo4j_info_get
 */
export const fastapineo4jinfo = handleNeo4jInfo;

/**
 * Execute read-only Cypher query on Neo4j
 * @see https://api.srv823383.hstgr.cloud/docs#/Neo4j/query_neo4j_query_get
 */
export const fastapineo4jquery = handleNeo4jQuery;

/**
 * Execute Cypher query (read or write) on Neo4j
 * @see https://api.srv823383.hstgr.cloud/docs#/Neo4j/execute_neo4j_execute_post
 */
export const fastapineo4jexecute = handleNeo4jExecute;

/**
 * List nodes in Neo4j with optional label filtering
 * @see https://api.srv823383.hstgr.cloud/docs#/Neo4j/get_nodes_neo4j_nodes_get
 */
export const fastapineo4jnodes = handleNeo4jNodes;

/**
 * List relationships in Neo4j with optional type filtering
 * @see https://api.srv823383.hstgr.cloud/docs#/Neo4j/get_relationships_neo4j_relationships_get
 */
export const fastapineo4jrelationships = handleNeo4jRelationships;
