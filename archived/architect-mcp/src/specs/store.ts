/**
 * Spec Storage System
 * 
 * Stores large specifications in SQLite with chunked retrieval
 * to avoid timeout issues with long prompts.
 */

import Database from 'better-sqlite3';
import { join } from 'path';
import { mkdirSync } from 'fs';

const DATA_DIR = join(process.cwd(), 'packages', 'architect-mcp', 'data');
const DB_PATH = join(DATA_DIR, 'architect.db');

// Ensure data directory exists
try {
  mkdirSync(DATA_DIR, { recursive: true });
} catch (err) {
  // Directory already exists
}

// Initialize database with WAL mode
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

// Create specs table
db.exec(`
  CREATE TABLE IF NOT EXISTS specs (
    spec_id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    text TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    size_bytes INTEGER NOT NULL
  )
`);

// Create index on created_at for cleanup
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_specs_created 
  ON specs(created_at)
`);

const insertSpec = db.prepare(`
  INSERT INTO specs (title, text, created_at, size_bytes)
  VALUES (?, ?, ?, ?)
`);

const getSpec = db.prepare(`
  SELECT * FROM specs WHERE spec_id = ?
`);

const deleteSpec = db.prepare(`
  DELETE FROM specs WHERE spec_id = ?
`);

const cleanupOldSpecs = db.prepare(`
  DELETE FROM specs 
  WHERE created_at < ?
`);

export interface Spec {
  spec_id: number;
  title: string;
  text: string;
  created_at: number;
  size_bytes: number;
}

/**
 * Submit a new specification
 * Max size: 200 KB
 */
export function submitSpec(title: string, text: string): { spec_id: number; size_bytes: number } {
  const sizeBytes = Buffer.byteLength(text, 'utf8');
  
  // Enforce 200 KB limit
  if (sizeBytes > 200 * 1024) {
    throw new Error(`Spec too large: ${sizeBytes} bytes (max 200 KB)`);
  }
  
  const result = insertSpec.run(title, text, Date.now(), sizeBytes);
  
  return {
    spec_id: result.lastInsertRowid as number,
    size_bytes: sizeBytes,
  };
}

/**
 * Get full spec by ID
 */
export function getSpecById(specId: number): Spec | null {
  const row = getSpec.get(specId) as Spec | undefined;
  return row || null;
}

/**
 * Get spec chunk (paged retrieval)
 * Default chunk size: 8 KB
 */
export function getSpecChunk(specId: number, from: number, size: number = 8192): {
  spec_id: number;
  title: string;
  chunk: string;
  from: number;
  size: number;
  total_size: number;
  has_more: boolean;
} {
  const spec = getSpecById(specId);
  
  if (!spec) {
    throw new Error(`Spec ${specId} not found`);
  }
  
  const chunk = spec.text.substring(from, from + size);
  const hasMore = (from + size) < spec.text.length;
  
  return {
    spec_id: specId,
    title: spec.title,
    chunk,
    from,
    size: chunk.length,
    total_size: spec.size_bytes,
    has_more: hasMore,
  };
}

/**
 * Delete spec by ID
 */
export function deleteSpecById(specId: number): void {
  deleteSpec.run(specId);
}

/**
 * Cleanup specs older than N days
 */
export function cleanupSpecs(daysOld: number = 7): number {
  const cutoff = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
  const result = cleanupOldSpecs.run(cutoff);
  return result.changes;
}

/**
 * Get database stats
 */
export function getSpecStats(): {
  total_specs: number;
  total_size_bytes: number;
  db_size_bytes: number;
} {
  const stats = db.prepare(`
    SELECT 
      COUNT(*) as total_specs,
      SUM(size_bytes) as total_size_bytes
    FROM specs
  `).get() as { total_specs: number; total_size_bytes: number };
  
  const dbSize = db.prepare(`
    SELECT page_count * page_size as size 
    FROM pragma_page_count(), pragma_page_size()
  `).get() as { size: number };
  
  return {
    total_specs: stats.total_specs || 0,
    total_size_bytes: stats.total_size_bytes || 0,
    db_size_bytes: dbSize.size || 0,
  };
}

/**
 * Close database connection
 */
export function closeSpecStore(): void {
  db.close();
}

