# Cost-Aware Model Routing - Complete Guide

## Overview

The 5-server system now includes intelligent cost-aware model routing that:
- **Defaults to free Ollama** for 90% of work
- **Escalates to cheap OpenAI** (gpt-4o-mini) for bulk tasks when 2x faster
- **Escalates to premium OpenAI** (gpt-4o, o1-mini) only for high-risk tasks with approval
- **Enforces budgets** ($25/month default, $10 approval threshold)

---

## Architecture

### 5 Servers

1. **Architect MCP** - Planning + cost forecasting
2. **Credit Optimizer MCP** - Execution orchestration
3. **Autonomous Agent MCP** - Free local work (Ollama)
4. **Robinson's Toolkit MCP** - Integrations (GitHub, Vercel, Neon)
5. **OpenAI Worker MCP** - Paid cloud work (OpenAI) ← NEW

---

## How It Works

### 1. Architect Forecasts Cost

When you create a plan, Architect:
1. Estimates tokens from plan skeleton
2. Classifies task (bulk-edit, high-risk, etc.)
3. Checks Model Catalog for available models
4. Applies Policy Engine rules
5. Returns cost forecast with recommended model

**Example:**
```javascript
// Create plan
const plan = await architect.plan_work({
  goal: "Format all TypeScript files",
  mode: "skeleton"
});

// Forecast cost
const forecast = await architect.forecast_run_cost({
  plan_id: plan.plan_id
});

// Result:
{
  task_class: "format",
  estimated_tokens: 5000,
  recommended: {
    model: { name: "gpt-4o-mini", provider: "openai" },
    estimated_cost: 0.00075,  // $0.00075
    requires_approval: false,
    reason: "Matched rule: Bulk tasks to cheap OpenAI"
  }
}
```

### 2. Policy Engine Decides

**Default Rules:**

| Task Class | Condition | Target Model | Approval? |
|------------|-----------|--------------|-----------|
| bulk-edit, format, short-copy | 2x faster + cost ≤ $1 | gpt-4o-mini | No |
| high-risk, security, prod-deploy | Quality = premium | gpt-4o | Yes |
| All others | Default | qwen2.5:7b (Ollama) | No |

**Budget Caps:**
- `HUMAN_APPROVAL_REQUIRED_OVER=$10` - Require approval if cost > $10
- `MONTHLY_BUDGET=$25` - Hard cap at $25/month
- `MAX_OPENAI_CONCURRENCY=2` - Max 2 concurrent OpenAI jobs

### 3. Optimizer Executes

Credit Optimizer checks the forecast and routes work:

```javascript
if (forecast.recommended.model.provider === 'ollama') {
  // Use Autonomous Agent (free)
  await autonomous_agent.delegate_code_generation({ task, context });
} else if (forecast.recommended.model.provider === 'openai') {
  // Use OpenAI Worker (paid)
  if (forecast.recommended.requires_approval) {
    // Ask user for approval
    const approved = await askUser(forecast.approval_reason);
    if (!approved) return;
  }
  
  await openai_worker.run_job({
    agent: 'mini-worker',  // or 'balanced-worker', 'premium-worker'
    task,
    input_refs: []
  });
}
```

---

## Model Catalog

### Ollama Models (Free)

| Model | Speed | Quality | Cost | Context |
|-------|-------|---------|------|---------|
| qwen2.5:3b | Very Fast | Basic | $0 | 32K |
| qwen2.5:7b | Fast | Good | $0 | 32K |
| deepseek-coder:33b | Medium | Excellent | $0 | 16K |
| qwen2.5-coder:32b | Medium | Excellent | $0 | 32K |

### OpenAI Models (Paid)

| Model | Speed | Quality | Cost/1K | Context | Agent |
|-------|-------|---------|---------|---------|-------|
| gpt-4o-mini | Very Fast | Good | $0.00015 | 128K | mini-worker |
| gpt-4o | Fast | Premium | $0.0025 | 128K | balanced-worker |
| o1-mini | Slow | Premium | $0.003 | 128K | premium-worker |

---

## OpenAI Worker MCP

### Sub-Agents

1. **mini-worker** (gpt-4o-mini)
   - Very cheap, very fast
   - Use for: bulk edits, formatting, simple transforms
   - Cost: ~$0.15 per 1M tokens

2. **balanced-worker** (gpt-4o)
   - Mid-tier quality and cost
   - Use for: complex refactors, API design
   - Cost: ~$2.50 per 1M tokens

3. **premium-worker** (o1-mini)
   - Expensive, high-quality reasoning
   - Use for: security reviews, complex planning
   - Cost: ~$3.00 per 1M tokens
   - **Requires approval**

### Tools

```javascript
// Run single job
openai_worker.run_job({
  agent: 'mini-worker',
  task: 'Format this code: ...',
  input_refs: ['src/file.ts'],
  caps: { max_tokens: 4096 }
});

// Queue batch (cheaper, slower)
openai_worker.queue_batch({
  jobs: [
    { agent: 'mini-worker', task: 'Format file 1' },
    { agent: 'mini-worker', task: 'Format file 2' },
    // ... 100 more
  ]
});

// Check status
openai_worker.get_job_status({ job_id: 'job_123' });

// Get spend stats
openai_worker.get_spend_stats();
```

---

## Configuration

### Environment Variables

```bash
# Budget caps
HUMAN_APPROVAL_REQUIRED_OVER=10      # Require approval if cost > $10
MONTHLY_BUDGET=25                     # Hard cap at $25/month
MAX_OPENAI_CONCURRENCY=2              # Max 2 concurrent OpenAI jobs

# Default models
DEFAULT_OLLAMA_MODEL=qwen2.5:7b
CHEAP_OPENAI_AGENT=gpt-4o-mini
PREMIUM_OPENAI_AGENT=gpt-4o

# OpenAI API
OPENAI_API_KEY=sk-proj-...           # Your OpenAI API key
```

### MCP Configuration

See `COST_AWARE_MODEL_ROUTING_CONFIG.json` for complete Augment configuration.

---

## Usage Examples

### Example 1: Bulk Formatting (Auto-escalates to OpenAI)

```
User: Format all TypeScript files in src/

Augment:
1. architect.plan_work({ goal: "Format all TS files" })
   → plan_id: 123
   
2. architect.forecast_run_cost({ plan_id: 123 })
   → task_class: "format"
   → recommended: gpt-4o-mini ($0.002)
   → requires_approval: false
   
3. credit_optimizer.execute_autonomous_workflow(workflow)
   → Routes to openai_worker.run_job({ agent: 'mini-worker' })
   
4. Result: All files formatted in 30 seconds
   Cost: $0.002 (vs 5 minutes with Ollama)
```

### Example 2: High-Risk Deploy (Requires Approval)

```
User: Deploy to production

Augment:
1. architect.plan_work({ goal: "Deploy to production" })
   → plan_id: 456
   
2. architect.forecast_run_cost({ plan_id: 456 })
   → task_class: "high-risk"
   → recommended: gpt-4o ($0.15)
   → requires_approval: true
   → approval_reason: "High-risk task requires premium model"
   
3. Augment asks user:
   "🔔 Approval Required
    Model: gpt-4o (openai)
    Estimated Cost: $0.15
    Reason: High-risk task requires premium model
    
    Do you want to proceed? (yes/no)"
   
4. User: yes
   
5. credit_optimizer.execute_autonomous_workflow(workflow)
   → Routes to openai_worker.run_job({ agent: 'balanced-worker' })
```

### Example 3: Simple Task (Stays on Ollama)

```
User: Add a new function to utils.ts

Augment:
1. architect.plan_work({ goal: "Add function to utils.ts" })
   → plan_id: 789
   
2. architect.forecast_run_cost({ plan_id: 789 })
   → task_class: "short-copy"
   → recommended: qwen2.5:7b ($0)
   → requires_approval: false
   → reason: "No escalation rule matched, using default Ollama"
   
3. credit_optimizer.execute_autonomous_workflow(workflow)
   → Routes to autonomous_agent.delegate_code_generation()
   
4. Result: Function added in 10 seconds
   Cost: $0
```

---

## Monitoring

### Check Spend

```javascript
// Architect spend stats
architect.get_spend_stats();
// Returns:
{
  current_month: 5.23,
  remaining_budget: 19.77,
  total_budget: 25,
  percentage_used: 20.9
}

// OpenAI Worker spend stats
openai_worker.get_spend_stats();
// Returns:
{
  current_month: 5.23,
  total_budget: 25,
  remaining: 19.77,
  percentage_used: 20.9
}
```

### List Available Models

```javascript
architect.list_models();
// Returns:
{
  models: [
    { name: "qwen2.5:7b", provider: "ollama", available: true, cost: 0 },
    { name: "gpt-4o-mini", provider: "openai", available: true, cost: 0.00015 },
    // ...
  ],
  stats: {
    total: 7,
    available: 5,
    by_provider: { ollama: 4, openai: 1 }
  }
}
```

---

## Best Practices

### 1. Let Architect Decide
✅ Always call `forecast_run_cost()` before execution
❌ Don't manually choose models

### 2. Use Batch for Bulk Work
✅ `openai_worker.queue_batch()` for 100+ similar tasks
❌ Don't run 100 individual `run_job()` calls

### 3. Monitor Budget
✅ Check `get_spend_stats()` weekly
❌ Don't ignore budget warnings

### 4. Adjust Caps as Needed
✅ Increase `MONTHLY_BUDGET` if you need more
❌ Don't disable approval threshold

---

## Troubleshooting

### "Monthly budget exceeded"
**Problem:** OpenAI Worker refuses to run jobs
**Solution:** 
1. Check spend: `openai_worker.get_spend_stats()`
2. Wait for next month OR increase `MONTHLY_BUDGET`

### "Approval required but no response"
**Problem:** Augment is waiting for approval
**Solution:** Respond "yes" or "no" to the approval prompt

### "No models available"
**Problem:** Model Catalog shows 0 available models
**Solution:**
1. Check Ollama is running: `curl http://localhost:11434/api/tags`
2. Check OpenAI API key is set: `echo $OPENAI_API_KEY`

---

## Next Steps

1. ✅ Build OpenAI Worker: `cd packages/openai-worker-mcp && npm run build`
2. ✅ Import config: Use `COST_AWARE_MODEL_ROUTING_CONFIG.json`
3. ✅ Test workflow: Try bulk formatting task
4. ✅ Monitor spend: Check stats after first week

---

## Summary

**You now have intelligent cost routing:**
- 90% of work stays free (Ollama)
- 10% escalates to OpenAI when worth it
- Budget caps prevent runaway costs
- Approval required for expensive tasks

**Total monthly cost: ~$5-15** (vs $100+ with all-cloud)

