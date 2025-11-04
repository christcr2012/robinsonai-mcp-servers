/**
 * Database for OpenAI Worker
 *
 * Tracks jobs and spend metrics. Uses better-sqlite3 when available and
 * gracefully falls back to a JSON store when native bindings are missing.
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'fs';
import { loadBetterSqlite } from './utils/sqlite.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_DIR = join(__dirname, '..', 'data');
const DB_PATH = join(DB_DIR, 'openai-worker.db');
const STORE_PATH = join(DB_DIR, 'openai-worker.json');

let db: any = null;
let mode: 'sqlite' | 'json' = 'json';
let store: { jobs: any[]; spend: any[] } = { jobs: [], spend: [] };

function loadStore() {
  if (existsSync(STORE_PATH)) {
    try {
      const raw = readFileSync(STORE_PATH, 'utf8');
      const parsed = JSON.parse(raw) as Partial<typeof store>;
      store = {
        jobs: parsed.jobs ?? [],
        spend: parsed.spend ?? [],
      };
    } catch (error) {
      console.error('[PAID-AGENT] Failed to load JSON store:', error);
      store = { jobs: [], spend: [] };
    }
  } else {
    store = { jobs: [], spend: [] };
  }
}

function persistStore() {
  writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf8');
}

/**
 * Initialize database
 */
export function initDatabase(): void {
  mkdirSync(DB_DIR, { recursive: true });

  const { Database, error } = loadBetterSqlite();
  if (Database) {
    try {
      db = new Database(DB_PATH);
      if (typeof db.pragma === 'function') {
        db.pragma('journal_mode = WAL');
      }
      db.exec(`
        CREATE TABLE IF NOT EXISTS jobs (
          id TEXT PRIMARY KEY,
          agent TEXT NOT NULL,
          task TEXT NOT NULL,
          input_refs TEXT,
          state TEXT NOT NULL,
          result TEXT,
          error TEXT,
          tokens_used INTEGER DEFAULT 0,
          cost REAL DEFAULT 0,
          created_at TEXT NOT NULL,
          completed_at TEXT
        );

        CREATE TABLE IF NOT EXISTS spend (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          amount REAL NOT NULL,
          job_id TEXT,
          created_at TEXT NOT NULL,
          month INTEGER NOT NULL,
          year INTEGER NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_jobs_state ON jobs(state);
        CREATE INDEX IF NOT EXISTS idx_spend_month_year ON spend(month, year);
      `);
      mode = 'sqlite';
      return;
    } catch (err) {
      console.error('[PAID-AGENT] SQLite init failed:', err instanceof Error ? err.message : String(err));
    }
  } else if (error) {
    console.error('[PAID-AGENT] better-sqlite3 unavailable:', error.message);
  }

  mode = 'json';
  db = null;
  loadStore();
  console.error('[PAID-AGENT] Using JSON storage for worker database.');
}

function ensureJsonStoreLoaded() {
  if (mode === 'json' && store.jobs.length === 0 && store.spend.length === 0) {
    loadStore();
  }
}

function generateJobId(): string {
  return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create a job
 */
export function createJob(params: {
  agent: string;
  task: string;
  input_refs: string;
  state: string;
}): { id: string } {
  const id = generateJobId();
  const created_at = new Date().toISOString();

  if (mode === 'sqlite' && db) {
    db.prepare(`
      INSERT INTO jobs (id, agent, task, input_refs, state, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, params.agent, params.task, params.input_refs, params.state, created_at);
  } else {
    ensureJsonStoreLoaded();
    store.jobs.push({
      id,
      agent: params.agent,
      task: params.task,
      input_refs: params.input_refs,
      state: params.state,
      result: null,
      error: null,
      tokens_used: 0,
      cost: 0,
      created_at,
      completed_at: null,
    });
    persistStore();
  }

  return { id };
}

/**
 * Get a job
 */
export function getJob(id: string): any {
  if (mode === 'sqlite' && db) {
    return db.prepare('SELECT * FROM jobs WHERE id = ?').get(id);
  }
  ensureJsonStoreLoaded();
  return store.jobs.find((job) => job.id === id) || null;
}

/**
 * Update a job
 */
export function updateJob(id: string, updates: {
  state?: string;
  result?: string;
  error?: string;
  tokens_used?: number;
  cost?: number;
  completed_at?: string;
}): void {
  if (mode === 'sqlite' && db) {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.state !== undefined) {
      fields.push('state = ?');
      values.push(updates.state);
    }
    if (updates.result !== undefined) {
      fields.push('result = ?');
      values.push(updates.result);
    }
    if (updates.error !== undefined) {
      fields.push('error = ?');
      values.push(updates.error);
    }
    if (updates.tokens_used !== undefined) {
      fields.push('tokens_used = ?');
      values.push(updates.tokens_used);
    }
    if (updates.cost !== undefined) {
      fields.push('cost = ?');
      values.push(updates.cost);
    }
    if (updates.completed_at !== undefined) {
      fields.push('completed_at = ?');
      values.push(updates.completed_at);
    }

    if (fields.length === 0) return;

    values.push(id);
    db.prepare(`UPDATE jobs SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return;
  }

  ensureJsonStoreLoaded();
  const job = store.jobs.find((j) => j.id === id);
  if (!job) return;
  Object.assign(job, updates);
  persistStore();
}

/**
 * Record spend
 */
export function recordSpend(amount: number, job_id?: string): void {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const created_at = now.toISOString();

  if (mode === 'sqlite' && db) {
    db.prepare(`
      INSERT INTO spend (amount, job_id, created_at, month, year)
      VALUES (?, ?, ?, ?, ?)
    `).run(amount, job_id || null, created_at, month, year);
    return;
  }

  ensureJsonStoreLoaded();
  store.spend.push({
    id: (store.spend.at(-1)?.id ?? 0) + 1,
    amount,
    job_id: job_id || null,
    created_at,
    month,
    year,
  });
  persistStore();
}

/**
 * Get monthly spend
 */
export function getMonthlySpend(): number {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  if (mode === 'sqlite' && db) {
    const result = db.prepare(`
      SELECT SUM(amount) as total
      FROM spend
      WHERE month = ? AND year = ?
    `).get(month, year) as { total: number | null };

    return result.total || 0;
  }

  ensureJsonStoreLoaded();
  return store.spend
    .filter((row) => row.month === month && row.year === year)
    .reduce((sum, row) => sum + row.amount, 0);
}

/**
 * Get spend stats
 */
export function getSpendStats() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  if (mode === 'sqlite' && db) {
    const monthly = db.prepare(`
      SELECT SUM(amount) as total, COUNT(*) as count
      FROM spend
      WHERE month = ? AND year = ?
    `).get(month, year) as { total: number | null; count: number };

    const allTime = db.prepare(`
      SELECT SUM(amount) as total, COUNT(*) as count
      FROM spend
    `).get() as { total: number | null; count: number };

    return {
      current_month: {
        total: monthly.total || 0,
        count: monthly.count,
      },
      all_time: {
        total: allTime.total || 0,
        count: allTime.count,
      },
    };
  }

  ensureJsonStoreLoaded();
  const monthlyEntries = store.spend.filter((row) => row.month === month && row.year === year);
  const allEntries = store.spend;

  return {
    current_month: {
      total: monthlyEntries.reduce((sum, row) => sum + row.amount, 0),
      count: monthlyEntries.length,
    },
    all_time: {
      total: allEntries.reduce((sum, row) => sum + row.amount, 0),
      count: allEntries.length,
    },
  };
}
