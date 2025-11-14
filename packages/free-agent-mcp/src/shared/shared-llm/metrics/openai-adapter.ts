/**
 * OpenAI Metrics Adapter
 * 
 * Provider-agnostic metrics implementation for OpenAI
 * Extracted from legacy OpenAI Worker code
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

// Fallback pricing (as of 2025-10-22)
const FALLBACK_PRICING: PricingCache = {
  'gpt-4o-mini': {
    cost_per_1k_input: 0.00015,
    cost_per_1k_output: 0.0006,
    last_updated: Date.now(),
    source: 'fallback',
  },
  'gpt-4o': {
    cost_per_1k_input: 0.0025,
    cost_per_1k_output: 0.01,
    last_updated: Date.now(),
    source: 'fallback',
  },
  'o1-mini': {
    cost_per_1k_input: 0.003,
    cost_per_1k_output: 0.012,
    last_updated: Date.now(),
    source: 'fallback',
  },
  'o1': {
    cost_per_1k_input: 0.015,
    cost_per_1k_output: 0.06,
    last_updated: Date.now(),
    source: 'fallback',
  },
};

export class OpenAIMetricsAdapter implements ProviderMetricsAdapter {
  readonly name = 'OpenAI Metrics Adapter';
  readonly provider = 'openai';

  private pricingCache: PricingCache = { ...FALLBACK_PRICING };
  private lastFetchTime = 0;
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  constructor(
    private getMonthlySpend: () => number,
    private getMonthlyBudget: () => number,
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
      provider: 'openai',
      pricing: {
        inputPer1k: pricing.cost_per_1k_input,
        outputPer1k: pricing.cost_per_1k_output,
        source: pricing.source,
        lastUpdated: new Date(pricing.last_updated).toISOString(),
      },
    };
  }

  async getUsageStats(params: { period: 'day' | 'week' | 'month' | 'all' }): Promise<UsageStats> {
    const monthlySpend = this.getMonthlySpend();
    
    // If token stats function is provided, use it
    if (this.getTokenStats) {
      const stats = this.getTokenStats(params.period);
      return {
        period: params.period,
        totalCost: stats.total_cost || monthlySpend,
        totalTokens: stats.total_tokens || 0,
        totalRequests: stats.total_requests || 0,
        byProvider: {
          openai: {
            cost: stats.total_cost || monthlySpend,
            tokens: stats.total_tokens || 0,
            requests: stats.total_requests || 0,
          },
        },
        byModel: stats.by_model || {},
      };
    }

    // Fallback to basic monthly spend
    return {
      period: params.period,
      totalCost: monthlySpend,
      totalTokens: 0,
      totalRequests: 0,
      byProvider: {
        openai: {
          cost: monthlySpend,
          tokens: 0,
          requests: 0,
        },
      },
      byModel: {},
    };
  }

  async getCapacity(params?: { model?: string }): Promise<CapacityInfo> {
    const monthlyBudget = this.getMonthlyBudget();
    const monthlySpend = this.getMonthlySpend();
    const remaining = Math.max(0, monthlyBudget - monthlySpend);

    const models: CapacityInfo['models'] = {};
    for (const [modelName, pricing] of Object.entries(this.pricingCache)) {
      models[modelName] = {
        available: true,
        costPer1kInput: pricing.cost_per_1k_input,
        costPer1kOutput: pricing.cost_per_1k_output,
        pricingSource: pricing.source,
      };
    }

    return {
      provider: 'openai',
      budget: {
        monthlyLimit: monthlyBudget,
        spent: monthlySpend,
        remaining,
        percentageUsed: (monthlySpend / monthlyBudget) * 100,
      },
      models,
    };
  }

  async refreshPricing(): Promise<boolean> {
    const livePricing = await this.fetchLivePricing();

    if (livePricing && Object.keys(livePricing).length > 0) {
      this.pricingCache = { ...FALLBACK_PRICING, ...livePricing };
      this.lastFetchTime = Date.now();
      return true;
    }

    return false;
  }

  isAvailable(): boolean {
    return !!process.env.OPENAI_API_KEY;
  }

  private async getModelPricing(model: string): Promise<ModelPricing> {
    const now = Date.now();

    // Auto-refresh if cache is stale (non-blocking)
    if (now - this.lastFetchTime > this.CACHE_DURATION) {
      this.fetchLivePricing()
        .then((livePricing) => {
          if (livePricing && Object.keys(livePricing).length > 0) {
            this.pricingCache = { ...FALLBACK_PRICING, ...livePricing };
            this.lastFetchTime = now;
          }
        })
        .catch(() => {
          this.lastFetchTime = now;
        });
    }

    // Return cached pricing or fallback
    if (this.pricingCache[model]) {
      return this.pricingCache[model];
    }

    // Conservative fallback for unknown models
    return {
      cost_per_1k_input: 0.01,
      cost_per_1k_output: 0.03,
      last_updated: Date.now(),
      source: 'fallback',
    };
  }

  private async fetchLivePricing(): Promise<PricingCache | null> {
    try {
      const response = await fetch('https://openai.com/api/pricing/', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) return null;

      const html = await response.text();
      const pricing: PricingCache = {};

      const models = [
        { name: 'gpt-4o-mini', patterns: ['gpt-4o-mini', 'GPT-4o mini'] },
        { name: 'gpt-4o', patterns: ['gpt-4o', 'GPT-4o'] },
        { name: 'o1-mini', patterns: ['o1-mini', 'O1-mini'] },
        { name: 'o1', patterns: ['o1', 'O1'] },
      ];

      for (const model of models) {
        let modelSection = '';
        for (const pattern of model.patterns) {
          const idx = html.indexOf(pattern);
          if (idx !== -1) {
            modelSection = html.substring(idx, idx + 1000);
            break;
          }
        }

        if (!modelSection) continue;

        const inputMatch = modelSection.match(/\$([0-9.]+)\s*\/\s*1M\s+input/i);
        const outputMatch = modelSection.match(/\$([0-9.]+)\s*\/\s*1M\s+output/i);

        if (inputMatch && outputMatch) {
          const inputCost = parseFloat(inputMatch[1]) / 1000;
          const outputCost = parseFloat(outputMatch[1]) / 1000;

          if (inputCost > 0 && inputCost < 1 && outputCost > 0 && outputCost < 1) {
            pricing[model.name] = {
              cost_per_1k_input: inputCost,
              cost_per_1k_output: outputCost,
              last_updated: Date.now(),
              source: 'live',
            };
          }
        }
      }

      return Object.keys(pricing).length > 0 ? pricing : null;
    } catch (error) {
      return null;
    }
  }
}
