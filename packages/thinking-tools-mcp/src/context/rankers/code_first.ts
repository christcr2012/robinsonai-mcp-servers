/**
 * Code-First Reranker for Robinson's Context Engine
 * 
 * Implements state-of-the-art retrieval practices:
 * - Hybrid BM25 + embeddings
 * - Code-aware priors (file type, path, symbols)
 * - RRF (Reciprocal Rank Fusion)
 * - Proximity boosting
 * - Exact symbol matching
 * 
 * Based on current research and vendor best practices.
 */

import path from 'node:path';

export type Candidate = {
  uri: string;
  title: string;
  text: string;
  vec?: number[]; // optional vectors from indexer
  lexScore?: number; // bm25-like lexical score
};

export type QueryHints = {
  wantsImplementation: boolean;
  symbols: string[];
  isCodeQuery: boolean;
};

/**
 * Derive query hints from natural language query
 */
export function deriveHints(q: string): QueryHints {
  const s = q.toLowerCase();
  const wantsImplementation = /\b(impl(ementation)?|method|function|class|generate|handler|service)\b/.test(s);
  const symbols = Array.from(new Set(
    s.split(/[^a-z0-9_]+/).filter(x => x.length > 2)
  ));
  const isCodeQuery = wantsImplementation || /\b(ts|js|tsx|py|go|java|ts\-node|typescript|interface)\b/.test(s);
  return { wantsImplementation, symbols, isCodeQuery };
}

/**
 * Split identifiers on camelCase and snake_case
 */
function splitIdents(text: string): string[] {
  return text
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

/**
 * File type prior: code files rank higher than docs
 */
function typePrior(f: string): number {
  const ext = path.extname(f).toLowerCase();
  if (['.ts', '.tsx', '.js', '.jsx', '.py', '.go', '.java', '.rs'].includes(ext)) return 1.0;
  if (['.md', '.mdx', '.rst'].includes(ext)) return -0.3;
  return 0;
}

/**
 * Path prior: /src/ ranks higher than /docs/
 */
function pathPrior(f: string): number {
  const p = f.toLowerCase();
  let w = 0;
  if (p.includes('/src/')) w += 0.4;
  if (p.includes('/lib/') || p.includes('/client') || p.includes('/server')) w += 0.2;
  if (p.includes('/docs/') || p.includes('/examples/')) w -= 0.4;
  return w;
}

/**
 * Proximity boost: terms close together = higher relevance
 */
function proximityBoost(queryTerms: string[], text: string): number {
  const T = text.toLowerCase();
  let best = Infinity;
  for (const t1 of queryTerms) {
    for (const t2 of queryTerms) {
      const i = T.indexOf(t1);
      const j = T.indexOf(t2);
      if (i >= 0 && j >= 0) {
        best = Math.min(best, Math.abs(i - j));
      }
    }
  }
  if (!isFinite(best)) return 0;
  return best < 60 ? 0.6 : best < 160 ? 0.25 : 0;
}

/**
 * Exact symbol boost: query symbols found in text
 */
function exactSymbolBoost(symbols: string[], text: string, title: string): number {
  const hay = (title + '\n' + text).toLowerCase();
  let gain = 0;
  for (const s of symbols) {
    if (s.length > 2 && hay.includes(s.toLowerCase())) {
      gain += 0.25;
    }
  }
  return Math.min(gain, 1.0);
}

/**
 * Cosine similarity between two vectors
 */
function cosine(a?: number[], b?: number[]): number {
  if (!a || !b) return 0;
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length && i < b.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (!na || !nb) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

/**
 * Rerank candidates using code-first heuristics
 * 
 * Combines:
 * - Lexical score (BM25-like) - 55%
 * - Dense vector similarity - 25%
 * - File type/path priors - 10%
 * - Proximity boosting - 6%
 * - Exact symbol matching - 4%
 * - Implementation bonus - 10% (if query wants implementation)
 * 
 * This is RRF-inspired fusion with tunable weights.
 */
export function rerankCodeFirst(q: string, cands: Candidate[], qVec?: number[]): Array<Candidate & { score: number }> {
  const hints = deriveHints(q);
  const qTerms = splitIdents(q);
  
  // Normalize lex scores to 0..1
  const maxLex = Math.max(1e-9, ...cands.map(c => c.lexScore ?? 0));

  const rescored = cands.map(c => {
    const base = (c.lexScore ?? 0) / maxLex;           // 0..1
    const dense = cosine(qVec, c.vec);                 // -1..1
    const prior = typePrior(c.uri) + pathPrior(c.uri); // code over docs, /src over /docs
    const prox = proximityBoost(qTerms, c.text);
    const exact = exactSymbolBoost(hints.symbols, c.text, c.title);

    // RRF-ish fusion with tunable weights
    const score =
      0.55 * base +                                    // lexical (BM25-like)
      0.25 * Math.max(0, dense) +                      // vector sim (optional)
      0.10 * prior +
      0.06 * prox +
      0.04 * exact +
      (hints.wantsImplementation ? 0.10 : 0);

    return { ...c, score };
  });

  rescored.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  return rescored;
}

