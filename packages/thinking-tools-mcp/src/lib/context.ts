/**
 * Server context for thinking tools
 * Provides unified access to state, workspace, and context engine
 */

import { state, SessionKey } from './state.js';
import { resolveWorkspaceRoot } from './workspace.js';
import { ContextEngine } from '../context/engine.js';
import { EvidenceStore } from '../context/evidence.js';

function ensureScores(items: any[], fallbackStart: number, limit?: number): any[] {
  const capped = typeof limit === 'number' ? items.slice(0, limit) : items;
  return capped.map((item, idx) => {
    if (!item || typeof item !== 'object') {
      return item;
    }

    const numericScore = typeof item.score === 'number' && Number.isFinite(item.score)
      ? item.score
      : undefined;

    if (numericScore !== undefined) {
      return item;
    }

    const rankScore = typeof item.rank === 'number' && Number.isFinite(item.rank)
      ? 1 / Math.max(1, item.rank + 1)
      : undefined;

    const fallback = Math.max(0.01, fallbackStart - idx * 0.05);
    return {
      ...item,
      score: rankScore ?? fallback,
    };
  });
}

export type ServerContext = {
  workspaceRoot: string;
  convoId: string;
  stateGet: <T = any>(k: string) => T | undefined;
  stateSet: (k: string, v: any) => void;
  stateUpdate: <T = any>(k: string, updater: (v: T | undefined) => T) => T;
  ctx: ContextEngine;
  evidence: EvidenceStore;
  setRankingMode: (m: 'local' | 'imported' | 'blend') => void;
  rankingMode: () => 'local' | 'imported' | 'blend';
  blendedSearch: (q: string, k?: number) => Promise<any[]>;
};

// Global ranking mode (can be overridden per context)
let _ranking: 'local' | 'imported' | 'blend' =
  (process.env.CTX_RANKING as any) ?? 'blend';

/**
 * Build server context from tool arguments
 * Extracts workspace root and conversation ID, provides state accessors
 */
export function buildServerContext(args: any): ServerContext {
  const workspaceRoot = resolveWorkspaceRoot();
  const convoId = String(args?.convoId ?? args?.conversationId ?? 'default');

  const key: SessionKey = { workspaceRoot, convoId };
  const kv = state.get(key);

  const ctx = ContextEngine.get(workspaceRoot);
  const evidence = ctx.evidence;

  // Ranking helpers
  const setRankingMode = (m: 'local' | 'imported' | 'blend') => {
    _ranking = m;
  };

  const rankingMode = () => _ranking;

  const blendedSearch = async (q: string, k = 12) => {
    const localRaw = await ctx.search(q, k);
    const importedRaw = await evidence.find({ source: 'context7', text: q });

    const local = ensureScores(localRaw, 0.85, k);
    const imported = ensureScores(importedRaw, 0.65, k);

    if (_ranking === 'local') return local.slice(0, k);
    if (_ranking === 'imported') return imported.slice(0, k);

    // Blend: interleave by score (if present), otherwise alternate
    const score = (x: any) => x.score ?? x.rank ?? 0;
    const A = [...local].sort((a, b) => score(b) - score(a));
    const B = [...imported].sort((a, b) => score(b) - score(a));

    const out: any[] = [];
    while ((A.length || B.length) && out.length < k) {
      if (A.length) out.push(A.shift());
      if (B.length && out.length < k) out.push(B.shift());
    }
    return out;
  };

  return {
    workspaceRoot,
    convoId,
    ctx,
    evidence,
    setRankingMode,
    rankingMode,
    blendedSearch,
    stateGet: <T = any>(k: string): T | undefined => kv[k] as T | undefined,
    stateSet: (k: string, v: any) => {
      state.update(key, (s) => ({ ...s, [k]: v }));
    },
    stateUpdate: <T = any>(k: string, updater: (v: T | undefined) => T): T => {
      const updated = state.update(key, (s) => ({
        ...s,
        [k]: updater(s[k] as T | undefined),
      }));
      return updated[k] as T;
    },
  };
}

