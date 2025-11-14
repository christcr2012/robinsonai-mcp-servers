/**
 * Anthropic (Claude) Metrics Adapter
 * 
 * Provider-agnostic metrics implementation for Anthropic Claude models
 */

import type {
  ProviderMetricsAdapter,
  CostEstimate,
  UsageStats,
  CapacityInfo,
  BatchJobRequest,
  BatchJobHandle,
  BatchJobResult,
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

// Fallback pricing for Claude models (as of 2025-11-14)
// Source: https://www.anthropic.com/pricing
const FALLBACK_PRICING: PricingCache = {
  'claude-3-5-sonnet-20241022': {
    cost_per_1k_input: 0.003,
    cost_per_1k_output: 0.015,
    last_updated: Date.now(),
    source: 'fallback',
  },
  'claude-3-5-haiku-20241022': {
    cost_per_1k_input: 0.001,
    cost_per_1k_output: 0.005,
    last_updated: Date.now(),
    source: 'fallback',
  },
  'claude-3-opus-20240229': {
    cost_per_1k_input: 0.015,
    cost_per_1k_output: 0.075,
    last_updated: Date.now(),
    source: 'fallback',
  },
};

export class AnthropicMetricsAdapter implements ProviderMetricsAdapter {
  readonly name = 'Anthropic Metrics Adapter';
  readonly provider = 'anthropic';

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
      provider: 'anthropic',
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
          anthropic: {
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
        anthropic: {
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
      };
    }

    return {
      provider: 'anthropic',
      budget: {
        monthlyLimit: 0, // No built-in budget tracking for Anthropic
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
      console.error('[ANTHROPIC-ADAPTER] Successfully fetched live pricing');
      return true;
    }

    console.error('[ANTHROPIC-ADAPTER] Failed to fetch live pricing, using fallback');
    return false;
  }

  isAvailable(): boolean {
    return !!process.env.ANTHROPIC_API_KEY;
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
            console.error('[ANTHROPIC-ADAPTER] Auto-refreshed live pricing');
          }
        })
        .catch(() => {
          this.lastFetchTime = now;
          console.error('[ANTHROPIC-ADAPTER] Auto-refresh failed, using fallback');
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
    // No live scraping - use fallback pricing
    // Pricing changes infrequently (quarterly), so manual updates are acceptable
    return null;
  }

  /**
   * Create a batch job using Anthropic's Message Batches API
   * https://docs.anthropic.com/en/docs/build-with-claude/message-batches
   */
  async createBatchJob(request: BatchJobRequest): Promise<BatchJobHandle> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }

    // Convert generic batch request to Anthropic format
    const anthropicRequests = request.requests.map((req) => ({
      custom_id: req.custom_id,
      params: {
        model: request.model,
        max_tokens: req.params.max_tokens || 4096,
        messages: req.params.messages,
        temperature: req.params.temperature,
      },
    }));

    const response = await fetch('https://api.anthropic.com/v1/messages/batches', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        requests: anthropicRequests,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic batch creation failed: ${error}`);
    }

    const data = await response.json() as any;

    return {
      batch_id: data.id,
      status: this.mapAnthropicStatus(data.processing_status),
      created_at: data.created_at,
      expires_at: data.expires_at,
      request_counts: {
        total: data.request_counts?.total || 0,
        completed: data.request_counts?.succeeded || 0,
        failed: data.request_counts?.errored || 0,
      },
      metadata: data,
    };
  }

  /**
   * Get batch job status
   */
  async getBatchJobStatus(batchId: string): Promise<BatchJobHandle> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }

    const response = await fetch(`https://api.anthropic.com/v1/messages/batches/${batchId}`, {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic batch status failed: ${error}`);
    }

    const data = await response.json() as any;

    return {
      batch_id: data.id,
      status: this.mapAnthropicStatus(data.processing_status),
      created_at: data.created_at,
      expires_at: data.expires_at,
      request_counts: {
        total: data.request_counts?.total || 0,
        completed: data.request_counts?.succeeded || 0,
        failed: data.request_counts?.errored || 0,
      },
      metadata: data,
    };
  }

  /**
   * Get batch job results
   */
  async getBatchJobResults(batchId: string): Promise<BatchJobResult> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }

    // First get the batch status to check if it's complete
    const status = await this.getBatchJobStatus(batchId);

    if (status.status !== 'ended') {
      throw new Error(`Batch job ${batchId} is not complete yet (status: ${status.status})`);
    }

    // Get the results URL from the batch metadata
    const resultsUrl = (status.metadata as any)?.results_url;
    if (!resultsUrl) {
      throw new Error(`No results URL found for batch ${batchId}`);
    }

    // Fetch the results
    const response = await fetch(resultsUrl, {
      method: 'GET',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic batch results failed: ${error}`);
    }

    const resultsText = await response.text();
    const results = resultsText
      .split('\n')
      .filter((line) => line.trim())
      .map((line) => JSON.parse(line));

    // Calculate total cost
    let totalCost = 0;
    const formattedResults = results.map((result: any) => {
      const usage = result.result?.usage;
      if (usage) {
        const pricing = this.pricingCache[result.result.model] || this.pricingCache['claude-3-5-sonnet-20241022'];
        const inputCost = (usage.input_tokens / 1000) * pricing.cost_per_1k_input;
        const outputCost = (usage.output_tokens / 1000) * pricing.cost_per_1k_output;
        totalCost += inputCost + outputCost;
      }

      return {
        custom_id: result.custom_id,
        result: result.result
          ? {
              content: result.result.content?.[0]?.text || '',
              usage: usage
                ? {
                    input_tokens: usage.input_tokens,
                    output_tokens: usage.output_tokens,
                  }
                : undefined,
            }
          : undefined,
        error: result.error
          ? {
              type: result.error.type,
              message: result.error.message,
            }
          : undefined,
      };
    });

    return {
      batch_id: batchId,
      status: 'completed',
      results: formattedResults,
      total_cost: totalCost,
    };
  }

  /**
   * Map Anthropic batch status to generic status
   */
  private mapAnthropicStatus(
    status: string
  ): 'validating' | 'in_progress' | 'canceling' | 'ended' {
    switch (status) {
      case 'in_progress':
        return 'in_progress';
      case 'canceling':
        return 'canceling';
      case 'ended':
        return 'ended';
      default:
        return 'validating';
    }
  }
}

