/**
 * Server context for thinking tools
 * Provides unified access to state, workspace, and context engine
 */

import { state, SessionKey } from './state.js';
import { resolveWorkspaceRoot } from './workspace.js';
import { ContextEngine } from '../context/engine.js';
import { EvidenceStore, EvidenceItem } from '../context/evidence.js';

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

  const normalizeLocalHits = (hits: any[], limit: number) => {
    return hits
      .map((hit, index) => ({
        ...hit,
        source: hit.source ?? 'workspace',
        snippet: hit.snippet ?? hit.text ?? hit.content ?? '',
        content: hit.content ?? hit.snippet ?? hit.text ?? '',
        uri: hit.uri ?? hit.path ?? hit.file ?? '',
        score: typeof hit.score === 'number'
          ? hit.score
          : typeof hit.rank === 'number'
            ? hit.rank
            : Math.max(0, 1 - index / Math.max(1, limit * 2)),
      }))
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  };

  const normalizeImportedHits = (items: EvidenceItem[], limit: number) => {
    return items
      .map((item, index) => {
        const data = item.data ?? {};
        const snippet = item.snippet ?? data.snippet ?? data.summary ?? '';
        const uri = item.uri ?? data.uri ?? data.path ?? '';
        const source = item.source ?? data.source ?? 'context7';
        const rawContent = data.content ?? data.snippet ?? '';

        return {
          ...item,
          source,
          snippet: snippet || rawContent,
          content: snippet || rawContent,
          uri,
          score: typeof item.score === 'number'
            ? item.score
            : typeof data.score === 'number'
              ? data.score
              : Math.max(0.05, 0.45 - index / Math.max(2, limit * 2)),
        };
      })
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  };

  const blendedSearch = async (q: string, k = 12) => {
    const localRaw = await ctx.search(q, Math.max(k, 12));
    const importedRaw = await evidence.find({ source: 'context7', text: q });

    const local = normalizeLocalHits(localRaw, k);
    const imported = normalizeImportedHits(importedRaw.slice(0, k * 3), k);

    if (_ranking === 'local') return local.slice(0, k);
    if (_ranking === 'imported') return imported.slice(0, k);

    const out: any[] = [];
    let li = 0;
    let ii = 0;
    while ((li < local.length || ii < imported.length) && out.length < k) {
      if (li < local.length) {
        out.push(local[li++]);
      }
      if (ii < imported.length && out.length < k) {
        out.push(imported[ii++]);
      }
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

