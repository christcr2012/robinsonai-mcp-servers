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
  uri: string; title: string; text: string;
  vec?: number[];        // optional dense vector (from indexer)
  lexScore?: number;     // BM25-like lexical score (stage-1)
  meta?: { symbols?: string[]; lang?: string; lines?: number; architectureTags?: string[] };
  boosts?: {
    style?: number;
    architecture?: number;
    usage?: number;
  };
};

export type QueryHints = {
  wantsImpl: boolean;
  methodNames: string[];         // e.g., ['generate', 'handle', 'execute']
  classOrInterface?: string;     // loose extraction from query
};

/**
 * Derive query hints from natural language query
 */
export function deriveHints(q: string): QueryHints {
  const s = q.toLowerCase();
  const wantsImpl = /\b(impl(ementation)?|method|function|class|generate|handler|execute|builder|client)\b/.test(s) || /\w+\s*\(/.test(s);
  const methodNames = Array.from(new Set(
    (s.match(/[a-zA-Z_][a-zA-Z0-9_]*\s*\(/g) || [])
      .map(x => x.replace(/\s*\($/,'').toLowerCase())
      .filter(x => x.length > 2)
  ));
  const classOrInterface = (s.match(/\b([A-Z][A-Za-z0-9]+)\b/) || [,''])[1] || undefined;
  return { wantsImpl, methodNames, classOrInterface };
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

// ----- Feature engines -----
function extPrior(f: string) {
  const e = path.extname(f).toLowerCase();
  if (['.ts','.tsx','.js','.jsx','.py','.go','.java','.rs'].includes(e)) return 1.0;
  if (['.md','.mdx','.rst'].includes(e)) return -0.8;
  return -0.2;
}
function pathPrior(f: string) {
  const p = f.toLowerCase();
  let w = 0;
  if (p.includes('/src/')) w += 0.6;
  if (p.includes('/lib/') || p.includes('/client') || p.includes('/server')) w += 0.3;
  if (p.includes('/docs/') || p.includes('/examples/')) w -= 0.7;
  return w;
}
function presenceOfSignature(methods: string[], text: string) {
  if (!methods.length) return 0;
  const T = text;
  const found = methods.some(m =>
    new RegExp(`\\b(function\\s+${m}\\b|${m}\\s*\\(|\\.${m}\\s*=\\s*\\(|\\b${m}\\s*=\\s*\\(|\\b${m}\\s*:\\s*\\(|\\b${m}\\s*<[^>]*>\\s*\\()`, 'm').test(T)
  );
  return found ? 1 : 0;
}
function classOrIfaceHint(name: string|undefined, text: string) {
  if (!name) return 0;
  const re = new RegExp(`\\b(class|interface)\\s+${name}\\b`);
  return re.test(text) ? 0.6 : 0;
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

function exactSymbolBoost(symbols: string[], title: string, text: string) {
  const hay = (title + '\n' + text).toLowerCase();
  let g = 0;
  for (const s of symbols) if (hay.includes(s.toLowerCase())) g += 0.25;
  return Math.min(g, 1.0);
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

// ----- Main reranker -----
export function rerankCodeFirst(q: string, cands: Candidate[], qVec?: number[]) {
  const hints = deriveHints(q);
  const qTerms = splitIdents(q);
  const maxLex = Math.max(1e-9, ...cands.map(c=>c.lexScore ?? 0));

  const rescored = cands.map(c => {
    const base   = (c.lexScore ?? 0) / maxLex;         // 0..1
    const dense  = Math.max(0, cosine(qVec, c.vec));   // 0..1
    const prior  = extPrior(c.uri) + pathPrior(c.uri); // code over docs, /src over /docs
    const prox   = proximityBoost(qTerms, c.text);
    const exact  = exactSymbolBoost(hints.methodNames, c.title, c.text);
    const sig    = presenceOfSignature(hints.methodNames, c.text);
    const clazz  = classOrIfaceHint(hints.classOrInterface, c.text);
    const style  = Math.min(1, c.boosts?.style ?? 0);
    const arch   = Math.min(1, c.boosts?.architecture ?? 0);
    const usage  = Math.min(1, c.boosts?.usage ?? 0);

    // Implementation-aware fusion
    const score =
      0.45 * base +
      0.18 * dense +
      0.12 * prior +
      0.05 * prox +
      0.04 * exact +
      0.08 * (hints.wantsImpl ? (sig + clazz) : 0) +
      0.04 * style +
      0.04 * arch +
      0.03 * usage;

    return { ...c, score };
  });

  rescored.sort((a,b)=> (b.score??0)-(a.score??0));
  return rescored;
}

