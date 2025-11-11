import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';

const API_BASE_URL = 'https://api.srv823383.hstgr.cloud/api/v1';
const USER_ID = 'chris';

interface ApiResponse {
  ok?: boolean;
  error?: string;
  [key: string]: unknown;
}

// Tool definitions
const tools: Tool[] = [
  {
    name: 'postgres_query',
    description: 'Execute a SQL query against PostgreSQL database',
    inputSchema: {
      type: 'object' as const,
      properties: {
        sql: {
          type: 'string',
          description: 'SQL query to execute',
        },
      },
      required: ['sql'],
    },
  },
  {
    name: 'postgres_execute',
    description: 'Execute a SQL command (INSERT/UPDATE/DELETE) against PostgreSQL',
    inputSchema: {
      type: 'object' as const,
      properties: {
        sql: {
          type: 'string',
          description: 'SQL command to execute',
        },
      },
      required: ['sql'],
    },
  },
  {
    name: 'postgres_tables',
    description: 'List all tables in PostgreSQL database',
    inputSchema: {
      type: 'object' as const,
      properties: {},
    },
  },
  {
    name: 'neo4j_execute',
    description: 'Execute a Cypher query against Neo4j graph database',
    inputSchema: {
      type: 'object' as const,
      properties: {
        cypher: {
          type: 'string',
          description: 'Cypher query to execute',
        },
        parameters: {
          type: 'object',
          description: 'Query parameters',
        },
      },
      required: ['cypher'],
    },
  },
  {
    name: 'qdrant_search',
    description: 'Search vectors in Qdrant collection',
    inputSchema: {
      type: 'object' as const,
      properties: {
        collection: {
          type: 'string',
          description: 'Collection name',
        },
        vector: {
          type: 'array',
          description: 'Query vector',
        },
        limit: {
          type: 'number',
          description: 'Number of results to return',
        },
      },
      required: ['collection', 'vector'],
    },
  },
  {
    name: 'qdrant_collections',
    description: 'List all Qdrant collections',
    inputSchema: {
      type: 'object' as const,
      properties: {},
    },
  },
];

async function callTool(
  name: string,
  args: Record<string, unknown>
): Promise<ApiResponse> {
  const headers = {
    'X-User': USER_ID,
    'Content-Type': 'application/json',
  };

  try {
    switch (name) {
      case 'postgres_query': {
        const response = await fetch(
          `${API_BASE_URL}/postgres/query?sql=${encodeURIComponent(args.sql as string)}`,
          { headers }
        );
        return await response.json();
      }

      case 'postgres_execute': {
        const response = await fetch(`${API_BASE_URL}/postgres/execute`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ sql: args.sql }),
        });
        return await response.json();
      }

      case 'postgres_tables': {
        const response = await fetch(`${API_BASE_URL}/postgres/tables`, {
          headers,
        });
        return await response.json();
      }

      case 'neo4j_execute': {
        const response = await fetch(`${API_BASE_URL}/neo4j/execute`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            cypher: args.cypher,
            parameters: args.parameters || {},
          }),
        });
        return await response.json();
      }

      case 'qdrant_search': {
        const response = await fetch(
          `${API_BASE_URL}/qdrant/collections/${args.collection}/search`,
          {
            method: 'POST',
            headers,
            body: JSON.stringify({
              vector: args.vector,
              limit: args.limit || 5,
            }),
          }
        );
        return await response.json();
      }

      case 'qdrant_collections': {
        const response = await fetch(`${API_BASE_URL}/qdrant/collections`, {
          headers,
        });
        return await response.json();
      }

      default:
        return { error: `Unknown tool: ${name}` };
    }
  } catch (error) {
    return {
      error: `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

async function main() {
  const server = new Server(
    {
      name: 'Custom API MCP',
      version: '0.1.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools,
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const result = await callTool(name, args as Record<string, unknown>);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);

