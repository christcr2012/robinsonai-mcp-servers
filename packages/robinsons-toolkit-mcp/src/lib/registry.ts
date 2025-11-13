/**
 * Runtime Registry Loader for Robinson's Toolkit
 * 
 * Loads the generated registry.json and categories.json at runtime.
 * Provides the single source of truth for all tools and categories.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { validateTools } from '../util/sanitizeTool.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// When tsup bundles, this code ends up in dist/index.js, so __dirname is dist/
// Registry files are at dist/registry.json and dist/categories.json
// So DIST_DIR should just be __dirname
const DIST_DIR = __dirname;

export type DangerLevel = 'safe' | 'caution' | 'dangerous';

export interface ToolRecord {
  name: string;
  description?: string;
  inputSchema?: any;
  category: string;
  subcategory?: string;
  handler: string; // Path to handler module (e.g., './stripe-handlers.js')

  // Phase 3B: Enhanced metadata
  tags?: string[]; // e.g., ["read", "write", "github", "repo"]
  dangerLevel?: DangerLevel; // Safety classification

  // Phase 5: Core tool metadata
  isCore?: boolean; // true = part of curated core set for this integration
}

export interface CategoryInfo {
  name: string;
  displayName: string;
  description: string;
  toolCount: number;
  subcategories?: string[];
}

export interface Registry {
  tools: ToolRecord[];
  categories: Record<string, CategoryInfo>;
  toolsByCategory: Map<string, ToolRecord[]>;
  toolsByName: Map<string, ToolRecord>;
}

let cachedRegistry: Registry | null = null;

/**
 * Load the registry from dist/registry.json and dist/categories.json
 * Caches the result for subsequent calls.
 */
export function loadRegistry(): Registry {
  if (cachedRegistry) {
    return cachedRegistry;
  }

  try {
    // Load registry.json
    const registryPath = join(DIST_DIR, 'registry.json');
    const toolsRaw = JSON.parse(readFileSync(registryPath, 'utf8'));

    // Load categories.json
    const categoriesPath = join(DIST_DIR, 'categories.json');
    const categories = JSON.parse(readFileSync(categoriesPath, 'utf8'));
    
    // Validate tools (final guard)
    const tools = validateTools(toolsRaw) as ToolRecord[];
    
    // Build lookup maps
    const toolsByCategory = new Map<string, ToolRecord[]>();
    const toolsByName = new Map<string, ToolRecord>();
    
    for (const tool of tools) {
      // By category
      if (!toolsByCategory.has(tool.category)) {
        toolsByCategory.set(tool.category, []);
      }
      toolsByCategory.get(tool.category)!.push(tool);
      
      // By name
      toolsByName.set(tool.name, tool);
    }
    
    cachedRegistry = {
      tools,
      categories,
      toolsByCategory,
      toolsByName,
    };
    
    return cachedRegistry;
  } catch (error) {
    console.error('Failed to load registry:', error);
    throw new Error(`Registry not found. Run 'npm run build' to generate it.`);
  }
}

/**
 * Get all tools in a category
 */
export function getToolsByCategory(category: string): ToolRecord[] {
  const registry = loadRegistry();
  return registry.toolsByCategory.get(category) || [];
}

/**
 * Get a specific tool by name
 */
export function getToolByName(name: string): ToolRecord | undefined {
  const registry = loadRegistry();
  return registry.toolsByName.get(name);
}

/**
 * Get all categories
 */
export function getCategories(): Record<string, CategoryInfo> {
  const registry = loadRegistry();
  return registry.categories;
}

/**
 * Get all tools (validated and deduplicated)
 */
export function getAllTools(): ToolRecord[] {
  const registry = loadRegistry();
  return registry.tools;
}

/**
 * Search tools by query (fuzzy search across name, description, and tags)
 */
export function searchTools(
  query: string,
  options?: {
    limit?: number;
    categoryId?: string;
    tags?: string[];
    dangerLevel?: DangerLevel;
  }
): ToolRecord[] {
  const registry = loadRegistry();
  const lowerQuery = query.toLowerCase();
  const limit = options?.limit ?? 10;

  const results: Array<{ tool: ToolRecord; score: number }> = [];

  for (const tool of registry.tools) {
    // Filter by category if specified
    if (options?.categoryId && tool.category !== options.categoryId) {
      continue;
    }

    // Filter by danger level if specified
    if (options?.dangerLevel && tool.dangerLevel !== options.dangerLevel) {
      continue;
    }

    // Filter by tags if specified (tool must have ALL specified tags)
    if (options?.tags && options.tags.length > 0) {
      const toolTags = tool.tags || [];
      const hasAllTags = options.tags.every(tag =>
        toolTags.some(t => t.toLowerCase() === tag.toLowerCase())
      );
      if (!hasAllTags) {
        continue;
      }
    }

    let score = 0;

    // Exact name match
    if (tool.name === query) {
      score += 100;
    }
    // Name starts with query
    else if (tool.name.toLowerCase().startsWith(lowerQuery)) {
      score += 75;
    }
    // Name contains query
    else if (tool.name.toLowerCase().includes(lowerQuery)) {
      score += 50;
    }

    // Description contains query
    if (tool.description?.toLowerCase().includes(lowerQuery)) {
      score += 25;
    }

    // Tags contain query
    if (tool.tags) {
      for (const tag of tool.tags) {
        if (tag.toLowerCase() === lowerQuery) {
          score += 40; // Exact tag match
        } else if (tag.toLowerCase().includes(lowerQuery)) {
          score += 20; // Partial tag match
        }
      }
    }

    // Category match
    if (tool.category.toLowerCase().includes(lowerQuery)) {
      score += 10;
    }

    if (score > 0) {
      results.push({ tool, score });
    }
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);

  return results.slice(0, limit).map(r => r.tool);
}

/**
 * Get registry statistics
 */
export function getRegistryStats() {
  const registry = loadRegistry();
  return {
    totalTools: registry.tools.length,
    totalCategories: Object.keys(registry.categories).length,
    categoryCounts: Object.entries(registry.categories).map(([name, info]) => ({
      category: name,
      displayName: info.displayName,
      count: info.toolCount,
    })),
  };
}

