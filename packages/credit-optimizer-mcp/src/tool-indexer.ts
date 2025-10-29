/**
 * Tool Indexer
 *
 * Indexes all tools from Robinson's Toolkit for fast discovery.
 * Now uses the broker pattern to discover actual tools dynamically.
 */

import { DatabaseManager } from './database.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

export interface ToolDefinition {
  name: string;
  server: string;
  category: string;
  description: string;
  keywords: string[];
  useCases: string[];
}

export class ToolIndexer {
  private db: DatabaseManager;
  private toolkitClient: Client | null = null;

  constructor(db: DatabaseManager) {
    this.db = db;
  }

  /**
   * Connect to Robinson's Toolkit MCP server
   */
  private async connectToToolkit(): Promise<void> {
    if (this.toolkitClient) return;

    try {
      const transport = new StdioClientTransport({
        command: 'node',
        args: ['packages/robinsons-toolkit-mcp/dist/index.js'],
      });

      this.toolkitClient = new Client({
        name: 'credit-optimizer-tool-indexer',
        version: '1.0.0',
      }, {
        capabilities: {},
      });

      await this.toolkitClient.connect(transport);
      console.log('✅ Connected to Robinson\'s Toolkit');
    } catch (error) {
      console.error('❌ Failed to connect to Robinson\'s Toolkit:', error);
      throw error;
    }
  }

  /**
   * Index all tools from Robinson's Toolkit using broker pattern
   */
  async indexAllTools(): Promise<void> {
    try {
      await this.connectToToolkit();

      // Get all categories from the broker
      const categoriesResult = await this.toolkitClient!.callTool({
        name: 'toolkit_list_categories',
        arguments: {},
      });

      const content = categoriesResult.content as Array<{ type: string; text: string }>;
      const categories = JSON.parse(content[0].text);
      console.log(`📦 Found ${categories.length} categories`);

      // Index tools from each category
      for (const category of categories) {
        await this.indexCategoryTools(category);
      }

      console.log('✅ Tool indexing complete');
    } catch (error) {
      console.error('❌ Tool indexing failed:', error);
      throw error;
    }
  }

  /**
   * Index all tools from a specific category
   */
  private async indexCategoryTools(category: any): Promise<void> {
    try {
      // Get all tools in this category
      const toolsResult = await this.toolkitClient!.callTool({
        name: 'toolkit_list_tools',
        arguments: { category: category.name },
      });

      const content = toolsResult.content as Array<{ type: string; text: string }>;
      const tools = JSON.parse(content[0].text);
      console.log(`  📋 ${category.displayName}: ${tools.length} tools`);

      // Index each tool
      for (const tool of tools) {
        this.indexTool(tool, category);
      }
    } catch (error) {
      console.error(`❌ Failed to index ${category.displayName} tools:`, error);
    }
  }

  /**
   * Index a single tool
   */
  private indexTool(tool: any, category: any): void {
    // Extract keywords from tool name and description
    const keywords = this.extractKeywords(tool.name, tool.description);

    // Generate use cases based on tool name
    const useCases = this.generateUseCases(tool.name, category.name);

    this.db.indexTool({
      toolName: tool.name,
      serverName: 'robinsons-toolkit-mcp',
      category: category.name,
      description: tool.description,
      keywords,
      useCases,
    });
  }

  /**
   * Extract keywords from tool name and description
   */
  private extractKeywords(name: string, description: string): string[] {
    const keywords = new Set<string>();

    // Extract from name (e.g., "github_create_repo" -> ["github", "create", "repo"])
    const nameParts = name.split('_');
    nameParts.forEach(part => keywords.add(part.toLowerCase()));

    // Extract from description (common action words)
    const actionWords = ['create', 'delete', 'update', 'list', 'get', 'set', 'add', 'remove', 'deploy', 'build', 'run', 'execute', 'query', 'search', 'find'];
    const descLower = description.toLowerCase();
    actionWords.forEach(word => {
      if (descLower.includes(word)) keywords.add(word);
    });

    return Array.from(keywords);
  }

  /**
   * Generate use cases based on tool name
   */
  private generateUseCases(name: string, category: string): string[] {
    const useCases: string[] = [];

    // Generic use case based on category
    useCases.push(`Manage ${category} resources`);

    // Specific use case based on action
    if (name.includes('create')) useCases.push('Create new resources');
    if (name.includes('delete')) useCases.push('Delete resources');
    if (name.includes('update')) useCases.push('Update existing resources');
    if (name.includes('list')) useCases.push('List and discover resources');
    if (name.includes('deploy')) useCases.push('Deploy applications');
    if (name.includes('build')) useCases.push('Build and compile');

    return useCases;
  }

  /**
   * Disconnect from Robinson's Toolkit
   */
  async disconnect(): Promise<void> {
    if (this.toolkitClient) {
      await this.toolkitClient.close();
      this.toolkitClient = null;
      console.log('✅ Disconnected from Robinson\'s Toolkit');
    }
  }

  /**
   * Search for tools
   */
  searchTools(query: string, limit: number = 10): any[] {
    return this.db.searchTools(query, limit);
  }

  /**
   * Get tools by category
   */
  getToolsByCategory(category: string): any[] {
    return this.db.getToolsByCategory(category);
  }

  /**
   * Get tools by server
   */
  getToolsByServer(serverName: string): any[] {
    return this.db.getToolsByServer(serverName);
  }
}

