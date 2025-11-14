// LEGACY: Not used by the current broker architecture (lib/registry.ts + index.ts).
// Kept for historical reference. Safe to delete once confirmed no one depends on it.

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

  // Category metadata configuration - add new categories here
  private static readonly CATEGORY_METADATA: Record<string, Omit<CategoryInfo, 'name' | 'toolCount'>> = {
    github: {
      displayName: 'GitHub',
      description: 'GitHub repository, issue, PR, workflow, and collaboration tools',
      enabled: true,
    },
    vercel: {
      displayName: 'Vercel',
      description: 'Vercel deployment, project, domain, and serverless platform tools',
      enabled: true,
    },
    neon: {
      displayName: 'Neon',
      description: 'Neon serverless Postgres database management tools',
      enabled: true,
    },
    upstash: {
      displayName: 'Upstash Redis',
      description: 'Upstash Redis database operations and management tools',
      enabled: true,
    },
    google: {
      displayName: 'Google Workspace',
      description: 'Gmail, Drive, Calendar, Sheets, Docs, and other Google Workspace tools',
      enabled: true,
    },
    openai: {
      displayName: 'OpenAI',
      description: 'OpenAI API tools for chat, embeddings, images, audio, assistants, fine-tuning, and more',
      enabled: true,
    },
    stripe: {
      displayName: 'Stripe',
      description: 'Stripe payment processing, subscriptions, invoices, and billing tools',
      enabled: true,
    },
    supabase: {
      displayName: 'Supabase',
      description: 'Supabase database, authentication, storage, and edge functions tools',
      enabled: true,
    },
    playwright: {
      displayName: 'Playwright',
      description: 'Playwright browser automation and web scraping tools',
      enabled: true,
    },
    rad: {
      displayName: 'RAD (Repository Agent Database)',
      description: 'RAD source and crawl management tools for document indexing',
      enabled: true,
    },
    twilio: {
      displayName: 'Twilio',
      description: 'Twilio SMS, voice, video, and messaging tools',
      enabled: true,
    },
    resend: {
      displayName: 'Resend',
      description: 'Resend email delivery and management tools',
      enabled: true,
    },
    cloudflare: {
      displayName: 'Cloudflare',
      description: 'Cloudflare DNS, CDN, Workers, and security tools',
      enabled: true,
    },
    postgres: {
      displayName: 'PostgreSQL',
      description: 'PostgreSQL database with pgvector for semantic search and embeddings (Chris\'s Infrastructure)',
      enabled: true,
    },
    neo4j: {
      displayName: 'Neo4j',
      description: 'Neo4j graph database for knowledge graphs and relationship mapping (Chris\'s Infrastructure)',
      enabled: true,
    },
    qdrant: {
      displayName: 'Qdrant',
      description: 'Qdrant vector search engine for semantic similarity and embeddings (Chris\'s Infrastructure)',
      enabled: true,
    },
    n8n: {
      displayName: 'N8N',
      description: 'N8N workflow automation and integration platform (Chris\'s Infrastructure)',
      enabled: true,
    },
  };

  // Google Workspace subcategory prefixes
  private static readonly GOOGLE_WORKSPACE_PREFIXES = [
    'gmail_', 'drive_', 'calendar_', 'sheets_', 'docs_', 'slides_',
    'tasks_', 'people_', 'forms_', 'classroom_', 'chat_', 'admin_',
    'reports_', 'licensing_'
  ];

  constructor() {
    // Categories are now auto-created when tools are registered
  }

  /**
   * Auto-create category if it doesn't exist
   * Uses metadata from CATEGORY_METADATA if available, otherwise generates default metadata
   */
  private ensureCategory(categoryName: string): void {
    if (this.categories.has(categoryName)) return;

    const metadata = ToolRegistry.CATEGORY_METADATA[categoryName];
    if (metadata) {
      // Use predefined metadata
      this.categories.set(categoryName, {
        name: categoryName,
        displayName: metadata.displayName,
        description: metadata.description,
        toolCount: 0,
        enabled: metadata.enabled,
      });
    } else {
      // Generate default metadata for unknown categories
      const displayName = categoryName.charAt(0).toUpperCase() + categoryName.slice(1);
      this.categories.set(categoryName, {
        name: categoryName,
        displayName,
        description: `${displayName} integration tools`,
        toolCount: 0,
        enabled: true,
      });
      console.warn(`[ToolRegistry] Auto-created category '${categoryName}' with default metadata. Consider adding to CATEGORY_METADATA.`);
    }
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
   * DYNAMIC: Automatically creates categories as needed
   */
  bulkRegisterTools(tools: ToolSchema[]): void {
    for (const tool of tools) {
      // Extract category from tool name (e.g., "github_create_repo" -> "github")
      const category = this.extractCategory(tool.name);
      if (category) {
        // Ensure category exists (auto-create if needed)
        this.ensureCategory(category);

        // Auto-detect subcategory for Google Workspace tools
        if (category === 'google' && !tool.subcategory) {
          const subcategory = this.extractSubcategory(tool.name);
          if (subcategory) {
            tool.subcategory = subcategory;
          }
        }
        this.registerTool(category, tool);
      } else {
        console.warn(`[ToolRegistry] Skipping tool '${tool.name}' - could not extract category`);
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
   * DYNAMIC: Automatically detects category from tool name prefix (e.g., "github_create_repo" -> "github")
   * Special handling for Google Workspace tools which use multiple prefixes (gmail_, drive_, etc.)
   */
  private extractCategory(toolName: string): string | null {
    if (!toolName || !toolName.includes('_')) {
      return null; // Invalid tool name format
    }

    // Check if it's a Google Workspace tool (special case with multiple prefixes)
    for (const prefix of ToolRegistry.GOOGLE_WORKSPACE_PREFIXES) {
      if (toolName.startsWith(prefix)) {
        return 'google';
      }
    }

    // Extract category from prefix (everything before first underscore)
    const firstUnderscore = toolName.indexOf('_');
    const category = toolName.substring(0, firstUnderscore);

    // Validate category name (alphanumeric only)
    if (!/^[a-z0-9]+$/.test(category)) {
      console.warn(`[ToolRegistry] Invalid category name extracted from tool '${toolName}': '${category}'`);
      return null;
    }

    return category;
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

