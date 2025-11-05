/**
 * Context Query Tool
 * Query indexed code semantically
 */

import type { ServerContext } from '../lib/context.js';

const MAX_RESULTS = 50;

export const contextQueryDescriptor = {
  name: 'context_query',
  description: 'Query indexed code semantically. Returns ranked search results.',
  inputSchema: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Search query' },
      top_k: { type: 'number', description: 'Number of results to return (default: 12, max: 50)' },
    },
    required: ['query'],
  },
};

export async function contextQueryTool(args: any, ctx: ServerContext) {
  const query = typeof args?.query === 'string' ? args.query.trim() : '';
  if (!query) {
    return { hits: [], error: 'Query is required' };
  }

  const topK = clamp(Math.floor(Number(args?.top_k) || 12), 1, MAX_RESULTS);
  let hits: any[] = [];
  let usedFallback = false;

  try {
    const primary = await ctx.ctx.search(query, topK);
    if (Array.isArray(primary)) {
      hits = primary;
    }
  } catch (error) {
    console.error('[ThinkingTools] context_query primary search failed:', (error as Error)?.message ?? error);
  }

  if (!hits.length) {
    try {
      const blended = await ctx.blendedSearch(query, topK);
      if (Array.isArray(blended) && blended.length) {
        hits = blended;
        usedFallback = true;
      }
    } catch (error) {
      console.error('[ThinkingTools] context_query blended search failed:', (error as Error)?.message ?? error);
    }
  }

  if (!hits.length) {
    return {
      query,
      hits: [],
      rankingMode: ctx.rankingMode(),
      error: 'Search returned no results',
    };
  }

  const normalized = normalizeHits(hits, query);

  return {
    query,
    rankingMode: ctx.rankingMode(),
    usedFallback,
    totalResults: normalized.length,
    summary: buildSummary(normalized, query, usedFallback, ctx.rankingMode()),
    hits: normalized,
  };
}

function normalizeHits(rawHits: any[], query: string) {
  const tokens = tokenize(query);
  const rawScores = rawHits.map((hit) => toNumber(hit?.score));
  const normalizedScores = normalizeScores(rawScores, rawHits.length);

  return rawHits.map((hit, index) => {
    const score = normalizedScores[index];
    const path = hit?.uri ?? hit?.path ?? hit?.file ?? '';
    const title = hit?.title ?? (path ? extractFilename(path) : 'Context match');
    const snippet = buildSnippet(hit?.snippet ?? hit?.text ?? '', tokens);
    const provider = hit?._provider ?? hit?.provider ?? hit?.meta?.type ?? 'local';
    const method = hit?._method ?? hit?.method ?? hit?.meta?.method;

    return {
      rank: index + 1,
      score,
      path,
      title,
      snippet,
      provider,
      method,
      highlights: tokens.filter((token) => snippet.toLowerCase().includes(token)).slice(0, 6),
      metadata: {
        source: provider,
        method,
        length: snippet.length,
        rawScore: toNumber(hit?.score),
        extra: hit?.meta ?? null,
      },
    };
  });
}

function normalizeScores(scores: Array<number | null>, total: number): number[] {
  const valid = scores.filter((score): score is number => typeof score === 'number' && Number.isFinite(score));
  if (!valid.length) {
    return scores.map((_, index) => Number(clamp(1 - index / Math.max(1, total), 0.05, 1).toFixed(4)));
  }

  const max = Math.max(...valid);
  const min = Math.min(...valid);

  if (Math.abs(max - min) < 1e-6) {
    return scores.map((score, index) => {
      if (typeof score === 'number' && Number.isFinite(score)) {
        return Number((score > 0 ? 1 : 0).toFixed(4));
      }
      return Number(clamp(1 - index / Math.max(1, total), 0.05, 1).toFixed(4));
    });
  }

  return scores.map((score, index) => {
    if (typeof score === 'number' && Number.isFinite(score)) {
      const normalized = (score - min) / (max - min);
      return Number(clamp(normalized, 0, 1).toFixed(4));
    }
    return Number(clamp(1 - index / Math.max(1, total), 0.05, 1).toFixed(4));
  });
}

function buildSnippet(raw: string, tokens: string[]): string {
  const cleaned = raw
    .toString()
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) return '';

  if (cleaned.length <= 600) {
    return cleaned;
  }

  const lower = cleaned.toLowerCase();
  let bestIndex = 0;
  let bestScore = -1;

  for (const token of tokens) {
    const idx = lower.indexOf(token);
    if (idx >= 0 && (bestScore === -1 || idx < bestIndex)) {
      bestIndex = idx;
      bestScore = token.length;
    }
  }

  const start = Math.max(0, bestIndex - 120);
  const end = Math.min(cleaned.length, start + 600);
  const snippet = cleaned.slice(start, end);
  return start > 0 ? `…${snippet}` : snippet;
}

function buildSummary(hits: any[], query: string, usedFallback: boolean, rankingMode: string) {
  if (!hits.length) {
    return `No matches found for "${query}".`;
  }

  const top = hits[0];
  const providers = Array.from(new Set(hits.map((hit) => hit.provider))).slice(0, 3);
  const origin = usedFallback ? 'blended search (local + imported evidence)' : 'local context index';

  return `Found ${hits.length} relevant chunk${hits.length === 1 ? '' : 's'} for "${query}" via ${origin} ` +
    `(ranking: ${rankingMode}). Top match: ${top.title || top.path || 'untitled'} (${providers.join(', ')}).`;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function extractFilename(path: string): string {
  const parts = path.split(/[/\\]/);
  return parts[parts.length - 1] || path;
}

