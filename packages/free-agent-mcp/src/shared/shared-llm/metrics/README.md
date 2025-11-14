# Provider-Agnostic Metrics System

A unified metrics and cost tracking system that works across multiple LLM providers.

## Supported Providers

- ✅ **OpenAI** - gpt-4o-mini, gpt-4o, o1-mini, o1 (live pricing from openai.com)
- ✅ **Anthropic** - Claude 3.5 Sonnet, Claude 3.5 Haiku, Claude 3 Opus
- ✅ **Moonshot (Kimi)** - moonshot-v1-8k, moonshot-v1-32k, moonshot-v1-128k (CHEAPEST!)
- ✅ **Voyage AI** - voyage-3, voyage-3-lite
- ✅ **Ollama** - All local models (FREE)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  Provider-Agnostic Tools                     │
│  agent_get_cost_estimate, agent_get_usage_stats, etc.       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   ProviderMetricsAdapter                     │
│              (Interface all providers implement)             │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐      ┌──────────────┐
│   OpenAI     │    │  Anthropic   │      │   Moonshot   │
│   Adapter    │    │   Adapter    │ ...  │   Adapter    │
└──────────────┘    └──────────────┘      └──────────────┘
```

## Adding a New Provider (5 Easy Steps!)

### Step 1: Create Adapter File

Create `packages/shared-llm/src/metrics/YOUR-PROVIDER-adapter.ts`:

```typescript
import type {
  ProviderMetricsAdapter,
  CostEstimate,
  UsageStats,
  CapacityInfo,
} from './provider-metrics.js';

export class YourProviderMetricsAdapter implements ProviderMetricsAdapter {
  readonly name = 'Your Provider Metrics Adapter';
  readonly provider = 'yourprovider';

  constructor(private getTokenStats?: (period: string) => any) {}

  async getCostEstimate(params: {
    model: string;
    inputTokens: number;
    outputTokens?: number;
  }): Promise<CostEstimate> {
    // Calculate cost based on your provider's pricing
    const inputCost = (params.inputTokens / 1000) * YOUR_INPUT_PRICE;
    const outputCost = ((params.outputTokens || 0) / 1000) * YOUR_OUTPUT_PRICE;
    
    return {
      inputCost,
      outputCost,
      totalCost: inputCost + outputCost,
      currency: 'USD',
      model: params.model,
      provider: 'yourprovider',
      pricing: {
        inputPer1k: YOUR_INPUT_PRICE,
        outputPer1k: YOUR_OUTPUT_PRICE,
        source: 'fallback',
        lastUpdated: new Date().toISOString(),
      },
    };
  }

  async getUsageStats(params: { period: 'day' | 'week' | 'month' | 'all' }): Promise<UsageStats> {
    // Return usage stats from token tracker
    if (this.getTokenStats) {
      const stats = this.getTokenStats(params.period);
      return {
        period: params.period,
        totalCost: stats.total_cost || 0,
        totalTokens: stats.total_tokens || 0,
        totalRequests: stats.total_requests || 0,
        byProvider: {
          yourprovider: {
            cost: stats.total_cost || 0,
            tokens: stats.total_tokens || 0,
            requests: stats.total_requests || 0,
          },
        },
        byModel: stats.by_model || {},
      };
    }
    return { period: params.period, totalCost: 0, totalTokens: 0, totalRequests: 0, byProvider: {}, byModel: {} };
  }

  async getCapacity(params?: { model?: string }): Promise<CapacityInfo> {
    return {
      provider: 'yourprovider',
      budget: { monthlyLimit: 0, spent: 0, remaining: Infinity, percentageUsed: 0 },
      models: {
        'your-model-name': {
          available: true,
          costPer1kInput: YOUR_INPUT_PRICE,
          costPer1kOutput: YOUR_OUTPUT_PRICE,
          pricingSource: 'fallback',
        },
      },
    };
  }

  async refreshPricing(): Promise<boolean> {
    // Optionally fetch live pricing from provider's API
    return true;
  }

  isAvailable(): boolean {
    return !!process.env.YOUR_PROVIDER_API_KEY;
  }
}
```

### Step 2: Export from index.ts

Add to `packages/shared-llm/src/index.ts`:

```typescript
export { YourProviderMetricsAdapter } from './metrics/yourprovider-adapter.js';
```

### Step 3: Register in Paid Agent MCP

Add to `packages/paid-agent-mcp/src/index.ts`:

```typescript
// Import
import { YourProviderMetricsAdapter } from '@robinson_ai_systems/shared-llm';

// Register in initializeMetricsAdapters()
const yourProviderAdapter = new YourProviderMetricsAdapter(
  (period: string) => getTokenTracker().getStats(period)
);
registerMetricsAdapter(yourProviderAdapter);
```

### Step 4: Update Tool Enums

Add 'yourprovider' to all provider enums in `packages/paid-agent-mcp/src/index.ts`:

```typescript
enum: ['openai', 'anthropic', 'moonshot', 'voyage', 'ollama', 'yourprovider', 'all']
```

### Step 5: Done! 🎉

Your new provider is now fully integrated:
- ✅ Cost estimation works
- ✅ Usage tracking works
- ✅ Capacity reporting works
- ✅ All `agent_get_*` tools support it

## Benefits

- **Unified Interface**: Same API for all providers
- **Easy Comparison**: Compare costs across providers instantly
- **Extensible**: Add new providers in ~100 lines of code
- **Type-Safe**: Full TypeScript support
- **Provider-Agnostic**: Tools work the same regardless of provider

## Example Usage

```typescript
// Get cost estimate for any provider
const estimate = await adapter.getCostEstimate({
  model: 'gpt-4o-mini',
  inputTokens: 1000,
  outputTokens: 500,
});

// Compare costs across providers
const estimates = await aggregateCostEstimates({
  model: 'gpt-4o-mini',
  inputTokens: 1000,
  outputTokens: 500,
  providers: ['openai', 'anthropic', 'moonshot'],
});

// Find cheapest option
const cheapest = estimates.sort((a, b) => a.totalCost - b.totalCost)[0];
```

