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
    const livePricing = await this.fetchLivePricing();

    if (livePricing && Object.keys(livePricing).length > 0) {
      this.pricingCache = { ...FALLBACK_PRICING, ...livePricing };
      this.lastFetchTime = Date.now();
      console.error('[MOONSHOT-ADAPTER] Successfully fetched live pricing');
      return true;
    }

    console.error('[MOONSHOT-ADAPTER] Failed to fetch live pricing, using fallback');
    return false;
  }

  isAvailable(): boolean {
    return !!process.env.MOONSHOT_API_KEY;
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
            console.error('[MOONSHOT-ADAPTER] Auto-refreshed live pricing');
          }
        })
        .catch(() => {
          this.lastFetchTime = now;
          console.error('[MOONSHOT-ADAPTER] Auto-refresh failed, using fallback');
        });
    }

    // Return cached pricing or fallback
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

  private async fetchLivePricing(): Promise<PricingCache | null> {
    try {
      // Moonshot pricing page (English version)
      const response = await fetch('https://platform.moonshot.ai/', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) return null;

      const html = await response.text();
      const pricing: PricingCache = {};

      // Moonshot pricing is in Chinese Yuan (¥), need to convert to USD
      // Approximate exchange rate: 1 USD ≈ 7.2 CNY (update as needed)
      const CNY_TO_USD = 1 / 7.2;

      // Scrape moonshot-v1-8k pricing (¥0.012/1K tokens)
      const v1_8kMatch = html.match(/moonshot-v1-8k.*?¥([0-9.]+).*?1K/is) ||
                         html.match(/8K.*?¥([0-9.]+).*?千tokens/is);
      if (v1_8kMatch) {
        const costCNY = parseFloat(v1_8kMatch[1]);
        const costUSD = costCNY * CNY_TO_USD;
        if (costUSD > 0 && costUSD < 1) {
          pricing['moonshot-v1-8k'] = {
            cost_per_1k_input: costUSD,
            cost_per_1k_output: costUSD,
            last_updated: Date.now(),
            source: 'live',
          };
        }
      }

      // Scrape moonshot-v1-32k pricing (¥0.024/1K tokens)
      const v1_32kMatch = html.match(/moonshot-v1-32k.*?¥([0-9.]+).*?1K/is) ||
                          html.match(/32K.*?¥([0-9.]+).*?千tokens/is);
      if (v1_32kMatch) {
        const costCNY = parseFloat(v1_32kMatch[1]);
        const costUSD = costCNY * CNY_TO_USD;
        if (costUSD > 0 && costUSD < 1) {
          pricing['moonshot-v1-32k'] = {
            cost_per_1k_input: costUSD,
            cost_per_1k_output: costUSD,
            last_updated: Date.now(),
            source: 'live',
          };
        }
      }

      // Scrape moonshot-v1-128k pricing (¥0.06/1K tokens)
      const v1_128kMatch = html.match(/moonshot-v1-128k.*?¥([0-9.]+).*?1K/is) ||
                           html.match(/128K.*?¥([0-9.]+).*?千tokens/is);
      if (v1_128kMatch) {
        const costCNY = parseFloat(v1_128kMatch[1]);
        const costUSD = costCNY * CNY_TO_USD;
        if (costUSD > 0 && costUSD < 1) {
          pricing['moonshot-v1-128k'] = {
            cost_per_1k_input: costUSD,
            cost_per_1k_output: costUSD,
            last_updated: Date.now(),
            source: 'live',
          };
        }
      }

      return Object.keys(pricing).length > 0 ? pricing : null;
    } catch (error) {
      console.error('[MOONSHOT-ADAPTER] Pricing scrape error:', error);
      return null;
    }
  }
}

