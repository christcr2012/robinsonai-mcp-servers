/**
 * Database Manager
 * 
 * SQLite database for tool index, cache, and statistics.
 */

import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';

export class DatabaseManager {
  private db: any;

  constructor(dbPath?: string) {
    // Default to user's home directory
    const homeDir = process.env.HOME || process.env.USERPROFILE || '.';
    const dataDir = path.join(homeDir, '.credit-optimizer-mcp');
    
    // Ensure directory exists
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const finalPath = dbPath || path.join(dataDir, 'credit-optimizer.db');
    this.db = new Database(finalPath);
    this.initializeSchema();
  }

  private initializeSchema(): void {
    // Tool Index Table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS tool_index (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tool_name TEXT NOT NULL UNIQUE,
        server_name TEXT NOT NULL,
        category TEXT NOT NULL,
        description TEXT NOT NULL,
        keywords TEXT NOT NULL,
        use_cases TEXT NOT NULL,
        created_at INTEGER NOT NULL
      )
    `);

    // Create indexes for fast search
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_tool_category ON tool_index(category);
      CREATE INDEX IF NOT EXISTS idx_tool_server ON tool_index(server_name);
      CREATE VIRTUAL TABLE IF NOT EXISTS tool_search USING fts5(
        tool_name, description, keywords, use_cases, content=tool_index
      );
    `);

    // Cache Table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS cache (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cache_key TEXT NOT NULL UNIQUE,
        cache_type TEXT NOT NULL,
        data TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        expires_at INTEGER
      )
    `);

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_cache_type ON cache(cache_type);
      CREATE INDEX IF NOT EXISTS idx_cache_expires ON cache(expires_at);
    `);

    // Stats Table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tool_name TEXT NOT NULL,
        credits_used INTEGER NOT NULL,
        credits_saved INTEGER NOT NULL,
        time_ms INTEGER NOT NULL,
        timestamp INTEGER NOT NULL
      )
    `);

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_stats_tool ON stats(tool_name);
      CREATE INDEX IF NOT EXISTS idx_stats_timestamp ON stats(timestamp);
    `);

    // Templates Table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        template_name TEXT NOT NULL UNIQUE,
        template_type TEXT NOT NULL,
        description TEXT NOT NULL,
        content TEXT NOT NULL,
        variables TEXT NOT NULL,
        created_at INTEGER NOT NULL
      )
    `);

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_template_type ON templates(template_type);
    `);
  }

  /**
   * Tool Index Operations
   */
  indexTool(tool: {
    toolName: string;
    serverName: string;
    category: string;
    description: string;
    keywords: string[];
    useCases: string[];
  }): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO tool_index 
      (tool_name, server_name, category, description, keywords, use_cases, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      tool.toolName,
      tool.serverName,
      tool.category,
      tool.description,
      JSON.stringify(tool.keywords),
      JSON.stringify(tool.useCases),
      Date.now()
    );
  }

  searchTools(query: string, limit: number = 10): any[] {
    const stmt = this.db.prepare(`
      SELECT t.* FROM tool_index t
      WHERE t.tool_name LIKE ? 
         OR t.description LIKE ?
         OR t.keywords LIKE ?
         OR t.use_cases LIKE ?
      LIMIT ?
    `);

    const searchPattern = `%${query}%`;
    return stmt.all(searchPattern, searchPattern, searchPattern, searchPattern, limit);
  }

  getToolsByCategory(category: string): any[] {
    const stmt = this.db.prepare(`
      SELECT * FROM tool_index WHERE category = ?
    `);
    return stmt.all(category);
  }

  getToolsByServer(serverName: string): any[] {
    const stmt = this.db.prepare(`
      SELECT * FROM tool_index WHERE server_name = ?
    `);
    return stmt.all(serverName);
  }

  /**
   * Cache Operations
   */
  setCache(key: string, type: string, data: any, ttlMs?: number): void {
    const expiresAt = ttlMs ? Date.now() + ttlMs : null;
    
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO cache (cache_key, cache_type, data, created_at, expires_at)
      VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run(key, type, JSON.stringify(data), Date.now(), expiresAt);
  }

  getCache(key: string): any | null {
    const stmt = this.db.prepare(`
      SELECT * FROM cache WHERE cache_key = ?
    `);

    const row = stmt.get(key) as any;
    
    if (!row) return null;

    // Check expiration
    if (row.expires_at && row.expires_at < Date.now()) {
      this.deleteCache(key);
      return null;
    }

    return JSON.parse(row.data);
  }

  deleteCache(key: string): void {
    const stmt = this.db.prepare(`DELETE FROM cache WHERE cache_key = ?`);
    stmt.run(key);
  }

  clearExpiredCache(): void {
    const stmt = this.db.prepare(`
      DELETE FROM cache WHERE expires_at IS NOT NULL AND expires_at < ?
    `);
    stmt.run(Date.now());
  }

  /**
   * Stats Operations
   */
  recordStats(toolName: string, creditsUsed: number, creditsSaved: number, timeMs: number): void {
    const stmt = this.db.prepare(`
      INSERT INTO stats (tool_name, credits_used, credits_saved, time_ms, timestamp)
      VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run(toolName, creditsUsed, creditsSaved, timeMs, Date.now());
  }

  getStats(period: string = 'all'): any {
    const cutoff = this.getPeriodCutoff(period);

    const stmt = this.db.prepare(`
      SELECT 
        COUNT(*) as total_requests,
        SUM(credits_saved) as total_credits_saved,
        AVG(time_ms) as avg_time_ms,
        tool_name,
        COUNT(*) as count
      FROM stats
      WHERE timestamp >= ?
      GROUP BY tool_name
    `);

    const rows = stmt.all(cutoff);

    const totalRequests = rows.reduce((sum: number, r: any) => sum + r.count, 0);
    const totalCreditsSaved = rows.reduce((sum: number, r: any) => sum + (r.total_credits_saved || 0), 0);

    return {
      totalRequests,
      totalCreditsSaved,
      toolBreakdown: rows,
    };
  }

  private getPeriodCutoff(period: string): number {
    const now = Date.now();
    switch (period) {
      case 'today':
        return now - 24 * 60 * 60 * 1000;
      case 'week':
        return now - 7 * 24 * 60 * 60 * 1000;
      case 'month':
        return now - 30 * 24 * 60 * 60 * 1000;
      case 'all':
      default:
        return 0;
    }
  }

  /**
   * Template Operations
   */
  saveTemplate(template: {
    name: string;
    type: string;
    description: string;
    content: string;
    variables: string[];
  }): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO templates (template_name, template_type, description, content, variables, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      template.name,
      template.type,
      template.description,
      template.content,
      JSON.stringify(template.variables),
      Date.now()
    );
  }

  getTemplate(name: string): any | null {
    const stmt = this.db.prepare(`
      SELECT * FROM templates WHERE template_name = ?
    `);

    const row = stmt.get(name) as any;
    if (!row) return null;

    return {
      name: row.template_name,
      type: row.template_type,
      description: row.description,
      content: row.content,
      variables: JSON.parse(row.variables),
    };
  }

  listTemplates(type?: string): any[] {
    let stmt;
    if (type) {
      stmt = this.db.prepare(`SELECT * FROM templates WHERE template_type = ?`);
      return stmt.all(type);
    } else {
      stmt = this.db.prepare(`SELECT * FROM templates`);
      return stmt.all();
    }
  }

  close(): void {
    this.db.close();
  }
}

