/**
 * Provider-Agnostic Metrics System
 * 
 * Unified interface for cost estimation, usage tracking, and capacity management
 * across multiple LLM providers (OpenAI, Anthropic, Moonshot, Ollama, etc.)
 */

/**
 * Cost estimate for a specific operation
 */
export interface CostEstimate {
  inputCost: number;
  outputCost: number;
  totalCost: number;
  currency: string;
  model: string;
  provider: string;
  pricing: {
    inputPer1k: number;
    outputPer1k: number;
    source: 'live' | 'fallback' | 'cached';
    lastUpdated: string;
  };
}

/**
 * Usage statistics for a time period
 */
export interface UsageStats {
  period: 'day' | 'week' | 'month' | 'all';
  totalCost: number;
  totalTokens: number;
  totalRequests: number;
  byProvider: {
    [provider: string]: {
      cost: number;
      tokens: number;
      requests: number;
    };
  };
  byModel: {
    [model: string]: {
      cost: number;
      tokens: number;
      requests: number;
      provider: string;
    };
  };
}

/**
 * Capacity and availability information
 */
export interface CapacityInfo {
  provider: string;
  budget: {
    monthlyLimit: number;
    spent: number;
    remaining: number;
    percentageUsed: number;
  };
  models: {
    [model: string]: {
      available: boolean;
      costPer1kInput: number;
      costPer1kOutput: number;
      pricingSource: string;
      note?: string;
    };
  };
  concurrency?: {
    max: number;
    current: number;
    available: number;
  };
}

/**
 * Provider metrics adapter interface
 * Each provider (OpenAI, Anthropic, etc.) implements this interface
 */
export interface ProviderMetricsAdapter {
  readonly name: string;
  readonly provider: 'openai' | 'anthropic' | 'moonshot' | 'ollama' | string;

  /**
   * Estimate cost for a specific operation
   */
  getCostEstimate(params: {
    model: string;
    inputTokens: number;
    outputTokens?: number;
  }): Promise<CostEstimate>;

  /**
   * Get usage statistics for a time period
   */
  getUsageStats(params: {
    period: 'day' | 'week' | 'month' | 'all';
  }): Promise<UsageStats>;

  /**
   * Get capacity and availability information
   */
  getCapacity(params?: {
    model?: string;
  }): Promise<CapacityInfo>;

  /**
   * Refresh pricing from live source
   */
  refreshPricing(): Promise<boolean>;

  /**
   * Check if provider is available (API key configured, etc.)
   */
  isAvailable(): boolean;
}

/**
 * Registry of provider metrics adapters
 */
const adapters = new Map<string, ProviderMetricsAdapter>();

/**
 * Register a provider metrics adapter
 */
export function registerMetricsAdapter(adapter: ProviderMetricsAdapter): void {
  adapters.set(adapter.provider, adapter);
}

/**
 * Get metrics adapter for a specific provider
 */
export function getMetricsAdapter(provider: string): ProviderMetricsAdapter | null {
  return adapters.get(provider) || null;
}

/**
 * Get all registered adapters
 */
export function getAllMetricsAdapters(): ProviderMetricsAdapter[] {
  return Array.from(adapters.values());
}

/**
 * Get all available (configured) adapters
 */
export function getAvailableMetricsAdapters(): ProviderMetricsAdapter[] {
  return Array.from(adapters.values()).filter(adapter => adapter.isAvailable());
}

/**
 * Aggregate cost estimates across multiple providers
 */
export async function aggregateCostEstimates(params: {
  model: string;
  inputTokens: number;
  outputTokens?: number;
  providers?: string[];
}): Promise<CostEstimate[]> {
  const providersToCheck = params.providers || Array.from(adapters.keys());
  const estimates: CostEstimate[] = [];

  for (const providerName of providersToCheck) {
    const adapter = adapters.get(providerName);
    if (!adapter || !adapter.isAvailable()) continue;

    try {
      const estimate = await adapter.getCostEstimate({
        model: params.model,
        inputTokens: params.inputTokens,
        outputTokens: params.outputTokens,
      });
      estimates.push(estimate);
    } catch (error) {
      // Skip providers that don't support this model
      continue;
    }
  }

  return estimates.sort((a, b) => a.totalCost - b.totalCost);
}

