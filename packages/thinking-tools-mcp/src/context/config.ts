import { request } from 'undici';
import { resolveWorkspaceRoot } from '../lib/workspace.js';

export type EmbeddingProvider = 'ollama' | 'openai' | 'claude' | 'voyage' | 'lexical';

export interface ContextConfig {
  workspaceRoot: string;
  contextRoot: string;
  embedding: {
    provider: EmbeddingProvider;
    model: string;
    fallbackDimensions: number;
  };
  indexing: {
    ttlMinutes: number;
    maxChangedFiles: number;
    lazyIndexing: boolean;
    backgroundIndexing: boolean;
    quickFileLimit: number;
  };
  storage: {
    compressionEnabled: boolean;
    maxDiskUsageMb: number;
    autoCleanup: boolean;
  };
  styleLearning: {
    enabled: boolean;
  };
  architectureLearning: {
    enabled: boolean;
  };
  behaviorLearning: {
    enabled: boolean;
  };
}

let cachedConfig: ContextConfig | null = null;
let loadPromise: Promise<ContextConfig> | null = null;

async function detectOllama(baseUrl: string): Promise<boolean> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 700).unref?.();

  try {
    const url = baseUrl.replace(/\/?$/, '') + '/api/tags';
    const response = await request(url, {
      method: 'GET',
      signal: controller.signal,
      headers: { 'accept': 'application/json' }
    });

    if (response.statusCode >= 200 && response.statusCode < 300) {
      await response.body.dump();
      return true;
    }
  } catch (error) {
    // ignore network failures – fallback will handle it
  } finally {
    clearTimeout(timeout);
  }
  return false;
}

function envToggle(name: string, defaultValue: boolean): boolean {
  const raw = process.env[name];
  if (raw === undefined) return defaultValue;
  return ['1', 'true', 'yes', 'on'].includes(raw.toLowerCase());
}

function envInt(name: string, defaultValue: number): number {
  const raw = process.env[name];
  if (!raw) return defaultValue;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : defaultValue;
}

async function resolveEmbeddingProvider(): Promise<EmbeddingProvider> {
  const forced = process.env.CTX_EMBED_PROVIDER || process.env.EMBED_PROVIDER;

  // Handle 'auto' - detect best available provider
  if (forced && forced.toLowerCase() !== 'auto') {
    return forced.toLowerCase() as EmbeddingProvider;
  }

  // Priority order: Voyage AI > OpenAI > Ollama > Lexical
  if (process.env.VOYAGE_API_KEY) {
    return 'voyage';
  }
  if (process.env.OPENAI_API_KEY) {
    return 'openai';
  }
  if (process.env.ANTHROPIC_API_KEY) {
    return 'voyage'; // Anthropic uses Voyage for embeddings
  }

  const baseUrl = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
  if (await detectOllama(baseUrl)) {
    return 'ollama';
  }

  return 'lexical';
}

export async function loadContextConfig(force = false): Promise<ContextConfig> {
  if (!force && cachedConfig) {
    return cachedConfig;
  }

  if (!force && loadPromise) {
    return loadPromise;
  }

  loadPromise = (async () => {
    const workspaceRoot = resolveWorkspaceRoot();
    const contextRoot = process.env.CTX_ROOT
      ? (process.env.CTX_ROOT.startsWith('.')
          ? new URL(process.env.CTX_ROOT, `file://${workspaceRoot.replace(/\\/g, '/')}/`).pathname
          : process.env.CTX_ROOT)
      : `${workspaceRoot}/.robinson/context`;

    const provider = await resolveEmbeddingProvider();
    const fallbackDimensions = envInt('CTX_FALLBACK_EMBED_DIMS', 384);

    const config: ContextConfig = {
      workspaceRoot,
      contextRoot,
      embedding: {
        provider,
        model: process.env.RCE_EMBED_MODEL || process.env.EMBED_MODEL || process.env.OLLAMA_EMBED_MODEL || 'nomic-embed-text',
        fallbackDimensions,
      },
      indexing: {
        ttlMinutes: envInt('RCE_INDEX_TTL_MINUTES', 20),
        maxChangedFiles: envInt('RCE_MAX_CHANGED_PER_RUN', 1000),
        lazyIndexing: envToggle('RCE_LAZY_INDEXING', true),
        backgroundIndexing: envToggle('RCE_BACKGROUND_INDEXING', true),
        quickFileLimit: envInt('RCE_QUICK_FILE_LIMIT', 240),
      },
      storage: {
        compressionEnabled: envToggle('RCE_STORAGE_COMPRESS', true),
        maxDiskUsageMb: envInt('RCE_STORAGE_LIMIT_MB', 2048),
        autoCleanup: envToggle('RCE_STORAGE_AUTOCLEAN', true),
      },
      styleLearning: {
        enabled: envToggle('RCE_STYLE_LEARNING', true),
      },
      architectureLearning: {
        enabled: envToggle('RCE_ARCH_LEARNING', true),
      },
      behaviorLearning: {
        enabled: envToggle('RCE_BEHAVIOR_LEARNING', true),
      },
    };

    cachedConfig = config;

    // Surface provider back to embedding module via env for backward compatibility
    process.env.CTX_EMBED_PROVIDER = provider;
    process.env.EMBED_PROVIDER = provider;

    return config;
  })();

  const resolved = await loadPromise;
  loadPromise = null;
  return resolved;
}

export function invalidateContextConfig(): void {
  cachedConfig = null;
  loadPromise = null;
}