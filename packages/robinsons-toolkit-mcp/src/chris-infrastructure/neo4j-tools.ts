/**
 * Neo4j Tools for Chris's Infrastructure
 *
 * 6 tools for Neo4j graph database operations via FastAPI Gateway
 * Matches OpenAPI spec exactly
 */

export const neo4jTools = [
  // ============================================================================
  // Database Info
  // ============================================================================
  {
    name: 'fastapi_neo4j_info',
    description: 'Get Neo4j database information and connection status',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },

  // ============================================================================
  // Query Execution
  // ============================================================================
  {
    name: 'fastapi_neo4j_query',
    description: 'Execute read-only Cypher query on Neo4j',
    inputSchema: {
      type: 'object',
      properties: {
        cypher: {
          type: 'string',
          description: 'Cypher query to execute',
        },
      },
      required: ['cypher'],
    },
  },

  {
    name: 'fastapi_neo4j_execute',
    description: 'Execute Cypher query (read or write) on Neo4j',
    inputSchema: {
      type: 'object',
      properties: {
        cypher: {
          type: 'string',
          description: 'Cypher query to execute',
        },
        parameters: {
          type: 'object',
          description: 'Query parameters (optional)',
        },
      },
      required: ['cypher'],
    },
  },

  // ============================================================================
  // Node Operations
  // ============================================================================
  {
    name: 'fastapi_neo4j_nodes',
    description: 'List nodes in Neo4j with optional label filtering',
    inputSchema: {
      type: 'object',
      properties: {
        label: {
          type: 'string',
          description: 'Filter by node label (optional)',
        },
        limit: {
          type: 'number',
          default: 100,
          description: 'Maximum number of nodes to return',
        },
      },
    },
  },

  // ============================================================================
  // Relationship Operations
  // ============================================================================
  {
    name: 'fastapi_neo4j_relationships',
    description: 'List relationships in Neo4j with optional type filtering',
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          description: 'Filter by relationship type (optional)',
        },
        limit: {
          type: 'number',
          default: 100,
          description: 'Maximum number of relationships to return',
        },
      },
    },
  },
];

