/**
 * Qdrant Tools for Chris's Infrastructure
 *
 * 7 tools for Qdrant vector search operations via FastAPI Gateway
 * Matches OpenAPI spec exactly
 */

export const qdrantTools = [
  // ============================================================================
  // Collection Management
  // ============================================================================
  {
    name: 'fastapi_qdrant_collections',
    description: 'List all collections in Qdrant',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },

  {
    name: 'fastapi_qdrant_collection_info',
    description: 'Get detailed information about a Qdrant collection',
    inputSchema: {
      type: 'object',
      properties: {
        collection_name: {
          type: 'string',
          description: 'Collection name',
        },
      },
      required: ['collection_name'],
    },
  },

  // ============================================================================
  // Search Operations
  // ============================================================================
  {
    name: 'fastapi_qdrant_vector_search',
    description: 'Perform vector similarity search in Qdrant',
    inputSchema: {
      type: 'object',
      properties: {
        collection_name: {
          type: 'string',
          description: 'Collection name',
        },
        vector: {
          type: 'array',
          items: { type: 'number' },
          description: 'Query vector',
        },
        limit: {
          type: 'number',
          default: 10,
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
      required: ['collection_name', 'vector'],
    },
  },

  // ============================================================================
  // Point Operations
  // ============================================================================
  {
    name: 'fastapi_qdrant_upsert_points',
    description: 'Upsert points into a Qdrant collection',
    inputSchema: {
      type: 'object',
      properties: {
        collection_name: {
          type: 'string',
          description: 'Collection name',
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
            required: ['id', 'vector'],
          },
          description: 'Array of points to upsert',
        },
      },
      required: ['collection_name', 'points'],
    },
  },

  {
    name: 'fastapi_qdrant_delete_points',
    description: 'Delete points from a Qdrant collection',
    inputSchema: {
      type: 'object',
      properties: {
        collection_name: {
          type: 'string',
          description: 'Collection name',
        },
        point_ids: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of point IDs to delete',
        },
      },
      required: ['collection_name', 'point_ids'],
    },
  },

  {
    name: 'fastapi_qdrant_get_point',
    description: 'Get a specific point from a Qdrant collection',
    inputSchema: {
      type: 'object',
      properties: {
        collection_name: {
          type: 'string',
          description: 'Collection name',
        },
        point_id: {
          type: 'string',
          description: 'Point ID',
        },
      },
      required: ['collection_name', 'point_id'],
    },
  },
];

