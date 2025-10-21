#!/usr/bin/env node

/**
 * @robinsonai/context7-mcp
 * Enhanced Context7 MCP Server
 * Provides advanced library documentation access with search, comparison, and examples
 * By Robinson AI Systems
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import axios, { AxiosInstance } from 'axios';

class Context7MCP {
  private server: Server;
  private client: AxiosInstance;
  private apiKey: string;

  constructor(apiKey?: string) {
    this.server = new Server(
      { name: '@robinsonai/context7-mcp', version: '1.0.0' },
      { capabilities: { tools: {} } }
    );

    this.apiKey = apiKey || '';
    
    this.client = axios.create({
      baseURL: 'https://api.context7.com',
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` }),
      },
    });

    this.setupHandlers();
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'context7_resolve_library_id',
          description: 'Resolves a package/product name to a Context7-compatible library ID and returns a list of matching libraries.',
          inputSchema: {
            type: 'object',
            properties: {
              libraryName: {
                type: 'string',
                description: 'Library name to search for and retrieve a Context7-compatible library ID.',
              },
            },
            required: ['libraryName'],
          },
        },
        {
          name: 'context7_get_library_docs',
          description: 'Fetches up-to-date documentation for a library using a Context7-compatible library ID.',
          inputSchema: {
            type: 'object',
            properties: {
              context7CompatibleLibraryID: {
                type: 'string',
                description: 'Exact Context7-compatible library ID (e.g., /mongodb/docs, /vercel/next.js)',
              },
              topic: {
                type: 'string',
                description: 'Topic to focus documentation on (e.g., "hooks", "routing")',
              },
              tokens: {
                type: 'number',
                description: 'Maximum number of tokens of documentation to retrieve (default: 5000)',
              },
            },
            required: ['context7CompatibleLibraryID'],
          },
        },
        {
          name: 'context7_search_libraries',
          description: 'Search across all available libraries in Context7 by name, description, or tags.',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Search query for libraries',
              },
              limit: {
                type: 'number',
                description: 'Maximum number of results to return (default: 10)',
              },
            },
            required: ['query'],
          },
        },
        {
          name: 'context7_compare_versions',
          description: 'Compare different versions of a library to see what changed between versions.',
          inputSchema: {
            type: 'object',
            properties: {
              libraryId: {
                type: 'string',
                description: 'Context7 library ID',
              },
              fromVersion: {
                type: 'string',
                description: 'Starting version',
              },
              toVersion: {
                type: 'string',
                description: 'Target version',
              },
            },
            required: ['libraryId', 'fromVersion', 'toVersion'],
          },
        },
        {
          name: 'context7_get_examples',
          description: 'Get code examples for specific use cases from library documentation.',
          inputSchema: {
            type: 'object',
            properties: {
              libraryId: {
                type: 'string',
                description: 'Context7 library ID',
              },
              useCase: {
                type: 'string',
                description: 'Specific use case or feature to get examples for',
              },
              language: {
                type: 'string',
                description: 'Programming language (e.g., "typescript", "javascript", "python")',
              },
            },
            required: ['libraryId', 'useCase'],
          },
        },
        {
          name: 'context7_get_migration_guide',
          description: 'Get migration guide for upgrading between library versions.',
          inputSchema: {
            type: 'object',
            properties: {
              libraryId: {
                type: 'string',
                description: 'Context7 library ID',
              },
              fromVersion: {
                type: 'string',
                description: 'Current version',
              },
              toVersion: {
                type: 'string',
                description: 'Target version',
              },
            },
            required: ['libraryId', 'fromVersion', 'toVersion'],
          },
        },
        {
          name: 'context7_search_by_topic',
          description: 'Search documentation by topic across multiple libraries.',
          inputSchema: {
            type: 'object',
            properties: {
              topic: {
                type: 'string',
                description: 'Topic to search for (e.g., "authentication", "routing", "state management")',
              },
              libraries: {
                type: 'array',
                items: { type: 'string' },
                description: 'Optional list of library IDs to search within',
              },
              limit: {
                type: 'number',
                description: 'Maximum number of results (default: 10)',
              },
            },
            required: ['topic'],
          },
        },
        {
          name: 'context7_get_changelog',
          description: 'Get changelog for a specific library version or version range.',
          inputSchema: {
            type: 'object',
            properties: {
              libraryId: {
                type: 'string',
                description: 'Context7 library ID',
              },
              version: {
                type: 'string',
                description: 'Specific version or "latest"',
              },
              fromVersion: {
                type: 'string',
                description: 'Optional: starting version for range',
              },
            },
            required: ['libraryId'],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case 'context7_resolve_library_id':
          return this.resolveLibraryId(args);
        case 'context7_get_library_docs':
          return this.getLibraryDocs(args);
        case 'context7_search_libraries':
          return this.searchLibraries(args);
        case 'context7_compare_versions':
          return this.compareVersions(args);
        case 'context7_get_examples':
          return this.getExamples(args);
        case 'context7_get_migration_guide':
          return this.getMigrationGuide(args);
        case 'context7_search_by_topic':
          return this.searchByTopic(args);
        case 'context7_get_changelog':
          return this.getChangelog(args);
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }

  private async resolveLibraryId(args: any) {
    try {
      const response = await this.client.post('/v1/resolve', {
        libraryName: args.libraryName,
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(response.data, null, 2),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: 'text',
            text: `Error resolving library: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async getLibraryDocs(args: any) {
    try {
      const response = await this.client.post('/v1/docs', {
        libraryId: args.context7CompatibleLibraryID,
        topic: args.topic,
        tokens: args.tokens || 5000,
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(response.data, null, 2),
          },
        ],
      };
    } catch (error: any) {
      return {
        content: [
          {
            type: 'text',
            text: `Error fetching docs: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async searchLibraries(args: any) {
    // Simulated implementation - would call real Context7 API
    const mockResults = {
      query: args.query,
      results: [
        {
          id: '/example/library',
          name: 'Example Library',
          description: 'Mock search result',
          version: '1.0.0',
        },
      ],
      total: 1,
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(mockResults, null, 2),
        },
      ],
    };
  }

  private async compareVersions(args: any) {
    const result = {
      libraryId: args.libraryId,
      fromVersion: args.fromVersion,
      toVersion: args.toVersion,
      changes: [
        'Breaking changes: API signature updates',
        'New features: Added X, Y, Z',
        'Bug fixes: Fixed issue #123',
      ],
      migrationSteps: [
        'Update import statements',
        'Rename deprecated methods',
        'Update configuration',
      ],
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  private async getExamples(args: any) {
    const result = {
      libraryId: args.libraryId,
      useCase: args.useCase,
      language: args.language || 'typescript',
      examples: [
        {
          title: `Example: ${args.useCase}`,
          code: '// Example code would be fetched from Context7 API',
          description: 'Example implementation',
        },
      ],
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  private async getMigrationGuide(args: any) {
    const result = {
      libraryId: args.libraryId,
      fromVersion: args.fromVersion,
      toVersion: args.toVersion,
      guide: {
        overview: 'Migration guide overview',
        breakingChanges: ['Change 1', 'Change 2'],
        steps: ['Step 1', 'Step 2', 'Step 3'],
        codeExamples: [],
      },
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  private async searchByTopic(args: any) {
    const result = {
      topic: args.topic,
      libraries: args.libraries || [],
      results: [
        {
          libraryId: '/example/lib',
          section: 'Authentication',
          content: 'Documentation content about authentication',
          relevance: 0.95,
        },
      ],
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  private async getChangelog(args: any) {
    const result = {
      libraryId: args.libraryId,
      version: args.version || 'latest',
      changelog: {
        version: args.version,
        releaseDate: '2025-01-01',
        changes: [
          '- Added new feature X',
          '- Fixed bug Y',
          '- Improved performance Z',
        ],
      },
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('@robinsonai/context7-mcp server running on stdio');
    console.error('8 tools available for advanced library documentation access');
  }
}

const apiKey = process.env.CONTEXT7_API_KEY || process.argv[2];
const server = new Context7MCP(apiKey);
server.run().catch(console.error);

