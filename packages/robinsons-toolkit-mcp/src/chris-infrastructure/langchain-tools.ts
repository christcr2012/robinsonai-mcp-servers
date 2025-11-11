/**
 * LangChain Tools for Chris's Infrastructure
 * 
 * 4 tools for LangChain integration via FastAPI Gateway
 */

export const langchainTools = [
  // ============================================================================
  // Configuration & Info
  // ============================================================================
  {
    name: 'fastapi_langchain_info',
    description: 'Get LangChain configuration and available features for the user',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },

  // ============================================================================
  // Chat & Conversation
  // ============================================================================
  {
    name: 'fastapi_langchain_chat',
    description: 'Chat with LLM using LangChain with optional RAG (Retrieval-Augmented Generation)',
    inputSchema: {
      type: 'object',
      properties: {
        messages: {
          type: 'array',
          items: {
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
            },
            required: ['role', 'content'],
          },
          description: 'Conversation messages',
        },
        model: {
          type: 'string',
          default: 'gpt-3.5-turbo',
          description: 'LLM model to use (e.g., gpt-3.5-turbo, gpt-4)',
        },
        temperature: {
          type: 'number',
          default: 0.7,
          description: 'Temperature for response generation (0-1)',
        },
        max_tokens: {
          type: 'number',
          default: 1000,
          description: 'Maximum tokens in response',
        },
        use_rag: {
          type: 'boolean',
          default: false,
          description: 'Enable RAG to search user databases for context',
        },
        rag_source: {
          type: 'string',
          description: 'RAG source (postgres, qdrant, neo4j) if use_rag is true',
        },
      },
      required: ['messages'],
    },
  },

  // ============================================================================
  // RAG (Retrieval-Augmented Generation)
  // ============================================================================
  {
    name: 'fastapi_langchain_rag_query',
    description: 'Perform RAG query to search user databases and retrieve relevant context',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Query text to search for',
        },
        collection_name: {
          type: 'string',
          description: 'Qdrant collection name to search (optional)',
        },
        table_name: {
          type: 'string',
          description: 'PostgreSQL table name to search (optional)',
        },
        limit: {
          type: 'number',
          default: 5,
          description: 'Number of results to return',
        },
        use_context: {
          type: 'boolean',
          default: true,
          description: 'Include context in results',
        },
      },
      required: ['query'],
    },
  },

  // ============================================================================
  // Document Ingestion
  // ============================================================================
  {
    name: 'fastapi_langchain_ingest_document',
    description: 'Ingest document into vector database with automatic embedding generation',
    inputSchema: {
      type: 'object',
      properties: {
        content: {
          type: 'string',
          description: 'Document content to ingest',
        },
        metadata: {
          type: 'object',
          description: 'Document metadata (title, source, tags, etc.)',
        },
        collection_name: {
          type: 'string',
          description: 'Qdrant collection to store embeddings (optional)',
        },
        table_name: {
          type: 'string',
          description: 'PostgreSQL table to store embeddings (optional)',
        },
      },
      required: ['content'],
    },
  },
];

