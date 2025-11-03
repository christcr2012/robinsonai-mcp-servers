/**
 * Context Engine - Unified context management for thinking tools
 * Provides singleton access to Robinson's Context Engine + evidence store
 */

import { RobinsonsContextEngine } from '@robinson_ai_systems/robinsons-context-engine';

// Re-export types
type SymbolIndex = any;
type ImportGraph = any;

// Stub functions - these will be replaced when RCE exports are fixed
const buildSymbolIndexForRepo = async (root: string, opts: any) => ({ symbols: [], files: [] });
const getFileNeighborhood = (file: string, symbolIndex: any) => ({ symbols: [], imports: [], importers: [] });
const findSymbolDefinition = (name: string, index: any) => null;
const findCallers = () => [];
const retrieveCodeContextForQuery = async (root: string, query: any, index: any) => ({ chunks: [] });
const buildImportGraph = async (files: string[], root: string) => ({ edges: new Map() });
const getImporters = (file: string, graph: any) => [];
const getImports = (file: string, graph: any) => [];
const getDependencyChain = (file: string, graph: any, maxDepth?: number) => new Set();
const getDependents = (file: string, graph: any, maxDepth?: number) => new Set();
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

  private rce: RobinsonsContextEngine;
  public evidence: EvidenceStore;
  private watcher?: FileWatcher;
  private symbolIndex: SymbolIndex | null = null;
  private importGraph: ImportGraph | null = null;

  private constructor(private root: string) {
    // Initialize Robinson's Context Engine with intelligent model selection
    this.rce = new RobinsonsContextEngine(root, {
      provider: (process.env.EMBED_PROVIDER as any) || 'auto',
      model: process.env.EMBED_MODEL,
      preferQuality: process.env.EMBED_PREFER_QUALITY === 'true',
      maxCostPer1M: process.env.EMBED_MAX_COST_PER_1M ? parseFloat(process.env.EMBED_MAX_COST_PER_1M) : undefined,
    });

    this.evidence = new EvidenceStore(this.root);

    // Start file watcher if enabled
    const autoWatch = process.env.CTX_AUTO_WATCH === '1' || process.env.CTX_AUTO_WATCH === 'true';
    if (autoWatch) {
      this.startWatcher();
    }
  }

  /**
   * Ensure repository is indexed (embeddings + BM25 + symbol index + import graph)
   */
  async ensureIndexed(): Promise<void> {
    const stats = await this.rce.stats();
    if (stats.chunks > 0) {
      console.log(`[ContextEngine] Already indexed: ${stats.chunks} chunks, ${stats.vectors} vectors`);
      return;
    }

    try {
      console.log('[ContextEngine] Indexing repository...');
      const result = await this.rce.indexRepo(this.root);
      console.log(`[ContextEngine] ✅ Indexed: ${result.files} files, ${result.chunks} chunks, ${result.vectors} vectors`);

      // Build symbol index
      this.symbolIndex = await buildSymbolIndexForRepo(this.root, {
        exts: ['.ts', '.tsx', '.js', '.jsx'],
        maxFiles: 2000,
        exclude: ['node_modules', 'dist', 'build', '.next', 'coverage', '__generated__'],
      });
      console.log(`[ContextEngine] ✅ Symbol index built: ${this.symbolIndex.symbols.length} symbols`);

      // Import graph will be built on-demand when needed
    } catch (error: any) {
      console.error('[ContextEngine] Indexing failed:', error.message);
      // Don't throw - allow tools to work without full index
    }
  }

  /**
   * Hybrid search across repository
   * Combines vector similarity + BM25 + symbol boosting
   */
  async search(query: string, k: number = 12): Promise<any[]> {
    await this.ensureIndexed();

    // Use Robinson's Context Engine (symbol boosting applied internally if symbol index exists)
    const results = await this.rce.search(query, k);

    return results;
  }

  /**
   * Get import graph for the repository
   * Returns array of edges with {from, to} structure
   */
  async getGraph(): Promise<Array<{ from: string; to: string }>> {
    await this.ensureIndexed();

    // Build import graph if not already built
    // (This is a simplified version - full implementation would cache the graph)
    const edges: Array<{ from: string; to: string }> = [];

    // TODO: Convert RCE's import graph to edge format
    // For now, return empty array
    return edges;
  }

  /**
   * Get import graph (Robinson's format)
   */
  async getImportGraph() {
    await this.ensureIndexed();

    // Build import graph if not already built
    if (!this.importGraph) {
      const files: string[] = []; // TODO: Get list of files from RCE
      this.importGraph = await buildImportGraph(files, this.root);
    }

    return {
      getImporters: (file: string) => getImporters(file, this.importGraph!),
      getImports: (file: string) => getImports(file, this.importGraph!),
      getDependencyChain: (file: string, maxDepth?: number) => getDependencyChain(file, this.importGraph!, maxDepth),
      getDependents: (file: string, maxDepth?: number) => getDependents(file, this.importGraph!, maxDepth),
    };
  }

  /**
   * Get file neighborhood (imports + importers + symbols)
   */
  async getNeighborhood(file: string) {
    await this.ensureIndexed();
    if (!this.symbolIndex) {
      throw new Error('Symbol index not built');
    }
    return getFileNeighborhood(file, this.symbolIndex, this.importGraph);
  }

  /**
   * Find symbol definition
   */
  async findSymbol(symbolName: string) {
    await this.ensureIndexed();
    if (!this.symbolIndex) {
      throw new Error('Symbol index not built');
    }
    return findSymbolDefinition(symbolName, this.symbolIndex);
  }

  /**
   * Find all callers of a function
   */
  async findCallers(functionName: string) {
    await this.ensureIndexed();
    if (!this.symbolIndex) {
      throw new Error('Symbol index not built');
    }
    return findCallers(functionName, this.symbolIndex);
  }

  /**
   * Retrieve code context (delegates to FREE Agent's code-aware retrieval)
   */
  async retrieveCodeContext(query: {
    targetFile?: string;
    targetFunction?: string;
    targetClass?: string;
    targetInterface?: string;
    keywords?: string[];
  }) {
    await this.ensureIndexed();

    // Ensure symbol index is built
    if (!this.symbolIndex) {
      throw new Error('Symbol index not built');
    }

    return retrieveCodeContextForQuery(this.root, query, this.symbolIndex);
  }

  /**
   * Reset index (force re-indexing)
   */
  async reset(): Promise<void> {
    await this.rce.reset();
    // Invalidate cache when index is reset
    getQueryCache().invalidate();
    console.log('[ContextEngine] ✅ Index reset');
  }

  /**
   * Get index statistics
   */
  async stats() {
    return this.rce.stats();
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

