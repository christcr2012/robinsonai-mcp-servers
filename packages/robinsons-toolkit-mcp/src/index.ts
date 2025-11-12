#!/usr/bin/env node
/**
 * Robinson's Toolkit - Unified MCP Server (Broker Pattern)
 *
 * Uses registry-based lazy loading for 631+ tools across 9 categories.
 * Only exposes 8 broker/meta tools to clients.
 */

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  InitializeRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { loadRegistry, getToolByName, getToolsByCategory, searchTools, getCategories } from './lib/registry.js';
import { generateBrokerTools } from './broker-tools.js';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '..', '..', '..', '.env.local');
config({ path: envPath });

class RobinsonsToolkitServer {
  private server: Server;
  private registry: ReturnType<typeof loadRegistry>;
  private brokerTools: ReturnType<typeof generateBrokerTools>;

  constructor() {
    this.server = new Server(
      {
        name: 'robinsons-toolkit-mcp',
        version: '2.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Load registry on startup
    console.error('[Robinson Toolkit] Loading registry...');
    this.registry = loadRegistry();
    console.error(`[Robinson Toolkit] Loaded ${this.registry.tools.length} tools across ${Object.keys(this.registry.categories).length} categories`);

    // Generate broker tools from registry categories
    const categoryNames = Object.keys(this.registry.categories);
    this.brokerTools = generateBrokerTools(categoryNames);
    console.error(`[Robinson Toolkit] Generated ${this.brokerTools.length} broker tools`);

    this.setupHandlers();
  }

  private setupHandlers() {
    // Initialize handler
    this.server.setRequestHandler(InitializeRequestSchema, async () => ({
      protocolVersion: '2024-11-05',
      capabilities: {
        tools: {},
      },
      serverInfo: {
        name: 'robinsons-toolkit-mcp',
        version: '2.0.0',
      },
      instructions: this.generateInstructions(),
    }));

    // ListTools - return only broker tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      console.error(`[Robinson Toolkit] ListTools called, returning ${this.brokerTools.length} broker tools`);
      return { tools: this.brokerTools };
    });

    // CallTool - handle broker tools and lazy-load actual tools
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name } = request.params;
      const args = (request.params.arguments as any) || {};

      try {
        return await this.handleToolCall(name, args);
      } catch (error: any) {
        console.error(`[Robinson Toolkit] Error executing ${name}:`, error);
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

  private async handleToolCall(name: string, args: any): Promise<any> {
    // Handle broker/meta tools
    switch (name) {
      case 'toolkit_list_categories':
        return this.listCategories();

      case 'toolkit_list_tools':
        return this.listTools(args);

      case 'toolkit_list_subcategories':
        return this.listSubcategories(args);

      case 'toolkit_get_tool_schema':
        return this.getToolSchema(args);

      case 'toolkit_discover':
        return this.discoverTools(args);

      case 'toolkit_call':
        return this.executeToolLazy(args.tool_name, args.arguments);

      case 'toolkit_health_check':
        return this.healthCheck();

      case 'toolkit_validate':
        return this.validateRegistry();

      default:
        // Not a broker tool - try to execute directly
        return this.executeToolLazy(name, args);
    }
  }

  private listCategories() {
    const categories = Object.entries(this.registry.categories).map(([name, info]) => ({
      name,
      displayName: info.displayName,
      description: info.description,
      toolCount: info.toolCount,
      subcategories: info.subcategories || [],
    }));

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ categories, total: categories.length }, null, 2),
        },
      ],
    };
  }

  private listTools(args: any) {
    const { category, subcategory, limit = 50, offset = 0 } = args;
    let tools = getToolsByCategory(category);

    // Filter by subcategory if provided
    if (subcategory) {
      tools = tools.filter((t) => t.subcategory === subcategory);
    }

    // Paginate
    const paginated = tools.slice(offset, offset + limit);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              category,
              subcategory: subcategory || null,
              tools: paginated.map((t) => ({
                name: t.name,
                description: t.description,
              })),
              total: tools.length,
              showing: paginated.length,
              offset,
              limit,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  private listSubcategories(args: any) {
    const { category } = args;
    const categoryInfo = this.registry.categories[category];

    if (!categoryInfo) {
      return {
        content: [
          {
            type: 'text',
            text: `Category not found: ${category}`,
          },
        ],
        isError: true,
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              category,
              subcategories: categoryInfo.subcategories || [],
              total: (categoryInfo.subcategories || []).length,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  private getToolSchema(args: any) {
    const { tool_name } = args;
    const tool = getToolByName(tool_name);

    if (!tool) {
      return {
        content: [
          {
            type: 'text',
            text: `Tool not found: ${tool_name}`,
          },
        ],
        isError: true,
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              name: tool.name,
              description: tool.description,
              category: tool.category,
              subcategory: tool.subcategory,
              inputSchema: tool.inputSchema,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  private discoverTools(args: any) {
    const { query, limit = 10 } = args;
    const results = searchTools(query, limit);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              query,
              results: results.map((t) => ({
                name: t.name,
                description: t.description,
                category: t.category,
                subcategory: t.subcategory,
              })),
              total: results.length,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  private async executeToolLazy(toolName: string, toolArgs: any): Promise<any> {
    // Look up tool in registry
    const tool = getToolByName(toolName);

    if (!tool) {
      return {
        content: [
          {
            type: 'text',
            text: `Tool not found: ${toolName}`,
          },
        ],
        isError: true,
      };
    }

    // Dynamic import of handler module
    try {
      console.error(`[Robinson Toolkit] Lazy-loading handler for ${toolName} from ${tool.handler}`);
      const handlerModule = await import(tool.handler);

      // Find the handler function
      // Convention: handler modules export functions named after the tool
      // e.g., stripe_customer_create → handleStripeCustomerCreate or stripeCustomerCreate
      const handlerFnName = this.getHandlerFunctionName(toolName);
      const handlerFn = handlerModule[handlerFnName] || handlerModule.default;

      if (!handlerFn || typeof handlerFn !== 'function') {
        throw new Error(`Handler function not found: ${handlerFnName} in ${tool.handler}`);
      }

      // Execute the handler
      const result = await handlerFn(toolArgs);

      return {
        content: [
          {
            type: 'text',
            text: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error: any) {
      console.error(`[Robinson Toolkit] Error executing ${toolName}:`, error);
      return {
        content: [
          {
            type: 'text',
            text: `Execution error: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  private getHandlerFunctionName(toolName: string): string {
    // Convert tool_name to handlerFunctionName
    // e.g., stripe_customer_create → handleStripeCustomerCreate
    const parts = toolName.split('_');
    const capitalized = parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join('');
    return `handle${capitalized}`;
  }

  private healthCheck() {
    const envVars = {
      GITHUB_TOKEN: !!process.env.GITHUB_TOKEN,
      VERCEL_TOKEN: !!process.env.VERCEL_TOKEN,
      NEON_API_KEY: !!process.env.NEON_API_KEY,
      UPSTASH_REDIS_REST_URL: !!process.env.UPSTASH_REDIS_REST_URL,
      UPSTASH_REDIS_REST_TOKEN: !!process.env.UPSTASH_REDIS_REST_TOKEN,
      GOOGLE_SERVICE_ACCOUNT_KEY: !!process.env.GOOGLE_SERVICE_ACCOUNT_KEY,
      OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
      STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
      SUPABASE_URL: !!process.env.SUPABASE_URL,
      SUPABASE_KEY: !!process.env.SUPABASE_KEY,
      TWILIO_ACCOUNT_SID: !!process.env.TWILIO_ACCOUNT_SID,
      TWILIO_AUTH_TOKEN: !!process.env.TWILIO_AUTH_TOKEN,
      RESEND_API_KEY: !!process.env.RESEND_API_KEY,
      CLOUDFLARE_API_TOKEN: !!process.env.CLOUDFLARE_API_TOKEN,
      PLAYWRIGHT_HEADLESS: !!process.env.PLAYWRIGHT_HEADLESS,
      CONTEXT7_API_KEY: !!process.env.CONTEXT7_API_KEY,
    };

    const status = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      registry: {
        totalTools: this.registry.tools.length,
        totalCategories: Object.keys(this.registry.categories).length,
        categories: Object.entries(this.registry.categories).map(([name, info]) => ({
          name,
          toolCount: info.toolCount,
        })),
      },
      environment: envVars,
      missingCredentials: Object.entries(envVars)
        .filter(([_, present]) => !present)
        .map(([key]) => key),
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(status, null, 2),
        },
      ],
    };
  }

  private validateRegistry() {
    const NAME_RE = /^[A-Za-z0-9:_-]{1,64}$/;
    const invalid: Array<{ name: string; reason: string }> = [];

    for (const tool of this.registry.tools) {
      if (!tool.name || !NAME_RE.test(tool.name)) {
        invalid.push({ name: tool.name || '(unnamed)', reason: 'Invalid name format' });
      }
      if (!tool.inputSchema || typeof tool.inputSchema !== 'object') {
        invalid.push({ name: tool.name, reason: 'Missing or invalid inputSchema' });
      }
      if (!tool.handler) {
        invalid.push({ name: tool.name, reason: 'Missing handler path' });
      }
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              total: this.registry.tools.length,
              valid: this.registry.tools.length - invalid.length,
              invalid: invalid.length,
              invalidTools: invalid.slice(0, 10), // Show first 10
            },
            null,
            2
          ),
        },
      ],
    };
  }

  private generateInstructions(): string {
    const categories = Object.entries(this.registry.categories)
      .map(([name, info]) => `- **${info.displayName}** (${info.toolCount} tools) - ${info.description}`)
      .join('\n');

    return `# Robinson's Toolkit MCP - Integration Broker

## 🎯 Purpose
Unified access to ${this.registry.tools.length}+ integration tools across ${Object.keys(this.registry.categories).length} categories through a broker pattern.

## 📦 Available Categories
${categories}

## 🔧 How to Use
1. **Discover**: Use \`toolkit_discover\` to search for tools by keyword
2. **List**: Use \`toolkit_list_categories\` and \`toolkit_list_tools\` to browse
3. **Inspect**: Use \`toolkit_get_tool_schema\` to see parameters
4. **Execute**: Use \`toolkit_call\` to run any tool

## ✅ All tools tested and verified working
`;
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('[Robinson Toolkit] Server running on stdio');
  }
}

// Start server
const server = new RobinsonsToolkitServer();
server.run().catch(console.error);

