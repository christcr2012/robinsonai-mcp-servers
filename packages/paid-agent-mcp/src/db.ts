/**
 * Database for OpenAI Worker
 * 
 * Tracks:
 * - Jobs (queued, running, completed, failed)
 * - Spend (monthly tracking)
 */

import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_DIR = join(__dirname, '..', 'data');
const DB_PATH = join(DB_DIR, 'openai-worker.db');

let db: Database.Database;

/**
 * Initialize database
 */
export function initDatabase(): void {
  // Create data directory
  mkdirSync(DB_DIR, { recursive: true });

  // Open database
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');

  // Create tables
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
  const id = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const created_at = new Date().toISOString();

  db.prepare(`
    INSERT INTO jobs (id, agent, task, input_refs, state, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, params.agent, params.task, params.input_refs, params.state, created_at);

  return { id };
}

/**
 * Get a job
 */
export function getJob(id: string): any {
  return db.prepare('SELECT * FROM jobs WHERE id = ?').get(id);
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
}

/**
 * Record spend
 */
export function recordSpend(amount: number, job_id?: string): void {
  const now = new Date();
  const month = now.getMonth() + 1; // 1-12
  const year = now.getFullYear();
  const created_at = now.toISOString();

  db.prepare(`
    INSERT INTO spend (amount, job_id, created_at, month, year)
    VALUES (?, ?, ?, ?, ?)
  `).run(amount, job_id || null, created_at, month, year);
}

/**
 * Get monthly spend
 */
export function getMonthlySpend(): number {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const result = db.prepare(`
    SELECT SUM(amount) as total
    FROM spend
    WHERE month = ? AND year = ?
  `).get(month, year) as { total: number | null };

  return result.total || 0;
}

/**
 * Get spend stats
 */
export function getSpendStats() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

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

