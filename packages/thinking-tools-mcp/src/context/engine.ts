/**
 * Context Engine - Unified context management for thinking tools
 * Provides singleton access to indexing, search, graph, and evidence
 */

import { indexRepo } from './indexer.js';
import { hybridQuery } from './search.js';
import { buildImportGraph } from './graph.js';
import { EvidenceStore } from './evidence.js';
import { FileWatcher } from './watcher.js';
import { getQueryCache } from './cache.js';

export class ContextEngine {
  private static byRoot = new Map<string, ContextEngine>();

  /**
   * Get or create context engine for a workspace root
   */
  static get(root: string): ContextEngine {
    if (!this.byRoot.has(root)) {
      this.byRoot.set(root, new ContextEngine(root));
    }
    return this.byRoot.get(root)!;
  }

  private _indexed = false;
  private _graph: Array<{ from: string; to: string }> = [];
  public evidence: EvidenceStore;
  private watcher?: FileWatcher;

  private constructor(private root: string) {
    this.evidence = new EvidenceStore(this.root);

    // Start file watcher if enabled
    const autoWatch = process.env.CTX_AUTO_WATCH === '1' || process.env.CTX_AUTO_WATCH === 'true';
    if (autoWatch) {
      this.startWatcher();
    }
  }

  /**
   * Ensure repository is indexed (embeddings + BM25 + graph)
   */
  async ensureIndexed(): Promise<void> {
    if (this._indexed) return;

    try {
      await indexRepo(this.root);
      this._graph = buildImportGraph(this.root);
      this._indexed = true;
    } catch (error) {
      console.error('[ContextEngine] Indexing failed:', error);
      // Don't throw - allow tools to work without full index
    }
  }

  /**
   * Hybrid search across repository
   * Combines vector similarity + BM25 + recency
   */
  async search(query: string, k: number = 12): Promise<any[]> {
    await this.ensureIndexed();
    return hybridQuery(query, k);
  }

  /**
   * Get import graph for the repository
   * Returns array of edges with {from, to} structure
   */
  async getGraph(): Promise<Array<{ from: string; to: string }>> {
    await this.ensureIndexed();
    return this._graph;
  }

  /**
   * Reset index (force re-indexing)
   */
  reset(): void {
    this._indexed = false;
    // Invalidate cache when index is reset
    getQueryCache().invalidate();
  }

  /**
   * Start file watcher for real-time indexing
   */
  startWatcher(): void {
    if (this.watcher?.isRunning()) {
      console.log('[ContextEngine] File watcher already running');
      return;
    }

    this.watcher = new FileWatcher(this.root);
    this.watcher.start();
    console.log('[ContextEngine] ✅ File watcher started');
  }

  /**
   * Stop file watcher
   */
  async stopWatcher(): Promise<void> {
    if (this.watcher) {
      await this.watcher.stop();
      this.watcher = undefined;
      console.log('[ContextEngine] ✅ File watcher stopped');
    }
  }

  /**
   * Check if file watcher is running
   */
  isWatcherRunning(): boolean {
    return this.watcher?.isRunning() ?? false;
  }
}

