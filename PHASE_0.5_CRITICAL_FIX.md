# 🚨 CRITICAL FIX: Generic Plan Problem

## Problem Statement

**USER FEEDBACK**: "Architect creates plans that are too generic, causing Augment Code to do the work itself instead of delegating to Autonomous Agent MCP."

## Root Cause Analysis

### 1. **Prompt Engineering Flaw** ⚠️ **CRITICAL**

**Location**: `packages/architect-mcp/src/index.ts:109`

```typescript
"Be concise. Include caps (max_files_changed, require_green_tests), budgets (time_ms, max_steps), successSignals, and a small DAG of steps."
```

**Problem**: The word "**Be concise**" causes the LLM to create vague, generic plans!

**Evidence**:
- Prompt says "Be concise" → LLM creates minimal, vague steps
- Example shows fake tools like `"scaffold_feature"` and `"apply_patches"` that don't exist
- No instruction to use ACTUAL available tools from the tool list
- No instruction to be SPECIFIC about files, parameters, or implementation details

### 2. **Missing Tool Binding** ⚠️ **CRITICAL**

**Problem**: Architect doesn't enforce using REAL MCP tools!

**Current Behavior**:
```json
{
  "steps": [
    {"id": "scaffold", "tool": "scaffold_feature"},  // ❌ Doesn't exist!
    {"id": "patch", "tool": "apply_patches"}         // ❌ Doesn't exist!
  ]
}
```

**Expected Behavior**:
```json
{
  "steps": [
    {
      "id": "generate_tool_1",
      "tool": "delegate_code_generation_autonomous-agent-mcp",
      "params": {
        "task": "Create Upstash Redis HSET tool handler",
        "context": "TypeScript, MCP server, Redis client",
        "complexity": "simple"
      }
    }
  ]
}
```

### 3. **No Delegation Enforcement** ⚠️ **CRITICAL**

**Problem**: Plans don't FORCE delegation to Autonomous Agent MCP!

**Current**: Plans are so generic that Augment Code thinks "I'll just do it myself"

**Solution**: Plans must be structured to REQUIRE delegation:
- Every code generation step MUST use `delegate_code_generation_autonomous-agent-mcp`
- Every analysis step MUST use `delegate_code_analysis_autonomous-agent-mcp`
- Every refactor step MUST use `delegate_code_refactoring_autonomous-agent-mcp`

---

## Solutions

### Solution 1: **Fix Architect Prompt** (30 minutes)

**Change**: Replace "Be concise" with "Be SPECIFIC and CONCRETE"

**New Prompt**:
```typescript
const prompt = [
  "You are a principal software architect creating CONCRETE, EXECUTABLE work plans.",
  "",
  "CRITICAL REQUIREMENTS:",
  "1. Use ONLY tools from the provided tool list (no fake tools!)",
  "2. Be SPECIFIC: Include exact file paths, function names, parameter values",
  "3. FORCE DELEGATION: Use delegate_code_generation_autonomous-agent-mcp for ALL code generation",
  "4. Include concrete success criteria (specific test files, not 'run tests')",
  "",
  "DELEGATION RULES:",
  "- Code generation → delegate_code_generation_autonomous-agent-mcp",
  "- Code analysis → delegate_code_analysis_autonomous-agent-mcp",
  "- Refactoring → delegate_code_refactoring_autonomous-agent-mcp",
  "- Tests → delegate_test_generation_autonomous-agent-mcp",
  "",
  `Goal: ${params.goal}`,
  `RepoDigest: ${params.repoDigest}`,
  `Available Tools: ${params.tools.join(", ")}`,
  "",
  "EXAMPLE (CONCRETE PLAN):",
  `{
    "name": "Add 10 Upstash Redis Tools",
    "caps": {"max_files_changed": 20, "require_green_tests": true},
    "budgets": {"time_ms": 600000, "max_steps": 15},
    "successSignals": ["npm test passes", "all 10 tools registered"],
    "steps": [
      {
        "id": "gen_hset",
        "tool": "delegate_code_generation_autonomous-agent-mcp",
        "params": {
          "task": "Create HSET tool handler in packages/robinsons-toolkit-mcp/src/integrations/upstash/redis-tools.ts",
          "context": "TypeScript, Upstash Redis client, MCP tool pattern",
          "complexity": "simple"
        }
      },
      {
        "id": "gen_hget",
        "tool": "delegate_code_generation_autonomous-agent-mcp",
        "params": {
          "task": "Create HGET tool handler in packages/robinsons-toolkit-mcp/src/integrations/upstash/redis-tools.ts",
          "context": "TypeScript, Upstash Redis client, MCP tool pattern",
          "complexity": "simple"
        },
        "requires": ["gen_hset"]
      }
    ]
  }`,
  "",
  "Now create a CONCRETE plan for the goal above. Respond with ONLY JSON."
].join("\n");
```

**Impact**: Plans will be 10x more specific and force delegation!

---

### Solution 2: **Add Plan Validation** (20 minutes)

**Add to Architect's plan validation**:

```typescript
function validatePlanForDelegation(plan: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  for (const step of plan.steps) {
    // Check 1: Tool must exist in available tools
    if (!AVAILABLE_TOOLS.includes(step.tool)) {
      errors.push(`Step ${step.id}: Tool "${step.tool}" does not exist!`);
    }
    
    // Check 2: Code generation MUST use autonomous agent
    if (step.tool.includes('generate') || step.tool.includes('create') || step.tool.includes('build')) {
      if (!step.tool.includes('delegate_code_generation')) {
        errors.push(`Step ${step.id}: Code generation must use delegate_code_generation_autonomous-agent-mcp!`);
      }
    }
    
    // Check 3: Must have concrete params
    if (!step.params || Object.keys(step.params).length === 0) {
      errors.push(`Step ${step.id}: Missing concrete parameters!`);
    }
    
    // Check 4: Task description must be specific (not generic)
    if (step.params?.task) {
      const genericWords = ['create', 'add', 'implement', 'build'];
      const hasSpecifics = step.params.task.includes('packages/') || 
                          step.params.task.includes('.ts') ||
                          step.params.task.includes('function') ||
                          step.params.task.includes('class');
      
      if (!hasSpecifics) {
        errors.push(`Step ${step.id}: Task too generic! Must include file paths or function names.`);
      }
    }
  }
  
  return { valid: errors.length === 0, errors };
}
```

---

### Solution 3: **Improve Ollama Model Quality** (15 minutes)

**Current**: Uses deepseek-coder:33b with default settings

**Improvement**: Use better prompting techniques for Ollama:

```typescript
async function llmPlan(params: { goal: string; repoDigest: string; tools: string[]; model: string }): Promise<any> {
  // TECHNIQUE 1: Chain-of-Thought Prompting
  const thinkingPrompt = [
    "First, think step-by-step about how to accomplish this goal:",
    `Goal: ${params.goal}`,
    "",
    "Break it down into concrete, specific steps.",
    "For each step, identify:",
    "1. Exact file path to modify",
    "2. Exact tool to use (from available tools)",
    "3. Exact parameters needed",
    "",
    "Think out loud:"
  ].join("\n");
  
  const thinking = await ollamaGenerate({ model: params.model, prompt: thinkingPrompt, timeoutMs: 60_000 });
  
  // TECHNIQUE 2: Few-Shot Learning with GOOD examples
  const planPrompt = [
    "Based on your thinking above, create a CONCRETE work plan.",
    "",
    "Here's your thinking:",
    thinking,
    "",
    "Now create the JSON plan following this EXACT pattern:",
    // ... (concrete example from Solution 1)
  ].join("\n");
  
  const raw = await ollamaGenerate({ model: params.model, prompt: planPrompt, timeoutMs: 180_000 });
  
  // ... parse JSON
}
```

**Impact**: 2-3x better plan quality from same Ollama model!

---

### Solution 4: **Add Augment Code Rules** (10 minutes)

**Create**: `.augment/rules/2-delegation-strategy.md`

```markdown
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
```

---

## Implementation Plan

### Phase 1: Quick Wins (1 hour)

1. ✅ **Fix Architect Prompt** (30 min)
   - Replace "Be concise" with "Be SPECIFIC and CONCRETE"
   - Add delegation rules
   - Add concrete example
   - Test with "Add 10 Redis tools"

2. ✅ **Add Plan Validation** (20 min)
   - Validate tools exist
   - Enforce delegation for code generation
   - Require concrete parameters
   - Reject generic tasks

3. ✅ **Create Augment Rules** (10 min)
   - Create `.augment/rules/2-delegation-strategy.md`
   - Document when to delegate
   - Add recognition patterns

### Phase 2: Quality Improvements (30 min)

4. ✅ **Improve Ollama Prompting** (15 min)
   - Add chain-of-thought
   - Add few-shot examples
   - Test quality improvement

5. ✅ **Add Learning Feedback** (15 min)
   - Track which plans get delegated vs done by Augment
   - Learn from successful delegations
   - Improve prompts based on feedback

---

## Success Metrics

### Before Fix:
- ❌ Plans are generic ("Create tool handlers")
- ❌ Augment does work itself (13,000 credits/file)
- ❌ Autonomous Agent MCP unused
- ❌ 0% cost savings

### After Fix:
- ✅ Plans are concrete ("Create HSET handler in packages/robinsons-toolkit-mcp/src/integrations/upstash/redis-tools.ts")
- ✅ Augment delegates to Autonomous Agent (500 credits/file)
- ✅ Autonomous Agent MCP used for 90% of work
- ✅ 96% cost savings

---

## Next Steps

1. Implement Solution 1 (Fix Architect Prompt)
2. Test with real example: "Add 10 Upstash Redis tools"
3. Verify Augment delegates instead of doing work itself
4. Implement remaining solutions
5. Document learnings

**Ready to implement?**

