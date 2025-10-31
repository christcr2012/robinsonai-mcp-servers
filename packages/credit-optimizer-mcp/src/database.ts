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

    // Cost History Table (for learning algorithm)
    this.db.exec(`
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
      )
    `);

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_cost_task_type ON cost_history(task_type);
      CREATE INDEX IF NOT EXISTS idx_cost_timestamp ON cost_history(timestamp);
    `);

    // Tool Usage Table (for analytics)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS tool_usage (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tool_name TEXT NOT NULL,
        usage_count INTEGER DEFAULT 0,
        success_count INTEGER DEFAULT 0,
        failure_count INTEGER DEFAULT 0,
        avg_execution_time REAL,
        last_used INTEGER NOT NULL
      )
    `);

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_tool_usage_name ON tool_usage(tool_name);
    `);

    // Workflow Patterns Table (for pattern recognition)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS workflow_patterns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pattern_name TEXT NOT NULL,
        pattern_json TEXT NOT NULL,
        success_rate REAL,
        avg_duration REAL,
        usage_count INTEGER DEFAULT 0,
        created_at INTEGER NOT NULL
      )
    `);

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_workflow_pattern_name ON workflow_patterns(pattern_name);
    `);

    // Learning Metrics Table (for tracking improvement)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS learning_metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        metric_type TEXT NOT NULL,
        metric_value REAL NOT NULL,
        metadata TEXT,
        timestamp INTEGER NOT NULL
      )
    `);

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_learning_metric_type ON learning_metrics(metric_type);
      CREATE INDEX IF NOT EXISTS idx_learning_timestamp ON learning_metrics(timestamp);
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

  /**
   * Cost History Operations (for learning algorithm)
   */
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
    const variance = (record.actualCost - record.estimatedCost) / record.estimatedCost;

    const stmt = this.db.prepare(`
      INSERT INTO cost_history
      (task_id, task_type, estimated_cost, actual_cost, variance, worker_used, lines_of_code, num_files, complexity, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      record.taskId,
      record.taskType,
      record.estimatedCost,
      record.actualCost,
      variance,
      record.workerUsed,
      record.linesOfCode || null,
      record.numFiles || null,
      record.complexity || null,
      Date.now()
    );
  }

  getCostHistory(taskType?: string, limit: number = 100): any[] {
    let stmt;
    if (taskType) {
      stmt = this.db.prepare(`
        SELECT * FROM cost_history
        WHERE task_type = ?
        ORDER BY timestamp DESC
        LIMIT ?
      `);
      return stmt.all(taskType, limit);
    } else {
      stmt = this.db.prepare(`
        SELECT * FROM cost_history
        ORDER BY timestamp DESC
        LIMIT ?
      `);
      return stmt.all(limit);
    }
  }

  getAverageVariance(taskType: string): number {
    const stmt = this.db.prepare(`
      SELECT AVG(variance) as avg_variance
      FROM cost_history
      WHERE task_type = ?
    `);

    const row = stmt.get(taskType) as any;
    return row?.avg_variance || 0;
  }

  /**
   * Learning Algorithm: Improve cost estimates based on historical data
   * Uses 10% learning rate as specified in Phase 0.5 plan
   */
  improveEstimate(taskType: string, baseEstimate: number): number {
    const history = this.getCostHistory(taskType, 100);

    // Need at least 5 samples to start learning
    if (history.length < 5) {
      return baseEstimate;
    }

    // Calculate average variance for this task type
    const avgVariance = this.getAverageVariance(taskType);

    // Apply 10% learning rate (adjust estimate by 10% of historical variance)
    const adjustedEstimate = baseEstimate * (1 + avgVariance * 0.1);

    return Math.max(0, adjustedEstimate); // Never return negative
  }

  /**
   * Tool Usage Operations
   */
  recordToolUsage(toolName: string, success: boolean, executionTimeMs: number): void {
    // Check if tool exists
    const checkStmt = this.db.prepare(`
      SELECT * FROM tool_usage WHERE tool_name = ?
    `);
    const existing = checkStmt.get(toolName) as any;

    if (existing) {
      // Update existing record
      const newUsageCount = existing.usage_count + 1;
      const newSuccessCount = existing.success_count + (success ? 1 : 0);
      const newFailureCount = existing.failure_count + (success ? 0 : 1);
      const newAvgTime = (existing.avg_execution_time * existing.usage_count + executionTimeMs) / newUsageCount;

      const updateStmt = this.db.prepare(`
        UPDATE tool_usage
        SET usage_count = ?,
            success_count = ?,
            failure_count = ?,
            avg_execution_time = ?,
            last_used = ?
        WHERE tool_name = ?
      `);

      updateStmt.run(newUsageCount, newSuccessCount, newFailureCount, newAvgTime, Date.now(), toolName);
    } else {
      // Insert new record
      const insertStmt = this.db.prepare(`
        INSERT INTO tool_usage (tool_name, usage_count, success_count, failure_count, avg_execution_time, last_used)
        VALUES (?, 1, ?, ?, ?, ?)
      `);

      insertStmt.run(toolName, success ? 1 : 0, success ? 0 : 1, executionTimeMs, Date.now());
    }
  }

  getToolUsageStats(toolName?: string): any {
    if (toolName) {
      const stmt = this.db.prepare(`
        SELECT * FROM tool_usage WHERE tool_name = ?
      `);
      return stmt.get(toolName);
    } else {
      const stmt = this.db.prepare(`
        SELECT * FROM tool_usage ORDER BY usage_count DESC
      `);
      return stmt.all();
    }
  }

  /**
   * Workflow Pattern Operations
   */
  recordWorkflowPattern(pattern: {
    name: string;
    patternJson: any;
    successRate: number;
    avgDuration: number;
  }): void {
    const checkStmt = this.db.prepare(`
      SELECT * FROM workflow_patterns WHERE pattern_name = ?
    `);
    const existing = checkStmt.get(pattern.name) as any;

    if (existing) {
      // Update existing pattern
      const newUsageCount = existing.usage_count + 1;
      const newSuccessRate = (existing.success_rate * existing.usage_count + pattern.successRate) / newUsageCount;
      const newAvgDuration = (existing.avg_duration * existing.usage_count + pattern.avgDuration) / newUsageCount;

      const updateStmt = this.db.prepare(`
        UPDATE workflow_patterns
        SET pattern_json = ?,
            success_rate = ?,
            avg_duration = ?,
            usage_count = ?
        WHERE pattern_name = ?
      `);

      updateStmt.run(JSON.stringify(pattern.patternJson), newSuccessRate, newAvgDuration, newUsageCount, pattern.name);
    } else {
      // Insert new pattern
      const insertStmt = this.db.prepare(`
        INSERT INTO workflow_patterns (pattern_name, pattern_json, success_rate, avg_duration, usage_count, created_at)
        VALUES (?, ?, ?, ?, 1, ?)
      `);

      insertStmt.run(pattern.name, JSON.stringify(pattern.patternJson), pattern.successRate, pattern.avgDuration, Date.now());
    }
  }

  getWorkflowPatterns(limit: number = 50): any[] {
    const stmt = this.db.prepare(`
      SELECT * FROM workflow_patterns
      ORDER BY success_rate DESC, usage_count DESC
      LIMIT ?
    `);
    return stmt.all(limit);
  }

  /**
   * Learning Metrics Operations
   */
  recordLearningMetric(metricType: string, metricValue: number, metadata?: any): void {
    const stmt = this.db.prepare(`
      INSERT INTO learning_metrics (metric_type, metric_value, metadata, timestamp)
      VALUES (?, ?, ?, ?)
    `);

    stmt.run(metricType, metricValue, metadata ? JSON.stringify(metadata) : null, Date.now());
  }

  getLearningMetrics(metricType?: string, period: string = 'all'): any[] {
    const cutoff = this.getPeriodCutoff(period);

    if (metricType) {
      const stmt = this.db.prepare(`
        SELECT * FROM learning_metrics
        WHERE metric_type = ? AND timestamp >= ?
        ORDER BY timestamp DESC
      `);
      return stmt.all(metricType, cutoff);
    } else {
      const stmt = this.db.prepare(`
        SELECT * FROM learning_metrics
        WHERE timestamp >= ?
        ORDER BY timestamp DESC
      `);
      return stmt.all(cutoff);
    }
  }

  /**
   * Cost Analytics
   */
  getCostAccuracy(): any {
    const stmt = this.db.prepare(`
      SELECT
        task_type,
        COUNT(*) as sample_count,
        AVG(ABS(variance)) as avg_abs_variance,
        AVG(variance) as avg_variance,
        MIN(variance) as min_variance,
        MAX(variance) as max_variance
      FROM cost_history
      GROUP BY task_type
    `);

    return stmt.all();
  }

  getCostSavings(period: string = 'all'): any {
    const cutoff = this.getPeriodCutoff(period);

    const stmt = this.db.prepare(`
      SELECT
        SUM(CASE WHEN worker_used = 'ollama' THEN actual_cost ELSE 0 END) as ollama_cost,
        SUM(CASE WHEN worker_used = 'openai' THEN actual_cost ELSE 0 END) as openai_cost,
        COUNT(CASE WHEN worker_used = 'ollama' THEN 1 END) as ollama_count,
        COUNT(CASE WHEN worker_used = 'openai' THEN 1 END) as openai_count
      FROM cost_history
      WHERE timestamp >= ?
    `);

    const row = stmt.get(cutoff) as any;

    return {
      ollamaCost: row?.ollama_cost || 0,
      openaiCost: row?.openai_cost || 0,
      ollamaCount: row?.ollama_count || 0,
      openaiCount: row?.openai_count || 0,
      totalSavings: (row?.openai_cost || 0) - (row?.ollama_cost || 0),
    };
  }

  close(): void {
    this.db.close();
  }
}

