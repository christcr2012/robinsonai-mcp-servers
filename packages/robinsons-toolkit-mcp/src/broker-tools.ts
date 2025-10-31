/**
 * Broker Tool Definitions
 * 
 * The 5 meta-tools that provide access to all 714 integration tools
 * without loading them into Augment's context window.
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';

/**
 * The 5 broker meta-tools
 */
export const BROKER_TOOLS: Tool[] = [
  {
    name: 'toolkit_list_categories',
    description: 'List all available integration categories (GitHub, Vercel, Neon, Upstash, Google). Returns category names, descriptions, and tool counts.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'toolkit_list_tools',
    description: 'List all tools in a specific category without loading their full schemas. Returns tool names and descriptions only.',
    inputSchema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          description: 'Category name (github, vercel, neon, upstash, google)',
          enum: ['github', 'vercel', 'neon', 'upstash', 'google'],
        },
        limit: {
          type: 'number',
          description: 'Maximum number of tools to return (default: 50)',
        },
        offset: {
          type: 'number',
          description: 'Offset for pagination (default: 0)',
        },
      },
      required: ['category'],
    },
  },
  {
    name: 'toolkit_get_tool_schema',
    description: 'Get the full schema for a specific tool including input parameters and descriptions. Use this when you need to know what parameters a tool accepts.',
    inputSchema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          description: 'Category name (github, vercel, neon, upstash, google)',
          enum: ['github', 'vercel', 'neon', 'upstash', 'google'],
        },
        tool_name: {
          type: 'string',
          description: 'Full tool name (e.g., "github_create_repo", "vercel_list_projects", "gmail_send_message")',
        },
      },
      required: ['category', 'tool_name'],
    },
  },
  {
    name: 'toolkit_discover',
    description: 'Search for tools by keyword across all categories. Returns matching tools with their categories and descriptions. Perfect for finding the right tool when you know what you want to do but not the exact tool name.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query (e.g., "create repo", "deploy", "database")',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results (default: 10)',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'toolkit_call',
    description: 'Execute any tool from any category. This is the main broker tool that runs tools server-side without loading their definitions into context. Provide the category, tool name, and arguments.',
    inputSchema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          description: 'Category name (github, vercel, neon, upstash, google)',
          enum: ['github', 'vercel', 'neon', 'upstash', 'google'],
        },
        tool_name: {
          type: 'string',
          description: 'Full tool name (e.g., "github_create_repo", "vercel_list_projects", "gmail_send_message")',
        },
        arguments: {
          type: 'object',
          description: 'Tool arguments as key-value pairs',
        },
      },
      required: ['category', 'tool_name', 'arguments'],
    },
  },
];

