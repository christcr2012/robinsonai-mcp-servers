/**
 * Token Usage Tracker
 * 
 * Tracks token usage and costs for all agent operations.
 * Stores in SQLite for fast local access, syncs insights to Postgres.
 */

import Database from 'better-sqlite3';
import { join } from 'path';
import { homedir } from 'os';
import { mkdirSync, existsSync } from 'fs';

export interface TokenUsage {
  id?: number;
  timestamp: string;
  agent_type: 'code-generator' | 'code-analyzer' | 'refactorer' | 'test-generator' | 'documentation';
  model: string;
  task_type: string;
  tokens_input: number;
  tokens_output: number;
  tokens_total: number;
  cost_usd: number;
  time_ms: number;
  success: boolean;
  error_message?: string;
}

export interface TokenStats {
  total_requests: number;
  total_tokens: number;
  total_cost: number;
  avg_tokens_per_request: number;
  by_agent: { [key: string]: { requests: number; tokens: number; cost: number } };
  by_model: { [key: string]: { requests: number; tokens: number; cost: number } };
  time_period: string;
}

export class TokenTracker {
  private db: Database.Database;
  private dbPath: string;

  constructor() {
    // Store in user's home directory
    const dataDir = join(homedir(), '.robinsonai', 'autonomous-agent');
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true });
    }

    this.dbPath = join(dataDir, 'token-usage.db');
    this.db = new Database(this.dbPath);
    this.initializeDatabase();
  }

  private initializeDatabase(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS token_usage (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        agent_type TEXT NOT NULL,
        model TEXT NOT NULL,
        task_type TEXT NOT NULL,
        tokens_input INTEGER NOT NULL,
        tokens_output INTEGER NOT NULL,
        tokens_total INTEGER NOT NULL,
        cost_usd REAL NOT NULL,
        time_ms INTEGER NOT NULL,
        success INTEGER NOT NULL,
        error_message TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_timestamp ON token_usage(timestamp);
      CREATE INDEX IF NOT EXISTS idx_agent_type ON token_usage(agent_type);
      CREATE INDEX IF NOT EXISTS idx_model ON token_usage(model);
      CREATE INDEX IF NOT EXISTS idx_task_type ON token_usage(task_type);
    `);
  }

  /**
   * Record token usage
   */
  record(usage: TokenUsage): void {
    const stmt = this.db.prepare(`
      INSERT INTO token_usage (
        timestamp, agent_type, model, task_type,
        tokens_input, tokens_output, tokens_total,
        cost_usd, time_ms, success, error_message
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      usage.timestamp,
      usage.agent_type,
      usage.model,
      usage.task_type,
      usage.tokens_input,
      usage.tokens_output,
      usage.tokens_total,
      usage.cost_usd,
      usage.time_ms,
      usage.success ? 1 : 0,
      usage.error_message || null
    );
  }

  /**
   * Get statistics for a time period
   */
  getStats(period: 'today' | 'week' | 'month' | 'all' = 'all'): TokenStats {
    let whereClause = '';
    const now = new Date();

    switch (period) {
      case 'today':
        const today = now.toISOString().split('T')[0];
        whereClause = `WHERE timestamp >= '${today}'`;
        break;
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        whereClause = `WHERE timestamp >= '${weekAgo.toISOString()}'`;
        break;
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        whereClause = `WHERE timestamp >= '${monthAgo.toISOString()}'`;
        break;
    }

    // Overall stats
    const overall = this.db.prepare(`
      SELECT 
        COUNT(*) as total_requests,
        SUM(tokens_total) as total_tokens,
        SUM(cost_usd) as total_cost
      FROM token_usage
      ${whereClause}
    `).get() as any;

    // By agent type
    const byAgent = this.db.prepare(`
      SELECT 
        agent_type,
        COUNT(*) as requests,
        SUM(tokens_total) as tokens,
        SUM(cost_usd) as cost
      FROM token_usage
      ${whereClause}
      GROUP BY agent_type
    `).all() as any[];

    // By model
    const byModel = this.db.prepare(`
      SELECT 
        model,
        COUNT(*) as requests,
        SUM(tokens_total) as tokens,
        SUM(cost_usd) as cost
      FROM token_usage
      ${whereClause}
      GROUP BY model
    `).all() as any[];

    return {
      total_requests: overall.total_requests || 0,
      total_tokens: overall.total_tokens || 0,
      total_cost: overall.total_cost || 0,
      avg_tokens_per_request: overall.total_requests > 0 
        ? Math.round(overall.total_tokens / overall.total_requests)
        : 0,
      by_agent: byAgent.reduce((acc, row) => {
        acc[row.agent_type] = {
          requests: row.requests,
          tokens: row.tokens,
          cost: row.cost
        };
        return acc;
      }, {} as any),
      by_model: byModel.reduce((acc, row) => {
        acc[row.model] = {
          requests: row.requests,
          tokens: row.tokens,
          cost: row.cost
        };
        return acc;
      }, {} as any),
      time_period: period
    };
  }

  /**
   * Get recent usage (last N records)
   */
  getRecent(limit: number = 10): TokenUsage[] {
    const stmt = this.db.prepare(`
      SELECT * FROM token_usage
      ORDER BY timestamp DESC
      LIMIT ?
    `);

    return stmt.all(limit) as TokenUsage[];
  }

  /**
   * Clear old records (keep last N days)
   */
  cleanup(daysToKeep: number = 90): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const stmt = this.db.prepare(`
      DELETE FROM token_usage
      WHERE timestamp < ?
    `);

    const result = stmt.run(cutoffDate.toISOString());
    return result.changes;
  }

  /**
   * Export data for syncing to Postgres
   */
  exportForSync(since?: string): TokenUsage[] {
    let query = 'SELECT * FROM token_usage';
    if (since) {
      query += ` WHERE timestamp > ?`;
      return this.db.prepare(query).all(since) as TokenUsage[];
    }
    return this.db.prepare(query).all() as TokenUsage[];
  }

  /**
   * Get database path (for diagnostics)
   */
  getDatabasePath(): string {
    return this.dbPath;
  }

  /**
   * Close database connection
   */
  close(): void {
    this.db.close();
  }
}

// Singleton instance
let tracker: TokenTracker | null = null;

export function getTokenTracker(): TokenTracker {
  if (!tracker) {
    tracker = new TokenTracker();
  }
  return tracker;
}

