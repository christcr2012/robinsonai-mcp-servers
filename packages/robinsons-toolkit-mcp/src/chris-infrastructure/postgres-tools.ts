/**
 * PostgreSQL Tools for Chris's Infrastructure
 * 
 * 25 tools for PostgreSQL database operations via FastAPI Gateway
 */

export const postgresTools = [
  // ============================================================================
  // Query Execution
  // ============================================================================
  {
    name: 'postgres_query_execute',
    description: 'Execute SQL query on Chris\'s PostgreSQL database via FastAPI',
    inputSchema: {
      type: 'object',
      properties: {
        sql: {
          type: 'string',
          description: 'SQL query to execute (SELECT, INSERT, UPDATE, DELETE)',
        },
        params: {
          type: 'array',
          items: { type: 'string' },
          description: 'Query parameters for prepared statements (optional)',
        },
      },
      required: ['sql'],
    },
  },

  // ============================================================================
  // Vector Search
  // ============================================================================
  {
    name: 'postgres_vector_search',
    description: 'Semantic search using pgvector embeddings in PostgreSQL',
    inputSchema: {
      type: 'object',
      properties: {
        table: {
          type: 'string',
          description: 'Table name (e.g., "code_snippets", "chat_history")',
        },
        embedding: {
          type: 'array',
          items: { type: 'number' },
          description: 'Query embedding vector (1536 dimensions for OpenAI)',
        },
        limit: {
          type: 'number',
          default: 5,
          description: 'Number of results to return',
        },
        threshold: {
          type: 'number',
          default: 0.7,
          description: 'Similarity threshold (0-1)',
        },
      },
      required: ['table', 'embedding'],
    },
  },

  // ============================================================================
  // Chat History
  // ============================================================================
  {
    name: 'postgres_chat_history_store',
    description: 'Store chat message with embedding for semantic search',
    inputSchema: {
      type: 'object',
      properties: {
        role: {
          type: 'string',
          enum: ['user', 'assistant', 'system'],
          description: 'Message role',
        },
        content: {
          type: 'string',
          description: 'Message content',
        },
        embedding: {
          type: 'array',
          items: { type: 'number' },
          description: 'Message embedding vector',
        },
        metadata: {
          type: 'object',
          description: 'Additional metadata (task, context, etc.)',
        },
      },
      required: ['role', 'content', 'embedding'],
    },
  },

  {
    name: 'postgres_chat_history_retrieve',
    description: 'Retrieve chat history from PostgreSQL',
    inputSchema: {
      type: 'object',
      properties: {
        user_id: {
          type: 'string',
          description: 'User ID to retrieve history for',
        },
        limit: {
          type: 'number',
          default: 10,
          description: 'Number of messages to retrieve',
        },
        offset: {
          type: 'number',
          default: 0,
          description: 'Offset for pagination',
        },
      },
      required: ['user_id'],
    },
  },

  {
    name: 'postgres_chat_history_search',
    description: 'Search chat history using semantic similarity',
    inputSchema: {
      type: 'object',
      properties: {
        query_embedding: {
          type: 'array',
          items: { type: 'number' },
          description: 'Query embedding vector',
        },
        limit: {
          type: 'number',
          default: 5,
          description: 'Number of results to return',
        },
      },
      required: ['query_embedding'],
    },
  },

  // ============================================================================
  // Embeddings
  // ============================================================================
  {
    name: 'postgres_embeddings_store',
    description: 'Store embeddings in PostgreSQL with pgvector',
    inputSchema: {
      type: 'object',
      properties: {
        table: {
          type: 'string',
          description: 'Table name to store embeddings',
        },
        document_id: {
          type: 'string',
          description: 'Document identifier',
        },
        content: {
          type: 'string',
          description: 'Document content',
        },
        embedding: {
          type: 'array',
          items: { type: 'number' },
          description: 'Embedding vector',
        },
        metadata: {
          type: 'object',
          description: 'Additional metadata',
        },
      },
      required: ['table', 'document_id', 'content', 'embedding'],
    },
  },

  {
    name: 'postgres_embeddings_search',
    description: 'Search embeddings using vector similarity',
    inputSchema: {
      type: 'object',
      properties: {
        table: {
          type: 'string',
          description: 'Table name to search',
        },
        query_embedding: {
          type: 'array',
          items: { type: 'number' },
          description: 'Query embedding vector',
        },
        limit: {
          type: 'number',
          default: 5,
          description: 'Number of results to return',
        },
        threshold: {
          type: 'number',
          default: 0.7,
          description: 'Similarity threshold',
        },
      },
      required: ['table', 'query_embedding'],
    },
  },

  // ============================================================================
  // Table Management
  // ============================================================================
  {
    name: 'postgres_table_create',
    description: 'Create a new table in PostgreSQL',
    inputSchema: {
      type: 'object',
      properties: {
        table_name: {
          type: 'string',
          description: 'Name of the table to create',
        },
        schema: {
          type: 'string',
          description: 'SQL schema definition (e.g., "id SERIAL PRIMARY KEY, name VARCHAR(255)")',
        },
      },
      required: ['table_name', 'schema'],
    },
  },

  {
    name: 'postgres_table_list',
    description: 'List all tables in PostgreSQL database',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },

  {
    name: 'postgres_table_describe',
    description: 'Describe table schema in PostgreSQL',
    inputSchema: {
      type: 'object',
      properties: {
        table_name: {
          type: 'string',
          description: 'Name of the table to describe',
        },
      },
      required: ['table_name'],
    },
  },

  {
    name: 'postgres_table_drop',
    description: 'Drop a table from PostgreSQL',
    inputSchema: {
      type: 'object',
      properties: {
        table_name: {
          type: 'string',
          description: 'Name of the table to drop',
        },
        cascade: {
          type: 'boolean',
          default: false,
          description: 'Drop dependent objects as well',
        },
      },
      required: ['table_name'],
    },
  },

  // ============================================================================
  // Index Management
  // ============================================================================
  {
    name: 'postgres_index_create',
    description: 'Create an index in PostgreSQL',
    inputSchema: {
      type: 'object',
      properties: {
        index_name: {
          type: 'string',
          description: 'Name of the index',
        },
        table_name: {
          type: 'string',
          description: 'Table to create index on',
        },
        columns: {
          type: 'array',
          items: { type: 'string' },
          description: 'Columns to index',
        },
        unique: {
          type: 'boolean',
          default: false,
          description: 'Create unique index',
        },
      },
      required: ['index_name', 'table_name', 'columns'],
    },
  },

  {
    name: 'postgres_index_list',
    description: 'List all indexes in PostgreSQL',
    inputSchema: {
      type: 'object',
      properties: {
        table_name: {
          type: 'string',
          description: 'Filter by table name (optional)',
        },
      },
    },
  },

  {
    name: 'postgres_index_drop',
    description: 'Drop an index from PostgreSQL',
    inputSchema: {
      type: 'object',
      properties: {
        index_name: {
          type: 'string',
          description: 'Name of the index to drop',
        },
      },
      required: ['index_name'],
    },
  },

  // ============================================================================
  // Transaction Management
  // ============================================================================
  {
    name: 'postgres_transaction_begin',
    description: 'Begin a transaction in PostgreSQL',
    inputSchema: {
      type: 'object',
      properties: {
        isolation_level: {
          type: 'string',
          enum: ['READ UNCOMMITTED', 'READ COMMITTED', 'REPEATABLE READ', 'SERIALIZABLE'],
          default: 'READ COMMITTED',
          description: 'Transaction isolation level',
        },
      },
    },
  },

  {
    name: 'postgres_transaction_commit',
    description: 'Commit the current transaction in PostgreSQL',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },

  {
    name: 'postgres_transaction_rollback',
    description: 'Rollback the current transaction in PostgreSQL',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },

  // ============================================================================
  // Backup & Restore
  // ============================================================================
  {
    name: 'postgres_backup_create',
    description: 'Create a backup of PostgreSQL database',
    inputSchema: {
      type: 'object',
      properties: {
        backup_name: {
          type: 'string',
          description: 'Name for the backup',
        },
        tables: {
          type: 'array',
          items: { type: 'string' },
          description: 'Specific tables to backup (optional, defaults to all)',
        },
      },
      required: ['backup_name'],
    },
  },

  {
    name: 'postgres_backup_restore',
    description: 'Restore PostgreSQL database from backup',
    inputSchema: {
      type: 'object',
      properties: {
        backup_name: {
          type: 'string',
          description: 'Name of the backup to restore',
        },
      },
      required: ['backup_name'],
    },
  },

  // ============================================================================
  // Statistics & Monitoring
  // ============================================================================
  {
    name: 'postgres_stats_get',
    description: 'Get database statistics from PostgreSQL',
    inputSchema: {
      type: 'object',
      properties: {
        stat_type: {
          type: 'string',
          enum: ['database', 'tables', 'indexes', 'connections'],
          default: 'database',
          description: 'Type of statistics to retrieve',
        },
      },
    },
  },

  {
    name: 'postgres_connection_test',
    description: 'Test connection to PostgreSQL database',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },

  // ============================================================================
  // Schema Management
  // ============================================================================
  {
    name: 'postgres_schema_create',
    description: 'Create a new schema in PostgreSQL',
    inputSchema: {
      type: 'object',
      properties: {
        schema_name: {
          type: 'string',
          description: 'Name of the schema to create',
        },
      },
      required: ['schema_name'],
    },
  },

  {
    name: 'postgres_schema_list',
    description: 'List all schemas in PostgreSQL database',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },

  // ============================================================================
  // User Management
  // ============================================================================
  {
    name: 'postgres_user_create',
    description: 'Create a new user in PostgreSQL',
    inputSchema: {
      type: 'object',
      properties: {
        username: {
          type: 'string',
          description: 'Username for the new user',
        },
        password: {
          type: 'string',
          description: 'Password for the new user',
        },
        privileges: {
          type: 'array',
          items: { type: 'string' },
          description: 'Privileges to grant (e.g., ["SELECT", "INSERT"])',
        },
      },
      required: ['username', 'password'],
    },
  },

  {
    name: 'postgres_user_list',
    description: 'List all users in PostgreSQL database',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

