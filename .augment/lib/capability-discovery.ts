/**
 * Capability Discovery System
 * 
 * Dynamic tool discovery and binding that survives tool evolution.
 * No hardcoded tool names - discovers at runtime and caches per session.
 */

interface ToolCapability {
  name: string;
  description: string;
  category?: string;
  tags?: string[];
  schema: {
    parameters: Record<string, any>;
    required?: string[];
  };
}

interface ToolBinding {
  toolName: string;
  argShape: Record<string, any>;
  lastUsed: number;
  successCount: number;
  failureCount: number;
}

/**
 * Session-scoped capability cache
 * Re-discovers tools per task to pick up changes
 */
class CapabilityDiscovery {
  private toolsByIntent: Map<string, ToolCapability[]> = new Map();
  private bindings: Map<string, ToolBinding> = new Map();
  private sessionId: string;

  constructor(sessionId: string) {
    this.sessionId = sessionId;
  }

  /**
   * Index tools by intent/tags for fast lookup
   */
  async indexTools(mcpServers: string[]): Promise<void> {
    const allTools: ToolCapability[] = [];

    // Discover from all MCP servers
    for (const server of mcpServers) {
      try {
        const tools = await this.listToolsFromServer(server);
        allTools.push(...tools);
      } catch (error) {
        console.warn(`Failed to list tools from ${server}:`, error);
      }
    }

    // Index by tags and keywords
    for (const tool of allTools) {
      const intents = this.extractIntents(tool);
      for (const intent of intents) {
        if (!this.toolsByIntent.has(intent)) {
          this.toolsByIntent.set(intent, []);
        }
        this.toolsByIntent.get(intent)!.push(tool);
      }
    }
  }

  /**
   * Pick best tool for an intent with fallback tags
   */
  pickTool(intent: string, fallbackTags: string[] = []): ToolCapability | null {
    // Try exact intent match
    const exactMatches = this.toolsByIntent.get(intent);
    if (exactMatches && exactMatches.length > 0) {
      return this.selectBestTool(exactMatches);
    }

    // Try fuzzy search
    const fuzzyMatches = this.fuzzySearch(intent);
    if (fuzzyMatches.length > 0) {
      return this.selectBestTool(fuzzyMatches);
    }

    // Try fallback tags
    for (const tag of fallbackTags) {
      const tagMatches = this.toolsByIntent.get(tag);
      if (tagMatches && tagMatches.length > 0) {
        return this.selectBestTool(tagMatches);
      }
    }

    return null;
  }

  /**
   * Probe tool before first use to check for deprecation/changes
   */
  async probeTool(toolName: string, dryRun: boolean = true): Promise<{
    available: boolean;
    deprecated?: boolean;
    movedTo?: string;
    schema?: any;
  }> {
    try {
      // Try calling with minimal/test args
      const result = await this.callTool(toolName, {}, dryRun);
      
      if (result.error) {
        const errorMsg = result.error.toLowerCase();
        if (errorMsg.includes('deprecated')) {
          return { available: false, deprecated: true };
        }
        if (errorMsg.includes('moved') || errorMsg.includes('renamed')) {
          const movedTo = this.extractMovedTo(result.error);
          return { available: false, movedTo };
        }
      }

      return { available: true, schema: result.schema };
    } catch (error) {
      return { available: false };
    }
  }

  /**
   * Cache successful binding for session
   */
  cacheBinding(intent: string, toolName: string, argShape: Record<string, any>): void {
    this.bindings.set(intent, {
      toolName,
      argShape,
      lastUsed: Date.now(),
      successCount: (this.bindings.get(intent)?.successCount || 0) + 1,
      failureCount: 0
    });
  }

  /**
   * Get cached binding if still valid
   */
  getCachedBinding(intent: string): ToolBinding | null {
    const binding = this.bindings.get(intent);
    if (!binding) return null;

    // Cache valid for current session only
    return binding;
  }

  /**
   * Record failure and potentially invalidate binding
   */
  recordFailure(intent: string): void {
    const binding = this.bindings.get(intent);
    if (binding) {
      binding.failureCount++;
      // Invalidate if too many failures
      if (binding.failureCount >= 3) {
        this.bindings.delete(intent);
      }
    }
  }

  // Private helper methods
  private async listToolsFromServer(server: string): Promise<ToolCapability[]> {
    // Implementation would call MCP server's list_tools
    throw new Error('Not implemented - integrate with MCP client');
  }

  private async callTool(toolName: string, args: any, dryRun: boolean): Promise<any> {
    // Implementation would call MCP server's tool
    throw new Error('Not implemented - integrate with MCP client');
  }

  private extractIntents(tool: ToolCapability): string[] {
    const intents: string[] = [];
    
    // Extract from tags
    if (tool.tags) {
      intents.push(...tool.tags);
    }

    // Extract from name (e.g., "github_create_repo" → ["github", "create", "repo"])
    const nameParts = tool.name.split(/[_-]/);
    intents.push(...nameParts);

    // Extract from description keywords
    const keywords = this.extractKeywords(tool.description);
    intents.push(...keywords);

    return [...new Set(intents.map(i => i.toLowerCase()))];
  }

  private extractKeywords(text: string): string[] {
    // Simple keyword extraction - could be enhanced with NLP
    const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for']);
    return text.toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 3 && !commonWords.has(word));
  }

  private fuzzySearch(query: string): ToolCapability[] {
    const matches: Array<{ tool: ToolCapability; score: number }> = [];
    const queryLower = query.toLowerCase();

    for (const [intent, tools] of this.toolsByIntent.entries()) {
      const score = this.calculateSimilarity(queryLower, intent);
      if (score > 0.5) {
        for (const tool of tools) {
          matches.push({ tool, score });
        }
      }
    }

    return matches
      .sort((a, b) => b.score - a.score)
      .map(m => m.tool);
  }

  private calculateSimilarity(a: string, b: string): number {
    // Simple Levenshtein-based similarity
    const longer = a.length > b.length ? a : b;
    const shorter = a.length > b.length ? b : a;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  private levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[b.length][a.length];
  }

  private selectBestTool(tools: ToolCapability[]): ToolCapability {
    // Prefer tools with higher success rate from bindings
    const withScores = tools.map(tool => {
      const binding = Array.from(this.bindings.values())
        .find(b => b.toolName === tool.name);
      const score = binding 
        ? binding.successCount / (binding.successCount + binding.failureCount)
        : 0.5; // neutral score for new tools
      return { tool, score };
    });

    return withScores.sort((a, b) => b.score - a.score)[0].tool;
  }

  private extractMovedTo(errorMessage: string): string | undefined {
    // Extract new tool name from error message
    const match = errorMessage.match(/moved to ([a-z_]+)/i);
    return match?.[1];
  }
}

export { CapabilityDiscovery, type ToolCapability, type ToolBinding };

