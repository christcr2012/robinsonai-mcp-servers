/**
 * Robinson's Context Engine (RCE)
 *
 * Production-grade context engine with:
 * - Hybrid search (vector + lexical BM25)
 * - Symbol-aware search (boosts code symbols)
 * - Import graph tracking (dependency analysis)
 * - Incremental indexing (fast re-indexing)
 * - Multiple embedding providers (OpenAI, Claude/Voyage, Ollama)
 * - Intelligent model selection (best quality for best price)
 * - Graceful degradation (works without API keys)
 * - Cost tracking and optimization
 *
 * @author Robinson AI Systems
 */

// Re-export all public APIs
export * from './embeddings.js';
export * from './store.js';
export * from './symbol-aware.js';
export * from './import-graph.js';
export * from './incremental.js';

import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import { makeEmbedder, estimateEmbeddingCost, type Embedder, type EmbedderConfig } from './embeddings.js';
import { RCEStore, type StoredChunk, type IndexMeta } from './store.js';
import { selectModelForTask, detectTaskType, estimateComplexity, type TaskContext } from './model-selector.js';
import { buildSymbolIndexForRepo, applySymbolBoosting, retrieveCodeContextForQuery, getFileNeighborhood, findSymbolDefinition, findCallers, type SymbolAwareSearchOptions } from './symbol-aware.js';
import { buildImportGraph, getImporters, getImports, getDependencyChain, getDependents, type ImportGraph } from './import-graph.js';
import { incrementalIndex, needsReindexing, type IncrementalIndexResult } from './incremental.js';
import type { SymbolIndex } from '@robinson_ai_systems/shared-utils';
import type { RetrievalResult } from '@robinson_ai_systems/shared-utils';

export type RCEStats = {
  sources: number;
  chunks: number;
  vectors: number;
  mode: string;
  model?: string;
  dimensions?: number;
  totalCost?: number;
  indexedAt?: string;
};

export type RCESearchHit = {
  uri: string;
  title: string;
  snippet: string;
  score?: number;
  _provider?: string;
  _method?: 'vector' | 'lexical' | 'hybrid';
};

export class RobinsonsContextEngine {
  private indexed = false;
  private docs: { uri: string; text: string; title: string }[] = [];
  private store: RCEStore;
  private embedderConfig: EmbedderConfig;
  private symbolIndex: SymbolIndex | null = null;
  private importGraph: ImportGraph | null = null;

  constructor(private root: string, embedderConfig: EmbedderConfig = {}) {
    this.store = new RCEStore(root);
    this.embedderConfig = embedderConfig;
  }

  /**
   * Ensure repository is indexed
   */
  async ensureIndexed() {
    if (!this.indexed) {
      const meta = await this.store.readMeta();
      if (meta && meta.chunks > 0) {
        console.log(`[RCE] Using existing index: ${meta.chunks} chunks, ${meta.vectors} vectors`);
        this.indexed = true;
      } else {
        await this.indexRepo(this.root);
        this.indexed = true;
      }
    }
  }

  /**
   * Index repository with intelligent embedding provider selection
   */
  async indexRepo(
    root: string,
    exts = ['.ts', '.tsx', '.js', '.jsx', '.md', '.mdx', '.py', '.go', '.rs', '.java', '.c', '.cpp', '.h']
  ): Promise<{ files: number; chunks: number; vectors: number; cost: number }> {
    console.log(`[RCE] Starting indexing for: ${root}`);
    
    // Clear existing index
    await this.store.clear();

    // Walk directory tree
    const files: string[] = [];
    const walk = async (p: string) => {
      try {
        const ents = await fs.readdir(p, { withFileTypes: true });
        for (const e of ents) {
          const full = path.join(p, e.name);
          if (e.isDirectory()) {
            // Comprehensive ignore list for directories
            const IGNORE_DIRS = [
              'node_modules',
              'dist',
              'build',
              '.next',
              '.turbo',
              'coverage',
              '__pycache__',
              '.pytest_cache',
              'venv',
              '.venv',
              '.venv-learning',
              '.venv-prod',
              '.venv-dev',
              'site-packages',
              '.augment',
              '.robinson',
              '.backups',
              'sandbox'
            ];

            // Skip if directory name matches ignore list or starts with .git or .venv
            if (
              e.name.startsWith('.git') ||
              e.name.startsWith('.venv') ||
              IGNORE_DIRS.includes(e.name)
            ) {
              continue;
            }
            await walk(full);
          } else if (exts.includes(path.extname(e.name))) {
            files.push(full);
          }
        }
      } catch (error: any) {
        console.error(`[RCE] Error walking ${p}:`, error.message);
      }
    };

    await walk(root);
    console.log(`[RCE] Found ${files.length} files to index`);

    if (files.length === 0) {
      console.warn(`[RCE] No files found in ${root}`);
      return { files: 0, chunks: 0, vectors: 0, cost: 0 };
    }

    this.docs = [];

    // Intelligent task-based model selection
    const taskContext: TaskContext = {
      type: detectTaskType(exts),
      complexity: estimateComplexity(files.length, 2000), // Assume avg 2KB per file
      fileExtensions: exts,
      estimatedTokens: files.length * 500, // Rough estimate
      preferQuality: this.embedderConfig.preferQuality ?? (process.env.EMBED_PREFER_QUALITY === '1'),
      maxCostPer1M: this.embedderConfig.maxCostPer1M ?? parseFloat(process.env.EMBED_MAX_COST_PER_1M ?? '0.15')
    };

    const recommendation = selectModelForTask(taskContext);

    if (recommendation) {
      console.log(`[RCE] 🎯 Intelligent Model Selection:`);
      console.log(`[RCE]   Task: ${taskContext.type} (${taskContext.complexity})`);
      console.log(`[RCE]   Selected: ${recommendation.provider}/${recommendation.model}`);
      console.log(`[RCE]   Reasoning: ${recommendation.reasoning}`);
      console.log(`[RCE]   Quality: ${recommendation.qualityScore}/100, Cost: $${recommendation.costPer1M}/1M`);

      // Override embedder config with recommended model
      this.embedderConfig = {
        ...this.embedderConfig,
        provider: recommendation.provider,
        model: recommendation.model
      };
    }

    // Create embedder with intelligent model selection
    const embedder = makeEmbedder(this.embedderConfig);
    
    if (embedder) {
      console.log(`[RCE] Using ${embedder.name}/${embedder.model} for embeddings`);
      console.log(`[RCE] Cost: $${embedder.costPer1M}/1M tokens, Dimensions: ${embedder.dimensions}`);
    } else {
      console.log(`[RCE] No embedder configured, using lexical search only`);
    }

    const batch: StoredChunk[] = [];
    let chunkCount = 0;
    let vecCount = 0;
    let totalTokens = 0;
    let errors = 0;

    for (let fileIdx = 0; fileIdx < files.length; fileIdx++) {
      const f = files[fileIdx];
      try {
        const text = await fs.readFile(f, 'utf8');
        const title = path.basename(f);
        const relPath = path.relative(root, f);
        
        this.docs.push({ uri: relPath, text, title });
        
        // Chunk text
        const parts = chunk(text, 1200);
        const hashes = parts.map(p => 
          crypto.createHash('sha1').update(relPath + '|' + p).digest('hex')
        );

        // Estimate tokens for cost tracking
        const fileTokens = parts.reduce((sum, p) => sum + Math.ceil(p.length / 4), 0);
        totalTokens += fileTokens;

        // Generate embeddings (optional)
        let vecs: number[][] = [];
        if (embedder) {
          try {
            // Embed in mini-batches to avoid OOM and rate limits
            const batchSize = 64;
            for (let i = 0; i < parts.length; i += batchSize) {
              const seg = parts.slice(i, i + batchSize);
              const e = await embedder.embed(seg);
              vecs.push(...e);
            }
          } catch (embedError: any) {
            console.error(`[RCE] Embedding failed for ${relPath}:`, embedError.message);
            errors++;
            // Continue without embeddings for this file
          }
        }

        // Create chunks
        for (let i = 0; i < parts.length; i++) {
          const chunkId = crypto.createHash('sha1').update(relPath + '|' + i).digest('hex');
          batch.push({
            id: chunkId,
            file: relPath,
            hash: hashes[i],
            uri: relPath,
            title,
            text: parts[i],
            vec: vecs[i],
            metadata: {
              start: i * 1200,
              end: Math.min((i + 1) * 1200, text.length),
              language: detectLanguage(f),
              size: parts[i].length
            }
          });
          chunkCount++;
          if (vecs[i]) vecCount++;

          // Write in batches to avoid memory issues
          if (batch.length >= 200) {
            await this.store.writeChunks(batch.splice(0, batch.length));
          }
        }

        // Progress logging
        if ((fileIdx + 1) % 100 === 0 || fileIdx === files.length - 1) {
          console.log(`[RCE] Progress: ${fileIdx + 1}/${files.length} files, ${chunkCount} chunks, ${vecCount} vectors`);
        }
      } catch (error: any) {
        console.error(`[RCE] Error processing ${f}:`, error.message);
        errors++;
      }
    }

    // Write remaining chunks
    if (batch.length) {
      await this.store.writeChunks(batch);
    }

    // Calculate total cost
    const totalCost = embedder ? estimateEmbeddingCost(totalTokens, embedder) : 0;

    // Save metadata
    const meta: IndexMeta = {
      sources: files.length,
      chunks: chunkCount,
      vectors: vecCount,
      provider: embedder?.name ?? 'none',
      model: embedder?.model,
      dimensions: embedder?.dimensions,
      indexedAt: new Date().toISOString(),
      totalCost
    };

    await this.store.saveMeta(meta);

    console.log(`[RCE] ✅ Indexing complete:`);
    console.log(`  - Files: ${files.length}`);
    console.log(`  - Chunks: ${chunkCount}`);
    console.log(`  - Vectors: ${vecCount}`);
    console.log(`  - Errors: ${errors}`);
    console.log(`  - Total cost: $${totalCost.toFixed(4)}`);

    return { files: files.length, chunks: chunkCount, vectors: vecCount, cost: totalCost };
  }

  /**
   * Hybrid search: Vector similarity + Lexical BM25 + Symbol-aware boosting
   * Always returns results (graceful degradation to lexical if no vectors)
   */
  async search(q: string, k = 12, options: SymbolAwareSearchOptions = {}): Promise<RCESearchHit[]> {
    await this.ensureIndexed();

    const chunks = await this.store.loadAll();
    if (chunks.length === 0) {
      console.warn('[RCE] No chunks in index');
      return [];
    }

    // Tokenize query
    const terms = tokenize(q);

    // Lexical scoring (BM25-ish)
    let scored = chunks.map(c => ({ c, s: bm25Score(terms, c.text) }));

    // Apply symbol-aware boosting if symbol index is available
    if (this.symbolIndex) {
      scored = applySymbolBoosting(scored, q, this.symbolIndex, options);
    }

    // Apply language-aware boosting (boost TypeScript, penalize tests and Python)
    scored = applyLanguageBoosting(scored, 'typescript');

    // Check if we have vectors
    const hasVectors = scored.some(x => Array.isArray(x.c.vec) && x.c.vec.length > 0);

    let method: 'vector' | 'lexical' | 'hybrid' = 'lexical';

    if (hasVectors) {
      // Generate query embedding for vector similarity
      try {
        const embedder = makeEmbedder(this.embedderConfig);
        if (!embedder) {
          console.warn('[RCE] No embedder available, falling back to lexical search');
          method = 'lexical';
        } else {
          const qvec = await embedder.embed([q]);
          const queryVector = qvec[0];

          // Compute vector similarity for each chunk
          scored = scored.map(({ c, s }) => {
            if (c.vec && c.vec.length > 0) {
              const vecScore = cosineSimilarity(queryVector, c.vec);
              // Hybrid: 70% vector, 30% lexical
              return { c, s: 0.7 * vecScore + 0.3 * s };
            }
            // Penalize chunks without vectors (fallback to lexical only)
            return { c, s: s * 0.3 };
          });

          method = 'hybrid';
        }
      } catch (error: any) {
        console.warn('[RCE] Vector search failed, falling back to lexical:', error.message);
        method = 'lexical';
      }
    }

    // Sort by score
    scored.sort((a, b) => b.s - a.s);

    // Return top-k results
    return scored.slice(0, k).map(({ c, s }) => ({
      uri: c.uri,
      title: c.title,
      snippet: bestSnippet(c.text, terms, 360),
      score: s,
      _provider: c.vec ? 'vector+lexical' : 'lexical',
      _method: method
    }));
  }

  /**
   * Get index statistics
   */
  async stats(): Promise<RCEStats> {
    const meta = await this.store.readMeta();
    if (!meta) {
      return {
        sources: 0,
        chunks: 0,
        vectors: 0,
        mode: 'not_indexed'
      };
    }

    return {
      sources: meta.sources,
      chunks: meta.chunks,
      vectors: meta.vectors,
      mode: meta.provider,
      model: meta.model,
      dimensions: meta.dimensions,
      totalCost: meta.totalCost,
      indexedAt: meta.indexedAt
    };
  }

  /**
   * Reset index (clear all data)
   */
  async reset() {
    await this.store.clear();
    this.indexed = false;
    this.docs = [];
    this.symbolIndex = null;
    this.importGraph = null;
    console.log('[RCE] Index reset');
  }

  /**
   * Build symbol index (enables symbol-aware search)
   */
  async buildSymbolIndex(): Promise<void> {
    console.log('[RCE] Building symbol index...');
    this.symbolIndex = await buildSymbolIndexForRepo(this.root, {
      exts: ['.ts', '.tsx', '.js', '.jsx'],
      maxFiles: 2000,
      exclude: ['node_modules', 'dist', 'build', '.next', 'coverage', '__generated__'],
    });
    console.log(`[RCE] Symbol index built: ${this.symbolIndex?.symbols.length ?? 0} symbols`);
  }

  /**
   * Build import graph (enables dependency tracking)
   */
  async buildImportGraph(files: string[]): Promise<void> {
    console.log('[RCE] Building import graph...');
    this.importGraph = await buildImportGraph(files, this.root);
    console.log(`[RCE] Import graph built: ${this.importGraph.imports.size} files`);
  }

  /**
   * Get file neighborhood (imports + importers + symbols)
   */
  getNeighborhood(file: string): ReturnType<typeof getFileNeighborhood> | null {
    if (!this.symbolIndex) {
      console.warn('[RCE] Symbol index not built, call buildSymbolIndex() first');
      return null;
    }
    return getFileNeighborhood(file, this.symbolIndex);
  }

  /**
   * Find symbol definition
   */
  findSymbol(symbolName: string): ReturnType<typeof findSymbolDefinition> {
    if (!this.symbolIndex) {
      console.warn('[RCE] Symbol index not built, call buildSymbolIndex() first');
      return null;
    }
    return findSymbolDefinition(symbolName, this.symbolIndex);
  }

  /**
   * Find all callers of a function
   */
  findCallersOf(functionName: string): ReturnType<typeof findCallers> {
    if (!this.symbolIndex) {
      console.warn('[RCE] Symbol index not built, call buildSymbolIndex() first');
      return [];
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
  }): Promise<RetrievalResult> {
    return retrieveCodeContextForQuery(this.root, query);
  }

  /**
   * Get files that import a given file
   */
  getImporters(file: string): string[] {
    if (!this.importGraph) {
      console.warn('[RCE] Import graph not built, call buildImportGraph() first');
      return [];
    }
    return getImporters(file, this.importGraph);
  }

  /**
   * Get files imported by a given file
   */
  getImports(file: string): string[] {
    if (!this.importGraph) {
      console.warn('[RCE] Import graph not built, call buildImportGraph() first');
      return [];
    }
    return getImports(file, this.importGraph);
  }

  /**
   * Get dependency chain for a file
   */
  getDependencyChain(file: string, maxDepth = 3): Set<string> {
    if (!this.importGraph) {
      console.warn('[RCE] Import graph not built, call buildImportGraph() first');
      return new Set();
    }
    return getDependencyChain(file, this.importGraph, maxDepth);
  }

  /**
   * Get dependents of a file (reverse dependency chain)
   */
  getDependents(file: string, maxDepth = 3): Set<string> {
    if (!this.importGraph) {
      console.warn('[RCE] Import graph not built, call buildImportGraph() first');
      return new Set();
    }
    return getDependents(file, this.importGraph, maxDepth);
  }

  /**
   * Perform incremental indexing (only re-index changed files)
   */
  async incrementalIndex(files: string[]): Promise<IncrementalIndexResult> {
    const embedder = makeEmbedder(this.embedderConfig);
    return incrementalIndex(this.root, files, this.store, embedder);
  }

  /**
   * Check if re-indexing is needed
   */
  async needsReindexing(files: string[]): Promise<boolean> {
    return needsReindexing(files, this.root, this.store);
  }
}

// Helper functions
function tokenize(t: string) {
  return t.toLowerCase().replace(/[^a-z0-9_\s]/g, ' ').split(/\s+/).filter(Boolean);
}

function chunk(t: string, size: number) {
  const out: string[] = [];
  for (let i = 0; i < t.length; i += size) {
    out.push(t.slice(i, i + size));
  }
  return out;
}

function termFreq(terms: string[], text: string) {
  const toks = tokenize(text);
  const map = new Map<string, number>();
  for (const w of toks) map.set(w, (map.get(w) ?? 0) + 1);
  return terms.map(w => map.get(w) ?? 0);
}

function bm25Score(terms: string[], text: string) {
  const tf = termFreq(terms, text);
  return tf.reduce((a, b) => a + b, 0) / (1 + text.length / 2000);
}

function bestSnippet(text: string, terms: string[], max = 360) {
  const lower = text.toLowerCase();
  let idx = 0, best = 0;
  for (const t of terms) {
    const i = lower.indexOf(t);
    if (i >= 0 && (best === 0 || i < best)) {
      best = i;
      idx = i;
    }
  }
  const start = Math.max(0, idx - Math.floor(max / 2));
  return text.slice(start, start + max).replace(/\s+/g, ' ');
}

function detectLanguage(filePath: string): string {
  const ext = path.extname(filePath);
  const langMap: Record<string, string> = {
    '.ts': 'typescript',
    '.tsx': 'typescript',
    '.js': 'javascript',
    '.jsx': 'javascript',
    '.py': 'python',
    '.go': 'go',
    '.rs': 'rust',
    '.java': 'java',
    '.c': 'c',
    '.cpp': 'cpp',
    '.h': 'c',
    '.md': 'markdown',
    '.mdx': 'markdown'
  };
  return langMap[ext] || 'unknown';
}

/**
 * Cosine similarity between two vectors
 * Returns a value between 0 (completely dissimilar) and 1 (identical)
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length !== b.length || a.length === 0) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dotProduct / denominator;
}

/**
 * Apply language-aware boosting to search results
 * Boosts TypeScript/JavaScript files, heavily penalizes test files and Python files
 */
function applyLanguageBoosting(
  chunks: Array<{ c: StoredChunk; s: number }>,
  projectLanguage: 'typescript' | 'python' | 'mixed' = 'typescript'
): Array<{ c: StoredChunk; s: number }> {
  return chunks.map(({ c, s }) => {
    let boostedScore = s;
    const uri = c.uri.toLowerCase();

    // Boost TypeScript/JavaScript files in TypeScript projects
    if (projectLanguage === 'typescript' || projectLanguage === 'mixed') {
      if (uri.endsWith('.ts') || uri.endsWith('.tsx') || uri.endsWith('.js') || uri.endsWith('.jsx')) {
        boostedScore *= 2.0;
      }
    }

    // Boost Python files in Python projects
    if (projectLanguage === 'python' && uri.endsWith('.py')) {
      boostedScore *= 2.0;
    }

    // Heavy penalty for test files (90% reduction)
    if (
      uri.includes('/tests/') ||
      uri.includes('\\tests\\') ||
      uri.includes('/test/') ||
      uri.includes('\\test\\') ||
      uri.includes('test_') ||
      uri.includes('.test.') ||
      uri.includes('.spec.') ||
      uri.includes('__tests__')
    ) {
      boostedScore *= 0.1;
    }

    // Penalty for Python files in TypeScript projects (80% reduction)
    if (projectLanguage === 'typescript' && uri.endsWith('.py')) {
      boostedScore *= 0.2;
    }

    // Heavy penalty for files in site-packages or venv (95% reduction)
    if (uri.includes('site-packages') || uri.includes('venv') || uri.includes('.venv')) {
      boostedScore *= 0.05;
    }

    // Boost source files over config/build files
    if (uri.includes('/src/') || uri.includes('\\src\\')) {
      boostedScore *= 1.5;
    }

    return { c, s: boostedScore };
  });
}

