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
  subcategory?: string; // Optional subcategory for organization (e.g., "gmail", "drive" for Google)
}

export interface CategoryInfo {
  name: string;
  displayName: string;
  description: string;
  toolCount: number;
  enabled: boolean;
  subcategories?: string[]; // List of subcategories within this category
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
  searchTools(query: string, limit: number = 10): Array<{ category: string; tool: ToolSchema; score: number; matched: string[] }> {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      return [];
    }

    const terms = Array.from(new Set(trimmed.split(/\s+/).filter(Boolean)));
    if (terms.length === 0) {
      return [];
    }

    const results: Array<{ category: string; tool: ToolSchema; score: number; matched: string[] }> = [];

    const normalise = (value: string | undefined): string => {
      if (!value) return '';
      return value
        .toLowerCase()
        .replace(/[_-]+/g, ' ')
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ') // collapse whitespace for reliable includes()
        .trim();
    };

    const collectSchemaHints = (tool: ToolSchema): string => {
      const props = tool.inputSchema?.properties ?? {};
      const keys = Object.keys(props);
      if (keys.length === 0) {
        return '';
      }
      const descriptions = keys
        .map((key) => {
          const prop = props[key];
          const desc = typeof prop?.description === 'string' ? prop.description : '';
          const enumValues = Array.isArray(prop?.enum) ? prop.enum.join(' ') : '';
          return `${key} ${desc} ${enumValues}`;
        })
        .join(' ');
      return descriptions;
    };

    for (const [category, tools] of this.toolsByCategory.entries()) {
      for (const tool of tools.values()) {
        const haystacks: Record<string, string> = {
          name: normalise(tool.name),
          description: normalise(tool.description),
          schema: normalise(collectSchemaHints(tool)),
          category,
        };

        const matchedFields = new Set<string>();
        let score = 0;

        for (const term of terms) {
          for (const [field, text] of Object.entries(haystacks)) {
            if (!text) continue;
            if (text.includes(term)) {
              score += 1;
              matchedFields.add(field);
              break; // Avoid double counting this term on other fields
            }
          }
        }

        if (score > 0) {
          results.push({ category, tool, score, matched: Array.from(matchedFields) });
        }
      }
    }

    results.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.category !== b.category) return a.category.localeCompare(b.category);
      return a.tool.name.localeCompare(b.tool.name);
    });

    return results.slice(0, limit);
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
        // Auto-detect subcategory for Google Workspace tools
        if (category === 'google' && !tool.subcategory) {
          const subcategory = this.extractSubcategory(tool.name);
          if (subcategory) {
            tool.subcategory = subcategory;
          }
        }
        this.registerTool(category, tool);
      }
    }

    // Update category tool counts and subcategories after registration
    for (const [categoryName, categoryInfo] of this.categories.entries()) {
      const tools = this.toolsByCategory.get(categoryName);
      categoryInfo.toolCount = tools ? tools.size : 0;
    }

    // Update subcategory metadata
    this.updateCategorySubcategories();
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

  /**
   * Extract subcategory from tool name (for Google Workspace tools)
   * Examples: gmail_send_message -> "gmail", drive_create_file -> "drive"
   */
  extractSubcategory(toolName: string): string | null {
    const googlePrefixes = [
      'gmail_', 'drive_', 'calendar_', 'sheets_', 'docs_', 'slides_',
      'tasks_', 'people_', 'forms_', 'classroom_', 'chat_', 'admin_',
      'reports_', 'licensing_'
    ];

    for (const prefix of googlePrefixes) {
      if (toolName.startsWith(prefix)) {
        return prefix.slice(0, -1); // Remove trailing underscore
      }
    }

    return null;
  }

  /**
   * Get all subcategories for a category
   */
  getSubcategories(category: string): string[] {
    const tools = this.toolsByCategory.get(category);
    if (!tools) return [];

    const subcategories = new Set<string>();
    for (const tool of tools.values()) {
      if (tool.subcategory) {
        subcategories.add(tool.subcategory);
      }
    }

    return Array.from(subcategories).sort();
  }

  /**
   * List tools in a category filtered by subcategory
   */
  listToolsInSubcategory(category: string, subcategory: string): Array<{ name: string; description: string }> {
    const tools = this.toolsByCategory.get(category);
    if (!tools) return [];

    return Array.from(tools.values())
      .filter(tool => tool.subcategory === subcategory)
      .map(tool => ({
        name: tool.name,
        description: tool.description,
      }));
  }

  /**
   * Update category metadata with subcategories
   */
  updateCategorySubcategories(): void {
    for (const [categoryName, categoryInfo] of this.categories.entries()) {
      const subcategories = this.getSubcategories(categoryName);
      if (subcategories.length > 0) {
        categoryInfo.subcategories = subcategories;
      }
    }
  }
}

