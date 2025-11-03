/**
 * Shared state store for thinking tools
 * Provides session-based state management across all tools
 */

export type SessionKey = { workspaceRoot: string; convoId: string };
type KV = Record<string, any>;

class StateStore {
  private cache = new Map<string, KV>();
  
  private key(k: SessionKey): string {
    return `${k.workspaceRoot}::${k.convoId}`;
  }

  get(k: SessionKey): KV {
    return this.cache.get(this.key(k)) ?? {};
  }

  set(k: SessionKey, v: KV): void {
    this.cache.set(this.key(k), v);
  }

  update(k: SessionKey, updater: (v: KV) => KV): KV {
    const cur = this.get(k);
    this.set(k, updater(cur));
    return this.get(k);
  }

  clear(k: SessionKey): void {
    this.cache.delete(this.key(k));
  }

  clearAll(): void {
    this.cache.clear();
  }
}

export const state = new StateStore();

