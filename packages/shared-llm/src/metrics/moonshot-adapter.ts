/**
 * Moonshot (Kimi) Metrics Adapter
 * 
 * Provider-agnostic metrics implementation for Moonshot Kimi models
 */

import type {
  ProviderMetricsAdapter,
  CostEstimate,
  UsageStats,
  CapacityInfo,
} from './provider-metrics.js';

interface ModelPricing {
  cost_per_1k_input: number;
  cost_per_1k_output: number;
  last_updated: number;
  source: 'live' | 'fallback';
}

interface PricingCache {
  [model: string]: ModelPricing;
}

// Fallback pricing for Moonshot Kimi models (as of 2025-11-14)
// Source: https://platform.moonshot.cn/pricing
// Kimi is VERY CHEAP - cheapest paid option!
const FALLBACK_PRICING: PricingCache = {
  'moonshot-v1-8k': {
    cost_per_1k_input: 0.00012,  // ¥0.012/1K tokens ≈ $0.00012
    cost_per_1k_output: 0.00012,
    last_updated: Date.now(),
    source: 'fallback',
  },
  'moonshot-v1-32k': {
    cost_per_1k_input: 0.00024,  // ¥0.024/1K tokens ≈ $0.00024
    cost_per_1k_output: 0.00024,
    last_updated: Date.now(),
    source: 'fallback',
  },
  'moonshot-v1-128k': {
    cost_per_1k_input: 0.00060,  // ¥0.06/1K tokens ≈ $0.00060
    cost_per_1k_output: 0.00060,
    last_updated: Date.now(),
    source: 'fallback',
  },
};

export class MoonshotMetricsAdapter implements ProviderMetricsAdapter {
  readonly name = 'Moonshot Metrics Adapter';
  readonly provider = 'moonshot';

  private pricingCache: PricingCache = { ...FALLBACK_PRICING };
  private lastFetchTime = 0;
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  constructor(
    private getTokenStats?: (period: string) => any
  ) {}

  async getCostEstimate(params: {
    model: string;
    inputTokens: number;
    outputTokens?: number;
  }): Promise<CostEstimate> {
    const pricing = await this.getModelPricing(params.model);
    const outputTokens = params.outputTokens || 0;

    const inputCost = (params.inputTokens / 1000) * pricing.cost_per_1k_input;
    const outputCost = (outputTokens / 1000) * pricing.cost_per_1k_output;
    const totalCost = inputCost + outputCost;

    return {
      inputCost,
      outputCost,
      totalCost,
      currency: 'USD',
      model: params.model,
      provider: 'moonshot',
      pricing: {
        inputPer1k: pricing.cost_per_1k_input,
        outputPer1k: pricing.cost_per_1k_output,
        source: pricing.source,
        lastUpdated: new Date(pricing.last_updated).toISOString(),
      },
    };
  }

  async getUsageStats(params: { period: 'day' | 'week' | 'month' | 'all' }): Promise<UsageStats> {
    if (this.getTokenStats) {
      const stats = this.getTokenStats(params.period);
      return {
        period: params.period,
        totalCost: stats.total_cost || 0,
        totalTokens: stats.total_tokens || 0,
        totalRequests: stats.total_requests || 0,
        byProvider: {
          moonshot: {
            cost: stats.total_cost || 0,
            tokens: stats.total_tokens || 0,
            requests: stats.total_requests || 0,
          },
        },
        byModel: stats.by_model || {},
      };
    }

    return {
      period: params.period,
      totalCost: 0,
      totalTokens: 0,
      totalRequests: 0,
      byProvider: {
        moonshot: {
          cost: 0,
          tokens: 0,
          requests: 0,
        },
      },
      byModel: {},
    };
  }

  async getCapacity(params?: { model?: string }): Promise<CapacityInfo> {
    const models: CapacityInfo['models'] = {};
    for (const [modelName, pricing] of Object.entries(this.pricingCache)) {
      models[modelName] = {
        available: true,
        costPer1kInput: pricing.cost_per_1k_input,
        costPer1kOutput: pricing.cost_per_1k_output,
        pricingSource: pricing.source,
        note: 'CHEAPEST PAID OPTION - ~80% cheaper than OpenAI!',
      };
    }

    return {
      provider: 'moonshot',
      budget: {
        monthlyLimit: 0,
        spent: 0,
        remaining: Infinity,
        percentageUsed: 0,
      },
      models,
    };
  }

  async refreshPricing(): Promise<boolean> {
    // Moonshot doesn't have a public pricing API
    // Pricing is manually updated in FALLBACK_PRICING
    return true;
  }

  isAvailable(): boolean {
    return !!process.env.MOONSHOT_API_KEY;
  }

  private async getModelPricing(model: string): Promise<ModelPricing> {
    if (this.pricingCache[model]) {
      return this.pricingCache[model];
    }

    // Conservative fallback for unknown models
    return {
      cost_per_1k_input: 0.00024,
      cost_per_1k_output: 0.00024,
      last_updated: Date.now(),
      source: 'fallback',
    };
  }
}

