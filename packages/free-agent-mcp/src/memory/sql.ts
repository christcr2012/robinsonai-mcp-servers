/**
 * SQL Memory
 *
 * Durable key-value store using SQLite.
 * Persists across sessions.
 */

import Database from "better-sqlite3";
import * as path from "path";
import * as os from "os";

// Use OS temp directory for database
const dbPath = path.join(os.tmpdir(), "free-agent.memory.sqlite");
const db = new Database(dbPath);

// Initialize database
db.exec("CREATE TABLE IF NOT EXISTS kv (k TEXT PRIMARY KEY, v TEXT)");

/**
 * Set a value in SQL memory
 *
 * @param k - Key
 * @param v - Value (will be JSON serialized)
 *
 * @example
 * ```typescript
 * sqlSet("lastTask", { name: "Add auth", status: "complete" });
 * sqlSet("config", { model: "gpt-4", temperature: 0.7 });
 * ```
 */
export function sqlSet(k: string, v: any): void {
  try {
    db.prepare("REPLACE INTO kv (k,v) VALUES (?,?)").run(k, JSON.stringify(v));
  } catch (err) {
    console.error("[SQL] Failed to set key:", k, err);
  }
}

/**
 * Get a value from SQL memory
 *
 * @param k - Key
 * @returns Value or undefined
 */
export function sqlGet<T = any>(k: string): T | undefined {
  try {
    const row = db.prepare("SELECT v FROM kv WHERE k=?").get(k) as any;
    return row ? (JSON.parse(row.v) as T) : undefined;
  } catch (err) {
    console.error("[SQL] Failed to get key:", k, err);
    return undefined;
  }
}

/**
 * Delete a key from SQL memory
 *
 * @param k - Key
 */
export function sqlDelete(k: string): void {
  try {
    db.prepare("DELETE FROM kv WHERE k=?").run(k);
  } catch (err) {
    console.error("[SQL] Failed to delete key:", k, err);
  }
}

/**
 * Check if key exists
 *
 * @param k - Key
 * @returns True if key exists
 */
export function sqlHas(k: string): boolean {
  try {
    const row = db.prepare("SELECT 1 FROM kv WHERE k=?").get(k);
    return !!row;
  } catch (err) {
    console.error("[SQL] Failed to check key:", k, err);
    return false;
  }
}

/**
 * Get all keys
 *
 * @returns Array of all keys
 */
export function sqlKeys(): string[] {
  try {
    const rows = db.prepare("SELECT k FROM kv").all() as any[];
    return rows.map(r => r.k);
  } catch (err) {
    console.error("[SQL] Failed to get keys:", err);
    return [];
  }
}

/**
 * Get all key-value pairs
 *
 * @returns Object with all key-value pairs
 */
export function sqlGetAll(): Record<string, any> {
  try {
    const rows = db.prepare("SELECT k, v FROM kv").all() as any[];
    const result: Record<string, any> = {};
    rows.forEach(r => {
      result[r.k] = JSON.parse(r.v);
    });
    return result;
  } catch (err) {
    console.error("[SQL] Failed to get all:", err);
    return {};
  }
}

/**
 * Clear all data
 */
export function sqlClear(): void {
  try {
    db.prepare("DELETE FROM kv").run();
  } catch (err) {
    console.error("[SQL] Failed to clear:", err);
  }
}

/**
 * Get count of keys
 *
 * @returns Number of keys
 */
export function sqlCount(): number {
  try {
    const row = db.prepare("SELECT COUNT(*) as count FROM kv").get() as any;
    return row?.count ?? 0;
  } catch (err) {
    console.error("[SQL] Failed to count:", err);
    return 0;
  }
}

/**
 * Search keys by pattern
 *
 * @param pattern - SQL LIKE pattern
 * @returns Matching keys
 */
export function sqlSearchKeys(pattern: string): string[] {
  try {
    const rows = db.prepare("SELECT k FROM kv WHERE k LIKE ?").all(pattern) as any[];
    return rows.map(r => r.k);
  } catch (err) {
    console.error("[SQL] Failed to search keys:", err);
    return [];
  }
}

/**
 * Batch set multiple values
 *
 * @param items - Array of [key, value] pairs
 */
export function sqlBatchSet(items: Array<[string, any]>): void {
  try {
    const stmt = db.prepare("REPLACE INTO kv (k,v) VALUES (?,?)");
    const transaction = db.transaction((items: Array<[string, any]>) => {
      items.forEach(([k, v]) => {
        stmt.run(k, JSON.stringify(v));
      });
    });
    transaction(items);
  } catch (err) {
    console.error("[SQL] Failed to batch set:", err);
  }
}

/**
 * Export SQL memory as JSON
 *
 * @returns JSON string
 */
export function exportSqlMemory(): string {
  return JSON.stringify(sqlGetAll(), null, 2);
}

/**
 * Import SQL memory from JSON
 *
 * @param json - JSON string
 */
export function importSqlMemory(json: string): void {
  try {
    const data = JSON.parse(json) as Record<string, any>;
    sqlClear();
    sqlBatchSet(Object.entries(data));
  } catch (err) {
    console.error("[SQL] Failed to import:", err);
  }
}

/**
 * Get SQL memory info
 *
 * @returns Info about SQL memory
 */
export function getSqlMemoryInfo(): {
  keyCount: number;
  dbPath: string;
  dbSize: number;
} {
  try {
    const fs = require("fs");
    const stats = fs.statSync(dbPath);
    return {
      keyCount: sqlCount(),
      dbPath,
      dbSize: stats.size
    };
  } catch (err) {
    console.error("[SQL] Failed to get info:", err);
    return {
      keyCount: sqlCount(),
      dbPath,
      dbSize: 0
    };
  }
}

/**
 * Close database connection
 */
export function closeSqlMemory(): void {
  try {
    db.close();
  } catch (err) {
    console.error("[SQL] Failed to close:", err);
  }
}

