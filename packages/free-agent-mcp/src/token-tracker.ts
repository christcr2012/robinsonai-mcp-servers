/**
 * Token Usage Tracker
 *
 * Tracks token usage and costs for all agent operations.
 * Prefers SQLite but falls back to JSON storage when native bindings
 * are unavailable.
 */

import { join } from 'path';
import { homedir } from 'os';
import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'fs';
import { loadBetterSqlite } from './utils/sqlite.js';

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

type StorageMode = 'sqlite' | 'json';

type JsonStore = {
  usage: TokenUsage[];
};

export class TokenTracker {
  private db: any;
  private dbPath: string;
  private mode: StorageMode;
  private storePath: string;
  private store: JsonStore;

  constructor() {
    const dataDir = join(homedir(), '.robinsonai', 'autonomous-agent');
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true });
    }

    this.dbPath = join(dataDir, 'token-usage.db');
    this.storePath = join(dataDir, 'token-usage.json');

    const { Database } = loadBetterSqlite();
    if (Database) {
      try {
        this.db = new Database(this.dbPath);
        if (typeof this.db.pragma === 'function') {
          this.db.pragma('journal_mode = WAL');
        }
        this.mode = 'sqlite';
        this.store = { usage: [] };
        this.initializeDatabase();
        return;
      } catch (error) {
        console.error('[FREE-AGENT] Token tracker SQLite init failed:', error instanceof Error ? error.message : String(error));
      }
    }

    this.mode = 'json';
    this.db = null;
    this.store = this.loadStore();
    console.error('[FREE-AGENT] Token tracker running in JSON mode (better-sqlite3 unavailable).');
  }

  private loadStore(): JsonStore {
    if (existsSync(this.storePath)) {
      try {
        const raw = readFileSync(this.storePath, 'utf8');
        const parsed = JSON.parse(raw) as Partial<JsonStore>;
        return {
          usage: parsed.usage ?? [],
        };
      } catch (error) {
        console.error('[FREE-AGENT] Failed to read token usage store:', error);
      }
    }
    return { usage: [] };
  }

  private persistStore(): void {
    writeFileSync(this.storePath, JSON.stringify(this.store, null, 2), 'utf8');
  }

  private initializeDatabase(): void {
    if (this.mode !== 'sqlite' || !this.db) return;

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
    if (this.mode === 'sqlite' && this.db) {
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
      return;
    }

    const entry: TokenUsage = { ...usage, id: (this.store.usage.at(-1)?.id ?? 0) + 1 };
    this.store.usage.push(entry);
    this.persistStore();
  }

  private filterByPeriod(period: 'today' | 'week' | 'month' | 'all'): TokenUsage[] {
    if (period === 'all') {
      return [...this.store.usage];
    }
    const now = new Date();
    let cutoff: number;
    if (period === 'today') {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      cutoff = today.getTime();
    } else if (period === 'week') {
      cutoff = now.getTime() - 7 * 24 * 60 * 60 * 1000;
    } else {
      cutoff = now.getTime() - 30 * 24 * 60 * 60 * 1000;
    }
    return this.store.usage.filter((entry) => new Date(entry.timestamp).getTime() >= cutoff);
  }

  /**
   * Get statistics for a time period
   */
  getStats(period: 'today' | 'week' | 'month' | 'all' = 'all'): TokenStats {
    if (this.mode === 'sqlite' && this.db) {
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

      const overall = this.db.prepare(`
        SELECT
          COUNT(*) as total_requests,
          SUM(tokens_total) as total_tokens,
          SUM(cost_usd) as total_cost
        FROM token_usage
        ${whereClause}
      `).get() as any;

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
            cost: row.cost,
          };
          return acc;
        }, {} as any),
        by_model: byModel.reduce((acc, row) => {
          acc[row.model] = {
            requests: row.requests,
            tokens: row.tokens,
            cost: row.cost,
          };
          return acc;
        }, {} as any),
        time_period: period,
      };
    }

    const data = this.filterByPeriod(period);
    const total_requests = data.length;
    const total_tokens = data.reduce((sum, row) => sum + row.tokens_total, 0);
    const total_cost = data.reduce((sum, row) => sum + row.cost_usd, 0);

    const by_agent: Record<string, { requests: number; tokens: number; cost: number }> = {};
    const by_model: Record<string, { requests: number; tokens: number; cost: number }> = {};

    for (const row of data) {
      by_agent[row.agent_type] ||= { requests: 0, tokens: 0, cost: 0 };
      by_agent[row.agent_type].requests += 1;
      by_agent[row.agent_type].tokens += row.tokens_total;
      by_agent[row.agent_type].cost += row.cost_usd;

      by_model[row.model] ||= { requests: 0, tokens: 0, cost: 0 };
      by_model[row.model].requests += 1;
      by_model[row.model].tokens += row.tokens_total;
      by_model[row.model].cost += row.cost_usd;
    }

    return {
      total_requests,
      total_tokens,
      total_cost,
      avg_tokens_per_request: total_requests > 0 ? Math.round(total_tokens / total_requests) : 0,
      by_agent,
      by_model,
      time_period: period,
    };
  }

  /**
   * Get recent usage (last N records)
   */
  getRecent(limit: number = 10): TokenUsage[] {
    if (this.mode === 'sqlite' && this.db) {
      const stmt = this.db.prepare(`
        SELECT * FROM token_usage
        ORDER BY timestamp DESC
        LIMIT ?
      `);

      return stmt.all(limit) as TokenUsage[];
    }

    return [...this.store.usage]
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .slice(0, limit);
  }

  clear(): void {
    if (this.mode === 'sqlite' && this.db) {
      this.db.exec('DELETE FROM token_usage');
    } else {
      this.store.usage = [];
      this.persistStore();
    }
  }

  getDatabasePath(): string {
    return this.mode === 'sqlite' ? this.dbPath : this.storePath;
  }
}

let singleton: TokenTracker | null = null;

export function getTokenTracker(): TokenTracker {
  if (!singleton) {
    singleton = new TokenTracker();
  }
  return singleton;
}
