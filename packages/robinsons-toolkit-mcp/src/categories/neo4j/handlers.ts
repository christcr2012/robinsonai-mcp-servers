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
