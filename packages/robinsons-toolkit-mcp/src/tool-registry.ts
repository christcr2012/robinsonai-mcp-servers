/**
 * Tool Registry for Robinson's Toolkit Broker Pattern
 * 
 * Maps all 714 tools by category and name for fast lookup.
 * Enables discovery and execution without loading all tool definitions into context.
 */

export interface ToolSchema {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties?: Record<string, any>;
    required?: string[];
  };
}

export interface CategoryInfo {
  name: string;
  displayName: string;
  description: string;
  toolCount: number;
  enabled: boolean;
}

export class ToolRegistry {
  private toolsByCategory: Map<string, Map<string, ToolSchema>> = new Map();
  private categories: Map<string, CategoryInfo> = new Map();

  constructor() {
    this.initializeCategories();
  }

  /**
   * Initialize category metadata
   * ACTUAL COUNTS: GitHub 241, Vercel 150, Neon 166, Upstash 157, Google 192 = 906 total tools
   */
  private initializeCategories(): void {
    this.categories.set('github', {
      name: 'github',
      displayName: 'GitHub',
      description: 'GitHub repository, issue, PR, workflow, and collaboration tools',
      toolCount: 0, // Will be updated after registration
      enabled: true,
    });

    this.categories.set('vercel', {
      name: 'vercel',
      displayName: 'Vercel',
      description: 'Vercel deployment, project, domain, and serverless platform tools',
      toolCount: 0, // Will be updated after registration
      enabled: true,
    });

    this.categories.set('neon', {
      name: 'neon',
      displayName: 'Neon',
      description: 'Neon serverless Postgres database management tools',
      toolCount: 0, // Will be updated after registration
      enabled: true,
    });

    this.categories.set('upstash', {
      name: 'upstash',
      displayName: 'Upstash Redis',
      description: 'Upstash Redis database operations and management tools',
      toolCount: 0, // Will be updated after registration
      enabled: true,
    });

    this.categories.set('google', {
      name: 'google',
      displayName: 'Google Workspace',
      description: 'Gmail, Drive, Calendar, Sheets, Docs, and other Google Workspace tools',
      toolCount: 0, // Will be updated after registration
      enabled: true,
    });

    this.categories.set('openai', {
      name: 'openai',
      displayName: 'OpenAI',
      description: 'OpenAI API tools for chat, embeddings, images, audio, assistants, fine-tuning, and more',
      toolCount: 0, // Will be updated after registration
      enabled: true,
    });
  }

  /**
   * Register a tool in the registry
   */
  registerTool(category: string, tool: ToolSchema): void {
    if (!this.toolsByCategory.has(category)) {
      this.toolsByCategory.set(category, new Map());
    }
    this.toolsByCategory.get(category)!.set(tool.name, tool);
  }

  /**
   * Get all categories
   */
  getCategories(): CategoryInfo[] {
    return Array.from(this.categories.values());
  }

  /**
   * Get category info
   */
  getCategory(name: string): CategoryInfo | undefined {
    return this.categories.get(name);
  }

  /**
   * List all tools in a category (without full schemas)
   */
  listToolsInCategory(category: string): Array<{ name: string; description: string }> {
    const tools = this.toolsByCategory.get(category);
    if (!tools) return [];

    return Array.from(tools.values()).map(tool => ({
      name: tool.name,
      description: tool.description,
    }));
  }

  /**
   * Get full tool schema
   */
  getToolSchema(category: string, toolName: string): ToolSchema | undefined {
    const tools = this.toolsByCategory.get(category);
    if (!tools) return undefined;
    return tools.get(toolName);
  }

  /**
   * Search for tools by keyword
   */
  searchTools(query: string, limit: number = 10): Array<{ category: string; tool: ToolSchema }> {
    const results: Array<{ category: string; tool: ToolSchema }> = [];
    const lowerQuery = query.toLowerCase();

    for (const [category, tools] of this.toolsByCategory.entries()) {
      for (const tool of tools.values()) {
        if (
          tool.name.toLowerCase().includes(lowerQuery) ||
          tool.description.toLowerCase().includes(lowerQuery)
        ) {
          results.push({ category, tool });
          if (results.length >= limit) return results;
        }
      }
    }

    return results;
  }

  /**
   * Get tool by full name (category_toolname)
   */
  getToolByFullName(fullName: string): { category: string; tool: ToolSchema } | undefined {
    // Parse full name (e.g., "github_create_repo" -> category: "github", name: "create_repo")
    const parts = fullName.split('_');
    if (parts.length < 2) return undefined;

    const category = parts[0];
    const toolName = fullName; // Keep full name as-is

    const tool = this.getToolSchema(category, toolName);
    if (!tool) return undefined;

    return { category, tool };
  }

  /**
   * Get total tool count
   */
  getTotalToolCount(): number {
    let total = 0;
    for (const tools of this.toolsByCategory.values()) {
      total += tools.size;
    }
    return total;
  }

  /**
   * Check if category exists
   */
  hasCategory(category: string): boolean {
    return this.categories.has(category);
  }

  /**
   * Check if tool exists
   */
  hasTool(category: string, toolName: string): boolean {
    const tools = this.toolsByCategory.get(category);
    if (!tools) return false;
    return tools.has(toolName);
  }

  /**
   * Bulk register tools from an array
   */
  bulkRegisterTools(tools: ToolSchema[]): void {
    for (const tool of tools) {
      // Extract category from tool name (e.g., "github_create_repo" -> "github")
      const category = this.extractCategory(tool.name);
      if (category) {
        this.registerTool(category, tool);
      }
    }

    // Update category tool counts after registration
    for (const [categoryName, categoryInfo] of this.categories.entries()) {
      const tools = this.toolsByCategory.get(categoryName);
      categoryInfo.toolCount = tools ? tools.size : 0;
    }
  }

  /**
   * Extract category from tool name
   * Handles: github_, vercel_, neon_, upstash_redis_, upstash_, gmail_, drive_, calendar_, etc.
   */
  private extractCategory(toolName: string): string | null {
    // Check prefixes in order (longest first to avoid false matches)
    if (toolName.startsWith('github_')) return 'github';
    if (toolName.startsWith('vercel_')) return 'vercel';
    if (toolName.startsWith('neon_')) return 'neon';
    if (toolName.startsWith('upstash_')) return 'upstash'; // Handles both upstash_redis_ and upstash_
    if (toolName.startsWith('openai_')) return 'openai';

    // Google Workspace tools use various prefixes (gmail_, drive_, calendar_, sheets_, docs_, etc.)
    if (toolName.startsWith('gmail_') ||
        toolName.startsWith('drive_') ||
        toolName.startsWith('calendar_') ||
        toolName.startsWith('sheets_') ||
        toolName.startsWith('docs_') ||
        toolName.startsWith('slides_') ||
        toolName.startsWith('tasks_') ||
        toolName.startsWith('people_') ||
        toolName.startsWith('forms_') ||
        toolName.startsWith('classroom_') ||
        toolName.startsWith('chat_') ||
        toolName.startsWith('admin_') ||
        toolName.startsWith('reports_') ||
        toolName.startsWith('licensing_')) {
      return 'google';
    }

    return null;
  }
}

