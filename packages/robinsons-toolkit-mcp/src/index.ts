#!/usr/bin/env node

/**
 * Robinson's Toolkit MCP Server - BROKER ARCHITECTURE
 *
 * Spawns integration MCP servers on demand instead of loading all at startup.
 *
 * Benefits:
 * - Faster startup (no 23-server initialization)
 * - Lower memory (only active workers loaded)
 * - Connection pooling (max 6 active workers)
 * - Idle eviction (kill workers after 5 min)
 * - Timeout protection (60s per tool call)
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
import { MCPBroker } from './broker.js';

/**
 * Main Robinson's Toolkit MCP Server
 *
 * This server acts as a broker that spawns integration workers on demand.
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


  private setupHandlers(): void {
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

    // List available tools (meta-tools only - integration tools loaded on demand)
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
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
              text: `Error: ${error.message}`,
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
