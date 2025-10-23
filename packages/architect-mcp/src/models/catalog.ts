/**
 * Model Catalog - Capability Registry
 * 
 * Tracks available models across all providers:
 * - Ollama (local, free)
 * - OpenAI Worker (cloud, paid)
 * - Augment Premium (optional)
 * 
 * Refreshes on startup + every 10 minutes
 */

export interface ModelCapability {
  name: string;
  provider: 'ollama' | 'openai' | 'augment';
  speed: 'very-fast' | 'fast' | 'medium' | 'slow';
  quality_tier: 'basic' | 'good' | 'excellent' | 'premium';
  approx_cost_per_1k_tokens: number; // USD
  context_len: number;
  rate_limit: {
    requests_per_minute: number;
    tokens_per_minute: number;
  };
  capabilities: string[]; // e.g., ['code', 'reasoning', 'vision']
  available: boolean;
}

export interface ModelCatalog {
  models: ModelCapability[];
  last_refresh: Date;
}

let catalog: ModelCatalog = {
  models: [],
  last_refresh: new Date(0),
};

const REFRESH_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Default model definitions
 */
const DEFAULT_MODELS: ModelCapability[] = [
  // Ollama models (free, local)
  {
    name: 'qwen2.5:3b',
    provider: 'ollama',
    speed: 'very-fast',
    quality_tier: 'basic',
    approx_cost_per_1k_tokens: 0,
    context_len: 32768,
    rate_limit: { requests_per_minute: 60, tokens_per_minute: 100000 },
    capabilities: ['code', 'reasoning'],
    available: true,
  },
  {
    name: 'qwen2.5:7b',
    provider: 'ollama',
    speed: 'fast',
    quality_tier: 'good',
    approx_cost_per_1k_tokens: 0,
    context_len: 32768,
    rate_limit: { requests_per_minute: 60, tokens_per_minute: 80000 },
    capabilities: ['code', 'reasoning'],
    available: true,
  },
  {
    name: 'deepseek-coder:33b',
    provider: 'ollama',
    speed: 'medium',
    quality_tier: 'excellent',
    approx_cost_per_1k_tokens: 0,
    context_len: 16384,
    rate_limit: { requests_per_minute: 30, tokens_per_minute: 40000 },
    capabilities: ['code', 'reasoning'],
    available: true,
  },
  {
    name: 'qwen2.5-coder:32b',
    provider: 'ollama',
    speed: 'medium',
    quality_tier: 'excellent',
    approx_cost_per_1k_tokens: 0,
    context_len: 32768,
    rate_limit: { requests_per_minute: 30, tokens_per_minute: 40000 },
    capabilities: ['code', 'reasoning'],
    available: true,
  },

  // OpenAI models (paid, cloud)
  {
    name: 'gpt-4o-mini',
    provider: 'openai',
    speed: 'very-fast',
    quality_tier: 'good',
    approx_cost_per_1k_tokens: 0.00015, // $0.15 per 1M input tokens
    context_len: 128000,
    rate_limit: { requests_per_minute: 500, tokens_per_minute: 200000 },
    capabilities: ['code', 'reasoning', 'vision'],
    available: false, // Check at runtime
  },
  {
    name: 'gpt-4o',
    provider: 'openai',
    speed: 'fast',
    quality_tier: 'premium',
    approx_cost_per_1k_tokens: 0.0025, // $2.50 per 1M input tokens
    context_len: 128000,
    rate_limit: { requests_per_minute: 500, tokens_per_minute: 150000 },
    capabilities: ['code', 'reasoning', 'vision'],
    available: false,
  },
  {
    name: 'o1-mini',
    provider: 'openai',
    speed: 'slow',
    quality_tier: 'premium',
    approx_cost_per_1k_tokens: 0.003, // $3.00 per 1M input tokens
    context_len: 128000,
    rate_limit: { requests_per_minute: 50, tokens_per_minute: 50000 },
    capabilities: ['reasoning', 'complex-planning'],
    available: false,
  },
];

/**
 * Refresh model catalog
 */
export async function refreshCatalog(): Promise<void> {
  const now = new Date();
  
  // Check if refresh needed
  if (now.getTime() - catalog.last_refresh.getTime() < REFRESH_INTERVAL_MS) {
    return;
  }

  console.log('[Model Catalog] Refreshing...');

  // Start with defaults
  const models = [...DEFAULT_MODELS];

  // Check Ollama availability
  try {
    const response = await fetch('http://localhost:11434/api/tags');
    if (response.ok) {
      const data: any = await response.json();
      const availableModels = new Set(data.models?.map((m: any) => m.name) || []);
      
      models.forEach(model => {
        if (model.provider === 'ollama') {
          model.available = availableModels.has(model.name);
        }
      });
    }
  } catch (error) {
    console.warn('[Model Catalog] Ollama not available:', error);
    models.forEach(model => {
      if (model.provider === 'ollama') {
        model.available = false;
      }
    });
  }

  // Check OpenAI availability (if API key present)
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    models.forEach(model => {
      if (model.provider === 'openai') {
        model.available = true;
      }
    });
  }

  catalog = {
    models,
    last_refresh: now,
  };

  console.log(`[Model Catalog] Refreshed: ${models.filter(m => m.available).length}/${models.length} models available`);
}

/**
 * Get all available models
 */
export function getAvailableModels(): ModelCapability[] {
  return catalog.models.filter(m => m.available);
}

/**
 * Get model by name
 */
export function getModel(name: string): ModelCapability | undefined {
  return catalog.models.find(m => m.name === name && m.available);
}

/**
 * Find best model for task
 */
export function findBestModel(criteria: {
  task_class?: 'bulk-edit' | 'format' | 'short-copy' | 'complex-refactor' | 'high-risk' | 'security';
  max_cost_per_1k?: number;
  min_quality?: 'basic' | 'good' | 'excellent' | 'premium';
  required_capabilities?: string[];
  prefer_speed?: boolean;
}): ModelCapability | null {
  let candidates = getAvailableModels();

  // Filter by cost
  if (criteria.max_cost_per_1k !== undefined) {
    candidates = candidates.filter(m => m.approx_cost_per_1k_tokens <= criteria.max_cost_per_1k!);
  }

  // Filter by quality
  if (criteria.min_quality) {
    const qualityOrder = ['basic', 'good', 'excellent', 'premium'];
    const minIndex = qualityOrder.indexOf(criteria.min_quality);
    candidates = candidates.filter(m => qualityOrder.indexOf(m.quality_tier) >= minIndex);
  }

  // Filter by capabilities
  if (criteria.required_capabilities) {
    candidates = candidates.filter(m =>
      criteria.required_capabilities!.every(cap => m.capabilities.includes(cap))
    );
  }

  if (candidates.length === 0) {
    return null;
  }

  // Sort by preference
  if (criteria.prefer_speed) {
    const speedOrder = ['very-fast', 'fast', 'medium', 'slow'];
    candidates.sort((a, b) => speedOrder.indexOf(a.speed) - speedOrder.indexOf(b.speed));
  } else {
    // Prefer free models, then cheapest
    candidates.sort((a, b) => a.approx_cost_per_1k_tokens - b.approx_cost_per_1k_tokens);
  }

  return candidates[0];
}

/**
 * Get catalog stats
 */
export function getCatalogStats() {
  const available = catalog.models.filter(m => m.available);
  const byProvider = {
    ollama: available.filter(m => m.provider === 'ollama').length,
    openai: available.filter(m => m.provider === 'openai').length,
    augment: available.filter(m => m.provider === 'augment').length,
  };

  return {
    total: catalog.models.length,
    available: available.length,
    by_provider: byProvider,
    last_refresh: catalog.last_refresh,
  };
}

// Auto-refresh on startup
refreshCatalog().catch(console.error);

// Auto-refresh every 10 minutes
setInterval(() => {
  refreshCatalog().catch(console.error);
}, REFRESH_INTERVAL_MS);

