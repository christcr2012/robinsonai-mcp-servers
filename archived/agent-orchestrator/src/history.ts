/**
 * Execution History Tracking
 * 
 * Tracks all task executions for learning and improvement.
 * Stores in SQLite database for persistence.
 */

import Database from 'better-sqlite3';
import { join } from 'path';
import { mkdirSync, existsSync } from 'fs';

const DATA_DIR = join(process.cwd(), 'packages', 'agent-orchestrator', 'data');
mkdirSync(DATA_DIR, { recursive: true });
const DB_PATH = join(DATA_DIR, 'execution-history.db');

const db = new Database(DB_PATH);

// Create executions table
db.exec(`
  CREATE TABLE IF NOT EXISTS executions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task TEXT NOT NULL,
    plan_json TEXT NOT NULL,
    results_json TEXT NOT NULL,
    success INTEGER NOT NULL,
    duration_ms INTEGER NOT NULL,
    cost_usd REAL NOT NULL,
    errors_json TEXT,
    timestamp INTEGER NOT NULL,
    worker_used TEXT,
    retries INTEGER DEFAULT 0,
    cached_steps INTEGER DEFAULT 0
  )
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_executions_timestamp 
  ON executions(timestamp)
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_executions_success 
  ON executions(success)
`);

const insertExecution = db.prepare(`
  INSERT INTO executions (
    task, plan_json, results_json, success, duration_ms, cost_usd, 
    errors_json, timestamp, worker_used, retries, cached_steps
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const getRecentExecutions = db.prepare(`
  SELECT * FROM executions 
  ORDER BY timestamp DESC 
  LIMIT ?
`);

const getSuccessRate = db.prepare(`
  SELECT 
    COUNT(*) as total,
    SUM(success) as successful,
    AVG(duration_ms) as avg_duration,
    AVG(cost_usd) as avg_cost
  FROM executions
  WHERE timestamp > ?
`);

const getSimilarExecutions = db.prepare(`
  SELECT * FROM executions
  WHERE task LIKE ?
  ORDER BY timestamp DESC
  LIMIT 10
`);

export interface ExecutionRecord {
  task: string;
  plan: any;
  results: any[];
  success: boolean;
  duration: number;
  cost: number;
  errors: string[];
  timestamp: number;
  workerUsed?: string;
  retries?: number;
  cachedSteps?: number;
}

export interface ExecutionStats {
  total: number;
  successful: number;
  successRate: number;
  avgDuration: number;
  avgCost: number;
}

/**
 * Record a task execution
 */
export function recordExecution(record: ExecutionRecord): void {
  try {
    insertExecution.run(
      record.task,
      JSON.stringify(record.plan),
      JSON.stringify(record.results),
      record.success ? 1 : 0,
      record.duration,
      record.cost,
      JSON.stringify(record.errors),
      record.timestamp,
      record.workerUsed || 'unknown',
      record.retries || 0,
      record.cachedSteps || 0
    );
    
    console.log(`[History] Recorded execution: ${record.success ? '✅' : '❌'} ${record.task.substring(0, 50)}...`);
  } catch (e) {
    console.error('[History] Failed to record execution:', e);
  }
}

/**
 * Get recent executions
 */
export function getRecentHistory(limit: number = 10): any[] {
  try {
    return getRecentExecutions.all(limit);
  } catch (e) {
    console.error('[History] Failed to get recent history:', e);
    return [];
  }
}

/**
 * Get success rate and stats for a time period
 */
export function getStats(sinceTimestamp: number = Date.now() - 7 * 24 * 60 * 60 * 1000): ExecutionStats {
  try {
    const row: any = getSuccessRate.get(sinceTimestamp);
    
    return {
      total: row.total || 0,
      successful: row.successful || 0,
      successRate: row.total > 0 ? (row.successful / row.total) * 100 : 0,
      avgDuration: row.avg_duration || 0,
      avgCost: row.avg_cost || 0
    };
  } catch (e) {
    console.error('[History] Failed to get stats:', e);
    return {
      total: 0,
      successful: 0,
      successRate: 0,
      avgDuration: 0,
      avgCost: 0
    };
  }
}

/**
 * Find similar past executions to learn from
 */
export function findSimilarExecutions(task: string): any[] {
  try {
    // Extract keywords from task
    const keywords = task.toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 3)
      .slice(0, 3)
      .join('%');
    
    return getSimilarExecutions.all(`%${keywords}%`);
  } catch (e) {
    console.error('[History] Failed to find similar executions:', e);
    return [];
  }
}

/**
 * Get insights from execution history
 */
export function getInsights(): {
  mostSuccessfulPatterns: string[];
  commonFailures: string[];
  avgRetries: number;
  cacheHitRate: number;
} {
  try {
    const recent = getRecentHistory(100);
    
    // Find most successful patterns
    const successfulTasks = recent
      .filter((r: any) => r.success === 1)
      .map((r: any) => r.task);
    
    const failedTasks = recent
      .filter((r: any) => r.success === 0)
      .map((r: any) => r.task);
    
    // Calculate average retries
    const avgRetries = recent.reduce((sum: number, r: any) => sum + (r.retries || 0), 0) / recent.length;
    
    // Calculate cache hit rate
    const totalSteps = recent.reduce((sum: number, r: any) => {
      const plan = JSON.parse(r.plan_json);
      return sum + (plan.steps?.length || 0);
    }, 0);
    
    const cachedSteps = recent.reduce((sum: number, r: any) => sum + (r.cached_steps || 0), 0);
    const cacheHitRate = totalSteps > 0 ? (cachedSteps / totalSteps) * 100 : 0;
    
    return {
      mostSuccessfulPatterns: successfulTasks.slice(0, 5),
      commonFailures: failedTasks.slice(0, 5),
      avgRetries,
      cacheHitRate
    };
  } catch (e) {
    console.error('[History] Failed to get insights:', e);
    return {
      mostSuccessfulPatterns: [],
      commonFailures: [],
      avgRetries: 0,
      cacheHitRate: 0
    };
  }
}

/**
 * Export history to JSON
 */
export function exportHistory(sinceTimestamp: number = 0): string {
  try {
    const executions = db.prepare(`
      SELECT * FROM executions 
      WHERE timestamp > ?
      ORDER BY timestamp DESC
    `).all(sinceTimestamp);
    
    return JSON.stringify(executions, null, 2);
  } catch (e) {
    console.error('[History] Failed to export history:', e);
    return '[]';
  }
}

