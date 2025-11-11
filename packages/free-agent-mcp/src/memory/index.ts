/**
 * Memory Module
 *
 * Unified interface for all memory systems:
 * - Episodic: Conversation and session history
 * - Working: Task-specific scratchpad
 * - Vector: Code and documentation retrieval
 * - SQL: Durable key-value store
 * - Files: Artifact and file recall
 */

export * as episodic from "./episodic.js";
export * as working from "./working.js";
export * as vector from "./vector.js";
export * as sql from "./sql.js";
export * as files from "./files.js";

/**
 * Memory system info
 */
export interface MemorySystemInfo {
  episodic: {
    count: number;
    maxCapacity: number;
    percentFull: number;
  };
  working: {
    size: number;
    keys: string[];
  };
  vector: {
    docCount: number;
    totalSize: number;
  };
  sql: {
    keyCount: number;
    dbSize: number;
  };
}

/**
 * Get info about all memory systems
 *
 * @returns Combined memory system info
 */
export function getMemorySystemInfo(): MemorySystemInfo {
  return {
    episodic: {
      count: episodic.getEpisodeCount(),
      maxCapacity: 25,
      percentFull: (episodic.getEpisodeCount() / 25) * 100
    },
    working: {
      size: working.getWorkingSize(),
      keys: working.getWorkingKeys()
    },
    vector: {
      docCount: vector.getVecDocCount(),
      totalSize: vector.getVecMemoryInfo().totalSize
    },
    sql: {
      keyCount: sql.sqlCount(),
      dbSize: sql.getSqlMemoryInfo().dbSize
    }
  };
}

/**
 * Clear all memory systems
 *
 * @param options - Which systems to clear
 */
export function clearAllMemory(options: {
  episodic?: boolean;
  working?: boolean;
  vector?: boolean;
  sql?: boolean;
  files?: boolean;
} = {}): void {
  if (options.episodic !== false) {
    episodic.clearEpisodes();
  }

  if (options.working !== false) {
    working.clearWorking();
  }

  if (options.vector !== false) {
    vector.clearVecDocs();
  }

  if (options.sql !== false) {
    sql.sqlClear();
  }
}

/**
 * Export all memory systems as JSON
 *
 * @returns JSON with all memory data
 */
export function exportAllMemory(): string {
  const data = {
    episodic: JSON.parse(episodic.exportEpisodes()),
    working: JSON.parse(working.exportWorking()),
    vector: JSON.parse(vector.exportVecDocs()),
    sql: sql.exportSqlMemory()
  };

  return JSON.stringify(data, null, 2);
}

/**
 * Import all memory systems from JSON
 *
 * @param json - JSON with all memory data
 */
export function importAllMemory(json: string): void {
  try {
    const data = JSON.parse(json);

    if (data.episodic) {
      episodic.importEpisodes(JSON.stringify(data.episodic));
    }

    if (data.working) {
      working.importWorking(JSON.stringify(data.working));
    }

    if (data.vector) {
      vector.importVecDocs(JSON.stringify(data.vector));
    }

    if (data.sql) {
      sql.importSqlMemory(JSON.stringify(data.sql));
    }
  } catch (err) {
    console.error("[Memory] Failed to import all memory:", err);
  }
}
