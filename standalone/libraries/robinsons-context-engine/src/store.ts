/**
 * Robinson's Context Engine - Storage Layer
 * 
 * Simple JSONL-based storage for chunks and embeddings
 * Designed for portability and easy debugging
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';

export type StoredChunk = {
  hash: string;
  uri: string;
  title: string;
  text: string;
  vec?: number[];
  metadata?: {
    start?: number;
    end?: number;
    language?: string;
    size?: number;
  };
};

export type IndexMeta = {
  sources: number;
  chunks: number;
  vectors: number;
  provider: string;
  model?: string;
  dimensions?: number;
  indexedAt: string;
  totalCost?: number;
  fileHashes?: { [path: string]: { hash: string; mtime: number; size: number } };
};

export class RCEStore {
  private dir: string;
  private chunksPath: string;
  private metaPath: string;

  constructor(private root: string) {
    this.dir = path.join(root, '.rce_index');
    this.chunksPath = path.join(this.dir, 'chunks.jsonl');
    this.metaPath = path.join(this.dir, 'meta.json');
  }

  /**
   * Initialize storage directory
   */
  async init() {
    await fs.mkdir(this.dir, { recursive: true });
  }

  /**
   * Write chunks to JSONL file (append mode)
   */
  async writeChunks(chunks: StoredChunk[]) {
    await this.init();
    const lines = chunks.map(c => JSON.stringify(c)).join('\n') + '\n';
    await fs.appendFile(this.chunksPath, lines, 'utf8');
  }

  /**
   * Load all chunks from JSONL file
   */
  async loadAll(): Promise<StoredChunk[]> {
    try {
      const txt = await fs.readFile(this.chunksPath, 'utf8');
      return txt
        .split('\n')
        .filter(Boolean)
        .map(l => JSON.parse(l));
    } catch {
      return [];
    }
  }

  /**
   * Load chunks in streaming fashion (for large indexes)
   */
  async *loadStream(): AsyncGenerator<StoredChunk> {
    try {
      const txt = await fs.readFile(this.chunksPath, 'utf8');
      const lines = txt.split('\n').filter(Boolean);
      
      for (const line of lines) {
        try {
          yield JSON.parse(line);
        } catch (error) {
          console.error('[RCEStore] Failed to parse chunk:', error);
        }
      }
    } catch {
      // File doesn't exist, return empty
    }
  }

  /**
   * Save index metadata
   */
  async saveMeta(meta: IndexMeta) {
    await this.init();
    await fs.writeFile(this.metaPath, JSON.stringify(meta, null, 2), 'utf8');
  }

  /**
   * Read index metadata
   */
  async readMeta(): Promise<IndexMeta | null> {
    try {
      const content = await fs.readFile(this.metaPath, 'utf8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  /**
   * Clear all stored data (reset index)
   */
  async clear() {
    try {
      await fs.unlink(this.chunksPath);
      await fs.unlink(this.metaPath);
      console.log('[RCEStore] Index cleared');
    } catch {
      // Files don't exist, nothing to clear
    }
  }

  /**
   * Get storage statistics
   */
  async getStats(): Promise<{ sizeBytes: number; chunkCount: number }> {
    try {
      const stat = await fs.stat(this.chunksPath);
      const chunks = await this.loadAll();
      return {
        sizeBytes: stat.size,
        chunkCount: chunks.length
      };
    } catch {
      return { sizeBytes: 0, chunkCount: 0 };
    }
  }

  /**
   * Remove chunks for specific files (for incremental indexing)
   */
  async removeChunksForFiles(files: string[]) {
    const chunks = await this.loadAll();
    const fileSet = new Set(files);
    const remaining = chunks.filter(c => !fileSet.has(c.uri));

    if (remaining.length < chunks.length) {
      // Rewrite file without removed chunks
      await fs.unlink(this.chunksPath);
      await this.writeChunks(remaining);
      console.log(`[RCEStore] Removed chunks for ${chunks.length - remaining.length} files`);
    }
  }

  /**
   * Compact index (remove duplicates, optimize storage)
   */
  async compact() {
    const chunks = await this.loadAll();
    const seen = new Set<string>();
    const unique: StoredChunk[] = [];

    for (const chunk of chunks) {
      if (!seen.has(chunk.hash)) {
        seen.add(chunk.hash);
        unique.push(chunk);
      }
    }

    if (unique.length < chunks.length) {
      // Rewrite file with unique chunks only
      await fs.unlink(this.chunksPath);
      await this.writeChunks(unique);
      console.log(`[RCEStore] Compacted: ${chunks.length} → ${unique.length} chunks`);
    }
  }
}

