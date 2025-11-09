/**
 * Neo4j Tools for Chris's Infrastructure
 * 
 * 20 tools for Neo4j graph database operations via FastAPI Gateway
 */

export const neo4jTools = [
  // ============================================================================
  // Query Execution
  // ============================================================================
  {
    name: 'neo4j_query_execute',
    description: 'Execute Cypher query on Chris\'s Neo4j graph database',
    inputSchema: {
      type: 'object',
      properties: {
        cypher: {
          type: 'string',
          description: 'Cypher query to execute',
        },
        params: {
          type: 'object',
          description: 'Query parameters',
        },
      },
      required: ['cypher'],
    },
  },

  // ============================================================================
  // Knowledge Graph Operations
  // ============================================================================
  {
    name: 'neo4j_knowledge_graph_create_node',
    description: 'Create a node in the knowledge graph',
    inputSchema: {
      type: 'object',
      properties: {
        label: {
          type: 'string',
          description: 'Node label (e.g., "Concept", "Entity", "Person")',
        },
        properties: {
          type: 'object',
          description: 'Node properties (e.g., {name: "AI", description: "Artificial Intelligence"})',
        },
      },
      required: ['label', 'properties'],
    },
  },

  {
    name: 'neo4j_knowledge_graph_create_relationship',
    description: 'Create a relationship between nodes in the knowledge graph',
    inputSchema: {
      type: 'object',
      properties: {
        from_node: {
          type: 'object',
          description: 'Source node identifier (e.g., {label: "Concept", name: "AI"})',
        },
        to_node: {
          type: 'object',
          description: 'Target node identifier (e.g., {label: "Concept", name: "ML"})',
        },
        relationship_type: {
          type: 'string',
          description: 'Relationship type (e.g., "RELATES_TO", "IS_TYPE_OF")',
        },
        properties: {
          type: 'object',
          description: 'Relationship properties (optional)',
        },
      },
      required: ['from_node', 'to_node', 'relationship_type'],
    },
  },

  {
    name: 'neo4j_knowledge_graph_query',
    description: 'Query the knowledge graph with pattern matching',
    inputSchema: {
      type: 'object',
      properties: {
        pattern: {
          type: 'string',
          description: 'Cypher pattern (e.g., "(a:Concept)-[r]->(b:Concept)")',
        },
        where: {
          type: 'string',
          description: 'WHERE clause (optional)',
        },
        limit: {
          type: 'number',
          default: 10,
          description: 'Number of results to return',
        },
      },
      required: ['pattern'],
    },
  },

  // ============================================================================
  // Node Operations
  // ============================================================================
  {
    name: 'neo4j_node_create',
    description: 'Create a node in Neo4j',
    inputSchema: {
      type: 'object',
      properties: {
        label: {
          type: 'string',
          description: 'Node label',
        },
        properties: {
          type: 'object',
          description: 'Node properties',
        },
      },
      required: ['label', 'properties'],
    },
  },

  {
    name: 'neo4j_node_get',
    description: 'Get node by ID from Neo4j',
    inputSchema: {
      type: 'object',
      properties: {
        node_id: {
          type: 'string',
          description: 'Node ID',
        },
      },
      required: ['node_id'],
    },
  },

  {
    name: 'neo4j_node_update',
    description: 'Update node properties in Neo4j',
    inputSchema: {
      type: 'object',
      properties: {
        node_id: {
          type: 'string',
          description: 'Node ID',
        },
        properties: {
          type: 'object',
          description: 'Properties to update',
        },
      },
      required: ['node_id', 'properties'],
    },
  },

  {
    name: 'neo4j_node_delete',
    description: 'Delete node from Neo4j',
    inputSchema: {
      type: 'object',
      properties: {
        node_id: {
          type: 'string',
          description: 'Node ID',
        },
        detach: {
          type: 'boolean',
          default: true,
          description: 'Detach relationships before deleting',
        },
      },
      required: ['node_id'],
    },
  },

  {
    name: 'neo4j_node_search',
    description: 'Search nodes in Neo4j',
    inputSchema: {
      type: 'object',
      properties: {
        label: {
          type: 'string',
          description: 'Node label to search (optional)',
        },
        properties: {
          type: 'object',
          description: 'Properties to match (optional)',
        },
        limit: {
          type: 'number',
          default: 10,
          description: 'Number of results to return',
        },
      },
    },
  },

  // ============================================================================
  // Relationship Operations
  // ============================================================================
  {
    name: 'neo4j_relationship_create',
    description: 'Create a relationship between nodes',
    inputSchema: {
      type: 'object',
      properties: {
        from_node_id: {
          type: 'string',
          description: 'Source node ID',
        },
        to_node_id: {
          type: 'string',
          description: 'Target node ID',
        },
        type: {
          type: 'string',
          description: 'Relationship type',
        },
        properties: {
          type: 'object',
          description: 'Relationship properties (optional)',
        },
      },
      required: ['from_node_id', 'to_node_id', 'type'],
    },
  },

  {
    name: 'neo4j_relationship_get',
    description: 'Get relationship by ID',
    inputSchema: {
      type: 'object',
      properties: {
        relationship_id: {
          type: 'string',
          description: 'Relationship ID',
        },
      },
      required: ['relationship_id'],
    },
  },

  {
    name: 'neo4j_relationship_delete',
    description: 'Delete relationship from Neo4j',
    inputSchema: {
      type: 'object',
      properties: {
        relationship_id: {
          type: 'string',
          description: 'Relationship ID',
        },
      },
      required: ['relationship_id'],
    },
  },

  {
    name: 'neo4j_relationship_search',
    description: 'Search relationships in Neo4j',
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          description: 'Relationship type to search (optional)',
        },
        limit: {
          type: 'number',
          default: 10,
          description: 'Number of results to return',
        },
      },
    },
  },

  // ============================================================================
  // Pattern Matching
  // ============================================================================
  {
    name: 'neo4j_pattern_match',
    description: 'Match patterns in the graph',
    inputSchema: {
      type: 'object',
      properties: {
        pattern: {
          type: 'string',
          description: 'Cypher pattern to match',
        },
        where: {
          type: 'string',
          description: 'WHERE clause (optional)',
        },
        return_clause: {
          type: 'string',
          default: '*',
          description: 'RETURN clause',
        },
        limit: {
          type: 'number',
          default: 10,
          description: 'Number of results to return',
        },
      },
      required: ['pattern'],
    },
  },

  {
    name: 'neo4j_path_find',
    description: 'Find path between two nodes',
    inputSchema: {
      type: 'object',
      properties: {
        from_node: {
          type: 'object',
          description: 'Source node identifier',
        },
        to_node: {
          type: 'object',
          description: 'Target node identifier',
        },
        max_depth: {
          type: 'number',
          default: 5,
          description: 'Maximum path depth',
        },
        relationship_types: {
          type: 'array',
          items: { type: 'string' },
          description: 'Allowed relationship types (optional)',
        },
      },
      required: ['from_node', 'to_node'],
    },
  },

  // ============================================================================
  // Schema & Admin
  // ============================================================================
  {
    name: 'neo4j_schema_get',
    description: 'Get Neo4j database schema',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },

  {
    name: 'neo4j_stats_get',
    description: 'Get Neo4j database statistics',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },

  {
    name: 'neo4j_connection_test',
    description: 'Test connection to Neo4j database',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },

  {
    name: 'neo4j_database_list',
    description: 'List all databases in Neo4j',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },

  {
    name: 'neo4j_constraint_create',
    description: 'Create a constraint in Neo4j',
    inputSchema: {
      type: 'object',
      properties: {
        constraint_name: {
          type: 'string',
          description: 'Name of the constraint',
        },
        label: {
          type: 'string',
          description: 'Node label',
        },
        property: {
          type: 'string',
          description: 'Property name',
        },
        type: {
          type: 'string',
          enum: ['UNIQUE', 'EXISTS', 'NODE_KEY'],
          description: 'Constraint type',
        },
      },
      required: ['constraint_name', 'label', 'property', 'type'],
    },
  },
];

