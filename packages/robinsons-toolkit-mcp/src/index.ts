#!/usr/bin/env node

/**
 * Robinson's Toolkit MCP Server - ALWAYS-ON PROVIDER HUB
 *
 * Eagerly exposes all provider tools from a single server.
 *
 * Benefits:
 * - All tools visible immediately (no spawning workers)
 * - Fast failure without credentials (helpful error messages)
 * - Dotenv support (RTK_DOTENV_PATH)
 * - Concurrency limiting (RTK_MAX_ACTIVE)
 * - Timeout protection (RTK_TOOL_TIMEOUT_MS)
 *
 * This gives Augment Code HANDS to DO things, not just explain them!
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  InitializeRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import 'dotenv/config';
import pLimit from 'p-limit';
import { providerCatalog, ensureProviders, routeProviderCall, whatWasRenamed } from './providers/registry.js';
import { MCPBroker } from './broker.js';

const LIMIT = pLimit(parseInt(process.env.RTK_MAX_ACTIVE || '12', 10));
const TOOL_TIMEOUT_MS = parseInt(process.env.RTK_TOOL_TIMEOUT_MS || '60000', 10);
const EAGER = (process.env.RTK_EAGER_LOAD || '1') !== '0';
const DOTENV_PATH = process.env.RTK_DOTENV_PATH;

/**
 * Main Robinson's Toolkit MCP Server
 *
 * This server exposes all provider tools immediately (always-on).
 */
class RobinsonsToolkitServer {
  private server: Server;
  private broker: MCPBroker;

  constructor() {
    this.server = new Server(
      {
        name: 'robinsons-toolkit-mcp',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.broker = new MCPBroker();
    this.setupHandlers();
  }


  private async setupHandlers(): Promise<void> {
    // Load dotenv if path specified
    if (DOTENV_PATH) {
      try {
        const dotenv = await import('dotenv');
        dotenv.config({ path: DOTENV_PATH });
      } catch {}
    }

    // Eagerly initialize providers if enabled
    if (EAGER) {
      await ensureProviders();
    }

    // Handle initialize request
    this.server.setRequestHandler(InitializeRequestSchema, async (request) => ({
      protocolVersion: "2024-11-05",
      capabilities: {
        tools: {},
      },
      serverInfo: {
        name: "robinsons-toolkit-mcp",
        version: "1.0.0",
      },
    }));

    // List ALL provider tools (always-on) + legacy broker meta-tools + diagnostics
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        ...providerCatalog(), // All provider tools (github.*, vercel.*, etc.)
        {
          name: 'toolkit_provider_stats',
          description: 'List providers, tool counts, and any renames applied for MCP safety',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'registry_list',
          description: 'List all available integration servers and their tool counts',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'discover_tools',
          description: 'Get virtual catalog of all integration tools without spawning workers',
          inputSchema: {
            type: 'object',
            properties: {
              server: { type: 'string', description: 'Optional: filter by server name' },
            },
          },
        },
        {
          name: 'broker_call',
          description: 'Call a tool from an integration server (spawns worker on demand)',
          inputSchema: {
            type: 'object',
            properties: {
              server: { type: 'string', description: 'Server name (e.g., "github-mcp")' },
              tool: { type: 'string', description: 'Tool name' },
              args: { type: 'object', description: 'Tool arguments' },
            },
            required: ['server', 'tool', 'args'],
          },
        },
        {
          name: 'broker_stats',
          description: 'Get broker statistics (active workers, idle times, etc.)',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
        {
          name: 'diagnose_environment',
          description: 'Check which integration servers have credentials configured',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
      ],
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        const params = args as any || {};

        // Check if this is a provider tool (contains dot)
        if (name.includes('.')) {
          const work = routeProviderCall(name, params);
          const withTimeout = Promise.race([
            work,
            new Promise((_, r) => setTimeout(() => r(new Error(`timeout after ${TOOL_TIMEOUT_MS}ms`)), TOOL_TIMEOUT_MS))
          ]);
          return await LIMIT(() => withTimeout);
        }

        // Diagnostic tool
        if (name === 'toolkit_provider_stats') {
          const cats = providerCatalog();  // rebuild for a fresh snapshot
          const counts: Record<string, number> = {};
          for (const t of cats) {
            const ns = t.name.split('.')[0];
            counts[ns] = (counts[ns] || 0) + 1;
          }
          const renamed = whatWasRenamed();
          return {
            content: [{ type: 'text', text: JSON.stringify({ counts, renamed }, null, 2) }]
          };
        }

        // Legacy broker meta-tools
        switch (name) {
          case 'registry_list':
            return this.registryList();

          case 'discover_tools':
            return this.discoverTools(params.server);

          case 'broker_call':
            return this.brokerCall(params);

          case 'broker_stats':
            return this.brokerStats();

          case 'diagnose_environment':
            return this.diagnoseEnvironment();

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error: any) {
        return {
          content: [
            {
              type: 'text',
              text: `Error calling ${name}: ${error.message || String(error)}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  private registryList(): any {
    const diagnosis = this.broker.diagnoseEnvironment();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            totalServers: diagnosis.available.length + diagnosis.missing.length,
            availableServers: diagnosis.available.length,
            availableTools: diagnosis.availableTools,
            totalTools: diagnosis.totalTools,
            available: diagnosis.available,
            missing: diagnosis.missing,
          }, null, 2),
        },
      ],
    };
  }

  private discoverTools(serverFilter?: string): any {
    const catalog = this.broker.getVirtualCatalog();

    const filtered = serverFilter
      ? catalog.filter(tool => tool.server === serverFilter)
      : catalog;

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            totalTools: filtered.length,
            serverFilter: serverFilter || 'all',
            tools: filtered.slice(0, 50), // Limit to first 50 for readability
            note: filtered.length > 50 ? `Showing first 50 of ${filtered.length} tools` : undefined,
          }, null, 2),
        },
      ],
    };
  }

  private async brokerCall(params: { server: string; tool: string; args: any }): Promise<any> {
    const result = await this.broker.brokerCall(params);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  private brokerStats(): any {
    const stats = this.broker.getBrokerStats();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(stats, null, 2),
        },
      ],
    };
  }

  private diagnoseEnvironment(): any {
    const diagnosis = this.broker.diagnoseEnvironment();

    let report = '🔍 Environment Diagnosis\n\n';

    report += `📊 Summary:\n`;
    report += `  • Total Integrations: ${diagnosis.available.length + diagnosis.missing.length}\n`;
    report += `  • Available: ${diagnosis.available.length} (${diagnosis.availableTools} tools)\n`;
    report += `  • Missing Credentials: ${diagnosis.missing.length}\n`;
    report += `  • Total Tools: ${diagnosis.totalTools}\n\n`;

    if (diagnosis.available.length > 0) {
      report += `✅ Available Integrations:\n`;
      diagnosis.available.forEach((integration: any) => {
        report += `  • ${integration.name} (${integration.toolCount} tools)\n`;
        report += `    Categories: ${integration.categories.join(', ')}\n`;
      });
      report += '\n';
    }

    if (diagnosis.missing.length > 0) {
      report += `❌ Missing Credentials:\n`;
      diagnosis.missing.forEach((integration: any) => {
        report += `  • ${integration.name} (${integration.toolCount} tools)\n`;
        report += `    Missing: ${integration.missingVars?.join(', ')}\n`;
      });
      report += '\n';
    }

    report += `💡 To enable missing integrations, set these environment variables:\n`;
    diagnosis.missing.forEach((integration: any) => {
      integration.missingVars?.forEach((varName: string) => {
        report += `  export ${varName}=your_${varName.toLowerCase()}_here\n`;
      });
    });

    return {
      content: [
        {
          type: 'text',
          text: report,
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Robinson\'s Toolkit MCP (Broker) running on stdio');
    console.error(`Broker config: max ${this.broker.getBrokerStats().maxActive} active workers, ${this.broker.getBrokerStats().idleTimeout}s idle timeout`);
    console.error(`Total integration servers: ${this.broker.getBrokerStats().totalServers}`);

    // Cleanup on exit
    process.on('SIGINT', () => {
      console.error('Shutting down broker...');
      this.broker.shutdown();
      process.exit(0);
    });
  }
}

const server = new RobinsonsToolkitServer();
server.run().catch(console.error);
