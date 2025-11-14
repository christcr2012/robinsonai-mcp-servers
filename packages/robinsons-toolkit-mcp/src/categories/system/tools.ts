/**
 * System Introspection Tool Definitions
 * Tools for agents to access system meta-knowledge
 */

export const SYSTEM_TOOLS = [
  {
    name: 'system_get_tool_catalog',
    description: 'Returns a grouped list of all tools across connected MCP servers',
    inputSchema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          description: 'Optional: Filter by category (github, vercel, neon, etc.)',
        },
        includeSchemas: {
          type: 'boolean',
          description: 'Include full tool schemas (default: false)',
        },
      },
    },
  },
  {
    name: 'system_get_capabilities',
    description: 'Queries capability_registry and returns capability summaries',
    inputSchema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          description: 'Filter by category (infrastructure, analysis, deployment, etc.)',
        },
        scope: {
          type: 'string',
          enum: ['global', 'repo', 'task'],
          description: 'Filter by scope',
        },
        complexity: {
          type: 'string',
          enum: ['simple', 'medium', 'complex', 'expert'],
          description: 'Filter by complexity level',
        },
      },
    },
  },
  {
    name: 'system_get_agent_handbook',
    description: 'Reads the latest Agent Handbook artifact from Cortex/RAD; if missing, responds with a clear "needs creation" signal',
    inputSchema: {
      type: 'object',
      properties: {
        format: {
          type: 'string',
          enum: ['markdown', 'json', 'yaml'],
          description: 'Preferred format (default: markdown)',
        },
      },
    },
  },
  {
    name: 'system_get_architecture_overview',
    description: 'Returns a short, curated system architecture overview',
    inputSchema: {
      type: 'object',
      properties: {
        includeComponents: {
          type: 'boolean',
          description: 'Include component details (default: true)',
        },
        includeIntegrations: {
          type: 'boolean',
          description: 'Include integration details (default: true)',
        },
      },
    },
  },
];

