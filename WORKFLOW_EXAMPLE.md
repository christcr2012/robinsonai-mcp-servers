# 4-Server Workflow Example

This document demonstrates the complete workflow using all 4 MCP servers working together.

## 🎯 Goal

Add a `helloWorld()` function to `test-workflow-example.ts` using the autonomous 4-server system.

---

## 📋 Step-by-Step Workflow

### 1️⃣ **PLAN** (Architect MCP)

**Tool**: `architect-mcp.plan_work`

```json
{
  "goal": "Add a helloWorld() function that returns 'Hello, World!' to test-workflow-example.ts",
  "depth": "fast",
  "budgets": {
    "max_steps": 5,
    "time_ms": 60000,
    "max_files_changed": 1
  }
}
```

**Returns**:
```json
{
  "plan_id": "1761148631334-d7f46200bc74d629",
  "summary": "Plan to add helloWorld function: 3 steps, 1 file"
}
```

---

### 2️⃣ **EXPORT** (Architect MCP)

**Tool**: `architect-mcp.export_workplan_to_optimizer`

```json
{
  "plan_id": "1761148631334-d7f46200bc74d629"
}
```

**Returns**:
```json
{
  "workflow": {
    "name": "Add helloWorld function",
    "steps": [
      {
        "id": "generate",
        "tool": "delegate_code_generation",
        "params": {
          "task": "Create helloWorld function",
          "context": "TypeScript, simple function"
        }
      },
      {
        "id": "apply",
        "tool": "str_replace",
        "params": {
          "file": "test-workflow-example.ts",
          "old": "// TODO: Add hello world function here",
          "new": "export function helloWorld(): string {\n  return 'Hello, World!';\n}"
        }
      },
      {
        "id": "test",
        "tool": "execute_test_generation",
        "params": {
          "files": ["test-workflow-example.ts"],
          "framework": "jest"
        }
      }
    ]
  }
}
```

---

### 3️⃣ **EXECUTE** (Credit Optimizer MCP)

**Tool**: `credit-optimizer-mcp.execute_autonomous_workflow`

```json
{
  "workflow": {
    "steps": [...]
  },
  "dryRun": false
}
```

**What Happens**:
1. ✅ **Preflight checks**: Validates files exist, no conflicts
2. ✅ **Code generation**: Delegates to Autonomous Agent MCP (uses local Ollama)
3. ✅ **Apply changes**: Uses Credit Optimizer's patch engine
4. ✅ **Generate tests**: Delegates to Autonomous Agent MCP
5. ✅ **Verify**: Runs tests to ensure green

**Returns**:
```json
{
  "filesModified": 2,
  "changes": [
    {
      "file": "test-workflow-example.ts",
      "linesAdded": 3,
      "linesRemoved": 1
    },
    {
      "file": "test-workflow-example.test.ts",
      "linesAdded": 12,
      "linesRemoved": 0
    }
  ],
  "testsPass": true,
  "augmentCreditsUsed": 0,
  "creditsSaved": 2500,
  "timeMs": 4500
}
```

---

### 4️⃣ **VERIFY** (Manual or Automated)

Check the modified files:

**test-workflow-example.ts**:
```typescript
/**
 * Test Workflow Example
 */

export function helloWorld(): string {
  return 'Hello, World!';
}
```

**test-workflow-example.test.ts** (auto-generated):
```typescript
import { helloWorld } from './test-workflow-example';

describe('helloWorld', () => {
  it('should return Hello, World!', () => {
    expect(helloWorld()).toBe('Hello, World!');
  });
});
```

---

## 🎉 Result

✅ **Function added** to `test-workflow-example.ts`  
✅ **Tests generated** automatically  
✅ **Tests passing** (verified)  
✅ **Zero Augment credits used** (all work done by local LLMs)  
✅ **Saved ~2500 credits** compared to manual AI-assisted coding

---

## 🔄 Full Workflow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     USER REQUEST                            │
│  "Add helloWorld() function to test-workflow-example.ts"   │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  1. ARCHITECT MCP (Planning)                                │
│     - Analyzes request                                      │
│     - Creates WorkPlan with 3 steps                         │
│     - Returns plan_id handle                                │
│     - Uses local Ollama (qwen2.5:3b) - FREE                 │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  2. ARCHITECT MCP (Export)                                  │
│     - Converts WorkPlan to Optimizer format                 │
│     - Returns workflow JSON                                 │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  3. CREDIT OPTIMIZER MCP (Execution)                        │
│     - Runs workflow autonomously                            │
│     - No "continue?" prompts                                │
│     - Enforces caps & budgets                               │
│     ┌─────────────────────────────────────────────────┐     │
│     │  3a. AUTONOMOUS AGENT MCP (Code Generation)     │     │
│     │      - Generates helloWorld function            │     │
│     │      - Uses local Ollama (codellama:34b) - FREE │     │
│     └─────────────────────────────────────────────────┘     │
│     ┌─────────────────────────────────────────────────┐     │
│     │  3b. CREDIT OPTIMIZER (Patch Engine)            │     │
│     │      - Applies code changes                     │     │
│     │      - Creates unified diffs                    │     │
│     └─────────────────────────────────────────────────┘     │
│     ┌─────────────────────────────────────────────────┐     │
│     │  3c. AUTONOMOUS AGENT MCP (Test Generation)     │     │
│     │      - Generates Jest tests                     │     │
│     │      - Uses local Ollama (qwen2.5:3b) - FREE    │     │
│     └─────────────────────────────────────────────────┘     │
│     ┌─────────────────────────────────────────────────┐     │
│     │  3d. ROBINSON'S TOOLKIT (Optional)              │     │
│     │      - GitHub PR creation (if requested)        │     │
│     │      - Vercel deployment (if requested)         │     │
│     └─────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                     RESULT                                  │
│  ✅ Code added                                              │
│  ✅ Tests generated                                         │
│  ✅ Tests passing                                           │
│  ✅ 0 Augment credits used                                  │
│  ✅ ~2500 credits saved                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 💰 Cost Breakdown

| Step | Tool | Credits Used | Why Free? |
|------|------|--------------|-----------|
| Planning | Architect MCP | 0 | Local Ollama (qwen2.5:3b) |
| Export | Architect MCP | 0 | Simple JSON transformation |
| Code Gen | Autonomous Agent MCP | 0 | Local Ollama (codellama:34b) |
| Patch | Credit Optimizer | 0 | Deterministic diff engine |
| Test Gen | Autonomous Agent MCP | 0 | Local Ollama (qwen2.5:3b) |
| **TOTAL** | | **0** | **All local!** |

**Compared to manual AI coding**: ~2500 credits saved (no back-and-forth, no "continue?", no GPT-4 calls)

---

## 🚀 How to Run This Example

### Prerequisites
1. ✅ All 4 servers installed and linked
2. ✅ Ollama running with models pulled
3. ✅ Augment Code configured with lean or firehose config

### Run the Workflow

```javascript
// 1. Plan
const plan = await architect.plan_work({
  goal: "Add helloWorld() function to test-workflow-example.ts",
  depth: "fast",
  budgets: { max_steps: 5, time_ms: 60000, max_files_changed: 1 }
});

// 2. Export
const { workflow } = await architect.export_workplan_to_optimizer({
  plan_id: plan.plan_id
});

// 3. Execute (autonomous, no stops)
const result = await creditOptimizer.execute_autonomous_workflow({
  workflow,
  dryRun: false
});

// 4. Verify
console.log(`✅ Modified ${result.filesModified} files`);
console.log(`✅ Saved ${result.creditsSaved} credits`);
console.log(`✅ Completed in ${result.timeMs}ms`);
```

---

## 📊 Success Metrics

- ✅ **Autonomous**: No human intervention required
- ✅ **Fast**: Completed in ~4.5 seconds
- ✅ **Free**: 0 Augment credits used
- ✅ **Reliable**: Tests generated and passing
- ✅ **Scalable**: Same workflow for complex tasks

---

## 🎯 Next Steps

1. **Try more complex workflows**: Multi-file changes, API endpoints, database migrations
2. **Add GitHub integration**: Auto-create PRs with `open_pr_with_changes`
3. **Add deployment**: Auto-deploy to Vercel with `vercel_deploy`
4. **Monitor savings**: Use `get_credit_stats` to track savings over time

---

**This is the power of the 4-server architecture!** 🚀

