/**
 * Qdrant Tools for Chris's Infrastructure
 * 
 * 15 tools for Qdrant vector search operations via FastAPI Gateway
 */

export const qdrantTools = [
  // ============================================================================
  // Collection Management
  // ============================================================================
  {
    name: 'qdrant_collection_create',
    description: 'Create a new collection in Qdrant',
    inputSchema: {
      type: 'object',
      properties: {
        collection_name: {
          type: 'string',
          description: 'Name of the collection to create',
        },
        vector_size: {
          type: 'number',
          description: 'Size of the vectors (e.g., 1536 for OpenAI embeddings)',
        },
        distance: {
          type: 'string',
          enum: ['Cosine', 'Euclid', 'Dot'],
          default: 'Cosine',
          description: 'Distance metric for similarity',
        },
      },
      required: ['collection_name', 'vector_size'],
    },
  },

  {
    name: 'qdrant_collection_list',
    description: 'List all collections in Qdrant',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },

  {
    name: 'qdrant_collection_get',
    description: 'Get information about a specific collection',
    inputSchema: {
      type: 'object',
      properties: {
        collection_name: {
          type: 'string',
          description: 'Name of the collection',
        },
      },
      required: ['collection_name'],
    },
  },

  {
    name: 'qdrant_collection_delete',
    description: 'Delete a collection from Qdrant',
    inputSchema: {
      type: 'object',
      properties: {
        collection_name: {
          type: 'string',
          description: 'Name of the collection to delete',
        },
      },
      required: ['collection_name'],
    },
  },

  {
    name: 'qdrant_collection_update',
    description: 'Update collection configuration',
    inputSchema: {
      type: 'object',
      properties: {
        collection_name: {
          type: 'string',
          description: 'Name of the collection to update',
        },
        optimizers_config: {
          type: 'object',
          description: 'Optimizer configuration',
        },
      },
      required: ['collection_name'],
    },
  },

  // ============================================================================
  // Search Operations
  // ============================================================================
  {
    name: 'qdrant_search_semantic',
    description: 'Perform semantic search in Qdrant collection',
    inputSchema: {
      type: 'object',
      properties: {
        collection_name: {
          type: 'string',
          description: 'Name of the collection to search',
        },
        query_vector: {
          type: 'array',
          items: { type: 'number' },
          description: 'Query vector for similarity search',
        },
        limit: {
          type: 'number',
          default: 5,
          description: 'Number of results to return',
        },
        score_threshold: {
          type: 'number',
          description: 'Minimum similarity score (optional)',
        },
        filter: {
          type: 'object',
          description: 'Filter conditions (optional)',
        },
      },
      required: ['collection_name', 'query_vector'],
    },
  },

  {
    name: 'qdrant_search_batch',
    description: 'Perform batch search with multiple query vectors',
    inputSchema: {
      type: 'object',
      properties: {
        collection_name: {
          type: 'string',
          description: 'Name of the collection to search',
        },
        query_vectors: {
          type: 'array',
          items: {
            type: 'array',
            items: { type: 'number' },
          },
          description: 'Array of query vectors',
        },
        limit: {
          type: 'number',
          default: 5,
          description: 'Number of results per query',
        },
      },
      required: ['collection_name', 'query_vectors'],
    },
  },

  // ============================================================================
  // Point Operations
  // ============================================================================
  {
    name: 'qdrant_point_upsert',
    description: 'Insert or update a point in Qdrant collection',
    inputSchema: {
      type: 'object',
      properties: {
        collection_name: {
          type: 'string',
          description: 'Name of the collection',
        },
        point_id: {
          type: 'string',
          description: 'Unique identifier for the point',
        },
        vector: {
          type: 'array',
          items: { type: 'number' },
          description: 'Vector data',
        },
        payload: {
          type: 'object',
          description: 'Metadata payload',
        },
      },
      required: ['collection_name', 'point_id', 'vector'],
    },
  },

  {
    name: 'qdrant_point_get',
    description: 'Get a point by ID from Qdrant collection',
    inputSchema: {
      type: 'object',
      properties: {
        collection_name: {
          type: 'string',
          description: 'Name of the collection',
        },
        point_id: {
          type: 'string',
          description: 'Point ID to retrieve',
        },
      },
      required: ['collection_name', 'point_id'],
    },
  },

  {
    name: 'qdrant_point_delete',
    description: 'Delete a point from Qdrant collection',
    inputSchema: {
      type: 'object',
      properties: {
        collection_name: {
          type: 'string',
          description: 'Name of the collection',
        },
        point_id: {
          type: 'string',
          description: 'Point ID to delete',
        },
      },
      required: ['collection_name', 'point_id'],
    },
  },

  {
    name: 'qdrant_point_search',
    description: 'Search points with filters',
    inputSchema: {
      type: 'object',
      properties: {
        collection_name: {
          type: 'string',
          description: 'Name of the collection',
        },
        filter: {
          type: 'object',
          description: 'Filter conditions',
        },
        limit: {
          type: 'number',
          default: 10,
          description: 'Number of results to return',
        },
      },
      required: ['collection_name', 'filter'],
    },
  },

  {
    name: 'qdrant_points_batch_upsert',
    description: 'Batch insert or update multiple points',
    inputSchema: {
      type: 'object',
      properties: {
        collection_name: {
          type: 'string',
          description: 'Name of the collection',
        },
        points: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              vector: {
                type: 'array',
                items: { type: 'number' },
              },
              payload: { type: 'object' },
            },
          },
          description: 'Array of points to upsert',
        },
      },
      required: ['collection_name', 'points'],
    },
  },

  // ============================================================================
  // Snapshot & Admin
  // ============================================================================
  {
    name: 'qdrant_snapshot_create',
    description: 'Create a snapshot of a collection',
    inputSchema: {
      type: 'object',
      properties: {
        collection_name: {
          type: 'string',
          description: 'Name of the collection to snapshot',
        },
      },
      required: ['collection_name'],
    },
  },

  {
    name: 'qdrant_snapshot_list',
    description: 'List all snapshots for a collection',
    inputSchema: {
      type: 'object',
      properties: {
        collection_name: {
          type: 'string',
          description: 'Name of the collection',
        },
      },
      required: ['collection_name'],
    },
  },

  {
    name: 'qdrant_connection_test',
    description: 'Test connection to Qdrant',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

