/**
 * File Watcher for Real-Time Indexing
 * Automatically reindexes files when they change
 */

import chokidar from 'chokidar';
import path from 'node:path';
import fs from 'node:fs';
import { embedBatch } from './embedding.js';
import { saveChunk, saveEmbedding, getPaths, loadChunks, loadEmbeddings } from './store.js';
import { Chunk } from './types.js';
import crypto from 'node:crypto';

const MAXCH = 1500; // Max characters per chunk

/**
 * SHA-1 hash for file tracking
 */
function sha(s: string): string {
  return crypto.createHash('sha1').update(s).digest('hex');
}

/**
 * Chunk text into manageable pieces
 */
function chunkText(text: string): { start: number; end: number; text: string }[] {
  const lines = text.split(/\r?\n/);
  const out: { start: number; end: number; text: string }[] = [];
  let buf: string[] = [];
  let start = 1;

  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i];
    buf.push(ln);
    const cur = buf.join('\n');

    if (cur.length >= MAXCH || i === lines.length - 1) {
      out.push({ start, end: i + 1, text: cur });
      buf = [];
      start = i + 2;
    }
  }

  return out;
}

/**
 * File Watcher class for real-time indexing
 */
export class FileWatcher {
  private watcher?: chokidar.FSWatcher;
  private debounceTimers = new Map<string, NodeJS.Timeout>();
  private fileHashes = new Map<string, string>();
  private isIndexing = false;

  constructor(private repoRoot: string) {
    this.loadFileHashes();
  }

  /**
   * Load file hashes from disk
   */
  private loadFileHashes(): void {
    const hashFile = path.join(this.repoRoot, '.robinson', 'context', 'file-hashes.json');
    if (fs.existsSync(hashFile)) {
      try {
        const data = fs.readFileSync(hashFile, 'utf8');
        const hashes = JSON.parse(data);
        this.fileHashes = new Map(Object.entries(hashes));
      } catch (error) {
        console.error('[FileWatcher] Failed to load file hashes:', error);
      }
    }
  }

  /**
   * Save file hashes to disk
   */
  private saveFileHashes(): void {
    const hashFile = path.join(this.repoRoot, '.robinson', 'context', 'file-hashes.json');
    const hashDir = path.dirname(hashFile);
    
    if (!fs.existsSync(hashDir)) {
      fs.mkdirSync(hashDir, { recursive: true });
    }

    try {
      const hashes = Object.fromEntries(this.fileHashes);
      fs.writeFileSync(hashFile, JSON.stringify(hashes, null, 2));
    } catch (error) {
      console.error('[FileWatcher] Failed to save file hashes:', error);
    }
  }

  /**
   * Check if file has changed based on hash
   */
  private async hasFileChanged(filePath: string): Promise<boolean> {
    try {
      const stat = fs.statSync(filePath);
      const text = fs.readFileSync(filePath, 'utf8');
      const currentHash = sha(filePath + ':' + stat.mtimeMs + ':' + text.length);
      const previousHash = this.fileHashes.get(filePath);

      if (currentHash !== previousHash) {
        this.fileHashes.set(filePath, currentHash);
        this.saveFileHashes();
        return true;
      }
      return false;
    } catch (error) {
      console.error(`[FileWatcher] Error checking file ${filePath}:`, error);
      return false;
    }
  }

  /**
   * Reindex a single file
   */
  private async reindexFile(filePath: string): Promise<void> {
    if (this.isIndexing) {
      console.log(`[FileWatcher] Skipping ${filePath} (indexing in progress)`);
      return;
    }

    try {
      this.isIndexing = true;

      // Check if file actually changed
      const changed = await this.hasFileChanged(filePath);
      if (!changed) {
        console.log(`[FileWatcher] Skipping ${filePath} (no changes)`);
        this.isIndexing = false;
        return;
      }

      const rel = path.relative(this.repoRoot, filePath);
      const text = fs.readFileSync(filePath, 'utf8');
      const stat = fs.statSync(filePath);
      const sh = sha(rel + ':' + stat.mtimeMs + ':' + text.length);

      // Remove old chunks for this file
      const existingChunks = loadChunks().filter(c => c.path === rel);
      const existingEmbeddings = loadEmbeddings();
      const existingIds = new Set(existingChunks.map(c => c.id));

      // Create new chunks
      const chunks = chunkText(text).map((c) => ({
        id: sha(rel + ':' + c.start + ':' + c.end + ':' + sh),
        source: 'repo' as const,
        path: rel,
        sha: sh,
        start: c.start,
        end: c.end,
        text: c.text,
      } as Chunk));

      console.log(`[FileWatcher] Reindexing ${rel} (${chunks.length} chunks)...`);

      // Generate embeddings
      const embs = await embedBatch(chunks.map(c => c.text));

      // Save new chunks and embeddings
      for (let i = 0; i < chunks.length; i++) {
        saveChunk(chunks[i]);
        saveEmbedding({ id: chunks[i].id, vec: embs[i] });
      }

      // Clean up old chunks/embeddings (simple approach: keep all, let deduplication handle it)
      // In production, you'd want to remove old chunks with the same path but different IDs

      console.log(`[FileWatcher] ✅ Reindexed ${rel}`);
    } catch (error) {
      console.error(`[FileWatcher] Error reindexing ${filePath}:`, error);
    } finally {
      this.isIndexing = false;
    }
  }

  /**
   * Handle file change with debouncing
   */
  private handleFileChange(filePath: string): void {
    // Clear existing timer
    const existingTimer = this.debounceTimers.get(filePath);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new timer (debounce for 1 second)
    const timer = setTimeout(() => {
      this.reindexFile(filePath);
      this.debounceTimers.delete(filePath);
    }, 1000);

    this.debounceTimers.set(filePath, timer);
  }

  /**
   * Start watching for file changes
   */
  start(): void {
    if (this.watcher) {
      console.log('[FileWatcher] Already watching');
      return;
    }

    console.log(`[FileWatcher] Starting file watcher for ${this.repoRoot}`);

    this.watcher = chokidar.watch(this.repoRoot, {
      ignored: [
        /(^|[\/\\])\../,  // Ignore dotfiles
        /node_modules/,
        /\.git/,
        /\.robctx/,
        /\.robinson/,
        /dist/,
        /build/,
        /out/,
        /coverage/,
        /\.next/,
        /\.cache/,
        /\.nuxt/,
        /vendor/,
      ],
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 500,
        pollInterval: 100,
      },
    });

    this.watcher
      .on('add', (filePath) => {
        console.log(`[FileWatcher] File added: ${filePath}`);
        this.handleFileChange(filePath);
      })
      .on('change', (filePath) => {
        console.log(`[FileWatcher] File changed: ${filePath}`);
        this.handleFileChange(filePath);
      })
      .on('unlink', (filePath) => {
        console.log(`[FileWatcher] File removed: ${filePath}`);
        // TODO: Remove chunks for deleted file
      })
      .on('error', (error) => {
        console.error('[FileWatcher] Watcher error:', error);
      });

    console.log('[FileWatcher] ✅ File watcher started');
  }

  /**
   * Stop watching for file changes
   */
  async stop(): Promise<void> {
    if (!this.watcher) {
      return;
    }

    console.log('[FileWatcher] Stopping file watcher');
    await this.watcher.close();
    this.watcher = undefined;

    // Clear all debounce timers
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();

    console.log('[FileWatcher] ✅ File watcher stopped');
  }

  /**
   * Check if watcher is running
   */
  isRunning(): boolean {
    return this.watcher !== undefined;
  }
}

