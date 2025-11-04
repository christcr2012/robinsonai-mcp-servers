/**
 * Robinson's Context Engine - Storage Layer
 * 
 * Simple JSONL-based storage for chunks and embeddings
 * Designed for portability and easy debugging
 */

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import crypto from 'node:crypto';

export type StoredChunk = {
  id: string;
  file: string;           // normalized path relative to root
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
    symbols?: string[];
    lang?: string;
    lines?: number;
  };
};

export type StoredDoc = {
  id: string;
  uri: string;
  title: string;
  type: string;
  status?: string;
  version?: string;
  date?: string;
  summary?: string;
  tags?: string[];
  tasks?: Array<{ text: string; done?: boolean }>;
  links?: Array<{ kind: 'code'|'issue'|'url'; ref: string }>;
};

export type IndexMeta = {
  head?: string;
  sources: number;
  chunks: number;
  vectors: number;
  docs?: number;
  provider: string;
  model?: string;
  dimensions?: number;
  indexedAt: string;
  updatedAt?: number;
  totalCost?: number;
  fileHashes?: { [path: string]: { hash: string; mtime: number; size: number } };
};

export class RCEStore {
  private dir: string;
  private chunksPath: string;
  private metaPath: string;
  private docsPath: string;
  private embedDir: string;
  private filesPath: string;

  constructor(private root: string) {
    this.dir = path.join(root, '.rce_index');
    this.chunksPath = path.join(this.dir, 'chunks.jsonl');
    this.metaPath = path.join(this.dir, 'meta.json');
    this.docsPath = path.join(this.dir, 'docs.jsonl');
    this.embedDir = path.join(this.dir, 'embeddings');
    this.filesPath = path.join(this.dir, 'files.json');
  }

  /**
   * Initialize storage directory
   */
  async init() {
    await fs.mkdir(this.dir, { recursive: true });
    await fs.mkdir(this.embedDir, { recursive: true });
    for (const f of [this.chunksPath, this.docsPath]) {
      try { await fs.access(f); } catch { await fs.writeFile(f, '', 'utf8'); }
    }
    try { await fs.access(this.filesPath); } catch { await fs.writeFile(this.filesPath, '{}', 'utf8'); }
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
   * Delete all chunks for a specific file
   */
  async deleteChunksForFile(file: string) {
    const all = await this.loadAll();
    const keep = all.filter(c => c.file !== file && c.uri !== file);
    if (keep.length < all.length) {
      await fs.writeFile(this.chunksPath, keep.map(c=>JSON.stringify(c)).join('\n')+'\n', 'utf8');
    }
  }

  /**
   * File map (path -> {mtimeMs, size, contentSha, chunkIds})
   */
  async loadFileMap(): Promise<Record<string, any>> {
    try {
      return JSON.parse(await fs.readFile(this.filesPath, 'utf8') || '{}');
    } catch {
      return {};
    }
  }

  async saveFileMap(m: Record<string, any>) {
    await fs.writeFile(this.filesPath, JSON.stringify(m, null, 2), 'utf8');
  }

  /**
   * Load metadata
   */
  async loadMeta() {
    try {
      return JSON.parse(await fs.readFile(this.metaPath, 'utf8'));
    } catch {
      return {};
    }
  }

  /**
   * Docs storage
   */
  async writeDocs(docs: StoredDoc[]) {
    await this.init();
    const lines = docs.map(d=>JSON.stringify(d)).join('\n')+'\n';
    await fs.appendFile(this.docsPath, lines, 'utf8');
  }

  async loadAllDocs(): Promise<StoredDoc[]> {
    try {
      const txt = await fs.readFile(this.docsPath, 'utf8');
      return txt.split('\n').filter(Boolean).map(l=>JSON.parse(l));
    } catch {
      return [];
    }
  }

  /**
   * Embeddings cache: model|sha -> vector
   */
  private key(model:string, sha:string) {
    return `${model}|${sha}`;
  }

  async getCachedVec(model:string, sha:string): Promise<number[]|undefined> {
    try {
      const p = path.join(this.embedDir, `${model}.jsonl`);
      const txt = await fs.readFile(p, 'utf8');
      for (const line of txt.split('\n')) {
        if (!line) continue;
        const [k, payload] = JSON.parse(line);
        if (k === this.key(model, sha)) return payload;
      }
    } catch {}
    return undefined;
  }

  async putCachedVec(model:string, sha:string, vec:number[]) {
    const p = path.join(this.embedDir, `${model}.jsonl`);
    await fs.appendFile(p, JSON.stringify([this.key(model, sha), vec])+'\n', 'utf8');
  }

  sha(text:string) {
    return crypto.createHash('sha1').update(text).digest('hex');
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

