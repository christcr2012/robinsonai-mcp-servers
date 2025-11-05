import { request } from 'undici';
import { resolveWorkspaceRoot } from '../lib/workspace.js';

export type EmbeddingProvider = 'ollama' | 'openai' | 'voyage' | 'none';

export interface ContextEngineConfig {
  embeddingProvider: EmbeddingProvider;
  embedModel: string;
  workspaceRoot: string;
  ttlMs: number;
  maxFiles: number;
  compressionEnabled: boolean;
  maxDiskUsageMb: number;
  inMemoryThreshold: number;
  styleLearning: boolean;
  behaviorLearning: boolean;
  architectureLearning: boolean;
  quickFallbackWaitMs: number;
}

const DEFAULT_CONFIG: ContextEngineConfig = {
  embeddingProvider: 'ollama',
  embedModel: 'nomic-embed-text',
  workspaceRoot: resolveWorkspaceRoot(),
  ttlMs: 20 * 60 * 1000,
  maxFiles: 150_000,
  compressionEnabled: true,
  maxDiskUsageMb: 2048,
  inMemoryThreshold: 45,
  styleLearning: true,
  behaviorLearning: true,
  architectureLearning: true,
  quickFallbackWaitMs: 1200,
};

async function isOllamaAvailable(): Promise<boolean> {
  const base = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
  try {
    const res = await request(`${base.replace(/\/$/, '')}/api/tags`, { method: 'GET' });
    return res.statusCode >= 200 && res.statusCode < 500;
  } catch {
    return false;
  }
}

async function detectEmbeddingProvider(): Promise<{ provider: EmbeddingProvider; model: string }> {
  if (process.env.OPENAI_API_KEY) {
    return {
      provider: 'openai',
      model: process.env.OPENAI_EMBED_MODEL || 'text-embedding-3-small',
    };
  }

  if (process.env.VOYAGE_API_KEY || process.env.ANTHROPIC_API_KEY) {
    return {
      provider: 'voyage',
      model: process.env.VOYAGE_EMBED_MODEL || 'voyage-code-2',
    };
  }

  if (await isOllamaAvailable()) {
    return {
      provider: 'ollama',
      model: process.env.OLLAMA_EMBED_MODEL || 'nomic-embed-text',
    };
  }

  return {
    provider: 'none',
    model: 'lexical-fallback',
  };
}

export async function loadContextEngineConfig(
  overrides: Partial<ContextEngineConfig> = {},
): Promise<ContextEngineConfig> {
  const detected = await detectEmbeddingProvider();
  const workspaceRoot = overrides.workspaceRoot || process.env.WORKSPACE_ROOT || DEFAULT_CONFIG.workspaceRoot;

  const config: ContextEngineConfig = {
    ...DEFAULT_CONFIG,
    ...overrides,
    workspaceRoot,
    embeddingProvider: overrides.embeddingProvider || detected.provider,
    embedModel: overrides.embedModel || detected.model,
    compressionEnabled:
      overrides.compressionEnabled !== undefined
        ? overrides.compressionEnabled
        : DEFAULT_CONFIG.compressionEnabled,
  };

  return config;
}

export function applyConfigToEnvironment(config: ContextEngineConfig): void {
  process.env.CTX_EMBED_PROVIDER = config.embeddingProvider;
  process.env.RCE_EMBED_MODEL = config.embedModel;
  process.env.RCE_INDEX_TTL_MINUTES = Math.max(5, Math.round(config.ttlMs / 60000)).toString();
  process.env.RCE_MAX_CHANGED_PER_RUN = Math.max(50, Math.min(2000, config.maxFiles)).toString();
  process.env.RCE_COMPRESS = config.compressionEnabled ? '1' : '0';
  process.env.CTX_CACHE_TTL_MINUTES = Math.max(5, Math.round(config.ttlMs / 60000)).toString();
  process.env.CTX_AUTO_WATCH = process.env.CTX_AUTO_WATCH || '1';
}

