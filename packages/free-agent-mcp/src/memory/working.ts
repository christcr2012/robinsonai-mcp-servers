/**
 * Working Memory
 *
 * Scratchpad for task-specific state and intermediate results.
 * Cleared between tasks.
 */

let working: Record<string, any> = {};

/**
 * Set a value in working memory
 *
 * @param key - Memory key
 * @param value - Value to store
 *
 * @example
 * ```typescript
 * setWorking("currentTask", "Add user authentication");
 * setWorking("taskProgress", { step: 1, total: 5 });
 * ```
 */
export function setWorking(key: string, value: any): void {
  working[key] = value;
}

/**
 * Get a value from working memory
 *
 * @param key - Memory key
 * @returns Value or undefined
 */
export function getWorking<T = any>(key: string): T | undefined {
  return working[key] as T | undefined;
}

/**
 * Get all working memory
 *
 * @returns Copy of all working memory
 */
export function getAllWorking(): Record<string, any> {
  return { ...working };
}

/**
 * Check if key exists in working memory
 *
 * @param key - Memory key
 * @returns True if key exists
 */
export function hasWorking(key: string): boolean {
  return key in working;
}

/**
 * Delete a key from working memory
 *
 * @param key - Memory key
 */
export function deleteWorking(key: string): void {
  delete working[key];
}

/**
 * Clear all working memory
 */
export function clearWorking(): void {
  working = {};
}

/**
 * Get working memory keys
 *
 * @returns Array of keys
 */
export function getWorkingKeys(): string[] {
  return Object.keys(working);
}

/**
 * Get working memory size
 *
 * @returns Number of keys in working memory
 */
export function getWorkingSize(): number {
  return Object.keys(working).length;
}

/**
 * Update working memory with partial object
 *
 * @param updates - Partial object to merge
 */
export function updateWorking(updates: Record<string, any>): void {
  working = { ...working, ...updates };
}

/**
 * Get working memory as JSON
 *
 * @returns JSON string
 */
export function exportWorking(): string {
  return JSON.stringify(working, null, 2);
}

/**
 * Import working memory from JSON
 *
 * @param json - JSON string
 */
export function importWorking(json: string): void {
  try {
    const imported = JSON.parse(json) as Record<string, any>;
    if (typeof imported === "object" && imported !== null) {
      working = imported;
    }
  } catch (err) {
    console.error("[Working] Failed to import working memory:", err);
  }
}

/**
 * Get working memory info
 *
 * @returns Info about working memory
 */
export function getWorkingInfo(): {
  size: number;
  keys: string[];
  totalSize: number;
} {
  const keys = Object.keys(working);
  const totalSize = JSON.stringify(working).length;

  return {
    size: keys.length,
    keys,
    totalSize
  };
}

/**
 * Merge working memory with another object
 *
 * @param other - Object to merge
 * @param overwrite - Whether to overwrite existing keys
 */
export function mergeWorking(other: Record<string, any>, overwrite: boolean = false): void {
  if (overwrite) {
    working = { ...working, ...other };
  } else {
    for (const [key, value] of Object.entries(other)) {
      if (!(key in working)) {
        working[key] = value;
      }
    }
  }
}

/**
 * Create a snapshot of working memory
 *
 * @returns Snapshot object
 */
export function snapshotWorking(): Record<string, any> {
  return JSON.parse(JSON.stringify(working));
}

/**
 * Restore working memory from snapshot
 *
 * @param snapshot - Snapshot to restore
 */
export function restoreWorking(snapshot: Record<string, any>): void {
  working = JSON.parse(JSON.stringify(snapshot));
}

