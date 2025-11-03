/**
 * Robinson's Context Engine - Embedding Providers
 * 
 * Supports multiple embedding providers with intelligent model selection:
 * - OpenAI (text-embedding-3-small, text-embedding-3-large)
 * - Claude/Anthropic (via Voyage AI - voyage-code-2, voyage-3)
 * - Ollama (nomic-embed-text, mxbai-embed-large) - FREE
 * - None (lexical search only)
 * 
 * Graceful degradation: If no API keys, falls back to Ollama or lexical-only
 */

// Using native fetch (Node 18+)

export interface Embedder {
  name: string;
  model: string;
  dimensions: number;
  costPer1M: number; // Cost per 1M tokens
  embed(texts: string[]): Promise<number[][]>;
}

export interface EmbedderConfig {
  provider?: 'openai' | 'claude' | 'voyage' | 'ollama' | 'none' | 'auto';
  model?: string;
  preferQuality?: boolean; // If true, use best model regardless of cost
  maxCostPer1M?: number; // Max cost per 1M tokens (default: $0.10)
}

/**
 * Smart embedder factory with cost-aware model selection
 */
export function makeEmbedder(config: EmbedderConfig = {}): Embedder | null {
  const provider = (config.provider ?? process.env.EMBED_PROVIDER ?? 'auto').toLowerCase();
  const preferQuality = config.preferQuality ?? (process.env.EMBED_PREFER_QUALITY === '1');
  const maxCost = config.maxCostPer1M ?? parseFloat(process.env.EMBED_MAX_COST_PER_1M ?? '0.10');

  // Auto mode: Try providers in order of quality/cost ratio
  if (provider === 'auto') {
    // Try OpenAI first (best quality/cost ratio)
    if (process.env.OPENAI_API_KEY) {
      return new OpenAIEmbedder(config.model, preferQuality, maxCost);
    }
    // Try Voyage/Claude next (best quality, higher cost)
    if (process.env.VOYAGE_API_KEY || process.env.ANTHROPIC_API_KEY) {
      return new VoyageEmbedder(config.model, preferQuality, maxCost);
    }
    // Try Ollama (free, lower quality)
    try {
      return new OllamaEmbedder(config.model);
    } catch {
      console.warn('[RCE] No embedding provider available, using lexical search only');
      return null;
    }
  }

  // Explicit provider selection
  if (provider === 'openai') return new OpenAIEmbedder(config.model, preferQuality, maxCost);
  if (provider === 'claude' || provider === 'voyage') return new VoyageEmbedder(config.model, preferQuality, maxCost);
  if (provider === 'ollama') return new OllamaEmbedder(config.model);
  if (provider === 'none') return null;

  // Fallback to Ollama
  return new OllamaEmbedder(config.model);
}

/**
 * OpenAI Embeddings
 * Models: text-embedding-3-small (best value), text-embedding-3-large (best quality)
 */
class OpenAIEmbedder implements Embedder {
  name = 'openai';
  model: string;
  dimensions: number;
  costPer1M: number;

  private api = process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1/embeddings';

  constructor(model?: string, preferQuality = false, maxCost = 0.10) {
    // Smart model selection
    if (model) {
      this.model = model;
    } else if (preferQuality && maxCost >= 0.13) {
      // Use best quality if budget allows
      this.model = 'text-embedding-3-large';
    } else {
      // Default to best value
      this.model = 'text-embedding-3-small';
    }

    // Set dimensions and cost based on model
    if (this.model === 'text-embedding-3-large') {
      this.dimensions = 3072;
      this.costPer1M = 0.13;
    } else {
      this.dimensions = 1536;
      this.costPer1M = 0.02;
    }

    console.log(`[RCE] Using OpenAI ${this.model} ($${this.costPer1M}/1M tokens, ${this.dimensions}D)`);
  }

  async embed(texts: string[]): Promise<number[][]> {
    const key = process.env.OPENAI_API_KEY;
    if (!key) throw new Error('OPENAI_API_KEY missing');

    try {
      const res = await fetch(this.api, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`
        },
        body: JSON.stringify({ 
          model: this.model, 
          input: texts,
          dimensions: this.dimensions 
        })
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(`OpenAI embeddings error ${res.status}: ${error}`);
      }

      const json = await res.json();
      return (json.data ?? []).map((d: any) => d.embedding as number[]);
    } catch (error: any) {
      console.error(`[RCE] OpenAI embedding failed:`, error.message);
      throw error;
    }
  }
}

/**
 * Voyage AI Embeddings (recommended for Claude users)
 * Models: voyage-code-2 (best for code), voyage-3 (best overall)
 */
class VoyageEmbedder implements Embedder {
  name = 'voyage';
  model: string;
  dimensions: number;
  costPer1M: number;

  private api = process.env.VOYAGE_BASE_URL ?? 'https://api.voyageai.com/v1/embeddings';

  constructor(model?: string, preferQuality = false, maxCost = 0.12) {
    // Smart model selection
    if (model) {
      this.model = model;
    } else if (preferQuality && maxCost >= 0.12) {
      // Use best quality
      this.model = 'voyage-3';
    } else {
      // Default to best for code
      this.model = 'voyage-code-2';
    }

    // Set dimensions and cost based on model
    if (this.model === 'voyage-3') {
      this.dimensions = 1024;
      this.costPer1M = 0.12;
    } else {
      this.dimensions = 1536;
      this.costPer1M = 0.10;
    }

    console.log(`[RCE] Using Voyage ${this.model} ($${this.costPer1M}/1M tokens, ${this.dimensions}D)`);
  }

  async embed(texts: string[]): Promise<number[][]> {
    const key = process.env.VOYAGE_API_KEY || process.env.ANTHROPIC_API_KEY;
    if (!key) throw new Error('VOYAGE_API_KEY or ANTHROPIC_API_KEY missing');

    try {
      const res = await fetch(this.api, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`
        },
        body: JSON.stringify({ 
          model: this.model, 
          input: texts,
          input_type: 'document' // Optimize for document embedding
        })
      } as RequestInit);

      if (!res.ok) {
        const error = await res.text();
        throw new Error(`Voyage embeddings error ${res.status}: ${error}`);
      }

      const json = await res.json();
      return (json.data ?? []).map((d: any) => d.embedding as number[]);
    } catch (error: any) {
      console.error(`[RCE] Voyage embedding failed:`, error.message);
      throw error;
    }
  }
}

/**
 * Ollama Embeddings (FREE, local)
 * Models: nomic-embed-text (best), mxbai-embed-large (alternative)
 */
class OllamaEmbedder implements Embedder {
  name = 'ollama';
  model: string;
  dimensions: number;
  costPer1M = 0; // FREE!

  private base = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434';

  constructor(model?: string) {
    this.model = model ?? process.env.EMBED_MODEL ?? 'nomic-embed-text';
    
    // Set dimensions based on model
    if (this.model === 'mxbai-embed-large') {
      this.dimensions = 1024;
    } else {
      this.dimensions = 768; // nomic-embed-text
    }

    console.log(`[RCE] Using Ollama ${this.model} (FREE, ${this.dimensions}D)`);
  }

  async embed(texts: string[]): Promise<number[][]> {
    const out: number[][] = [];
    
    for (const t of texts) {
      try {
        const res = await fetch(`${this.base}/api/embeddings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: this.model, prompt: t })
        } as RequestInit);

        if (!res.ok) {
          throw new Error(`Ollama embeddings error ${res.status}`);
        }

        const json = await res.json();
        out.push(json.embedding as number[]);
      } catch (error: any) {
        console.error(`[RCE] Ollama embedding failed for text ${out.length}:`, error.message);
        throw error;
      }
    }
    
    return out;
  }
}

/**
 * Estimate cost for embedding N tokens
 */
export function estimateEmbeddingCost(tokens: number, embedder: Embedder | null): number {
  if (!embedder) return 0;
  return (tokens / 1_000_000) * embedder.costPer1M;
}

/**
 * Get recommended embedder for user's configuration
 */
export function getRecommendedEmbedder(): string {
  if (process.env.OPENAI_API_KEY) {
    return 'openai (text-embedding-3-small) - Best value: $0.02/1M tokens';
  }
  if (process.env.VOYAGE_API_KEY || process.env.ANTHROPIC_API_KEY) {
    return 'voyage (voyage-code-2) - Best for code: $0.10/1M tokens';
  }
  return 'ollama (nomic-embed-text) - FREE but requires local Ollama';
}

