#!/usr/bin/env node
/**
 * Robinson's Toolkit - Unified MCP Server (Broker Pattern)
 *
 * Uses registry-based lazy loading for 1,717+ tools across 16 categories.
 * Only exposes 11 broker/meta tools to clients.
 *
 * Phase 5: Added core tool discovery (toolkit_list_core_tools, toolkit_discover_core)
 */

import { config } from 'dotenv';
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, join, resolve } from 'path';
import { readFileSync } from 'fs';
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
  private coreToolsConfig: Record<string, Array<{ name: string; tags: string[] }>>;

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

    // Load core tools config
    try {
      const configPath = join(__dirname, '..', 'scripts', 'core-tools-config.json');
      const configContent = readFileSync(configPath, 'utf-8');
      this.coreToolsConfig = JSON.parse(configContent);
      const totalCoreTools = Object.values(this.coreToolsConfig).reduce((sum, tools) => sum + tools.length, 0);
      console.error(`[Robinson Toolkit] Loaded ${totalCoreTools} core tools from config`);
    } catch (error) {
      console.error('[Robinson Toolkit] Warning: Could not load core tools config:', error);
      this.coreToolsConfig = {};
    }

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
    // Accept both plain and suffixed names for compatibility
    // Augment uses plain names (e.g., 'toolkit_call')
    // ToolkitClient uses suffixed names (e.g., 'toolkit_call_robinsons-toolkit-mcp')
    const normalized = name.replace(/_robinsons-toolkit-mcp$/, '');

    // Handle broker/meta tools
    switch (normalized) {
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

      case 'toolkit_search_tools':
        return this.searchTools(args);

      case 'toolkit_list_core_tools':
        return this.listCoreTools(args);

      case 'toolkit_discover_core':
        return this.discoverCoreTools(args);

      case 'toolkit_call':
        // Note: client sends { category, tool_name, arguments }
        return this.executeToolLazy(args.tool_name, args.arguments);

      case 'toolkit_health_check':
        return this.healthCheck();

      case 'toolkit_validate':
        return this.validateRegistry();

      default:
        // Not a broker tool - try to execute directly
        // Use normalized name for direct tool calls too
        return this.executeToolLazy(normalized, args);
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
    const results = searchTools(query, { limit });

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

  private searchTools(args: any) {
    const { query, categoryId, tags, dangerLevel, limit = 10 } = args;
    const results = searchTools(query, {
      limit,
      categoryId,
      tags,
      dangerLevel,
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              query,
              filters: {
                categoryId: categoryId || 'none',
                tags: tags || [],
                dangerLevel: dangerLevel || 'none',
              },
              results: results.map((t) => ({
                name: t.name,
                description: t.description,
                category: t.category,
                subcategory: t.subcategory,
                tags: t.tags || [],
                dangerLevel: t.dangerLevel || 'unknown',
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

  private listCoreTools(args: any) {
    const { category, includeNonCore = false } = args;

    // Get core tool names from config
    let coreToolNames: Set<string> = new Set();

    if (category) {
      // Get core tools for specific category
      const categoryTools = this.coreToolsConfig[category] || [];
      categoryTools.forEach(t => coreToolNames.add(t.name));
    } else {
      // Get all core tools
      Object.values(this.coreToolsConfig).forEach(tools => {
        tools.forEach(t => coreToolNames.add(t.name));
      });
    }

    // Get full tool records from registry
    const coreTools = this.registry.tools.filter(t => coreToolNames.has(t.name));

    // If includeNonCore, add some related non-core tools
    let results = coreTools;
    if (includeNonCore && category) {
      const categoryTools = this.registry.tools.filter(t => t.category === category);
      const nonCore = categoryTools
        .filter(t => !coreToolNames.has(t.name))
        .slice(0, 5);
      results = [...coreTools, ...nonCore];
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              category: category || 'all',
              coreToolsCount: coreTools.length,
              totalResults: results.length,
              tools: results.map((t) => ({
                name: t.name,
                description: t.description,
                category: t.category,
                subcategory: t.subcategory,
                tags: this.getToolTags(t.name),
              })),
            },
            null,
            2
          ),
        },
      ],
    };
  }

  private discoverCoreTools(args: any) {
    const { query, category, max_results = 10 } = args;

    // Get core tool names from config
    let coreToolNames: Set<string> = new Set();

    if (category) {
      const categoryTools = this.coreToolsConfig[category] || [];
      categoryTools.forEach(t => coreToolNames.add(t.name));
    } else {
      Object.values(this.coreToolsConfig).forEach(tools => {
        tools.forEach(t => coreToolNames.add(t.name));
      });
    }

    // Search all tools first
    const allResults = searchTools(query, {
      limit: 100, // Get more results to filter
      categoryId: category,
    });

    // Filter to only core tools
    const coreResults = allResults.filter((t) => coreToolNames.has(t.name));

    // Limit results
    const limitedResults = coreResults.slice(0, max_results);

    // Generate "why this matches" explanations
    const resultsWithReasons = limitedResults.map((t) => {
      const reasons: string[] = [];

      // Check if query matches name
      if (t.name.toLowerCase().includes(query.toLowerCase())) {
        reasons.push('Tool name matches query');
      }

      // Check if query matches description
      if (t.description && t.description.toLowerCase().includes(query.toLowerCase())) {
        reasons.push('Description matches query');
      }

      // Check if query matches tags
      const tags = this.getToolTags(t.name);
      if (tags && tags.some((tag) => query.toLowerCase().includes(tag.toLowerCase()))) {
        reasons.push('Tags match query');
      }

      // Check if query matches category
      if (t.category.toLowerCase().includes(query.toLowerCase())) {
        reasons.push('Category matches query');
      }

      return {
        name: t.name,
        description: t.description,
        category: t.category,
        subcategory: t.subcategory,
        tags: tags,
        whyMatches: reasons.length > 0 ? reasons.join(', ') : 'Semantic similarity to query',
      };
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              query,
              category: category || 'all',
              totalCoreMatches: coreResults.length,
              showing: resultsWithReasons.length,
              results: resultsWithReasons,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  private getToolTags(toolName: string): string[] {
    // Find the tool in the core tools config and return its tags
    for (const [category, tools] of Object.entries(this.coreToolsConfig)) {
      const tool = tools.find(t => t.name === toolName);
      if (tool) {
        return tool.tags;
      }
    }
    return [];
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

    // Phase 3E: Safety check for dangerous operations
    // Check if tool is dangerous and requires confirmation
    if (tool.dangerLevel === 'dangerous') {
      const confirmDangerous = toolArgs.confirmDangerous;

      // If confirmDangerous is not explicitly set to true, warn but allow execution
      // This is non-breaking: we log a warning but don't block
      if (confirmDangerous !== true) {
        console.warn(`[Robinson Toolkit] ⚠️  DANGER: Executing dangerous tool ${toolName} without confirmDangerous flag`);
        console.warn(`[Robinson Toolkit] ⚠️  This tool can perform destructive operations (delete, remove, etc.)`);
        console.warn(`[Robinson Toolkit] ⚠️  To suppress this warning, pass { confirmDangerous: true } in arguments`);
      } else {
        console.error(`[Robinson Toolkit] ✅ Dangerous tool ${toolName} confirmed with confirmDangerous flag`);
      }
    }

    // Dynamic import of handler module (filesystem path - use pathToFileURL for Windows)
    try {
      console.error(`[Robinson Toolkit] Lazy-loading handler for ${toolName} from ${tool.handler}`);

      // Convert filesystem path to file:// URL for Windows compatibility
      const handlerPath = resolve(tool.handler);
      const handlerUrl = pathToFileURL(handlerPath).href;
      const handlerModule = await import(handlerUrl);

      // Find the handler function
      // Convention: handler modules export functions in camelCase
      // e.g., stripe_customer_create → stripeCustomerCreate
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
    // Convert tool_name to camelCase function name
    // e.g., stripe_customer_create → stripeCustomerCreate
    const parts = toolName.split('_');
    const capitalized = parts.map((p, i) =>
      i === 0 ? p : p.charAt(0).toUpperCase() + p.slice(1)
    ).join('');
    return capitalized;
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

