#!/usr/bin/env node
/**
 * RAD Crawler MCP Server
 * Retrieval-Augmented Development crawler with web scraping, repo ingestion, and semantic search
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';

import * as tools from './tools.js';

const server = new Server(
  {
    name: 'rad-crawler-mcp',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define available tools
const TOOLS: Tool[] = [
  {
    name: 'plan_crawl',
    description: 'Plan a web crawl from a high-level goal. Uses local LLM to generate seed URLs, domains, and budgets.',
    inputSchema: {
      type: 'object',
      properties: {
        goal: {
          type: 'string',
          description: 'What you want to crawl (e.g., "Vercel edge functions documentation")',
        },
        scope: {
          type: 'string',
          description: 'Optional scope/context for the crawl',
        },
        depth: {
          type: 'string',
          enum: ['fast', 'thorough'],
          description: 'Planning depth (default: fast)',
        },
      },
      required: ['goal'],
    },
  },
  {
    name: 'seed',
    description: 'Seed a crawl job with explicit URLs and rules',
    inputSchema: {
      type: 'object',
      properties: {
        urls: {
          type: 'array',
          items: { type: 'string' },
          description: 'Starting URLs to crawl',
        },
        allow: {
          type: 'array',
          items: { type: 'string' },
          description: 'Allowed domains (wildcards supported)',
        },
        deny: {
          type: 'array',
          items: { type: 'string' },
          description: 'Denied patterns (wildcards supported)',
        },
        max_depth: {
          type: 'number',
          description: 'Maximum crawl depth (default: 3)',
        },
        max_pages: {
          type: 'number',
          description: 'Maximum pages to crawl (default: 200)',
        },
        recrawl_days: {
          type: 'number',
          description: 'Recrawl pages older than N days (default: 7)',
        },
      },
      required: ['urls'],
    },
  },
  {
    name: 'crawl_now',
    description: 'Force start a queued crawl job',
    inputSchema: {
      type: 'object',
      properties: {
        job_id: {
          type: 'number',
          description: 'Job ID to start',
        },
      },
      required: ['job_id'],
    },
  },
  {
    name: 'ingest_repo',
    description: 'Ingest a code repository for analysis and search',
    inputSchema: {
      type: 'object',
      properties: {
        repo_url: {
          type: 'string',
          description: 'GitHub repository URL',
        },
        branch: {
          type: 'string',
          description: 'Branch to ingest (default: main)',
        },
        include: {
          type: 'array',
          items: { type: 'string' },
          description: 'File patterns to include (globs)',
        },
        exclude: {
          type: 'array',
          items: { type: 'string' },
          description: 'File patterns to exclude (globs)',
        },
      },
      required: ['repo_url'],
    },
  },
  {
    name: 'status',
    description: 'Get status of a crawl or ingest job',
    inputSchema: {
      type: 'object',
      properties: {
        job_id: {
          type: 'number',
          description: 'Job ID to check',
        },
      },
      required: ['job_id'],
    },
  },
  {
    name: 'search',
    description: 'Search the RAD index with FTS or semantic search',
    inputSchema: {
      type: 'object',
      properties: {
        q: {
          type: 'string',
          description: 'Search query',
        },
        top_k: {
          type: 'number',
          description: 'Number of results to return (default: 10)',
        },
        semantic: {
          type: 'boolean',
          description: 'Use semantic (vector) search instead of FTS (default: false)',
        },
      },
      required: ['q'],
    },
  },
  {
    name: 'get_doc',
    description: 'Get full document by ID (limited to 10KB)',
    inputSchema: {
      type: 'object',
      properties: {
        doc_id: {
          type: 'number',
          description: 'Document ID',
        },
      },
      required: ['doc_id'],
    },
  },
  {
    name: 'get_doc_chunk',
    description: 'Get a chunk of a document (paged retrieval)',
    inputSchema: {
      type: 'object',
      properties: {
        doc_id: {
          type: 'number',
          description: 'Document ID',
        },
        offset: {
          type: 'number',
          description: 'Byte offset to start from',
        },
        limit: {
          type: 'number',
          description: 'Number of bytes to retrieve',
        },
      },
      required: ['doc_id', 'offset', 'limit'],
    },
  },
  {
    name: 'govern',
    description: 'Update governance policy (allowlist, denylist, budgets)',
    inputSchema: {
      type: 'object',
      properties: {
        allowlist: {
          type: 'array',
          items: { type: 'string' },
          description: 'Allowed domains',
        },
        denylist: {
          type: 'array',
          items: { type: 'string' },
          description: 'Denied patterns',
        },
        budgets: {
          type: 'object',
          properties: {
            max_pages_per_job: { type: 'number' },
            max_depth: { type: 'number' },
            rate_per_domain: { type: 'number' },
          },
          description: 'Crawl budgets',
        },
      },
    },
  },
  {
    name: 'index_stats',
    description: 'Get RAD index statistics (pages, repos, chunks, storage)',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

// Handle tool listing
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS,
}));

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let result;

    switch (name) {
      case 'plan_crawl':
        result = await tools.planCrawl(args as any);
        break;
      case 'seed':
        result = await tools.seed(args as any);
        break;
      case 'crawl_now':
        result = await tools.crawlNow(args as any);
        break;
      case 'ingest_repo':
        result = await tools.ingestRepo(args as any);
        break;
      case 'status':
        result = await tools.status(args as any);
        break;
      case 'search':
        result = await tools.search(args as any);
        break;
      case 'get_doc':
        result = await tools.getDoc(args as any);
        break;
      case 'get_doc_chunk':
        result = await tools.getDocChunk(args as any);
        break;
      case 'govern':
        result = await tools.govern(args as any);
        break;
      case 'index_stats':
        result = await tools.indexStats();
        break;
      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ error: error.message }, null, 2),
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('RAD Crawler MCP server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});

