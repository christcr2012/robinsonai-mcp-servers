# OpenAI Worker Legacy Tools - Migration to Provider-Agnostic Metrics

**Status**: Phase 1 - COMPLETE ✅
**Date Started**: 2025-11-14
**Date Completed**: 2025-11-14

## Overview

This document inventories all `openai_worker_*` tools in the Paid Agent MCP server and classifies them for migration to provider-agnostic metrics that work with OpenAI, Anthropic, Moonshot/Kimi, Ollama, etc.

## ✅ Phase 1 Complete

All Phase 1 objectives have been completed:

1. ✅ **Provider-Agnostic Metrics Module** - Created `packages/shared-llm/src/metrics/provider-metrics.ts` with interfaces and registry
2. ✅ **OpenAI Metrics Adapter** - Implemented `packages/shared-llm/src/metrics/openai-adapter.ts` with live pricing
3. ✅ **Ollama Metrics Adapter** - Implemented `packages/shared-llm/src/metrics/ollama-adapter.ts` (always free)
4. ✅ **New Agent-Level Tools** - Added 5 new provider-agnostic tools to Paid Agent MCP:
   - `agent_get_cost_estimate`
   - `agent_get_usage_stats`
   - `agent_get_capacity`
   - `agent_refresh_pricing`
   - `agent_get_token_analytics`
5. ✅ **Legacy Tool Deprecation** - Marked all 5 OpenAI Worker metrics tools as deprecated with ⚠️ warnings
6. ✅ **Backward Compatibility** - Legacy tools now delegate to new provider-agnostic tools internally

## Tool Classification

| Tool Name | Purpose | Classification | Migration Target |
|-----------|---------|----------------|------------------|
| `openai_worker_run_job` | Execute job with specific agent (mini/balanced/premium) | Job Queue/Worker Orchestration | Keep as-is (OpenAI-specific execution) |
| `openai_worker_queue_batch` | Queue multiple jobs for batch processing | Job Queue/Worker Orchestration | Keep as-is (OpenAI-specific batching) |
| `openai_worker_get_job_status` | Get status of a specific job | Job Queue/Worker Orchestration | Keep as-is (job tracking) |
| `openai_worker_get_spend_stats` | Get monthly spend statistics | **Cost/Usage Analytics** | → `agent_get_usage_stats` |
| `openai_worker_estimate_cost` | Estimate cost before running job | **Cost/Usage Analytics** | → `agent_get_cost_estimate` |
| `openai_worker_get_capacity` | Get current capacity and availability | **Capacity/Limits** | → `agent_get_capacity` |
| `openai_worker_refresh_pricing` | Force refresh pricing from live source | **Cost/Usage Analytics** | → `agent_refresh_pricing` |
| `openai_worker_get_token_analytics` | Get detailed token usage analytics | **Cost/Usage Analytics** | → `agent_get_token_analytics` |

## Migration Strategy

### Tools to Migrate (Provider-Agnostic Metrics)

These tools should become provider-agnostic and work with any LLM provider:

1. **`openai_worker_get_spend_stats`** → **`agent_get_usage_stats`**
   - Current: Returns OpenAI-specific monthly spend
   - New: Returns provider-agnostic usage stats (supports OpenAI, Anthropic, Moonshot, Ollama)
   - Implementation: Use `ProviderMetricsAdapter` interface

2. **`openai_worker_estimate_cost`** → **`agent_get_cost_estimate`**
   - Current: Estimates cost for OpenAI agents (mini/balanced/premium)
   - New: Estimates cost for any provider/model combination
   - Implementation: Use `ProviderMetricsAdapter.getCostEstimate()`

3. **`openai_worker_get_capacity`** → **`agent_get_capacity`**
   - Current: Returns OpenAI worker capacity and budget info
   - New: Returns provider-agnostic capacity info
   - Implementation: Use `ProviderMetricsAdapter.getCapacity()`

4. **`openai_worker_refresh_pricing`** → **`agent_refresh_pricing`**
   - Current: Refreshes OpenAI pricing from live source
   - New: Refreshes pricing for all configured providers
   - Implementation: Call refresh on all registered adapters

5. **`openai_worker_get_token_analytics`** → **`agent_get_token_analytics`**
   - Current: Returns OpenAI token usage analytics
   - New: Returns provider-agnostic token analytics
   - Implementation: Use unified token tracker with provider tags

### Tools to Keep (OpenAI-Specific)

These tools are genuinely OpenAI-specific and should remain:

1. **`openai_worker_run_job`**
   - Purpose: Execute job with OpenAI-specific agents (mini-worker, balanced-worker, premium-worker)
   - Reason: Tied to OpenAI's specific model execution

2. **`openai_worker_queue_batch`**
   - Purpose: Queue multiple jobs for OpenAI batch processing
   - Reason: Uses OpenAI's batch API features

3. **`openai_worker_get_job_status`**
   - Purpose: Get status of OpenAI job
   - Reason: Job tracking specific to OpenAI worker queue

## Implementation Plan

### Phase 1: Create Provider-Agnostic Metrics Module

**Location:** `packages/shared-llm/src/metrics/provider-metrics.ts`

**Interfaces:**
```typescript
export interface ProviderMetricsAdapter {
  getCostEstimate(params: {
    model: string;
    inputTokens: number;
    outputTokens?: number;
  }): Promise<CostEstimate>;
  
  getUsageStats(params: {
    period: 'day' | 'week' | 'month' | 'all';
  }): Promise<UsageStats>;
  
  getCapacity(params?: {
    model?: string;
  }): Promise<CapacityInfo>;
  
  refreshPricing(): Promise<boolean>;
}
```

**Adapters to Implement:**
- `OpenAIMetricsAdapter` - Extract from current OpenAI Worker code
- `AnthropicMetricsAdapter` - New (Claude pricing)
- `MoonshotMetricsAdapter` - New (Kimi pricing)
- `OllamaMetricsAdapter` - New (free, always $0)

### Phase 2: Add New Agent-Level Tools

Add to `packages/paid-agent-mcp/src/index.ts`:

1. `agent_get_cost_estimate` - Provider-agnostic cost estimation
2. `agent_get_usage_stats` - Provider-agnostic usage statistics
3. `agent_get_capacity` - Provider-agnostic capacity info
4. `agent_refresh_pricing` - Refresh pricing for all providers
5. `agent_get_token_analytics` - Provider-agnostic token analytics

### Phase 3: Deprecate Legacy Tools

1. Add `@deprecated` JSDoc comments to all `openai_worker_*` metrics tools
2. Update implementations to call new provider-agnostic tools
3. Update documentation to recommend new tools
4. Keep tools functional for backward compatibility

## Benefits

1. **Multi-Provider Support**: Works with OpenAI, Anthropic, Moonshot, Ollama
2. **Unified Interface**: Same API for all providers
3. **Cost Optimization**: Compare costs across providers
4. **Future-Proof**: Easy to add new providers
5. **Backward Compatible**: Legacy tools still work

## Timeline

- **Phase 1**: Provider-agnostic metrics module (this PR)
- **Phase 2**: New agent-level tools (this PR)
- **Phase 3**: Deprecation notices (this PR)
- **Phase 4**: Remove legacy tools (future PR, after migration period)

## Notes

- Legacy `openai_worker_*` tools will remain functional during migration
- New `agent_*` tools are the recommended approach going forward
- Job queue tools (`run_job`, `queue_batch`, `get_job_status`) remain OpenAI-specific

