/**
 * RAD (Repository Agent Database) Tool Definitions
 * Tools for managing RAD sources and crawls
 */

export const RAD_TOOLS = [
  {
    name: 'rad_register_source',
    description: 'Register or update a RAD source for crawling',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Source name',
        },
        sourceType: {
          type: 'string',
          enum: ['git_repo', 'filesystem', 'web', 'api'],
          description: 'Type of source',
        },
        config: {
          type: 'object',
          description: 'Source configuration (repoUrl for git_repo, path for filesystem, etc.)',
        },
        enabled: {
          type: 'boolean',
          description: 'Whether source is enabled (default: true)',
        },
        metadata: {
          type: 'object',
          description: 'Optional metadata',
        },
      },
      required: ['name', 'sourceType', 'config'],
    },
  },
  {
    name: 'rad_list_sources',
    description: 'List all RAD sources',
    inputSchema: {
      type: 'object',
      properties: {
        enabled: {
          type: 'boolean',
          description: 'Filter by enabled status',
        },
        sourceType: {
          type: 'string',
          enum: ['git_repo', 'filesystem', 'web', 'api'],
          description: 'Filter by source type',
        },
      },
    },
  },
  {
    name: 'rad_trigger_crawl',
    description: 'Trigger a crawl for a source',
    inputSchema: {
      type: 'object',
      properties: {
        sourceId: {
          type: 'string',
          description: 'Source ID to crawl',
        },
        overrides: {
          type: 'object',
          description: 'Optional crawl configuration overrides',
          properties: {
            entrypoints: {
              type: 'array',
              items: { type: 'string' },
              description: 'Entry points to start crawling from',
            },
            excludePatterns: {
              type: 'array',
              items: { type: 'string' },
              description: 'Patterns to exclude',
            },
            includePatterns: {
              type: 'array',
              items: { type: 'string' },
              description: 'Patterns to include',
            },
            maxDepth: {
              type: 'number',
              description: 'Maximum directory depth',
            },
            followSymlinks: {
              type: 'boolean',
              description: 'Whether to follow symbolic links',
            },
          },
        },
      },
      required: ['sourceId'],
    },
  },
  {
    name: 'rad_get_crawl_status',
    description: 'Get status of a crawl',
    inputSchema: {
      type: 'object',
      properties: {
        crawlId: {
          type: 'string',
          description: 'Crawl ID to check',
        },
      },
      required: ['crawlId'],
    },
  },
  {
    name: 'rad_get_crawl_summary',
    description: 'Get aggregated stats for a source',
    inputSchema: {
      type: 'object',
      properties: {
        sourceId: {
          type: 'string',
          description: 'Source ID',
        },
      },
      required: ['sourceId'],
    },
  },
  {
    name: 'rad_preview_documents',
    description: 'Preview documents and chunks for a source',
    inputSchema: {
      type: 'object',
      properties: {
        sourceId: {
          type: 'string',
          description: 'Source ID',
        },
        docType: {
          type: 'string',
          description: 'Filter by document type (code, markdown, config, test, etc.)',
        },
        language: {
          type: 'string',
          description: 'Filter by language',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of documents to return (default: 10)',
        },
      },
      required: ['sourceId'],
    },
  },
];

