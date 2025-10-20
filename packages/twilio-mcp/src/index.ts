#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { TwilioClient } from './client.js';
import { createMessagingTools } from './tools/messaging.js';
import { createVoiceTools } from './tools/voice.js';
import { createPhoneNumberTools } from './tools/numbers.js';
import { createUsageTools } from './tools/usage.js';
import { createSubaccountTools } from './tools/subaccounts.js';
import { createConferenceTools } from './tools/conferences.js';
import { createMediaTools } from './tools/media.js';
import { createMessagingServiceNumberTools } from './tools/messaging-service-numbers.js';
import { createVerifyTools } from './tools/verify.js';
import { createLookupTools } from './tools/lookup.js';
import { createNotifyTools } from './tools/notify.js';

const server = new Server(
  {
    name: 'cortiware-twilio-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Initialize Twilio client
const twilioClient = new TwilioClient();

// Collect all tools
const allTools = {
  ...createMessagingTools(twilioClient),
  ...createVoiceTools(twilioClient),
  ...createPhoneNumberTools(twilioClient),
  ...createUsageTools(twilioClient),
  ...createSubaccountTools(twilioClient),
  ...createConferenceTools(twilioClient),
  ...createMediaTools(twilioClient),
  ...createMessagingServiceNumberTools(twilioClient),
  ...createVerifyTools(twilioClient),
  ...createLookupTools(twilioClient),
  ...createNotifyTools(twilioClient),
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
  console.error('Twilio MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

