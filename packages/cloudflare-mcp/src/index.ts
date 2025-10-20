#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { CloudflareClient } from './client.js';
import { createDnsTools } from './tools/dns.js';
import { createZoneTools } from './tools/zones.js';
import { createDomainTools } from './tools/domains.js';
import { createSslTools } from './tools/ssl.js';
import { createVerificationTools } from './tools/verification.js';
import { createTroubleshootingTools } from './tools/troubleshooting.js';
import { createFirewallTools } from './tools/firewall.js';
import { createCacheTools } from './tools/cache.js';
import { createZoneSettingsTools } from './tools/zone-settings.js';
import { createWorkersTools } from './tools/workers.js';
import { createPagesTools } from './tools/pages.js';
import { createR2Tools } from './tools/r2.js';
import { createD1Tools } from './tools/d1.js';
import { createAnalyticsTools } from './tools/analytics.js';
import { createLoadBalancingTools } from './tools/load-balancing.js';

const server = new Server(
  {
    name: 'cortiware-cloudflare-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Initialize Cloudflare client
const cloudflareClient = new CloudflareClient();

// Collect all tools
const allTools = {
  ...createDnsTools(cloudflareClient),
  ...createZoneTools(cloudflareClient),
  ...createDomainTools(cloudflareClient),
  ...createSslTools(cloudflareClient),
  ...createVerificationTools(cloudflareClient),
  ...createTroubleshootingTools(cloudflareClient),
  ...createFirewallTools(cloudflareClient),
  ...createCacheTools(cloudflareClient),
  ...createZoneSettingsTools(cloudflareClient),
  ...createWorkersTools(cloudflareClient),
  ...createPagesTools(cloudflareClient),
  ...createR2Tools(cloudflareClient),
  ...createD1Tools(cloudflareClient),
  ...createAnalyticsTools(cloudflareClient),
  ...createLoadBalancingTools(cloudflareClient),
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
  console.error('Cloudflare MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

