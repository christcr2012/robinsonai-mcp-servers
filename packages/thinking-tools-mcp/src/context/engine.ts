/**
 * Context Engine - Unified context management for thinking tools
 * Built-in context engine with semantic search, symbol indexing, and evidence store
 */

import { indexRepo } from './indexer.js';
import { hybridQuery } from './search.js';
import { getStats } from './store.js';
import { EvidenceStore } from './evidence.js';
import { FileWatcher } from './watcher.js';
import { getQueryCache } from './cache.js';
import { buildImportGraph } from './graph.js';
import {
  buildSymbolIndex,
  findSymbolDefinition,
  findCallers,
  getFileNeighborhood,
  type SymbolIndex
} from './symbol-index.js';
import type { Chunk, IndexStats, Hit } from './types.js';
import { rerankCodeFirst, type Candidate } from './rankers/code_first.js';
import { docHints, rerankDocs } from './rankers/doc_first.js';
import { loadDocs } from './store.js';
import { loadContextEngineConfig, applyConfigToEnvironment, type ContextEngineConfig } from './config.js';
import { PatternManager } from './patterns.js';
import { quickSearchFallback, type QuickSearchHit } from './quick-search.js';

// Import graph type
type ImportGraph = Array<{ from: string; to: string }>;

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

  public evidence: EvidenceStore;
  private watcher?: FileWatcher;
  private symbolIndex: SymbolIndex | null = null;
  private importGraph: ImportGraph | null = null;
  private indexed: boolean = false;
  private configPromise?: Promise<ContextEngineConfig>;
  private config?: ContextEngineConfig;
  private patternManager: PatternManager;
  private indexingPromise?: Promise<void>;

  private constructor(private root: string) {
    this.evidence = new EvidenceStore(this.root);
    this.patternManager = PatternManager.forRoot(this.root);

    // Start file watcher if enabled
    const autoWatch = process.env.CTX_AUTO_WATCH === '1' || process.env.CTX_AUTO_WATCH === 'true';
    if (autoWatch) {
      this.startWatcher();
    }
  }

  private async ensureConfig(): Promise<ContextEngineConfig> {
    if (!this.configPromise) {
      this.configPromise = loadContextEngineConfig()
        .then(config => {
          this.config = config;
          applyConfigToEnvironment(config);
          return config;
        })
        .catch(error => {
          this.configPromise = undefined;
          throw error;
        });
    }
    return this.configPromise;
  }

  private async ensureSecondaryIndexes(): Promise<void> {
    if (!this.symbolIndex) {
      console.log('[ContextEngine] Building symbol index...');
      this.symbolIndex = await buildSymbolIndex(this.root);
      console.log(`[ContextEngine] ✅ Symbol index built: ${this.symbolIndex.symbols.length} symbols`);
    }

    if (!this.importGraph) {
      console.log('[ContextEngine] Building import graph...');
      this.importGraph = buildImportGraph(this.root);
      console.log(`[ContextEngine] ✅ Import graph built: ${this.importGraph.length} edges`);
    }

    if (this.symbolIndex && this.importGraph) {
      await this.patternManager.ensureAnalysed(this.symbolIndex, this.importGraph);
    }
  }

  private async runIndexing(force = false): Promise<void> {
    const stats = await getStats();

    if (!force && stats && stats.chunks > 0) {
      this.indexed = true;
      await this.ensureSecondaryIndexes();
      return;
    }

    console.log('[ContextEngine] Indexing repository...');
    const result = await indexRepo(this.root, { quick: !force && Boolean(stats), force });
    console.log(`[ContextEngine] ✅ Indexed: ${result.files} files, ${result.chunks} chunks`);

    this.indexed = true;
    await this.ensureSecondaryIndexes();
  }

  private async ensureIndexed(waitForCompletion: boolean = true): Promise<void> {
    await this.ensureConfig();

    if (!this.indexingPromise) {
      this.indexingPromise = this.runIndexing().catch(error => {
        console.error('[ContextEngine] Indexing failed:', error.message || error);
        this.indexingPromise = undefined;
        this.indexed = false;
        throw error;
      });
    }

    if (waitForCompletion) {
      await this.indexingPromise.catch(() => {});
    }
  }

  async waitForIndex(): Promise<void> {
    await this.ensureIndexed(true);
  }

  /**
   * Hybrid search across repository with intelligent reranking
   *
   * Pipeline:
   * 1. Detect query intent (docs vs code)
   * 2. If docs query: use doc-first reranker on doc records
   * 3. If code query: hybrid BM25 + vector search → code-first reranking
   * 4. Return top k results
   */
  async search(query: string, k: number = 12): Promise<any[]> {
    const config = await this.ensureConfig();
    const indexingPromise = this.ensureIndexed(false);
    let indexingFailed = false;
    let fallback: QuickSearchHit[] | null = null;

    if (!this.indexed) {
      fallback = await quickSearchFallback(this.root, query, k);
      const ready = await Promise.race([
        indexingPromise.then(() => true).catch(() => {
          indexingFailed = true;
          return true;
        }),
        new Promise<boolean>(resolve => setTimeout(() => resolve(false), config.quickFallbackWaitMs)),
      ]);

      if (!ready && fallback.length) {
        return fallback.map(hit => ({
          uri: hit.uri,
          title: `Quick match: ${hit.uri}`,
          snippet: hit.snippet,
          score: hit.score,
          meta: { mode: 'fallback', indexed: false }
        }));
      }
    }

    try {
      await indexingPromise;
    } catch (error) {
      indexingFailed = true;
      console.error('[ContextEngine] Background indexing failed:', (error as Error).message);
    }

    if (!this.indexed || indexingFailed) {
      if (!fallback) {
        fallback = await quickSearchFallback(this.root, query, k);
      }
      return fallback.map(hit => ({
        uri: hit.uri,
        title: `Quick match: ${hit.uri}`,
        snippet: hit.snippet,
        score: hit.score,
        meta: { mode: 'fallback', indexed: false }
      }));
    }

    // Detect query intent
    const { wantsDocs } = docHints(query);

    // Doc-first path: search documentation records
    if (wantsDocs) {
      const docs = loadDocs();
      const top = rerankDocs(query, docs, k * 2); // list more docs

      return top.slice(0, k).map(d => ({
        uri: d.uri,
        title: `${d.type.toUpperCase()}: ${d.title}`,
        snippet: d.summary ?? '',
        score: 1,
        meta: { type: d.type, status: d.status, date: d.date, tasks: d.tasks?.length, links: d.links?.length, mode: 'docs' }
      }));
    }

    // Code-first path: hybrid search with code-first reranking
    const shortlistSize = Math.max(300, k * 25);
    const results: Hit[] = await hybridQuery(query, shortlistSize);

    if (results.length === 0) {
      const quick = fallback ?? await quickSearchFallback(this.root, query, k);
      return quick.map(hit => ({
        uri: hit.uri,
        title: `Quick match: ${hit.uri}`,
        snippet: hit.snippet,
        score: hit.score,
        meta: { mode: 'fallback', indexed: this.indexed }
      }));
    }

    const { embedBatch } = await import('./embedding.js');
    const [qVec] = await embedBatch([query]);

    const candidates: Candidate[] = results.map(r => ({
      uri: r.chunk.uri,
      title: r.chunk.title || r.chunk.uri,
      text: r.chunk.text,
      vec: r.chunk.vec,
      lexScore: r.score,
      meta: r.chunk.meta
    }));

    let reranked = rerankCodeFirst(query, candidates, qVec).slice(0, 50);

    const { ceRerankIfAvailable } = await import('./rankers/cross_encoder.js');
    const ce = await ceRerankIfAvailable(query, reranked.map(t => ({ text: t.text })));
    if (ce) {
      const ceScores = ce as Array<{ idx: number; score: number }>;
      reranked = reranked
        .map((candidate, idx) => {
          const ceScore = ceScores.find(entry => entry.idx === idx)?.score ?? 0;
          return { ...candidate, score: (candidate.score ?? 0) + ceScore * 0.25 };
        })
        .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    }

    const primary = reranked.slice(0, k);
    const boosts = this.patternManager.applyBoosts(query, primary.map(r => ({ uri: r.uri, text: r.text })));

    const boosted = primary
      .map(r => ({ ...r, score: (r.score ?? 0) + (boosts.get(r.uri) ?? 0) }))
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

    return boosted.map(r => ({
      uri: r.uri,
      title: r.title,
      snippet: r.text.substring(0, 620),
      score: r.score ?? 0,
      meta: { mode: 'indexed', boost: boosts.get(r.uri) ?? 0, lang: r.meta?.lang }
    }));
  }

  /**
   * Get import graph for the repository
   * Returns array of edges with {from, to} structure
   */
  async getGraph(): Promise<Array<{ from: string; to: string }>> {
    await this.ensureIndexed();

    // Build import graph if not already built
    if (!this.importGraph) {
      console.log('[ContextEngine] Building import graph...');
      this.importGraph = buildImportGraph(this.root);
      console.log(`[ContextEngine] ✅ Import graph built: ${this.importGraph.length} edges`);
    }

    return this.importGraph;
  }

  /**
   * Get import graph (Robinson's format with helper methods)
   */
  async getImportGraph() {
    await this.ensureIndexed();

    const graph = await this.getGraph();

    return {
      getImporters: (file: string) => {
        return graph.filter(e => e.to === file).map(e => e.from);
      },
      getImports: (file: string) => {
        return graph.filter(e => e.from === file).map(e => e.to);
      },
      getDependencyChain: (file: string, maxDepth: number = 10) => {
        const visited = new Set<string>();
        const queue: Array<{ file: string; depth: number }> = [{ file, depth: 0 }];

        while (queue.length > 0) {
          const { file: current, depth } = queue.shift()!;
          if (visited.has(current) || depth >= maxDepth) continue;
          visited.add(current);

          const imports = graph.filter(e => e.from === current).map(e => e.to);
          for (const imp of imports) {
            queue.push({ file: imp, depth: depth + 1 });
          }
        }

        return visited;
      },
      getDependents: (file: string, maxDepth: number = 10) => {
        const visited = new Set<string>();
        const queue: Array<{ file: string; depth: number }> = [{ file, depth: 0 }];

        while (queue.length > 0) {
          const { file: current, depth } = queue.shift()!;
          if (visited.has(current) || depth >= maxDepth) continue;
          visited.add(current);

          const importers = graph.filter(e => e.to === current).map(e => e.from);
          for (const importer of importers) {
            queue.push({ file: importer, depth: depth + 1 });
          }
        }

        return visited;
      },
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
    return getFileNeighborhood(file, this.symbolIndex);
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
    return findCallers(functionName, this.symbolIndex, this.root);
  }

  /**
   * Retrieve code context (search-based retrieval)
   */
  async retrieveCodeContext(query: {
    targetFile?: string;
    targetFunction?: string;
    targetClass?: string;
    targetInterface?: string;
    keywords?: string[];
  }) {
    await this.ensureIndexed();

    // Build search query from parameters
    const searchTerms = [
      query.targetFile,
      query.targetFunction,
      query.targetClass,
      query.targetInterface,
      ...(query.keywords || [])
    ].filter(Boolean).join(' ');

    // Use search to find relevant code
    const results = await this.search(searchTerms, 10);

    // Return in expected format
    return {
      targetFile: query.targetFile || '',
      similarFiles: results.map(r => r.uri),
      relatedTests: [],
      relatedTypes: [],
      snippets: results.map(r => ({
        file: r.uri,
        content: r.snippet,
        reason: 'Search result'
      }))
    };
  }

  /**
   * Reset index (force re-indexing)
   */
  async reset(): Promise<void> {
    this.indexed = false;
    this.symbolIndex = null;
    this.importGraph = null;
    this.indexingPromise = undefined;
    // Invalidate cache when index is reset
    getQueryCache().invalidate();
    console.log('[ContextEngine] ✅ Index reset (will re-index on next search)');
  }

  /**
   * Get index statistics
   */
  async stats(): Promise<IndexStats> {
    const stats = await getStats();
    return stats || {
      chunks: 0,
      embeddings: 0,
      vectors: 0,
      sources: {},
      mode: 'none',
      model: 'none',
      dimensions: 0,
      totalCost: 0,
      indexedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
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

