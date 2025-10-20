#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { ResendClient } from './client.js';
import { createEmailTools } from './tools/email.js';
import { createDomainTools } from './tools/domains.js';
import { createApiKeyTools } from './tools/api-keys.js';
import { createAudienceTools } from './tools/audiences.js';
import { createContactTools } from './tools/contacts.js';
import { createBroadcastTools } from './tools/broadcasts.js';
import { createReceivingTools } from './tools/receiving.js';
import { createTopicTools } from './tools/topics.js';
import { createTemplateTools } from './tools/templates.js';

const server = new Server(
  {
    name: 'cortiware-resend-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Initialize Resend client
const resendClient = new ResendClient();

// Collect all tools
const allTools = {
  ...createEmailTools(resendClient),
  ...createDomainTools(resendClient),
  ...createApiKeyTools(resendClient),
  ...createAudienceTools(resendClient),
  ...createContactTools(resendClient),
  ...createBroadcastTools(resendClient),
  ...createReceivingTools(resendClient),
  ...createTopicTools(resendClient),
  ...createTemplateTools(resendClient),
};

// List tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: Object.entries(allTools).map(([name, tool]) => ({
      name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    })),
  };
});

// Call tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const toolName = request.params.name;
  const tool = allTools[toolName as keyof typeof allTools];

  if (!tool) {
    throw new Error(`Unknown tool: ${toolName}`);
  }

  try {
    return await tool.handler(request.params.arguments || {});
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [{
        type: 'text',
        text: `Error: ${errorMessage}`
      }],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Resend MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
