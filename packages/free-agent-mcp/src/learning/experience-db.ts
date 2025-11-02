#!/usr/bin/env node
/**
 * Experience Database - SQLite-based learning memory
 * 
 * Stores:
 * - runs: Every agent execution with reward, cost, duration
 * - signals: Structured quality metrics (lint, type, test, coverage, etc.)
 * - pairs: Anonymized prompt→output pairs for future fine-tuning
 * - web_cache: Cached documentation pages
 * 
 * This enables:
 * - Prompt portfolio bandit (ε-greedy selection)
 * - Model routing (easy→local, hard→API)
 * - Context shaping (learn which retrieval bundles work)
 * - LoRA fine-tuning datasets
 */

import Database from 'better-sqlite3';
import { join } from 'path';
import { mkdirSync } from 'fs';

export interface Run {
  id?: number;
  ts?: string;
  task_slug: string;
  model_name: string;
  prompt_id: string;
  reward: number; // 0..1 composite
  cost_tokens: number;
  duration_ms: number;
}

export interface Signals {
  run_id: number;
  lint_errors: number;
  type_errors: number;
  tests_failed: number;
  coverage_pct: number;
  schema_errors: number;
  boundary_errors: number;
}

export interface Pair {
  id?: number;
  task_slug: string;
  role: 'coder' | 'fixer' | 'judge';
  prompt_json: string; // JSON string of compacted prompt
  output_json: string; // JSON string of candidate or patch
  label: number; // reward or human preference
}

export interface WebCache {
  url: string;
  html: string;
  fetched_at?: string;
}

export class ExperienceDB {
  private db: Database.Database;

  constructor(repoRoot: string) {
    const dbDir = join(repoRoot, '.agent');
    mkdirSync(dbDir, { recursive: true });
    
    const dbPath = join(dbDir, 'experience.db');
    this.db = new Database(dbPath);
    
    this.initSchema();
  }

  private initSchema(): void {
    // Runs table - one row per agent execution
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS runs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ts DATETIME DEFAULT CURRENT_TIMESTAMP,
        task_slug TEXT NOT NULL,
        model_name TEXT NOT NULL,
        prompt_id TEXT NOT NULL,
        reward REAL NOT NULL CHECK(reward >= 0 AND reward <= 1),
        cost_tokens INTEGER NOT NULL,
        duration_ms INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_runs_task_slug ON runs(task_slug);
      CREATE INDEX IF NOT EXISTS idx_runs_model ON runs(model_name);
      CREATE INDEX IF NOT EXISTS idx_runs_prompt ON runs(prompt_id);
    `);

    // Signals table - structured quality metrics
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS signals (
        run_id INTEGER NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
        lint_errors INTEGER NOT NULL DEFAULT 0,
        type_errors INTEGER NOT NULL DEFAULT 0,
        tests_failed INTEGER NOT NULL DEFAULT 0,
        coverage_pct REAL NOT NULL DEFAULT 0,
        schema_errors INTEGER NOT NULL DEFAULT 0,
        boundary_errors INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (run_id)
      );
    `);

    // Pairs table - anonymized datasets for fine-tuning
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS pairs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task_slug TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('coder', 'fixer', 'judge')),
        prompt_json TEXT NOT NULL,
        output_json TEXT NOT NULL,
        label REAL NOT NULL CHECK(label >= 0 AND label <= 1)
      );
      CREATE INDEX IF NOT EXISTS idx_pairs_task_role ON pairs(task_slug, role);
      CREATE INDEX IF NOT EXISTS idx_pairs_label ON pairs(label DESC);
    `);

    // Web cache table - cached documentation pages
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS web_cache (
        url TEXT PRIMARY KEY,
        html TEXT NOT NULL,
        fetched_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }

  // ============================================================================
  // RUNS
  // ============================================================================

  insertRun(run: Run): number {
    const stmt = this.db.prepare(`
      INSERT INTO runs (task_slug, model_name, prompt_id, reward, cost_tokens, duration_ms)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      run.task_slug,
      run.model_name,
      run.prompt_id,
      run.reward,
      run.cost_tokens,
      run.duration_ms
    );
    return result.lastInsertRowid as number;
  }

  getRunsByTaskSlug(taskSlug: string, limit = 10): Run[] {
    const stmt = this.db.prepare(`
      SELECT * FROM runs
      WHERE task_slug = ?
      ORDER BY ts DESC
      LIMIT ?
    `);
    return stmt.all(taskSlug, limit) as Run[];
  }

  getRunsByModel(modelName: string, limit = 10): Run[] {
    const stmt = this.db.prepare(`
      SELECT * FROM runs
      WHERE model_name = ?
      ORDER BY ts DESC
      LIMIT ?
    `);
    return stmt.all(modelName, limit) as Run[];
  }

  getRunsByPrompt(promptId: string, limit = 10): Run[] {
    const stmt = this.db.prepare(`
      SELECT * FROM runs
      WHERE prompt_id = ?
      ORDER BY ts DESC
      LIMIT ?
    `);
    return stmt.all(promptId, limit) as Run[];
  }

  // ============================================================================
  // SIGNALS
  // ============================================================================

  insertSignals(signals: Signals): void {
    const stmt = this.db.prepare(`
      INSERT INTO signals (run_id, lint_errors, type_errors, tests_failed, coverage_pct, schema_errors, boundary_errors)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      signals.run_id,
      signals.lint_errors,
      signals.type_errors,
      signals.tests_failed,
      signals.coverage_pct,
      signals.schema_errors,
      signals.boundary_errors
    );
  }

  getSignals(runId: number): Signals | undefined {
    const stmt = this.db.prepare(`SELECT * FROM signals WHERE run_id = ?`);
    return stmt.get(runId) as Signals | undefined;
  }

  // ============================================================================
  // PAIRS (for fine-tuning)
  // ============================================================================

  insertPair(pair: Pair): number {
    const stmt = this.db.prepare(`
      INSERT INTO pairs (task_slug, role, prompt_json, output_json, label)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      pair.task_slug,
      pair.role,
      pair.prompt_json,
      pair.output_json,
      pair.label
    );
    return result.lastInsertRowid as number;
  }

  getTopPairs(role: 'coder' | 'fixer' | 'judge', limit = 100): Pair[] {
    const stmt = this.db.prepare(`
      SELECT * FROM pairs
      WHERE role = ?
      ORDER BY label DESC
      LIMIT ?
    `);
    return stmt.all(role, limit) as Pair[];
  }

  getPairsByTaskSlug(taskSlug: string, role?: 'coder' | 'fixer' | 'judge', limit = 10): Pair[] {
    if (role) {
      const stmt = this.db.prepare(`
        SELECT * FROM pairs
        WHERE task_slug = ? AND role = ?
        ORDER BY label DESC
        LIMIT ?
      `);
      return stmt.all(taskSlug, role, limit) as Pair[];
    } else {
      const stmt = this.db.prepare(`
        SELECT * FROM pairs
        WHERE task_slug = ?
        ORDER BY label DESC
        LIMIT ?
      `);
      return stmt.all(taskSlug, limit) as Pair[];
    }
  }

  // ============================================================================
  // WEB CACHE
  // ============================================================================

  cacheWebPage(url: string, html: string): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO web_cache (url, html, fetched_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `);
    stmt.run(url, html);
  }

  getCachedWebPage(url: string): WebCache | undefined {
    const stmt = this.db.prepare(`SELECT * FROM web_cache WHERE url = ?`);
    return stmt.get(url) as WebCache | undefined;
  }

  // ============================================================================
  // ANALYTICS
  // ============================================================================

  getAverageRewardByModel(): Array<{ model_name: string; avg_reward: number; count: number }> {
    const stmt = this.db.prepare(`
      SELECT model_name, AVG(reward) as avg_reward, COUNT(*) as count
      FROM runs
      GROUP BY model_name
      ORDER BY avg_reward DESC
    `);
    return stmt.all() as Array<{ model_name: string; avg_reward: number; count: number }>;
  }

  getAverageRewardByPrompt(): Array<{ prompt_id: string; avg_reward: number; count: number }> {
    const stmt = this.db.prepare(`
      SELECT prompt_id, AVG(reward) as avg_reward, COUNT(*) as count
      FROM runs
      GROUP BY prompt_id
      ORDER BY avg_reward DESC
    `);
    return stmt.all() as Array<{ prompt_id: string; avg_reward: number; count: number }>;
  }

  getRecentStats(limit = 100): {
    avgReward: number;
    avgCost: number;
    avgDuration: number;
    totalRuns: number;
  } {
    const stmt = this.db.prepare(`
      SELECT 
        AVG(reward) as avgReward,
        AVG(cost_tokens) as avgCost,
        AVG(duration_ms) as avgDuration,
        COUNT(*) as totalRuns
      FROM runs
      ORDER BY ts DESC
      LIMIT ?
    `);
    const result = stmt.get(limit) as any;
    return {
      avgReward: result.avgReward || 0,
      avgCost: result.avgCost || 0,
      avgDuration: result.avgDuration || 0,
      totalRuns: result.totalRuns || 0,
    };
  }

  close(): void {
    this.db.close();
  }
}

