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

