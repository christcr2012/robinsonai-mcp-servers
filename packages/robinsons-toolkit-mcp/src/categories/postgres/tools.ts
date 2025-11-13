/**
 * PostgreSQL Tools for Chris's Infrastructure
 *
 * 8 tools for PostgreSQL database operations via FastAPI Gateway
 * Matches OpenAPI spec exactly
 */

export const postgresTools = [
  // ============================================================================
  // Database Info
  // ============================================================================
  {
    name: 'fastapi_postgres_info',
    description: 'Get PostgreSQL database information and connection status',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },

  // ============================================================================
  // Schema Management
  // ============================================================================
  {
    name: 'fastapi_postgres_schemas',
    description: 'List all schemas in PostgreSQL database',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },

  // ============================================================================
  // Table Management
  // ============================================================================
  {
    name: 'fastapi_postgres_tables',
    description: 'List all tables in PostgreSQL database',
    inputSchema: {
      type: 'object',
      properties: {
        schema: {
          type: 'string',
          default: 'public',
          description: 'Schema name (default: public)',
        },
      },
    },
  },

  {
    name: 'fastapi_postgres_table_columns',
    description: 'Get column information for a specific table',
    inputSchema: {
      type: 'object',
      properties: {
        table_name: {
          type: 'string',
          description: 'Table name',
        },
        schema: {
          type: 'string',
          default: 'public',
          description: 'Schema name (default: public)',
        },
      },
      required: ['table_name'],
    },
  },

  {
    name: 'fastapi_postgres_table_indexes',
    description: 'Get index information for a specific table',
    inputSchema: {
      type: 'object',
      properties: {
        table_name: {
          type: 'string',
          description: 'Table name',
        },
        schema: {
          type: 'string',
          default: 'public',
          description: 'Schema name (default: public)',
        },
      },
      required: ['table_name'],
    },
  },

  // ============================================================================
  // Query Execution
  // ============================================================================
  {
    name: 'fastapi_postgres_query',
    description: 'Execute read-only SQL query on PostgreSQL',
    inputSchema: {
      type: 'object',
      properties: {
        sql: {
          type: 'string',
          description: 'SQL query to execute (SELECT only)',
        },
      },
      required: ['sql'],
    },
  },

  {
    name: 'fastapi_postgres_execute',
    description: 'Execute write SQL query on PostgreSQL (INSERT, UPDATE, DELETE)',
    inputSchema: {
      type: 'object',
      properties: {
        sql: {
          type: 'string',
          description: 'SQL query to execute (INSERT, UPDATE, DELETE)',
        },
      },
      required: ['sql'],
    },
  },

  // ============================================================================
  // Vector Search
  // ============================================================================
  {
    name: 'fastapi_postgres_vector_search',
    description: 'Perform vector similarity search using pgvector',
    inputSchema: {
      type: 'object',
      properties: {
        table_name: {
          type: 'string',
          description: 'Table name with vector column',
        },
        vector_column: {
          type: 'string',
          description: 'Vector column name',
        },
        query_vector: {
          type: 'string',
          description: 'Comma-separated vector values',
        },
        limit: {
          type: 'number',
          default: 10,
          description: 'Number of results to return',
        },
        schema: {
          type: 'string',
          default: 'public',
          description: 'Schema name (default: public)',
        },
      },
      required: ['table_name', 'vector_column', 'query_vector'],
    },
  },
];

