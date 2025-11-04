/**
 * Database Manager
 *
 * Provides portable persistence for the Credit Optimizer server.
 * Prefers `better-sqlite3` when available but automatically falls back
 * to a JSON-backed store when native bindings cannot be loaded.
 */

import * as path from 'path';
import * as fs from 'fs';
import { loadBetterSqlite } from './utils/sqlite.js';

// ---------------------------------------------------------------------------
// Types shared by both backends
// ---------------------------------------------------------------------------

type ToolRecord = {
  tool_name: string;
  server_name: string;
  category: string;
  description: string;
  keywords: string;
  use_cases: string;
  created_at: number;
};

type CacheRecord = {
  cache_key: string;
  cache_type: string;
  data: string;
  created_at: number;
  expires_at: number | null;
};

type StatRecord = {
  tool_name: string;
  credits_used: number;
  credits_saved: number;
  time_ms: number;
  timestamp: number;
};

type TemplateRecord = {
  template_name: string;
  template_type: string;
  description: string;
  content: string;
  variables: string;
  created_at: number;
};

type CostHistoryRecord = {
  task_id: string;
  task_type: string;
  estimated_cost: number;
  actual_cost: number;
  variance: number;
  worker_used: string;
  lines_of_code: number | null;
  num_files: number | null;
  complexity: string | null;
  timestamp: number;
};

type ToolUsageRecord = {
  tool_name: string;
  usage_count: number;
  success_count: number;
  failure_count: number;
  avg_execution_time: number;
  last_used: number;
};

type WorkflowPatternRecord = {
  pattern_name: string;
  pattern_json: string;
  success_rate: number;
  avg_duration: number;
  usage_count: number;
  created_at: number;
};

type LearningMetricRecord = {
  metric_type: string;
  metric_value: number;
  metadata: string | null;
  timestamp: number;
};

type WorkflowResultRecord = {
  result_id: string;
  workflow_name: string | null;
  result_json: string;
  created_at: number;
};

type JsonStore = {
  tool_index: ToolRecord[];
  cache: CacheRecord[];
  stats: StatRecord[];
  templates: TemplateRecord[];
  cost_history: CostHistoryRecord[];
  tool_usage: ToolUsageRecord[];
  workflow_patterns: WorkflowPatternRecord[];
  learning_metrics: LearningMetricRecord[];
  workflow_results: WorkflowResultRecord[];
};

type StorageMode = 'sqlite' | 'json';

// ---------------------------------------------------------------------------
// DatabaseManager implementation
// ---------------------------------------------------------------------------

export class DatabaseManager {
  private mode: StorageMode;
  private db: any = null;
  private storePath: string;
  private store: JsonStore;
  private sqliteError: Error | null = null;

  constructor(dbPath?: string) {
    const homeDir = process.env.HOME || process.env.USERPROFILE || '.';
    const dataDir = path.join(homeDir, '.credit-optimizer-mcp');

    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const finalPath = dbPath || path.join(dataDir, 'credit-optimizer.db');
    this.storePath = finalPath.replace(/\.db$/i, '.json');

    const { Database, error } = loadBetterSqlite();
    if (Database) {
      try {
        this.db = new Database(finalPath);
        if (typeof this.db.pragma === 'function') {
          this.db.pragma('journal_mode = WAL');
        }
        this.mode = 'sqlite';
        this.store = this.createEmptyStore();
        this.initializeSchema();
      } catch (err: any) {
        this.sqliteError = err instanceof Error ? err : new Error(String(err));
        this.mode = 'json';
        this.store = this.loadStore();
        this.logFallback();
      }
    } else {
      this.mode = 'json';
      this.sqliteError = error;
      this.store = this.loadStore();
      this.logFallback();
    }
  }

  get storageMode(): StorageMode {
    return this.mode;
  }

  get lastSqliteError(): Error | null {
    return this.sqliteError;
  }

  private logFallback() {
    if (this.sqliteError) {
      console.error('[CREDIT-OPTIMIZER] better-sqlite3 unavailable, using JSON storage.');
      console.error(`[CREDIT-OPTIMIZER] Reason: ${this.sqliteError.message}`);
    }
  }

  private createEmptyStore(): JsonStore {
    return {
      tool_index: [],
      cache: [],
      stats: [],
      templates: [],
      cost_history: [],
      tool_usage: [],
      workflow_patterns: [],
      learning_metrics: [],
      workflow_results: [],
    };
  }

  private loadStore(): JsonStore {
    if (fs.existsSync(this.storePath)) {
      try {
        const raw = fs.readFileSync(this.storePath, 'utf8');
        const parsed = JSON.parse(raw) as Partial<JsonStore>;
        return {
          ...this.createEmptyStore(),
          ...parsed,
          tool_index: parsed.tool_index ?? [],
          cache: parsed.cache ?? [],
          stats: parsed.stats ?? [],
          templates: parsed.templates ?? [],
          cost_history: parsed.cost_history ?? [],
          tool_usage: parsed.tool_usage ?? [],
          workflow_patterns: parsed.workflow_patterns ?? [],
          learning_metrics: parsed.learning_metrics ?? [],
          workflow_results: parsed.workflow_results ?? [],
        };
      } catch (error) {
        console.error('[CREDIT-OPTIMIZER] Failed to load JSON store:', error);
      }
    }
    return this.createEmptyStore();
  }

  private persistStore(): void {
    fs.writeFileSync(this.storePath, JSON.stringify(this.store, null, 2), 'utf8');
  }

  private initializeSchema(): void {
    if (this.mode !== 'sqlite' || !this.db) return;

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
      );
      CREATE INDEX IF NOT EXISTS idx_tool_category ON tool_index(category);
      CREATE INDEX IF NOT EXISTS idx_tool_server ON tool_index(server_name);
      CREATE VIRTUAL TABLE IF NOT EXISTS tool_search USING fts5(
        tool_name, description, keywords, use_cases, content=tool_index
      );

      CREATE TABLE IF NOT EXISTS cache (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cache_key TEXT NOT NULL UNIQUE,
        cache_type TEXT NOT NULL,
        data TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        expires_at INTEGER
      );
      CREATE INDEX IF NOT EXISTS idx_cache_type ON cache(cache_type);
      CREATE INDEX IF NOT EXISTS idx_cache_expires ON cache(expires_at);

      CREATE TABLE IF NOT EXISTS stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tool_name TEXT NOT NULL,
        credits_used INTEGER NOT NULL,
        credits_saved INTEGER NOT NULL,
        time_ms INTEGER NOT NULL,
        timestamp INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_stats_tool ON stats(tool_name);
      CREATE INDEX IF NOT EXISTS idx_stats_timestamp ON stats(timestamp);

      CREATE TABLE IF NOT EXISTS templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        template_name TEXT NOT NULL UNIQUE,
        template_type TEXT NOT NULL,
        description TEXT NOT NULL,
        content TEXT NOT NULL,
        variables TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_template_type ON templates(template_type);

      CREATE TABLE IF NOT EXISTS cost_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task_id TEXT NOT NULL,
        task_type TEXT NOT NULL,
        estimated_cost REAL NOT NULL,
        actual_cost REAL NOT NULL,
        variance REAL NOT NULL,
        worker_used TEXT NOT NULL,
        lines_of_code INTEGER,
        num_files INTEGER,
        complexity TEXT,
        timestamp INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_cost_task_type ON cost_history(task_type);
      CREATE INDEX IF NOT EXISTS idx_cost_timestamp ON cost_history(timestamp);

      CREATE TABLE IF NOT EXISTS tool_usage (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tool_name TEXT NOT NULL,
        usage_count INTEGER DEFAULT 0,
        success_count INTEGER DEFAULT 0,
        failure_count INTEGER DEFAULT 0,
        avg_execution_time REAL,
        last_used INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_tool_usage_name ON tool_usage(tool_name);

      CREATE TABLE IF NOT EXISTS workflow_patterns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pattern_name TEXT NOT NULL,
        pattern_json TEXT NOT NULL,
        success_rate REAL,
        avg_duration REAL,
        usage_count INTEGER DEFAULT 0,
        created_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_workflow_pattern_name ON workflow_patterns(pattern_name);

      CREATE TABLE IF NOT EXISTS learning_metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        metric_type TEXT NOT NULL,
        metric_value REAL NOT NULL,
        metadata TEXT,
        timestamp INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_learning_metric_type ON learning_metrics(metric_type);
      CREATE INDEX IF NOT EXISTS idx_learning_timestamp ON learning_metrics(timestamp);

      CREATE TABLE IF NOT EXISTS workflow_results (
        result_id TEXT PRIMARY KEY,
        workflow_name TEXT,
        result_json TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_results_created ON workflow_results(created_at);
    `);
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

  private safeVariance(estimated: number, actual: number): number {
    if (!isFinite(estimated) || estimated === 0) {
      return 0;
    }
    return (actual - estimated) / estimated;
  }

  // ---------------------------------------------------------------------------
  // Tool index operations
  // ---------------------------------------------------------------------------

  indexTool(tool: {
    toolName: string;
    serverName: string;
    category: string;
    description: string;
    keywords: string[];
    useCases: string[];
  }): void {
    const now = Date.now();
    if (this.mode === 'sqlite' && this.db) {
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
        now
      );
      return;
    }

    const entry: ToolRecord = {
      tool_name: tool.toolName,
      server_name: tool.serverName,
      category: tool.category,
      description: tool.description,
      keywords: JSON.stringify(tool.keywords),
      use_cases: JSON.stringify(tool.useCases),
      created_at: now,
    };

    const idx = this.store.tool_index.findIndex((r) => r.tool_name === entry.tool_name);
    if (idx >= 0) {
      this.store.tool_index[idx] = entry;
    } else {
      this.store.tool_index.push(entry);
    }
    this.persistStore();
  }

  searchTools(query: string, limit: number = 10): any[] {
    if (this.mode === 'sqlite' && this.db) {
      const stmt = this.db.prepare(`
        SELECT t.* FROM tool_index t
        WHERE t.tool_name LIKE ?
           OR t.description LIKE ?
           OR t.keywords LIKE ?
           OR t.use_cases LIKE ?
        ORDER BY
          CASE
            WHEN t.tool_name LIKE ? THEN 1
            WHEN t.description LIKE ? THEN 2
            ELSE 3
          END
        LIMIT ?
      `);
      const searchPattern = `%${query}%`;
      const jsonSearchPattern = `%"${query}"%`;
      return stmt.all(
        searchPattern,
        searchPattern,
        jsonSearchPattern,
        jsonSearchPattern,
        searchPattern,
        searchPattern,
        limit
      );
    }

    const q = query.toLowerCase();
    const results = this.store.tool_index.filter((tool) => {
      return (
        tool.tool_name.toLowerCase().includes(q) ||
        tool.description.toLowerCase().includes(q) ||
        tool.keywords.toLowerCase().includes(q) ||
        tool.use_cases.toLowerCase().includes(q)
      );
    });

    results.sort((a, b) => {
      const aMatch = a.tool_name.toLowerCase().includes(q)
        ? 1
        : a.description.toLowerCase().includes(q)
        ? 2
        : 3;
      const bMatch = b.tool_name.toLowerCase().includes(q)
        ? 1
        : b.description.toLowerCase().includes(q)
        ? 2
        : 3;
      if (aMatch !== bMatch) return aMatch - bMatch;
      return a.tool_name.localeCompare(b.tool_name);
    });

    return results.slice(0, limit);
  }

  getToolsByCategory(category: string): any[] {
    if (this.mode === 'sqlite' && this.db) {
      const stmt = this.db.prepare(`
        SELECT * FROM tool_index WHERE category = ?
      `);
      return stmt.all(category);
    }
    return this.store.tool_index.filter((tool) => tool.category === category);
  }

  getToolsByServer(serverName: string): any[] {
    if (this.mode === 'sqlite' && this.db) {
      const stmt = this.db.prepare(`
        SELECT * FROM tool_index WHERE server_name = ?
      `);
      return stmt.all(serverName);
    }
    return this.store.tool_index.filter((tool) => tool.server_name === serverName);
  }

  // ---------------------------------------------------------------------------
  // Cache operations
  // ---------------------------------------------------------------------------

  setCache(key: string, type: string, data: any, ttlMs?: number): void {
    const now = Date.now();
    const expiresAt = ttlMs ? now + ttlMs : null;

    if (this.mode === 'sqlite' && this.db) {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO cache (cache_key, cache_type, data, created_at, expires_at)
        VALUES (?, ?, ?, ?, ?)
      `);
      stmt.run(key, type, JSON.stringify(data), now, expiresAt);
      return;
    }

    const payload: CacheRecord = {
      cache_key: key,
      cache_type: type,
      data: JSON.stringify(data),
      created_at: now,
      expires_at: expiresAt,
    };

    const idx = this.store.cache.findIndex((entry) => entry.cache_key === key);
    if (idx >= 0) {
      this.store.cache[idx] = payload;
    } else {
      this.store.cache.push(payload);
    }
    this.persistStore();
  }

  getCache(key: string): any | null {
    if (this.mode === 'sqlite' && this.db) {
      const stmt = this.db.prepare(`
        SELECT * FROM cache WHERE cache_key = ?
      `);
      const row = stmt.get(key) as any;
      if (!row) return null;
      if (row.expires_at && row.expires_at < Date.now()) {
        this.deleteCache(key);
        return null;
      }
      return JSON.parse(row.data);
    }

    const entry = this.store.cache.find((c) => c.cache_key === key);
    if (!entry) return null;
    if (entry.expires_at && entry.expires_at < Date.now()) {
      this.deleteCache(key);
      return null;
    }
    try {
      return JSON.parse(entry.data);
    } catch {
      return null;
    }
  }

  deleteCache(key: string): void {
    if (this.mode === 'sqlite' && this.db) {
      this.db.prepare(`DELETE FROM cache WHERE cache_key = ?`).run(key);
      return;
    }
    this.store.cache = this.store.cache.filter((entry) => entry.cache_key !== key);
    this.persistStore();
  }

  clearExpiredCache(): void {
    if (this.mode === 'sqlite' && this.db) {
      this.db.prepare(`
        DELETE FROM cache WHERE expires_at IS NOT NULL AND expires_at < ?
      `).run(Date.now());
      return;
    }
    const now = Date.now();
    this.store.cache = this.store.cache.filter((entry) => !entry.expires_at || entry.expires_at >= now);
    this.persistStore();
  }

  // ---------------------------------------------------------------------------
  // Stats operations
  // ---------------------------------------------------------------------------

  recordStats(toolName: string, creditsUsed: number, creditsSaved: number, timeMs: number): void {
    const now = Date.now();
    if (this.mode === 'sqlite' && this.db) {
      this.db.prepare(`
        INSERT INTO stats (tool_name, credits_used, credits_saved, time_ms, timestamp)
        VALUES (?, ?, ?, ?, ?)
      `).run(toolName, creditsUsed, creditsSaved, timeMs, now);
      return;
    }

    this.store.stats.push({
      tool_name: toolName,
      credits_used: creditsUsed,
      credits_saved: creditsSaved,
      time_ms: timeMs,
      timestamp: now,
    });
    this.persistStore();
  }

  getStats(period: string = 'all'): any {
    const cutoff = this.getPeriodCutoff(period);
    if (this.mode === 'sqlite' && this.db) {
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

    const filtered = this.store.stats.filter((row) => row.timestamp >= cutoff);
    const grouped = new Map<string, { count: number; totalCreditsSaved: number; totalTime: number }>();
    for (const row of filtered) {
      const bucket = grouped.get(row.tool_name) || { count: 0, totalCreditsSaved: 0, totalTime: 0 };
      bucket.count += 1;
      bucket.totalCreditsSaved += row.credits_saved;
      bucket.totalTime += row.time_ms;
      grouped.set(row.tool_name, bucket);
    }
    const toolBreakdown = Array.from(grouped.entries()).map(([tool, info]) => ({
      tool_name: tool,
      total_requests: info.count,
      count: info.count,
      total_credits_saved: info.totalCreditsSaved,
      avg_time_ms: info.count > 0 ? info.totalTime / info.count : 0,
    }));
    const totalRequests = toolBreakdown.reduce((sum, row) => sum + row.count, 0);
    const totalCreditsSaved = toolBreakdown.reduce((sum, row) => sum + (row.total_credits_saved || 0), 0);
    return {
      totalRequests,
      totalCreditsSaved,
      toolBreakdown,
    };
  }

  // ---------------------------------------------------------------------------
  // Template operations
  // ---------------------------------------------------------------------------

  saveTemplate(template: {
    name: string;
    type: string;
    description: string;
    content: string;
    variables: string[];
  }): void {
    const now = Date.now();
    if (this.mode === 'sqlite' && this.db) {
      this.db.prepare(`
        INSERT OR REPLACE INTO templates (template_name, template_type, description, content, variables, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        template.name,
        template.type,
        template.description,
        template.content,
        JSON.stringify(template.variables),
        now
      );
      return;
    }

    const entry: TemplateRecord = {
      template_name: template.name,
      template_type: template.type,
      description: template.description,
      content: template.content,
      variables: JSON.stringify(template.variables),
      created_at: now,
    };
    const idx = this.store.templates.findIndex((row) => row.template_name === entry.template_name);
    if (idx >= 0) {
      this.store.templates[idx] = entry;
    } else {
      this.store.templates.push(entry);
    }
    this.persistStore();
  }

  getTemplate(name: string): any | null {
    if (this.mode === 'sqlite' && this.db) {
      const row = this.db.prepare(`
        SELECT * FROM templates WHERE template_name = ?
      `).get(name) as any;
      if (!row) return null;
      return {
        name: row.template_name,
        type: row.template_type,
        description: row.description,
        content: row.content,
        variables: JSON.parse(row.variables),
      };
    }

    const row = this.store.templates.find((t) => t.template_name === name);
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
    if (this.mode === 'sqlite' && this.db) {
      if (type) {
        return this.db.prepare(`SELECT * FROM templates WHERE template_type = ?`).all(type);
      }
      return this.db.prepare(`SELECT * FROM templates`).all();
    }
    if (type) {
      return this.store.templates.filter((row) => row.template_type === type);
    }
    return [...this.store.templates];
  }

  // ---------------------------------------------------------------------------
  // Cost history & learning
  // ---------------------------------------------------------------------------

  recordCostHistory(record: {
    taskId: string;
    taskType: string;
    estimatedCost: number;
    actualCost: number;
    workerUsed: string;
    linesOfCode?: number;
    numFiles?: number;
    complexity?: string;
  }): void {
    const variance = this.safeVariance(record.estimatedCost, record.actualCost);
    const now = Date.now();

    if (this.mode === 'sqlite' && this.db) {
      this.db.prepare(`
        INSERT INTO cost_history
        (task_id, task_type, estimated_cost, actual_cost, variance, worker_used, lines_of_code, num_files, complexity, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        record.taskId,
        record.taskType,
        record.estimatedCost,
        record.actualCost,
        variance,
        record.workerUsed,
        record.linesOfCode ?? null,
        record.numFiles ?? null,
        record.complexity ?? null,
        now
      );
      return;
    }

    this.store.cost_history.push({
      task_id: record.taskId,
      task_type: record.taskType,
      estimated_cost: record.estimatedCost,
      actual_cost: record.actualCost,
      variance,
      worker_used: record.workerUsed,
      lines_of_code: record.linesOfCode ?? null,
      num_files: record.numFiles ?? null,
      complexity: record.complexity ?? null,
      timestamp: now,
    });
    this.persistStore();
  }

  getCostHistory(taskType?: string, limit: number = 100): any[] {
    if (this.mode === 'sqlite' && this.db) {
      if (taskType) {
        return this.db.prepare(`
          SELECT * FROM cost_history
          WHERE task_type = ?
          ORDER BY timestamp DESC
          LIMIT ?
        `).all(taskType, limit);
      }
      return this.db.prepare(`
        SELECT * FROM cost_history
        ORDER BY timestamp DESC
        LIMIT ?
      `).all(limit);
    }

    const filtered = taskType
      ? this.store.cost_history.filter((row) => row.task_type === taskType)
      : [...this.store.cost_history];
    filtered.sort((a, b) => b.timestamp - a.timestamp);
    return filtered.slice(0, limit);
  }

  getAverageVariance(taskType: string): number {
    const history = this.getCostHistory(taskType, 100);
    if (history.length === 0) return 0;
    const avg =
      history.reduce((sum: number, row: any) => sum + (row.variance ?? 0), 0) /
      history.length;
    return avg;
  }

  improveEstimate(taskType: string, baseEstimate: number): number {
    const history = this.getCostHistory(taskType, 100);
    if (history.length < 5) {
      return baseEstimate;
    }
    const avgVariance = this.getAverageVariance(taskType);
    const adjusted = baseEstimate * (1 + avgVariance * 0.1);
    return Math.max(0, adjusted);
  }

  recordLearningMetric(metricType: string, metricValue: number, metadata?: any): void {
    const now = Date.now();
    if (this.mode === 'sqlite' && this.db) {
      this.db.prepare(`
        INSERT INTO learning_metrics (metric_type, metric_value, metadata, timestamp)
        VALUES (?, ?, ?, ?)
      `).run(metricType, metricValue, metadata ? JSON.stringify(metadata) : null, now);
      return;
    }

    this.store.learning_metrics.push({
      metric_type: metricType,
      metric_value: metricValue,
      metadata: metadata ? JSON.stringify(metadata) : null,
      timestamp: now,
    });
    this.persistStore();
  }

  getLearningMetrics(metricType?: string, period: string = 'all'): any[] {
    const cutoff = this.getPeriodCutoff(period);
    if (this.mode === 'sqlite' && this.db) {
      if (metricType) {
        return this.db.prepare(`
          SELECT * FROM learning_metrics
          WHERE metric_type = ? AND timestamp >= ?
          ORDER BY timestamp DESC
        `).all(metricType, cutoff);
      }
      return this.db.prepare(`
        SELECT * FROM learning_metrics
        WHERE timestamp >= ?
        ORDER BY timestamp DESC
      `).all(cutoff);
    }

    return this.store.learning_metrics
      .filter((row) => row.timestamp >= cutoff && (!metricType || row.metric_type === metricType))
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  getCostAccuracy(): any {
    if (this.mode === 'sqlite' && this.db) {
      return this.db.prepare(`
        SELECT
          task_type,
          COUNT(*) as sample_count,
          AVG(ABS(variance)) as avg_abs_variance,
          AVG(variance) as avg_variance,
          MIN(variance) as min_variance,
          MAX(variance) as max_variance
        FROM cost_history
        GROUP BY task_type
      `).all();
    }

    const grouped = new Map<string, number[]>();
    for (const row of this.store.cost_history) {
      const arr = grouped.get(row.task_type) || [];
      arr.push(row.variance ?? 0);
      grouped.set(row.task_type, arr);
    }
    return Array.from(grouped.entries()).map(([taskType, values]) => {
      if (values.length === 0) {
        return {
          task_type: taskType,
          sample_count: 0,
          avg_abs_variance: 0,
          avg_variance: 0,
          min_variance: 0,
          max_variance: 0,
        };
      }
      const sum = values.reduce((s, v) => s + v, 0);
      const abs = values.reduce((s, v) => s + Math.abs(v), 0);
      return {
        task_type: taskType,
        sample_count: values.length,
        avg_abs_variance: abs / values.length,
        avg_variance: sum / values.length,
        min_variance: Math.min(...values),
        max_variance: Math.max(...values),
      };
    });
  }

  getCostSavings(period: string = 'all'): any {
    const cutoff = this.getPeriodCutoff(period);
    if (this.mode === 'sqlite' && this.db) {
      const row = this.db.prepare(`
        SELECT
          SUM(CASE WHEN worker_used = 'ollama' THEN actual_cost ELSE 0 END) as ollama_cost,
          SUM(CASE WHEN worker_used = 'openai' THEN actual_cost ELSE 0 END) as openai_cost,
          COUNT(CASE WHEN worker_used = 'ollama' THEN 1 END) as ollama_count,
          COUNT(CASE WHEN worker_used = 'openai' THEN 1 END) as openai_count
        FROM cost_history
        WHERE timestamp >= ?
      `).get(cutoff) as any;
      return {
        ollamaCost: row?.ollama_cost || 0,
        openaiCost: row?.openai_cost || 0,
        ollamaCount: row?.ollama_count || 0,
        openaiCount: row?.openai_count || 0,
        totalSavings: (row?.openai_cost || 0) - (row?.ollama_cost || 0),
      };
    }

    const filtered = this.store.cost_history.filter((row) => row.timestamp >= cutoff);
    let ollamaCost = 0;
    let openaiCost = 0;
    let ollamaCount = 0;
    let openaiCount = 0;
    for (const row of filtered) {
      if (row.worker_used === 'ollama') {
        ollamaCost += row.actual_cost;
        ollamaCount += 1;
      } else if (row.worker_used === 'openai') {
        openaiCost += row.actual_cost;
        openaiCount += 1;
      }
    }
    return {
      ollamaCost,
      openaiCost,
      ollamaCount,
      openaiCount,
      totalSavings: openaiCost - ollamaCost,
    };
  }

  // ---------------------------------------------------------------------------
  // Tool usage analytics
  // ---------------------------------------------------------------------------

  recordToolUsage(toolName: string, success: boolean, executionTimeMs: number): void {
    const now = Date.now();
    if (this.mode === 'sqlite' && this.db) {
      const checkStmt = this.db.prepare(`
        SELECT * FROM tool_usage WHERE tool_name = ?
      `);
      const existing = checkStmt.get(toolName) as any;
      if (existing) {
        const newUsageCount = existing.usage_count + 1;
        const newSuccessCount = existing.success_count + (success ? 1 : 0);
        const newFailureCount = existing.failure_count + (success ? 0 : 1);
        const newAvgTime =
          (existing.avg_execution_time * existing.usage_count + executionTimeMs) / newUsageCount;
        this.db.prepare(`
          UPDATE tool_usage
          SET usage_count = ?,
              success_count = ?,
              failure_count = ?,
              avg_execution_time = ?,
              last_used = ?
          WHERE tool_name = ?
        `).run(newUsageCount, newSuccessCount, newFailureCount, newAvgTime, now, toolName);
      } else {
        this.db.prepare(`
          INSERT INTO tool_usage (tool_name, usage_count, success_count, failure_count, avg_execution_time, last_used)
          VALUES (?, 1, ?, ?, ?, ?)
        `).run(toolName, success ? 1 : 0, success ? 0 : 1, executionTimeMs, now);
      }
      return;
    }

    const existing = this.store.tool_usage.find((row) => row.tool_name === toolName);
    if (existing) {
      const newUsageCount = existing.usage_count + 1;
      const newSuccessCount = existing.success_count + (success ? 1 : 0);
      const newFailureCount = existing.failure_count + (success ? 0 : 1);
      const newAvgTime = (existing.avg_execution_time * existing.usage_count + executionTimeMs) / newUsageCount;
      Object.assign(existing, {
        usage_count: newUsageCount,
        success_count: newSuccessCount,
        failure_count: newFailureCount,
        avg_execution_time: newAvgTime,
        last_used: now,
      });
    } else {
      this.store.tool_usage.push({
        tool_name: toolName,
        usage_count: 1,
        success_count: success ? 1 : 0,
        failure_count: success ? 0 : 1,
        avg_execution_time: executionTimeMs,
        last_used: now,
      });
    }
    this.persistStore();
  }

  getToolUsage(toolName: string): any | null {
    if (this.mode === 'sqlite' && this.db) {
      return this.db.prepare(`SELECT * FROM tool_usage WHERE tool_name = ?`).get(toolName);
    }
    return this.store.tool_usage.find((row) => row.tool_name === toolName) ?? null;
  }

  getTopTools(limit: number = 20): any[] {
    if (this.mode === 'sqlite' && this.db) {
      return this.db.prepare(`
        SELECT * FROM tool_usage
        ORDER BY usage_count DESC, success_count DESC
        LIMIT ?
      `).all(limit);
    }
    return [...this.store.tool_usage]
      .sort((a, b) => {
        if (b.usage_count !== a.usage_count) return b.usage_count - a.usage_count;
        return b.success_count - a.success_count;
      })
      .slice(0, limit);
  }

  // ---------------------------------------------------------------------------
  // Workflow patterns & results
  // ---------------------------------------------------------------------------

  recordWorkflowPattern(pattern: {
    name: string;
    patternJson: any;
    successRate: number;
    avgDuration: number;
  }): void {
    const now = Date.now();
    if (this.mode === 'sqlite' && this.db) {
      const existing = this.db
        .prepare(`SELECT * FROM workflow_patterns WHERE pattern_name = ?`)
        .get(pattern.name) as any;
      if (existing) {
        const newUsageCount = existing.usage_count + 1;
        const newSuccessRate =
          (existing.success_rate * existing.usage_count + pattern.successRate) / newUsageCount;
        const newAvgDuration =
          (existing.avg_duration * existing.usage_count + pattern.avgDuration) / newUsageCount;
        this.db.prepare(`
          UPDATE workflow_patterns
          SET pattern_json = ?,
              success_rate = ?,
              avg_duration = ?,
              usage_count = ?
          WHERE pattern_name = ?
        `).run(
          JSON.stringify(pattern.patternJson),
          newSuccessRate,
          newAvgDuration,
          newUsageCount,
          pattern.name
        );
      } else {
        this.db.prepare(`
          INSERT INTO workflow_patterns (pattern_name, pattern_json, success_rate, avg_duration, usage_count, created_at)
          VALUES (?, ?, ?, ?, 1, ?)
        `).run(
          pattern.name,
          JSON.stringify(pattern.patternJson),
          pattern.successRate,
          pattern.avgDuration,
          now
        );
      }
      return;
    }

    const existing = this.store.workflow_patterns.find((row) => row.pattern_name === pattern.name);
    if (existing) {
      const newUsageCount = existing.usage_count + 1;
      const newSuccessRate = (existing.success_rate * existing.usage_count + pattern.successRate) / newUsageCount;
      const newAvgDuration = (existing.avg_duration * existing.usage_count + pattern.avgDuration) / newUsageCount;
      Object.assign(existing, {
        pattern_json: JSON.stringify(pattern.patternJson),
        success_rate: newSuccessRate,
        avg_duration: newAvgDuration,
        usage_count: newUsageCount,
      });
    } else {
      this.store.workflow_patterns.push({
        pattern_name: pattern.name,
        pattern_json: JSON.stringify(pattern.patternJson),
        success_rate: pattern.successRate,
        avg_duration: pattern.avgDuration,
        usage_count: 1,
        created_at: now,
      });
    }
    this.persistStore();
  }

  getWorkflowPatterns(limit: number = 50): any[] {
    if (this.mode === 'sqlite' && this.db) {
      return this.db.prepare(`
        SELECT * FROM workflow_patterns
        ORDER BY success_rate DESC, usage_count DESC
        LIMIT ?
      `).all(limit);
    }
    return [...this.store.workflow_patterns]
      .sort((a, b) => {
        if (b.success_rate !== a.success_rate) return b.success_rate - a.success_rate;
        return b.usage_count - a.usage_count;
      })
      .slice(0, limit);
  }

  saveWorkflowResult(result: { resultId: string; workflowName?: string; resultJson: string }): void {
    const now = Date.now();
    if (this.mode === 'sqlite' && this.db) {
      this.db.prepare(`
        INSERT OR REPLACE INTO workflow_results(result_id, workflow_name, result_json, created_at)
        VALUES (?, ?, ?, ?)
      `).run(result.resultId, result.workflowName || null, result.resultJson, now);
      return;
    }

    const entry: WorkflowResultRecord = {
      result_id: result.resultId,
      workflow_name: result.workflowName ?? null,
      result_json: result.resultJson,
      created_at: now,
    };
    const idx = this.store.workflow_results.findIndex((row) => row.result_id === entry.result_id);
    if (idx >= 0) {
      this.store.workflow_results[idx] = entry;
    } else {
      this.store.workflow_results.push(entry);
    }
    this.persistStore();
  }

  getWorkflowResult(resultId: string): string | null {
    if (this.mode === 'sqlite' && this.db) {
      const row = this.db.prepare(`SELECT result_json FROM workflow_results WHERE result_id = ?`).get(resultId) as any;
      return row?.result_json ?? null;
    }
    const row = this.store.workflow_results.find((entry) => entry.result_id === resultId);
    return row?.result_json ?? null;
  }

  // ---------------------------------------------------------------------------
  // Cleanup
  // ---------------------------------------------------------------------------

  close(): void {
    if (this.mode === 'sqlite' && this.db && typeof this.db.close === 'function') {
      this.db.close();
    } else {
      this.persistStore();
    }
  }
}
