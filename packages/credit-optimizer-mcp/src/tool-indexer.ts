/**
 * Tool Indexer
 *
 * Indexes all tools from Robinson's Toolkit for fast discovery.
 * Uses a static tool index generated at build time (0 network calls, 0 AI credits).
 */

import { DatabaseManager } from './database.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve as pathResolve } from 'path';

type RawToolRecord = {
  tool_name?: string;
  toolName?: string;
  server_name?: string;
  serverName?: string;
  category?: string;
  description?: string;
  keywords?: string | string[];
  use_cases?: string | string[];
  useCases?: string | string[];
  created_at?: number;
  createdAt?: number;
};

export interface ToolDefinition {
  name: string;
  server: string;
  category: string;
  description: string;
  keywords: string[];
  useCases: string[];
  score: number;
  rank: number;
  lastIndexedAt?: string;
}

export class ToolIndexer {
  private db: DatabaseManager;

  constructor(db: DatabaseManager) {
    this.db = db;
  }

  /**
   * Index all tools from static JSON file
   * This is MUCH faster and more reliable than connecting to MCP server
   */
  async indexAllTools(): Promise<void> {
    try {
      // Load static tool index
      const here = dirname(fileURLToPath(import.meta.url));
      const indexPath = pathResolve(here, 'tools-index.json');

      console.log(`📦 Loading tool index from: ${indexPath}`);
      const indexData = readFileSync(indexPath, 'utf-8');
      const toolIndex = JSON.parse(indexData);

      console.log(`📦 Found ${toolIndex.totalTools} tools across ${toolIndex.categories.length} categories`);
      console.log(`📅 Index generated: ${toolIndex.generatedAt}`);

      // Index each tool
      for (const tool of toolIndex.tools) {
        this.db.indexTool({
          toolName: tool.name,
          serverName: tool.server,
          category: tool.category,
          description: tool.description,
          keywords: tool.keywords,
          useCases: tool.useCases,
        });
      }

      console.log('✅ Tool indexing complete');
      console.log('');
      console.log('Categories:');
      for (const category of toolIndex.categories) {
        console.log(`  - ${category.displayName}: ${category.toolCount} tools`);
      }
    } catch (error) {
      console.error('❌ Tool indexing failed:', error);
      console.error('⚠️  Tool discovery will return empty results until index is available');
      // Swallow to avoid crashing host; searches will simply return empty until next attempt
    }
  }



  /**
   * Search for tools with sophisticated multi-field scoring
   */
  searchTools(query: string, limit: number = 10): ToolDefinition[] {
    const normalizedQuery = (query ?? '').toString().trim();
    if (!normalizedQuery) {
      return [];
    }

    const raw = this.db.searchTools(normalizedQuery, Math.max(limit * 2, 10)) as RawToolRecord[];
    if (!raw || raw.length === 0) {
      return [];
    }

    const qTokens = this.tokenize(normalizedQuery);

    const scored = raw.map((entry, index) => {
      const name = (entry.tool_name ?? entry.toolName ?? '').toString();
      const server = (entry.server_name ?? entry.serverName ?? '').toString();
      const category = (entry.category ?? '').toString();
      const description = (entry.description ?? '').toString();
      const keywords = this.toStringArray(entry.keywords ?? '[]');
      const useCases = this.toStringArray(entry.use_cases ?? entry.useCases ?? '[]');
      const createdAt = entry.created_at ?? entry.createdAt;

      const haystack = this.tokenize([name, description, ...keywords, ...useCases].join(' '));

      let score = 0;
      for (const token of qTokens) {
        if (!token) continue;
        if (name.toLowerCase().includes(token)) score += 6;
        if (server.toLowerCase().includes(token)) score += 3;
        if (category.toLowerCase().includes(token)) score += 2;
        if (description.toLowerCase().includes(token)) score += 2.5;
        if (keywords.some((kw) => kw.toLowerCase().includes(token))) score += 1.75;
        if (useCases.some((kw) => kw.toLowerCase().includes(token))) score += 1.5;
        if (haystack.filter((w) => w === token).length > 1) {
          score += 0.5;
        }
      }

      // Bonus for early DB matches to stabilise ordering
      score += Math.max(0, 3 - index * 0.25);

      return {
        name,
        server,
        category,
        description,
        keywords,
        useCases,
        score,
        createdAt,
      };
    });

    const maxScore = Math.max(...scored.map((s) => s.score));
    const minScore = Math.min(...scored.map((s) => s.score));
    const scoreRange = Math.max(1e-6, maxScore - minScore);

    const ranked = scored
      .map((entry) => ({
        ...entry,
        score: Number(((entry.score - minScore) / scoreRange).toFixed(4)),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((entry, idx) => ({
        name: entry.name,
        server: entry.server,
        category: entry.category,
        description: entry.description,
        keywords: entry.keywords,
        useCases: entry.useCases,
        score: entry.score,
        rank: idx + 1,
        lastIndexedAt: entry.createdAt ? new Date(entry.createdAt).toISOString() : undefined,
      }));

    return ranked;
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

  private toStringArray(value: string | string[]): string[] {
    if (Array.isArray(value)) {
      return value.map((item) => item.toString());
    }

    if (!value) return [];

    const trimmed = value.toString().trim();
    if (!trimmed) return [];

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => item?.toString?.() ?? '').filter(Boolean);
      }
    } catch (error) {
      // Not JSON, fall back to comma separated parsing
    }

    return trimmed
      .split(/[,\n]/)
      .map((part) => part.trim())
      .filter(Boolean);
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .split(/[^a-z0-9+]+/i)
      .map((token) => token.trim())
      .filter(Boolean);
  }
}

