/**
 * SQL Memory (File-based Key-Value Store)
 *
 * Durable key-value store using JSON file storage.
 * Persists across sessions.
 * No native dependencies - works in all environments (pnpm dlx, Docker, etc.)
 */

import * as path from "path";
import * as os from "os";
import * as fs from "fs";

// Use OS temp directory for storage
const dbPath = path.join(os.tmpdir(), "free-agent.memory.json");
let memoryCache: Record<string, string> = {};
let initialized = false;

/**
 * Load memory from file
 */
function loadMemory(): void {
  if (initialized) return;
  initialized = true;

  try {
    if (fs.existsSync(dbPath)) {
      const data = fs.readFileSync(dbPath, "utf-8");
      memoryCache = JSON.parse(data);
    } else {
      memoryCache = {};
    }
  } catch (err) {
    console.warn("[SQL] Failed to load memory from file, starting fresh:", err);
    memoryCache = {};
  }
}

/**
 * Save memory to file
 */
function saveMemory(): void {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(memoryCache, null, 2), "utf-8");
  } catch (err) {
    console.error("[SQL] Failed to save memory to file:", err);
  }
}

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
    loadMemory();
    memoryCache[k] = JSON.stringify(v);
    saveMemory();
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
    loadMemory();
    const v = memoryCache[k];
    return v ? (JSON.parse(v) as T) : undefined;
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
    loadMemory();
    delete memoryCache[k];
    saveMemory();
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
    loadMemory();
    return k in memoryCache;
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
    loadMemory();
    return Object.keys(memoryCache);
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
    loadMemory();
    const result: Record<string, any> = {};
    Object.entries(memoryCache).forEach(([k, v]) => {
      result[k] = JSON.parse(v);
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
    loadMemory();
    memoryCache = {};
    saveMemory();
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
    loadMemory();
    return Object.keys(memoryCache).length;
  } catch (err) {
    console.error("[SQL] Failed to count:", err);
    return 0;
  }
}

/**
 * Search keys by pattern (simple substring match)
 *
 * @param pattern - Pattern to search for
 * @returns Matching keys
 */
export function sqlSearchKeys(pattern: string): string[] {
  try {
    loadMemory();
    return Object.keys(memoryCache).filter(k => k.includes(pattern));
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
    loadMemory();
    items.forEach(([k, v]) => {
      memoryCache[k] = JSON.stringify(v);
    });
    saveMemory();
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
 * Close/cleanup (no-op for file-based storage)
 */
export function closeSqlMemory(): void {
  // File-based storage doesn't need explicit cleanup
}

