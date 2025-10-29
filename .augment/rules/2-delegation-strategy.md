# Delegation Strategy

## CRITICAL RULE: Always Delegate Code Generation

When you receive a work plan from Architect MCP, you MUST delegate to the specified tools.

### ❌ NEVER DO THIS:
```
User: "Add 10 Redis tools"
Architect: Creates plan with delegate_code_generation steps
Augment: "I'll just write the code myself" ← WRONG!
```

### ✅ ALWAYS DO THIS:
```
User: "Add 10 Redis tools"
Architect: Creates plan with delegate_code_generation steps
Augment: Calls delegate_code_generation_autonomous-agent-mcp for each step ← CORRECT!
```

## When to Delegate

| Task Type | Delegate To | Why |
|-----------|-------------|-----|
| Code generation | `delegate_code_generation_autonomous-agent-mcp` | FREE (Ollama), saves 90% credits |
| Code analysis | `delegate_code_analysis_autonomous-agent-mcp` | FREE (Ollama), saves 90% credits |
| Refactoring | `delegate_code_refactoring_autonomous-agent-mcp` | FREE (Ollama), saves 90% credits |
| Test generation | `delegate_test_generation_autonomous-agent-mcp` | FREE (Ollama), saves 90% credits |
| Planning | `plan_work_architect-mcp` | Creates concrete plans |
| Bulk operations | `execute_autonomous_workflow_credit-optimizer-mcp` | Autonomous execution |

## Recognition Patterns

If the plan step includes:
- `tool: "delegate_code_generation_autonomous-agent-mcp"` → CALL IT, don't do it yourself!
- `tool: "delegate_*"` → ALWAYS delegate!
- `params.task` with specific file paths → This is a CONCRETE task, delegate it!

## Cost Awareness

- Augment doing work itself: ~13,000 credits per file
- Delegating to Autonomous Agent: ~500 credits per file
- **Savings: 96% by delegating!**

Always prefer delegation when the plan specifies it.

## Example Workflow

### User Request:
"Add 10 new Upstash Redis tools"

### Step 1: Create Plan
```
Call: plan_work_architect-mcp({ goal: "Add 10 new Upstash Redis tools" })
```

### Step 2: Architect Returns Concrete Plan
```json
{
  "steps": [
    {
      "id": "gen_hset",
      "tool": "delegate_code_generation_autonomous-agent-mcp",
      "params": {
        "task": "Create HSET tool handler in packages/robinsons-toolkit-mcp/src/integrations/upstash/redis-tools.ts",
        "context": "TypeScript, Upstash Redis client, MCP tool pattern",
        "complexity": "simple"
      }
    }
  ]
}
```

### Step 3: Execute Plan (DELEGATE!)
```
For each step in plan.steps:
  Call the specified tool with the specified params
  
Example:
  delegate_code_generation_autonomous-agent-mcp({
    task: "Create HSET tool handler in packages/robinsons-toolkit-mcp/src/integrations/upstash/redis-tools.ts",
    context: "TypeScript, Upstash Redis client, MCP tool pattern",
    complexity: "simple"
  })
```

### Step 4: Verify Results
- Check that code was generated
- Run tests
- Report success

## Why This Matters

**Without Delegation**:
- Augment uses 13,000 credits per file
- 10 files = 130,000 credits
- Cost: ~$13

**With Delegation**:
- Autonomous Agent uses 500 credits per file (just for orchestration)
- Ollama does actual work (FREE!)
- 10 files = 5,000 credits
- Cost: ~$0.50

**Savings: 96% ($12.50 saved!)**

## Trust the System

The agent coordination system is designed to:
1. Architect creates concrete plans
2. Credit Optimizer validates and tracks costs
3. Autonomous Agent executes using FREE Ollama
4. You orchestrate and verify

**Your role**: Orchestrate, don't execute!

