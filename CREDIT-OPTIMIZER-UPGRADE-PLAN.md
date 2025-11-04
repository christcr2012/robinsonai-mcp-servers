# Credit Optimizer Upgrade Plan

Based on ChatGPT document lines 5762-6500, here's the complete upgrade plan for the Credit Optimizer MCP.

## Vision

The Credit Optimizer should be a **smart router** that:
- Tries FREE models (Ollama) first
- Escalates to PAID models (OpenAI, Claude, Google) when quality gates fail
- Tracks costs and enforces budgets
- Caches responses to avoid paying twice
- Provides health checks for all providers

## Files to Create

### 1. Model Catalog (`src/lib/model_catalog.ts`)
**Purpose:** Define all available models with costs, capabilities, and quality scores

**Key Types:**
- `ModelKind`: "chat" | "embed" | "rerank"
- `Provider`: "ollama" | "openai" | "anthropic" | "google"
- `ModelInfo`: { id, provider, kind, ctx, tps, priceIn, priceOut, quality, supports }

**Models to Include:**
- **Ollama (FREE):**
  - llama3.1:70b-instruct-q5_K_M (quality: 0.78)
  - qwen2.5-coder:32b-instruct-q5_K_M (quality: 0.80)
  - nomic-embed-text (quality: 0.70)

- **OpenAI (PAID):**
  - gpt-4o-mini (quality: 0.88, $0.15/$0.60 per 1K tokens)
  - gpt-4.1-mini (quality: 0.92, $0.30/$1.20 per 1K tokens)
  - text-embedding-3-small (quality: 0.86, $0.02 per 1K tokens)

- **Anthropic (PAID):**
  - claude-3-haiku-20240307 (quality: 0.88, $0.25/$1.25 per 1K tokens)
  - claude-3-5-sonnet-20241022 (quality: 0.98, $3/$15 per 1K tokens)

- **Google (PAID):**
  - gemini-1.5-pro (quality: 0.93, $1.25/$5 per 1K tokens)

### 2. Provider Abstraction (`src/lib/providers.ts`)
**Purpose:** Unified interface for all providers with retry/backoff

**Key Functions:**
- `withRetry<T>(fn, tries=3)` - Exponential backoff retry logic
- `Providers.generateOllama(args)` - Call Ollama /api/generate
- `Providers.generateOpenAI(args)` - Call OpenAI /v1/chat/completions
- `Providers.generateAnthropic(args)` - Call Anthropic /v1/messages
- `Providers.generateGoogle(args)` - Call Google Gemini API
- `generate(args)` - Main entry point that routes to correct provider

**Key Types:**
- `GenArgs`: { model, input, system?, json?, maxTokens?, temperature?, tools? }
- `GenOut`: { output, usage?, provider, model }

### 3. Policy Engine (`src/lib/policy.ts`)
**Purpose:** Budget enforcement, quality gates, caching, routing logic

**Key Functions:**
- `cacheDir(root)` - Get cache directory path
- `hashKey(x)` - Hash prompt for cache key
- `getCache(root, key)` - Retrieve cached response
- `putCache(root, key, val)` - Store response in cache
- `priceEstimate(model, inTok, outTok)` - Calculate cost
- `pickCandidates(task, preferFree)` - Select models to try
- `qualityGate(task, text)` - Check if output meets quality standards
- `routeAndExecute(args)` - Main routing logic with escalation

**Key Types:**
- `TaskType`: "codegen" | "analysis" | "classification" | "embedding"
- `Budget`: { maxUsd?, preferFree?, maxLatencyMs?, quality? }
- `RouteResult`: { tried[], final, escalated }

**Quality Gates:**
- **codegen**: Must contain code patterns (```, class, function, def, interface, return) and be > 120 chars
- **analysis**: Must have 6+ lines and contain keywords (summary, recommend, risk, option)
- **classification**: Must be non-empty and < 2000 chars
- **default**: Must be non-empty

### 4. MCP Tools

#### `credit_optimize_execute` (`src/tools/optimize_execute.ts`)
**Purpose:** Main tool that agents call to execute prompts with budget/quality control

**Input:**
- `task`: "codegen" | "analysis" | "classification" | "embedding"
- `prompt`: { system?, user }
- `budget?`: { maxUsd?, preferFree?, maxLatencyMs?, quality? }

**Output:**
- `tried`: Array of models attempted with estimated costs
- `final`: { model, provider, costUsd, latencyMs, output, usage }
- `escalated`: Boolean indicating if escalation occurred

#### `credit_optimizer_health` (`src/tools/optimizer_health.ts`)
**Purpose:** Check which providers are configured

**Output:**
- `ok`: true
- `env`: { OLLAMA_URL, OPENAI_API_KEY (boolean), ANTHROPIC_API_KEY (boolean), GOOGLE_API_KEY (boolean) }

#### `credit_ollama_health` (`src/tools/ollama_health.ts`)
**Purpose:** Check Ollama availability and loaded models

**Output:**
- `ok`: Boolean
- `url`: Ollama URL
- `models`: Array of { name, size, digest }

### 5. Server Integration (`src/index.ts`)
**Purpose:** Register all tools in the MCP server

**Changes:**
- Import all tool descriptors and handlers
- Create centralized registry
- Set up tools/list handler
- Set up tools/call handler with proper error handling

## Environment Variables

```bash
# Routing defaults
CO_PREFER_FREE=1              # default: try Ollama first
CO_MAX_USD=0.50               # per-call ceiling unless overridden

# Providers (set only those you want)
OLLAMA_URL=http://localhost:11434
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GOOGLE_API_KEY=
```

## Usage Examples

### Health Check
```javascript
credit_optimizer_health -> {}
credit_ollama_health -> {}
```

### Free-first, escalate if needed
```javascript
credit_optimize_execute -> {
  "task": "analysis",
  "prompt": {
    "system": "You are a precise engineering analyst.",
    "user": "Summarize risks in our MCP handshake code and propose fixes."
  },
  "budget": {
    "maxUsd": 0.25,
    "preferFree": true,
    "quality": 0.85
  }
}
```

### Force best quality
```javascript
credit_optimize_execute -> {
  "task": "codegen",
  "prompt": {
    "system": "Return only valid TypeScript.",
    "user": "Write a robust MCP tools/list handler that advertises all tools."
  },
  "budget": {
    "maxUsd": 1.50,
    "preferFree": false,
    "quality": 0.95
  }
}
```

## Implementation Steps

1. ✅ Read and understand the specs (DONE)
2. Create `src/lib/model_catalog.ts`
3. Create `src/lib/providers.ts`
4. Create `src/lib/policy.ts`
5. Create `src/tools/optimize_execute.ts`
6. Create `src/tools/optimizer_health.ts`
7. Create `src/tools/ollama_health.ts`
8. Update `src/index.ts` to register all tools
9. Build and test
10. Commit and push

## Benefits

- **Cost Control**: Automatic escalation only when needed
- **Quality Assurance**: Quality gates ensure output meets standards
- **Caching**: Avoid paying twice for identical prompts
- **Reliability**: Retry logic and graceful fallback
- **Transparency**: Full visibility into which models were tried and costs incurred
- **Flexibility**: Easy to add new providers or models

