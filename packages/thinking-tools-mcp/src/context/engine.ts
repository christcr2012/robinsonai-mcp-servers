/**
 * Context Engine - Unified context management for thinking tools
 * Provides singleton access to indexing, search, graph, and evidence
 */

import { indexRepo } from './indexer.js';
import { hybridQuery } from './search.js';
import { buildImportGraph } from './graph.js';
import { EvidenceStore } from './evidence.js';

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
  public evidence: EvidenceStore;

  private constructor(private root: string) {
    this.evidence = new EvidenceStore(this.root);
  }

  /**
   * Ensure repository is indexed (embeddings + BM25 + graph)
   */
  async ensureIndexed(): Promise<void> {
    if (this._indexed) return;
    
    try {
      await indexRepo(this.root);
      await buildImportGraph(this.root);
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
   */
  async getGraph(): Promise<any> {
    await this.ensureIndexed();
    // Return graph data - implementation depends on graph.ts structure
    return {}; // TODO: Implement based on graph.ts exports
  }

  /**
   * Reset index (force re-indexing)
   */
  reset(): void {
    this._indexed = false;
  }
}

