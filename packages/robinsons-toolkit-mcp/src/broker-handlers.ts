/**
 * Broker Tool Handlers
 * 
 * Implements the 5 broker meta-tools that provide access to all 714 integration tools.
 */

import { ToolRegistry } from './tool-registry.js';

export class BrokerHandlers {
  constructor(private registry: ToolRegistry) {}

  /**
   * toolkit_list_categories
   * List all available integration categories
   */
  async listCategories(): Promise<any> {
    const categories = this.registry.getCategories();
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          categories: categories.map(cat => ({
            name: cat.name,
            displayName: cat.displayName,
            description: cat.description,
            toolCount: cat.toolCount,
            enabled: cat.enabled,
          })),
          totalCategories: categories.length,
          totalTools: this.registry.getTotalToolCount(),
        }, null, 2),
      }],
    };
  }

  /**
   * toolkit_list_tools
   * List all tools in a specific category (without full schemas)
   */
  async listTools(args: { category: string; limit?: number; offset?: number }): Promise<any> {
    const { category, limit = 50, offset = 0 } = args;

    // Validate category
    if (!this.registry.hasCategory(category)) {
      throw new Error(`Unknown category: ${category}. Available categories: github, vercel, neon, upstash, google`);
    }

    const allTools = this.registry.listToolsInCategory(category);
    const paginatedTools = allTools.slice(offset, offset + limit);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          category,
          tools: paginatedTools,
          total: allTools.length,
          limit,
          offset,
          hasMore: offset + limit < allTools.length,
        }, null, 2),
      }],
    };
  }

  /**
   * toolkit_get_tool_schema
   * Get the full schema for a specific tool
   */
  async getToolSchema(args: { category: string; tool_name: string }): Promise<any> {
    const { category, tool_name } = args;

    // Validate category
    if (!this.registry.hasCategory(category)) {
      throw new Error(`Unknown category: ${category}. Available categories: github, vercel, neon, upstash, google`);
    }

    // Get tool schema
    const tool = this.registry.getToolSchema(category, tool_name);
    if (!tool) {
      throw new Error(`Tool not found: ${tool_name} in category ${category}`);
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          category,
          tool: {
            name: tool.name,
            description: tool.description,
            inputSchema: tool.inputSchema,
          },
        }, null, 2),
      }],
    };
  }

  /**
   * toolkit_discover
   * Search for tools by keyword across all categories
   */
  async discover(args: { query: string; limit?: number }): Promise<any> {
    const { query, limit = 10 } = args;

    const results = this.registry.searchTools(query, limit);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          query,
          results: results.map(r => ({
            category: r.category,
            name: r.tool.name,
            description: r.tool.description,
          })),
          total: results.length,
          limit,
        }, null, 2),
      }],
    };
  }

  /**
   * toolkit_call
   * Execute any tool from any category (broker pattern)
   * 
   * This is the main broker tool that runs tools server-side without loading
   * their definitions into context.
   */
  async call(
    args: { category: string; tool_name: string; arguments: any },
    executeToolFn: (toolName: string, toolArgs: any) => Promise<any>
  ): Promise<any> {
    const { category, tool_name, arguments: toolArgs } = args;

    // Validate category
    if (!this.registry.hasCategory(category)) {
      throw new Error(`Unknown category: ${category}. Available categories: github, vercel, neon, upstash, google`);
    }

    // Validate tool exists
    if (!this.registry.hasTool(category, tool_name)) {
      throw new Error(`Tool not found: ${tool_name} in category ${category}`);
    }

    // Execute the tool using the provided execution function
    // This delegates to the existing tool handlers in UnifiedToolkit
    return await executeToolFn(tool_name, toolArgs);
  }
}

