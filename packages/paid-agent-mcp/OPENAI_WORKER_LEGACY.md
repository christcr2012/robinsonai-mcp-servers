# OpenAI Worker Tools - Legacy Documentation

**⚠️ DEPRECATED**: These tools are maintained for backward compatibility only. All new code should use the provider-agnostic `agent_*` tools instead.

## Migration Guide

### Deprecated Tools → New Tools

| Legacy Tool | New Tool | Notes |
|------------|----------|-------|
| `openai_worker_get_spend_stats` | `agent_get_usage_stats` | Now supports all providers (OpenAI, Anthropic, Moonshot, Ollama, Voyage) |
| `openai_worker_estimate_cost` | `agent_get_cost_estimate` | Provider-agnostic cost estimation |
| `openai_worker_get_capacity` | `agent_get_capacity` | Multi-provider capacity reporting |
| `openai_worker_refresh_pricing` | `agent_refresh_pricing` | Refresh pricing for all providers |
| `openai_worker_get_token_analytics` | `agent_get_token_analytics` | Cross-provider token analytics |

### Still Active (Not Deprecated)

These tools are still actively used and are NOT deprecated:
- `openai_worker_run_job` - Execute jobs with OpenAI models
- `openai_worker_queue_batch` - Queue batch jobs
- `openai_worker_get_job_status` - Get job status

## Why Deprecated?

The original `openai_worker_*` metrics tools were OpenAI-specific and couldn't handle other providers like Anthropic, Moonshot, or Ollama. The new `agent_*` tools use a provider-agnostic architecture that works across all LLM providers.

## Provider-Agnostic Architecture

The new metrics system uses adapters:

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
│   Adapter    │    │   Adapter    │      │   Adapter    │
└──────────────┘    └──────────────┘      └──────────────┘
```

## Migration Examples

### Before (OpenAI-only)
```typescript
// Get spend stats (OpenAI only)
const stats = await openai_worker_get_spend_stats();

// Estimate cost (OpenAI only)
const cost = await openai_worker_estimate_cost({
  agent: 'mini-worker',
  estimated_input_tokens: 1000,
  estimated_output_tokens: 500
});
```

### After (Provider-agnostic)
```typescript
// Get usage stats (all providers)
const stats = await agent_get_usage_stats({
  period: 'month',
  provider: 'all' // or 'openai', 'anthropic', 'moonshot', etc.
});

// Estimate cost (any provider)
const cost = await agent_get_cost_estimate({
  provider: 'auto', // or specific provider
  model: 'gpt-4o-mini',
  estimated_input_tokens: 1000,
  estimated_output_tokens: 500
});
```

## Implementation Status

✅ **All deprecated tools delegate to new tools** - The legacy tools still work but internally call the new provider-agnostic implementations.

✅ **Deprecation warnings in responses** - All deprecated tools include `_deprecation_notice` in their JSON responses.

✅ **Documentation updated** - Tool descriptions include deprecation warnings.

## Timeline

- **2025-01-14**: Provider-agnostic metrics system implemented
- **2025-01-14**: Legacy tools marked as deprecated
- **Future**: Legacy tools will be removed in a future major version

## For Maintainers

The legacy tool handlers are located in `packages/paid-agent-mcp/src/index.ts`:
- `handleGetSpendStats()` - Lines ~2058-2085
- `handleEstimateCost()` - Lines ~2089-2139
- `handleRefreshPricing()` - Lines ~2143-2164
- `handleGetCapacity()` - Lines ~2168-2230
- `handleGetTokenAnalytics()` - Lines ~2234-2257

All handlers include:
- `@deprecated` JSDoc tags
- "DO NOT USE IN NEW CODE" warnings
- Delegation to new `handleAgent*` functions
- `_deprecation_notice` in responses

## References

- Provider-agnostic metrics: `packages/shared-llm/src/metrics/`
- New tool handlers: `packages/paid-agent-mcp/src/index.ts` (lines 2263-2457)
- Metrics README: `packages/shared-llm/src/metrics/README.md`

