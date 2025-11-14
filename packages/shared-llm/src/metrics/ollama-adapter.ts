/**
 * Ollama Metrics Adapter
 * 
 * Provider-agnostic metrics implementation for Ollama (local, always free)
 */

import type {
  ProviderMetricsAdapter,
  CostEstimate,
  UsageStats,
  CapacityInfo,
} from './provider-metrics.js';

export class OllamaMetricsAdapter implements ProviderMetricsAdapter {
  readonly name = 'Ollama Metrics Adapter';
  readonly provider = 'ollama';

  constructor(
    private getTokenStats?: (period: string) => any
  ) {}

  async getCostEstimate(params: {
    model: string;
    inputTokens: number;
    outputTokens?: number;
  }): Promise<CostEstimate> {
    // Ollama is always free
    return {
      inputCost: 0,
      outputCost: 0,
      totalCost: 0,
      currency: 'USD',
      model: params.model,
      provider: 'ollama',
      pricing: {
        inputPer1k: 0,
        outputPer1k: 0,
        source: 'live',
        lastUpdated: new Date().toISOString(),
      },
    };
  }

  async getUsageStats(params: { period: 'day' | 'week' | 'month' | 'all' }): Promise<UsageStats> {
    // If token stats function is provided, use it
    if (this.getTokenStats) {
      const stats = this.getTokenStats(params.period);
      return {
        period: params.period,
        totalCost: 0, // Always free
        totalTokens: stats.total_tokens || 0,
        totalRequests: stats.total_requests || 0,
        byProvider: {
          ollama: {
            cost: 0,
            tokens: stats.total_tokens || 0,
            requests: stats.total_requests || 0,
          },
        },
        byModel: stats.by_model || {},
      };
    }

    // Fallback
    return {
      period: params.period,
      totalCost: 0,
      totalTokens: 0,
      totalRequests: 0,
      byProvider: {
        ollama: {
          cost: 0,
          tokens: 0,
          requests: 0,
        },
      },
      byModel: {},
    };
  }

  async getCapacity(params?: { model?: string }): Promise<CapacityInfo> {
    return {
      provider: 'ollama',
      budget: {
        monthlyLimit: 0, // No budget limit (free)
        spent: 0,
        remaining: Infinity,
        percentageUsed: 0,
      },
      models: {
        'qwen2.5-coder:7b': {
          available: true,
          costPer1kInput: 0,
          costPer1kOutput: 0,
          pricingSource: 'live',
          note: 'FREE - Local Ollama model',
        },
        'deepseek-coder:33b': {
          available: true,
          costPer1kInput: 0,
          costPer1kOutput: 0,
          pricingSource: 'live',
          note: 'FREE - Local Ollama model',
        },
        'mistral:7b': {
          available: true,
          costPer1kInput: 0,
          costPer1kOutput: 0,
          pricingSource: 'live',
          note: 'FREE - Local Ollama model',
        },
      },
    };
  }

  async refreshPricing(): Promise<boolean> {
    // Ollama pricing never changes (always $0)
    return true;
  }

  isAvailable(): boolean {
    // Ollama is available if it's running locally
    // We could ping it, but for now assume it's available
    return true;
  }
}

