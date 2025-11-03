/**
 * Context Engine - Unified context management for thinking tools
 * Built-in context engine with semantic search, symbol indexing, and evidence store
 */

import { indexRepo } from './indexer.js';
import { hybridQuery } from './search.js';
import { getStats, loadChunks } from './store.js';
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

  private constructor(private root: string) {
    this.evidence = new EvidenceStore(this.root);

    // Start file watcher if enabled
    const autoWatch = process.env.CTX_AUTO_WATCH === '1' || process.env.CTX_AUTO_WATCH === 'true';
    if (autoWatch) {
      this.startWatcher();
    }
  }

  /**
   * Ensure repository is indexed (embeddings + BM25 + symbols)
   */
  async ensureIndexed(): Promise<void> {
    if (this.indexed) {
      return;
    }

    try {
      const stats = await getStats();
      if (stats && stats.chunks > 0) {
        console.log(`[ContextEngine] Already indexed: ${stats.chunks} chunks`);
        this.indexed = true;

        // Build symbol index if not already built
        if (!this.symbolIndex) {
          console.log('[ContextEngine] Building symbol index...');
          this.symbolIndex = await buildSymbolIndex(this.root);
          console.log(`[ContextEngine] ✅ Symbol index built: ${this.symbolIndex.symbols.length} symbols`);
        }

        return;
      }

      console.log('[ContextEngine] Indexing repository...');
      const result = await indexRepo();
      console.log(`[ContextEngine] ✅ Indexed: ${result.files} files, ${result.chunks} chunks`);

      // Build symbol index
      console.log('[ContextEngine] Building symbol index...');
      this.symbolIndex = await buildSymbolIndex(this.root);
      console.log(`[ContextEngine] ✅ Symbol index built: ${this.symbolIndex.symbols.length} symbols`);

      this.indexed = true;
    } catch (error: any) {
      console.error('[ContextEngine] Indexing failed:', error.message);
      // Don't throw - allow tools to work without full index
    }
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
    await this.ensureIndexed();

    // Detect query intent
    const { wantsDocs } = docHints(query);

    // Doc-first path: search documentation records
    if (wantsDocs) {
      const docs = loadDocs();
      const top = rerankDocs(query, docs, k * 2); // list more docs

      // Return doc-shaped hits
      return top.slice(0, k).map(d => ({
        uri: d.uri,
        title: `${d.type.toUpperCase()}: ${d.title}`,
        snippet: d.summary ?? '',
        score: 1,
        meta: { type: d.type, status: d.status, date: d.date, tasks: d.tasks?.length, links: d.links?.length }
      }));
    }

    // Code-first path: hybrid search with code-first reranking
    // Get larger shortlist for reranking (300 candidates)
    const shortlistSize = Math.max(300, k * 25);
    const results: Hit[] = await hybridQuery(query, shortlistSize);

    if (results.length === 0) {
      return [];
    }

    // Get query embedding for reranker
    const { embedBatch } = await import('./embedding.js');
    const [qVec] = await embedBatch([query]);

    // Convert to reranker format
    const candidates: Candidate[] = results.map(r => ({
      uri: r.chunk.uri,
      title: r.chunk.title || r.chunk.uri,
      text: r.chunk.text,
      vec: r.chunk.vec, // Include chunk vector if available
      lexScore: r.score, // Pass hybrid score as lexical score
      meta: r.chunk.meta // Include symbol metadata
    }));

    // Rerank with code-first heuristics
    const top50 = rerankCodeFirst(query, candidates, qVec).slice(0, 50);

    // Optional: cross-encoder rerank on top-50 (only if COHERE_API_KEY is set)
    const { ceRerankIfAvailable } = await import('./rankers/cross_encoder.js');
    const ce = await ceRerankIfAvailable(query, top50.map(t => ({ text: t.text })));
    const final = ce
      ? [...top50].sort((a, b) => (ce.find((x: any) => x.idx === top50.indexOf(b))?.score ?? 0) -
                                   (ce.find((x: any) => x.idx === top50.indexOf(a))?.score ?? 0))
      : top50;

    // Format results
    return final.slice(0, k).map(r => ({
      uri: r.uri,
      title: r.title,
      snippet: r.text.substring(0, 620), // Longer snippets for better context
      score: r.score
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

