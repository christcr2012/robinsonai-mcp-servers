let defaultsApplied = false;

type Provider = 'openai' | 'voyage' | 'ollama';

const STATIC_DEFAULTS: Record<string, string> = {
  RCE_LAZY_INDEX: '1',
  RCE_MAX_DISK_MB: '512',
  RCE_COMPRESSION: 'auto',
  RCE_COMPRESSION_THRESHOLD: '4096',
  RCE_INDEX_TTL_MINUTES: '20',
  RCE_MAX_CHANGED_PER_RUN: '800',
  RCE_QUICK_MAX_FILES: '400',
  CTX_AUTO_WATCH: '1',
  CTX_FALLBACK_EMBED_DIMS: '384',
  OLLAMA_BASE_URL: 'http://127.0.0.1:11434',
};

function normalizeProvider(value: string | undefined): Provider | undefined {
  if (!value) return undefined;
  const lower = value.toLowerCase();
  if (lower === 'openai' || lower === 'voyage' || lower === 'ollama') {
    return lower;
  }
  return undefined;
}

function detectEmbeddingDefaults(explicit?: Provider): { provider: Provider; model: string } {
  const chosen = explicit
    ?? (process.env.OPENAI_API_KEY ? 'openai'
      : (process.env.VOYAGE_API_KEY || process.env.ANTHROPIC_API_KEY) ? 'voyage'
        : 'ollama');

  if (chosen === 'openai') {
    const model = process.env.OPENAI_EMBED_MODEL || 'text-embedding-3-small';
    return { provider: 'openai', model };
  }

  if (chosen === 'voyage') {
    const model = process.env.VOYAGE_EMBED_MODEL || 'voyage-code-2';
    return { provider: 'voyage', model };
  }

  const model = process.env.OLLAMA_EMBED_MODEL || 'nomic-embed-text';
  return { provider: 'ollama', model };
}

/**
 * Apply zero-config defaults for the context engine.
 * Prefers OpenAI → Voyage → Ollama automatically and fills in sane limits.
 */
export function applyContextDefaults(): void {
  if (defaultsApplied) return;
  defaultsApplied = true;

  const explicitProvider = normalizeProvider(
    process.env.CTX_EMBED_PROVIDER ?? process.env.EMBED_PROVIDER
  );
  const { provider, model } = detectEmbeddingDefaults(explicitProvider);

  if (!process.env.CTX_EMBED_PROVIDER) {
    process.env.CTX_EMBED_PROVIDER = provider;
  }
  if (!process.env.EMBED_PROVIDER) {
    process.env.EMBED_PROVIDER = provider;
  }

  if (!process.env.RCE_EMBED_MODEL) {
    process.env.RCE_EMBED_MODEL = model;
  }
  if (!process.env.EMBED_MODEL) {
    process.env.EMBED_MODEL = model;
  }

  if (provider === 'openai' && !process.env.OPENAI_EMBED_MODEL) {
    process.env.OPENAI_EMBED_MODEL = model;
  }
  if (provider === 'voyage' && !process.env.VOYAGE_EMBED_MODEL) {
    process.env.VOYAGE_EMBED_MODEL = model;
  }
  if (provider === 'ollama' && !process.env.OLLAMA_EMBED_MODEL) {
    process.env.OLLAMA_EMBED_MODEL = model;
  }

  for (const [key, value] of Object.entries(STATIC_DEFAULTS)) {
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

