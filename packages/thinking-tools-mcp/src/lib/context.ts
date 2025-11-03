/**
 * Server context for thinking tools
 * Provides unified access to state, workspace, and context engine
 */

import { state, SessionKey } from './state.js';
import { resolveWorkspaceRoot } from './workspace.js';
import { ContextEngine } from '../context/engine.js';

export type ServerContext = {
  workspaceRoot: string;
  convoId: string;
  stateGet: <T = any>(k: string) => T | undefined;
  stateSet: (k: string, v: any) => void;
  stateUpdate: <T = any>(k: string, updater: (v: T | undefined) => T) => T;
  ctx: ContextEngine;
};

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

  return {
    workspaceRoot,
    convoId,
    ctx,
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

