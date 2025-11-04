#!/usr/bin/env node
/**
 * Experience Database - portable learning memory
 *
 * Uses better-sqlite3 when available and falls back to a JSON store
 * when native bindings cannot be loaded. The public API remains the same
 * regardless of storage backend.
 */

import { join } from 'path';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'fs';
import { loadBetterSqlite } from '../utils/sqlite.js';

export interface Run {
  id?: number;
  ts?: string;
  task_slug: string;
  model_name: string;
  prompt_id: string;
  reward: number;
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
  prompt_json: string;
  output_json: string;
  label: number;
}

export interface WebCache {
  url: string;
  html: string;
  fetched_at?: string;
}

type JsonStore = {
  runs: Run[];
  signals: Signals[];
  pairs: Pair[];
  web_cache: WebCache[];
};

type StorageMode = 'sqlite' | 'json';

export class ExperienceDB {
  private db: any = null;
  private mode: StorageMode;
  private storePath: string;
  private store: JsonStore;
  private repoRoot: string;
  private sqliteError: Error | null = null;

  constructor(repoRoot: string) {
    this.repoRoot = repoRoot;
    const dbDir = join(repoRoot, '.agent');
    mkdirSync(dbDir, { recursive: true });

    const dbPath = join(dbDir, 'experience.db');
    this.storePath = join(dbDir, 'experience.json');

    const { Database, error } = loadBetterSqlite();
    if (Database) {
      try {
        this.db = new Database(dbPath);
        if (typeof this.db.pragma === 'function') {
          this.db.pragma('journal_mode = WAL');
        }
        this.mode = 'sqlite';
        this.store = { runs: [], signals: [], pairs: [], web_cache: [] };
        this.initSchema();
        return;
      } catch (err: any) {
        this.sqliteError = err instanceof Error ? err : new Error(String(err));
      }
    } else {
      this.sqliteError = error;
    }

    this.mode = 'json';
    if (this.sqliteError) {
      console.error('[FREE-AGENT] Experience DB using JSON store:', this.sqliteError.message);
    }
    this.store = this.loadStore();
  }

  get storageMode(): StorageMode {
    return this.mode;
  }

  private loadStore(): JsonStore {
    if (existsSync(this.storePath)) {
      try {
        const raw = readFileSync(this.storePath, 'utf8');
        const parsed = JSON.parse(raw) as Partial<JsonStore>;
        return {
          runs: parsed.runs ?? [],
          signals: parsed.signals ?? [],
          pairs: parsed.pairs ?? [],
          web_cache: parsed.web_cache ?? [],
        };
      } catch (error) {
        console.error('[FREE-AGENT] Failed to load experience store:', error);
      }
    }
    return { runs: [], signals: [], pairs: [], web_cache: [] };
  }

  private persistStore(): void {
    writeFileSync(this.storePath, JSON.stringify(this.store, null, 2), 'utf8');
  }

  private initSchema(): void {
    if (this.mode !== 'sqlite' || !this.db) return;

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

      CREATE TABLE IF NOT EXISTS web_cache (
        url TEXT PRIMARY KEY,
        html TEXT NOT NULL,
        fetched_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }

  // ---------------------------------------------------------------------------
  // Runs
  // ---------------------------------------------------------------------------

  insertRun(run: Run): number {
    if (this.mode === 'sqlite' && this.db) {
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

    const id = (this.store.runs.at(-1)?.id ?? 0) + 1;
    this.store.runs.push({
      ...run,
      id,
      ts: new Date().toISOString(),
    });
    this.persistStore();
    return id;
  }

  getRunsByTaskSlug(taskSlug: string, limit = 10): Run[] {
    if (this.mode === 'sqlite' && this.db) {
      const stmt = this.db.prepare(`
        SELECT * FROM runs
        WHERE task_slug = ?
        ORDER BY ts DESC
        LIMIT ?
      `);
      return stmt.all(taskSlug, limit) as Run[];
    }
    return this.store.runs
      .filter((run) => run.task_slug === taskSlug)
      .sort((a, b) => (a.ts && b.ts ? b.ts.localeCompare(a.ts) : 0))
      .slice(0, limit);
  }

  getRunsByModel(modelName: string, limit = 10): Run[] {
    if (this.mode === 'sqlite' && this.db) {
      const stmt = this.db.prepare(`
        SELECT * FROM runs
        WHERE model_name = ?
        ORDER BY ts DESC
        LIMIT ?
      `);
      return stmt.all(modelName, limit) as Run[];
    }
    return this.store.runs
      .filter((run) => run.model_name === modelName)
      .sort((a, b) => (a.ts && b.ts ? b.ts.localeCompare(a.ts) : 0))
      .slice(0, limit);
  }

  getRunsByPrompt(promptId: string, limit = 10): Run[] {
    if (this.mode === 'sqlite' && this.db) {
      const stmt = this.db.prepare(`
        SELECT * FROM runs
        WHERE prompt_id = ?
        ORDER BY ts DESC
        LIMIT ?
      `);
      return stmt.all(promptId, limit) as Run[];
    }
    return this.store.runs
      .filter((run) => run.prompt_id === promptId)
      .sort((a, b) => (a.ts && b.ts ? b.ts.localeCompare(a.ts) : 0))
      .slice(0, limit);
  }

  // ---------------------------------------------------------------------------
  // Signals
  // ---------------------------------------------------------------------------

  insertSignals(signals: Signals): void {
    if (this.mode === 'sqlite' && this.db) {
      this.db.prepare(`
        INSERT INTO signals (run_id, lint_errors, type_errors, tests_failed, coverage_pct, schema_errors, boundary_errors)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        signals.run_id,
        signals.lint_errors,
        signals.type_errors,
        signals.tests_failed,
        signals.coverage_pct,
        signals.schema_errors,
        signals.boundary_errors
      );
      return;
    }

    this.store.signals = this.store.signals.filter((row) => row.run_id !== signals.run_id);
    this.store.signals.push({ ...signals });
    this.persistStore();
  }

  getSignals(runId: number): Signals | undefined {
    if (this.mode === 'sqlite' && this.db) {
      const stmt = this.db.prepare(`SELECT * FROM signals WHERE run_id = ?`);
      return stmt.get(runId) as Signals | undefined;
    }
    return this.store.signals.find((row) => row.run_id === runId);
  }

  // ---------------------------------------------------------------------------
  // Pairs
  // ---------------------------------------------------------------------------

  insertPair(pair: Pair): number {
    if (this.mode === 'sqlite' && this.db) {
      const stmt = this.db.prepare(`
        INSERT INTO pairs (task_slug, role, prompt_json, output_json, label)
        VALUES (?, ?, ?, ?, ?)
      `);
      const result = stmt.run(pair.task_slug, pair.role, pair.prompt_json, pair.output_json, pair.label);
      return result.lastInsertRowid as number;
    }

    const id = (this.store.pairs.at(-1)?.id ?? 0) + 1;
    this.store.pairs.push({ ...pair, id });
    this.persistStore();
    return id;
  }

  getTopPairs(role: Pair['role'], limit = 100): Pair[] {
    if (this.mode === 'sqlite' && this.db) {
      return this.db.prepare(`
        SELECT * FROM pairs
        WHERE role = ?
        ORDER BY label DESC
        LIMIT ?
      `).all(role, limit) as Pair[];
    }

    return [...this.store.pairs]
      .filter((row) => row.role === role)
      .sort((a, b) => b.label - a.label)
      .slice(0, limit);
  }

  getPairsByTaskSlug(taskSlug: string, role?: Pair['role'], limit = 25): Pair[] {
    if (this.mode === 'sqlite' && this.db) {
      if (role) {
        return this.db.prepare(`
          SELECT * FROM pairs
          WHERE task_slug = ? AND role = ?
          ORDER BY label DESC
          LIMIT ?
        `).all(taskSlug, role, limit) as Pair[];
      }
      return this.db.prepare(`
        SELECT * FROM pairs
        WHERE task_slug = ?
        ORDER BY label DESC
        LIMIT ?
      `).all(taskSlug, limit) as Pair[];
    }

    return this.store.pairs
      .filter((row) => row.task_slug === taskSlug && (!role || row.role === role))
      .sort((a, b) => b.label - a.label)
      .slice(0, limit);
  }

  getPairsForFineTuning(limit = 1000): Pair[] {
    if (this.mode === 'sqlite' && this.db) {
      return this.db.prepare(`
        SELECT * FROM pairs
        ORDER BY id DESC
        LIMIT ?
      `).all(limit) as Pair[];
    }
    return [...this.store.pairs].slice(-limit).reverse();
  }

  // ---------------------------------------------------------------------------
  // Web cache
  // ---------------------------------------------------------------------------

  upsertWebCache(entry: WebCache): void {
    if (this.mode === 'sqlite' && this.db) {
      this.db.prepare(`
        INSERT INTO web_cache (url, html, fetched_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(url) DO UPDATE SET html = excluded.html, fetched_at = CURRENT_TIMESTAMP
      `).run(entry.url, entry.html);
      return;
    }

    const existingIndex = this.store.web_cache.findIndex((row) => row.url === entry.url);
    const payload: WebCache = {
      ...entry,
      fetched_at: new Date().toISOString(),
    };
    if (existingIndex >= 0) {
      this.store.web_cache[existingIndex] = payload;
    } else {
      this.store.web_cache.push(payload);
    }
    this.persistStore();
  }

  getWebCache(url: string): WebCache | undefined {
    if (this.mode === 'sqlite' && this.db) {
      const stmt = this.db.prepare(`SELECT * FROM web_cache WHERE url = ?`);
      return stmt.get(url) as WebCache | undefined;
    }
    return this.store.web_cache.find((row) => row.url === url);
  }

  listCachedDocs(limit = 50): WebCache[] {
    if (this.mode === 'sqlite' && this.db) {
      return this.db.prepare(`
        SELECT * FROM web_cache
        ORDER BY fetched_at DESC
        LIMIT ?
      `).all(limit) as WebCache[];
    }
    return [...this.store.web_cache]
      .sort((a, b) => (a.fetched_at && b.fetched_at ? b.fetched_at.localeCompare(a.fetched_at) : 0))
      .slice(0, limit);
  }

  cacheWebPage(url: string, html: string): void {
    this.upsertWebCache({ url, html });
  }

  getCachedWebPage(url: string): WebCache | undefined {
    return this.getWebCache(url);
  }

  getAverageRewardByModel(): Array<{ model_name: string; avg_reward: number; count: number }> {
    if (this.mode === 'sqlite' && this.db) {
      return this.db.prepare(`
        SELECT model_name, AVG(reward) as avg_reward, COUNT(*) as count
        FROM runs
        GROUP BY model_name
        ORDER BY avg_reward DESC
      `).all() as Array<{ model_name: string; avg_reward: number; count: number }>;
    }

    const grouped = new Map<string, { total: number; count: number }>();
    for (const run of this.store.runs) {
      const bucket = grouped.get(run.model_name) || { total: 0, count: 0 };
      bucket.total += run.reward;
      bucket.count += 1;
      grouped.set(run.model_name, bucket);
    }
    return Array.from(grouped.entries()).map(([model, info]) => ({
      model_name: model,
      avg_reward: info.count ? info.total / info.count : 0,
      count: info.count,
    })).sort((a, b) => b.avg_reward - a.avg_reward);
  }

  getAverageRewardByPrompt(): Array<{ prompt_id: string; avg_reward: number; count: number }> {
    if (this.mode === 'sqlite' && this.db) {
      return this.db.prepare(`
        SELECT prompt_id, AVG(reward) as avg_reward, COUNT(*) as count
        FROM runs
        GROUP BY prompt_id
        ORDER BY avg_reward DESC
      `).all() as Array<{ prompt_id: string; avg_reward: number; count: number }>;
    }

    const grouped = new Map<string, { total: number; count: number }>();
    for (const run of this.store.runs) {
      const bucket = grouped.get(run.prompt_id) || { total: 0, count: 0 };
      bucket.total += run.reward;
      bucket.count += 1;
      grouped.set(run.prompt_id, bucket);
    }
    return Array.from(grouped.entries()).map(([prompt, info]) => ({
      prompt_id: prompt,
      avg_reward: info.count ? info.total / info.count : 0,
      count: info.count,
    })).sort((a, b) => b.avg_reward - a.avg_reward);
  }

  getRecentStats(limit = 100): {
    avgReward: number;
    avgCost: number;
    avgDuration: number;
    totalRuns: number;
  } {
    if (this.mode === 'sqlite' && this.db) {
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
        avgReward: result?.avgReward || 0,
        avgCost: result?.avgCost || 0,
        avgDuration: result?.avgDuration || 0,
        totalRuns: result?.totalRuns || 0,
      };
    }

    const sorted = [...this.store.runs]
      .sort((a, b) => (a.ts && b.ts ? b.ts.localeCompare(a.ts) : 0))
      .slice(0, limit);
    const totalRuns = sorted.length;
    const sumReward = sorted.reduce((sum, run) => sum + (run.reward ?? 0), 0);
    const sumCost = sorted.reduce((sum, run) => sum + (run.cost_tokens ?? 0), 0);
    const sumDuration = sorted.reduce((sum, run) => sum + (run.duration_ms ?? 0), 0);
    return {
      avgReward: totalRuns ? sumReward / totalRuns : 0,
      avgCost: totalRuns ? sumCost / totalRuns : 0,
      avgDuration: totalRuns ? sumDuration / totalRuns : 0,
      totalRuns,
    };
  }

  // ---------------------------------------------------------------------------
  // Utilities
  // ---------------------------------------------------------------------------

  close(): void {
    if (this.mode === 'sqlite' && this.db && typeof this.db.close === 'function') {
      this.db.close();
    } else {
      this.persistStore();
    }
  }
}
