# 🔄 Comprehensive Refactoring Plan - Unified Model Support

**Date**: 2025-10-30  
**Goal**: Make both agent MCPs support ANY model (OpenAI, Ollama, Claude, etc.) and fix architectural issues  
**Estimated Time**: 8-12 hours

---

## 🎯 OBJECTIVES

1. **Rename Servers** to reflect capabilities (not providers)
2. **Unified Model Support** - Both agents can use OpenAI, Ollama, Claude, etc.
3. **Fix Credit Optimizer Bypass** - All execution goes through cost validation
4. **System-Wide Updates** - Update all references, imports, documentation

---

## 📋 PHASE 1: RENAME SERVERS (2-3 hours)

### 1.1 Rename `autonomous-agent-mcp` → `free-agent-mcp`

**Rationale**: "Autonomous" doesn't convey "FREE". "Free Agent" clearly indicates it uses FREE models.

**Changes Required**:
- ✅ Package name: `@robinsonai/free-agent-mcp`
- ✅ Folder: `packages/free-agent-mcp`
- ✅ Binary: `free-agent-mcp`
- ✅ Tool names: `execute_versatile_task_free-agent-mcp`
- ✅ All imports across 7 servers
- ✅ All documentation

**Files to Update**:
```
packages/autonomous-agent-mcp/package.json → packages/free-agent-mcp/package.json
packages/autonomous-agent-mcp/README.md → packages/free-agent-mcp/README.md
packages/autonomous-agent-mcp/src/index.ts → packages/free-agent-mcp/src/index.ts
packages/credit-optimizer-mcp/src/agent-pool.ts (imports)
packages/credit-optimizer-mcp/src/parallel-execution.ts (imports)
READY_TO_PASTE_CONFIG.json
AUGMENT_MCP_CONFIGURATION_SOURCE_OF_TRUTH.md
README.md
All documentation files
```

### 1.2 Rename `openai-worker-mcp` → `paid-agent-mcp`

**Rationale**: "OpenAI Worker" is too specific. "Paid Agent" clearly indicates it uses PAID models (OpenAI, Claude, etc.).

**Changes Required**:
- ✅ Package name: `@robinsonai/paid-agent-mcp`
- ✅ Folder: `packages/paid-agent-mcp`
- ✅ Binary: `paid-agent-mcp`
- ✅ Tool names: `execute_versatile_task_paid-agent-mcp`
- ✅ All imports across 7 servers
- ✅ All documentation

**Files to Update**:
```
packages/openai-worker-mcp/package.json → packages/paid-agent-mcp/package.json
packages/openai-worker-mcp/README.md → packages/paid-agent-mcp/README.md
packages/openai-worker-mcp/src/index.ts → packages/paid-agent-mcp/src/index.ts
packages/credit-optimizer-mcp/src/agent-pool.ts (imports)
packages/credit-optimizer-mcp/src/parallel-execution.ts (imports)
READY_TO_PASTE_CONFIG.json
AUGMENT_MCP_CONFIGURATION_SOURCE_OF_TRUTH.md
README.md
All documentation files
```

---

## 📋 PHASE 2: UNIFIED MODEL CATALOG (3-4 hours)

### 2.1 Create Shared Model Catalog Package

**New Package**: `packages/shared-model-catalog`

**Purpose**: Single source of truth for ALL models (FREE + PAID)

**Structure**:
```typescript
// packages/shared-model-catalog/src/index.ts

export interface ModelConfig {
  id: string;                    // e.g., "openai/gpt-4o", "ollama/qwen2.5-coder:7b", "claude/claude-3.5-sonnet"
  provider: 'openai' | 'ollama' | 'claude' | 'gemini';
  name: string;                  // Display name
  cost: number | 'free';         // Cost per 1M tokens (input + output average)
  quality: 'basic' | 'standard' | 'premium' | 'best';
  speed: 'slow' | 'medium' | 'fast' | 'very_fast';
  contextWindow: number;         // Max context tokens
  capabilities: string[];        // ['code', 'chat', 'vision', 'function_calling']
}

export const MODEL_CATALOG: Record<string, ModelConfig> = {
  // FREE MODELS (Ollama)
  'ollama/qwen2.5:3b': {
    id: 'ollama/qwen2.5:3b',
    provider: 'ollama',
    name: 'Qwen 2.5 3B',
    cost: 'free',
    quality: 'basic',
    speed: 'very_fast',
    contextWindow: 32768,
    capabilities: ['code', 'chat'],
  },
  'ollama/qwen2.5-coder:7b': {
    id: 'ollama/qwen2.5-coder:7b',
    provider: 'ollama',
    name: 'Qwen 2.5 Coder 7B',
    cost: 'free',
    quality: 'standard',
    speed: 'fast',
    contextWindow: 32768,
    capabilities: ['code', 'chat'],
  },
  'ollama/deepseek-coder:33b': {
    id: 'ollama/deepseek-coder:33b',
    provider: 'ollama',
    name: 'DeepSeek Coder 33B',
    cost: 'free',
    quality: 'best',
    speed: 'slow',
    contextWindow: 16384,
    capabilities: ['code', 'chat'],
  },
  
  // PAID MODELS (OpenAI)
  'openai/gpt-4o-mini': {
    id: 'openai/gpt-4o-mini',
    provider: 'openai',
    name: 'GPT-4o Mini',
    cost: 0.15,  // $0.15 per 1M tokens (average)
    quality: 'standard',
    speed: 'very_fast',
    contextWindow: 128000,
    capabilities: ['code', 'chat', 'vision', 'function_calling'],
  },
  'openai/gpt-4o': {
    id: 'openai/gpt-4o',
    provider: 'openai',
    name: 'GPT-4o',
    cost: 2.5,  // $2.50 per 1M tokens (average)
    quality: 'premium',
    speed: 'fast',
    contextWindow: 128000,
    capabilities: ['code', 'chat', 'vision', 'function_calling'],
  },
  'openai/o1-mini': {
    id: 'openai/o1-mini',
    provider: 'openai',
    name: 'O1 Mini',
    cost: 3.0,  // $3.00 per 1M tokens (average)
    quality: 'best',
    speed: 'slow',
    contextWindow: 128000,
    capabilities: ['code', 'chat', 'reasoning'],
  },
  
  // PAID MODELS (Claude)
  'claude/claude-3-haiku': {
    id: 'claude/claude-3-haiku',
    provider: 'claude',
    name: 'Claude 3 Haiku',
    cost: 0.25,  // $0.25 per 1M tokens (average)
    quality: 'standard',
    speed: 'very_fast',
    contextWindow: 200000,
    capabilities: ['code', 'chat', 'vision'],
  },
  'claude/claude-3.5-sonnet': {
    id: 'claude/claude-3.5-sonnet',
    provider: 'claude',
    name: 'Claude 3.5 Sonnet',
    cost: 3.0,  // $3.00 per 1M tokens (average)
    quality: 'premium',
    speed: 'fast',
    contextWindow: 200000,
    capabilities: ['code', 'chat', 'vision'],
  },
  'claude/claude-3-opus': {
    id: 'claude/claude-3-opus',
    provider: 'claude',
    name: 'Claude 3 Opus',
    cost: 15.0,  // $15.00 per 1M tokens (average)
    quality: 'best',
    speed: 'medium',
    contextWindow: 200000,
    capabilities: ['code', 'chat', 'vision'],
  },
};

export function selectBestModel(params: {
  minQuality?: 'basic' | 'standard' | 'premium' | 'best';
  maxCost?: number;
  taskComplexity?: 'simple' | 'medium' | 'complex' | 'expert';
  preferFree?: boolean;
  provider?: 'openai' | 'ollama' | 'claude' | 'any';
}): string {
  // Smart model selection logic
  // Returns best model ID based on constraints
}
```

### 2.2 Update Free Agent MCP

**Add Support For**:
- ✅ Ollama (existing)
- ✅ Any FREE provider in the future

**Changes**:
```typescript
// packages/free-agent-mcp/src/index.ts

import { MODEL_CATALOG, selectBestModel } from '@robinsonai/shared-model-catalog';

// Use unified catalog instead of hardcoded Ollama models
const modelId = selectBestModel({
  minQuality: 'standard',
  maxCost: 0,  // FREE only
  preferFree: true,
  provider: 'any',  // Accept any FREE provider
});
```

### 2.3 Update Paid Agent MCP

**Add Support For**:
- ✅ OpenAI (existing)
- ✅ Claude (NEW!)
- ✅ Any PAID provider in the future

**Changes**:
```typescript
// packages/paid-agent-mcp/src/index.ts

import { MODEL_CATALOG, selectBestModel } from '@robinsonai/shared-model-catalog';
import Anthropic from '@anthropic-ai/sdk';  // NEW

// Add Claude client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Use unified catalog
const modelId = selectBestModel({
  minQuality: params.minQuality,
  maxCost: params.maxCost,
  preferFree: params.forcePaid ? false : true,
  provider: 'any',  // Accept any provider
});

// Execute based on provider
const modelConfig = MODEL_CATALOG[modelId];
if (modelConfig.provider === 'openai') {
  // Use OpenAI SDK
} else if (modelConfig.provider === 'claude') {
  // Use Anthropic SDK (NEW!)
} else if (modelConfig.provider === 'ollama') {
  // Use Ollama client
}
```

---

## 📋 PHASE 3: FIX CREDIT OPTIMIZER BYPASS (2-3 hours)

### 3.1 Update Credit Optimizer to Support Arbitrary MCP Tools

**File**: `packages/credit-optimizer-mcp/src/autonomous-executor.ts`

**Add Method**:
```typescript
private async callMCPTool(toolName: string, params: any): Promise<any> {
  // Parse tool name (e.g., "execute_versatile_task_free-agent-mcp")
  const [_, agentType] = toolName.split('_').slice(-2);
  
  // Get agent from pool
  const agent = this.agentPool.assignTask({ ...params, agentType });
  
  if (!agent) {
    throw new Error(`No ${agentType} agents available`);
  }
  
  // Call the tool
  const result = await agent.client.callTool(toolName, params);
  
  // Track cost
  if (result.cost) {
    this.totalCost += result.cost.total;
  }
  
  // Release agent
  agent.busy = false;
  
  return result;
}
```

**Update executeWorkflow**:
```typescript
async executeWorkflow(
  workflow: WorkflowStep[] | any,
  options: { ... }
): Promise<WorkflowResult> {
  // ...
  
  for (const step of steps) {
    // NEW: Support arbitrary MCP tool calls
    if (step.tool && step.params) {
      const result = await this.callMCPTool(step.tool, step.params);
      
      // Validate budget
      if (this.totalCost > budgets.maxCost) {
        throw new Error(`Budget exceeded: $${this.totalCost} > $${budgets.maxCost}`);
      }
      
      changes.push({
        step: step.id,
        success: result.success,
        output: result.result,
        cost: result.cost,
      });
    }
    // OLD: Support legacy file edit steps
    else if (step.action === 'edit_file') {
      // ... existing code
    }
  }
}
```

### 3.2 Update Architect to Route Through Credit Optimizer

**File**: `packages/architect-mcp/src/tools/plan.ts`

**Change**:
```typescript
// OLD (line 146):
return await handleRunPlanSteps({ plan_id: args.plan_id });

// NEW:
const plan = getFullPlan(args.plan_id);
const steps = JSON.parse(plan.steps_json);

// Route through Credit Optimizer for cost validation
const creditOptimizer = getCreditOptimizerClient();
const result = await creditOptimizer.executeWorkflow(steps, {
  budgets: plan.budgets,
  caps: plan.caps,
});

return toText(result);
```

---

## 📋 PHASE 4: SYSTEM-WIDE UPDATES (2-3 hours)

### 4.1 Update All Package References

**Files to Update**:
- `package-lock.json` (regenerate after renames)
- `packages/credit-optimizer-mcp/src/agent-pool.ts`
- `packages/credit-optimizer-mcp/src/parallel-execution.ts`
- `packages/architect-mcp/src/planner/incremental.ts`
- All documentation files

### 4.2 Update Configuration Files

**READY_TO_PASTE_CONFIG.json**:
```json
{
  "mcpServers": {
    "free-agent-mcp": {
      "command": "npx",
      "args": ["free-agent-mcp"],
      "env": {
        "OLLAMA_BASE_URL": "http://localhost:11434/v1"
      }
    },
    "paid-agent-mcp": {
      "command": "npx",
      "args": ["paid-agent-mcp"],
      "env": {
        "OPENAI_API_KEY": "sk-proj-...",
        "ANTHROPIC_API_KEY": "sk-ant-...",
        "MONTHLY_BUDGET": "25"
      }
    }
  }
}
```

### 4.3 Update All Documentation

**Files**:
- `README.md`
- `AUGMENT_MCP_CONFIGURATION_SOURCE_OF_TRUTH.md`
- `MCP_SERVERS_FIXED.md`
- `STRESS_TEST_COMPLETE.md`
- `FORCE_PAID_FEATURE.md`
- All package READMEs

---

## 📋 PHASE 5: TESTING (1-2 hours)

### 5.1 Test FREE Models

```javascript
// Test Ollama
execute_versatile_task_free-agent-mcp({
  task: "Generate function",
  taskType: "code_generation",
  model: "ollama/qwen2.5-coder:7b"
})
```

### 5.2 Test PAID OpenAI Models

```javascript
// Test OpenAI
execute_versatile_task_paid-agent-mcp({
  task: "Generate function",
  taskType: "code_generation",
  model: "openai/gpt-4o-mini",
  forcePaid: true
})
```

### 5.3 Test PAID Claude Models

```javascript
// Test Claude
execute_versatile_task_paid-agent-mcp({
  task: "Generate function",
  taskType: "code_generation",
  model: "claude/claude-3.5-sonnet",
  forcePaid: true
})
```

### 5.4 Test Credit Optimizer Integration

```javascript
// This should go through Credit Optimizer with cost validation
const plan = await architect.plan_work({
  goal: "Generate 10 functions",
  budgets: { maxCost: 1.0 }
});

await architect.export_workplan_to_optimizer({ plan_id: plan.plan_id });
// Expected: Cost validation enforced!
```

---

## ✅ SUCCESS CRITERIA

- [ ] Both agents renamed (free-agent-mcp, paid-agent-mcp)
- [ ] Unified model catalog supports OpenAI, Ollama, Claude
- [ ] Free Agent can use any FREE model
- [ ] Paid Agent can use OpenAI OR Claude
- [ ] Credit Optimizer validates ALL execution paths
- [ ] Architect routes through Credit Optimizer (no bypass!)
- [ ] All system-wide references updated
- [ ] All documentation updated
- [ ] All tests passing

---

## 📊 ESTIMATED TIMELINE

| Phase | Task | Time |
|-------|------|------|
| 1 | Rename servers | 2-3 hours |
| 2 | Unified model catalog | 3-4 hours |
| 3 | Fix Credit Optimizer bypass | 2-3 hours |
| 4 | System-wide updates | 2-3 hours |
| 5 | Testing | 1-2 hours |
| **TOTAL** | | **10-15 hours** |

---

## 🎯 PRIORITY ORDER

1. **CRITICAL**: Fix Credit Optimizer bypass (Phase 3)
2. **HIGH**: Rename servers (Phase 1)
3. **HIGH**: Unified model catalog (Phase 2)
4. **MEDIUM**: System-wide updates (Phase 4)
5. **MEDIUM**: Testing (Phase 5)

---

**Status**: 📋 PLAN COMPLETE - Ready to Execute  
**Next Step**: Begin Phase 1 (Rename Servers)

