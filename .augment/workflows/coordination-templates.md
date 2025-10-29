# Agent Coordination Workflow Templates

This file defines common workflow patterns for the 6-server agent coordination network.

## Architecture Overview

```
User Request
    ↓
Augment Code (orchestrator)
    ↓
Architect MCP (planning) ← uses Thinking Tools MCP
    ↓
Credit Optimizer (validation/tracking)
    ↓
Autonomous Agent (execution via FREE Ollama)
    ↓
Robinson's Toolkit (integration tools via broker)
    ↓
OpenAI Worker (paid execution when needed)
```

---

## Workflow 1: Code Generation

**Use Case**: Generate new code files (components, APIs, schemas, etc.)

**Steps**:
1. **Plan** (Architect MCP)
   - Tool: `plan_work`
   - Input: Goal, budgets, constraints
   - Output: Concrete plan with delegation steps

2. **Validate** (Credit Optimizer)
   - Tool: `estimate_task_cost`
   - Check: Cost < budget, files < limit
   - Output: Approval or rejection

3. **Execute** (Autonomous Agent)
   - Tool: `delegate_code_generation_autonomous-agent-mcp`
   - Uses: FREE Ollama (deepseek-coder:33b)
   - Output: Generated code

4. **Integrate** (Robinson's Toolkit)
   - Tool: `toolkit_call` (if GitHub/Vercel/etc needed)
   - Output: Committed/deployed code

**Cost**: ~500 credits (orchestration only, Ollama is FREE!)

---

## Workflow 2: Code Refactoring

**Use Case**: Refactor existing code (extract components, apply patterns, etc.)

**Steps**:
1. **Analyze** (Autonomous Agent)
   - Tool: `delegate_code_analysis_autonomous-agent-mcp`
   - Output: Issues, patterns, recommendations

2. **Plan** (Architect MCP)
   - Tool: `plan_work`
   - Input: Analysis results + refactoring goal
   - Output: Step-by-step refactoring plan

3. **Execute** (Autonomous Agent)
   - Tool: `delegate_code_refactoring_autonomous-agent-mcp`
   - Uses: FREE Ollama
   - Output: Refactored code

4. **Test** (Autonomous Agent)
   - Tool: `delegate_test_generation_autonomous-agent-mcp`
   - Output: Tests for refactored code

**Cost**: ~800 credits (analysis + orchestration, Ollama is FREE!)

---

## Workflow 3: Bug Fix

**Use Case**: Fix bugs across multiple files

**Steps**:
1. **Discover** (Credit Optimizer)
   - Tool: `discover_tools` to find relevant tools
   - Output: Tools that can help

2. **Analyze** (Autonomous Agent)
   - Tool: `delegate_code_analysis_autonomous-agent-mcp`
   - Input: Error messages, stack traces
   - Output: Root cause analysis

3. **Plan** (Architect MCP)
   - Tool: `plan_work`
   - Input: Root cause + fix strategy
   - Output: Fix plan

4. **Execute** (Credit Optimizer)
   - Tool: `execute_bulk_fix`
   - Input: Fix pattern, file glob
   - Output: Fixed files

5. **Verify** (Autonomous Agent)
   - Tool: `delegate_test_generation_autonomous-agent-mcp`
   - Output: Tests to prevent regression

**Cost**: ~1000 credits (analysis + orchestration, Ollama is FREE!)

---

## Workflow 4: Feature Development

**Use Case**: Build complete feature (component + API + tests + deployment)

**Steps**:
1. **Think** (Thinking Tools MCP)
   - Tool: `first_principles_thinking` or `systems_thinking`
   - Output: Feature design, architecture

2. **Plan** (Architect MCP)
   - Tool: `plan_work`
   - Input: Feature spec + architecture
   - Output: Multi-step implementation plan

3. **Scaffold** (Credit Optimizer)
   - Tool: `scaffold_feature`
   - Output: Boilerplate code (0 AI credits!)

4. **Implement** (Autonomous Agent)
   - Tool: `delegate_code_generation_autonomous-agent-mcp`
   - Uses: FREE Ollama
   - Output: Feature implementation

5. **Test** (Autonomous Agent)
   - Tool: `delegate_test_generation_autonomous-agent-mcp`
   - Output: Comprehensive test suite

6. **Deploy** (Robinson's Toolkit)
   - Tool: `toolkit_call` with Vercel deployment
   - Output: Deployed feature

**Cost**: ~1500 credits (orchestration only, Ollama is FREE!)

---

## Workflow 5: Database Migration

**Use Case**: Migrate database schema or data

**Steps**:
1. **Analyze** (Thinking Tools MCP)
   - Tool: `premortem_analysis`
   - Output: Risks, failure scenarios

2. **Plan** (Architect MCP)
   - Tool: `plan_work`
   - Input: Migration spec + risk analysis
   - Output: Migration plan with rollback

3. **Execute** (Credit Optimizer)
   - Tool: `execute_migration`
   - Input: Migration SQL, rollback strategy
   - Output: Migrated database

4. **Verify** (Robinson's Toolkit)
   - Tool: `toolkit_call` with Neon database tools
   - Output: Verification results

**Cost**: ~600 credits (orchestration only)

---

## Workflow 6: Deployment Pipeline

**Use Case**: Deploy application to production

**Steps**:
1. **Validate** (Thinking Tools MCP)
   - Tool: `red_team_thinking`
   - Output: Security/reliability issues

2. **Build** (Robinson's Toolkit)
   - Tool: `toolkit_call` with Vercel build
   - Output: Built application

3. **Test** (Autonomous Agent)
   - Tool: `delegate_test_generation_autonomous-agent-mcp`
   - Output: E2E tests

4. **Deploy** (Robinson's Toolkit)
   - Tool: `toolkit_call` with Vercel deployment
   - Output: Deployed application

5. **Monitor** (Robinson's Toolkit)
   - Tool: `toolkit_call` with Vercel analytics
   - Output: Deployment metrics

**Cost**: ~800 credits (orchestration only)

---

## Cost Optimization Strategies

### 1. Always Delegate to Ollama
- **Never** have Augment Code generate code itself
- **Always** use `delegate_code_generation_autonomous-agent-mcp`
- **Savings**: 96% (from ~13,000 to ~500 credits per file)

### 2. Use Scaffolding for Boilerplate
- **Never** generate boilerplate with AI
- **Always** use `scaffold_*` tools (0 AI credits!)
- **Savings**: 100% for boilerplate

### 3. Cache Analysis Results
- **Never** re-analyze the same code
- **Always** use `cache_analysis` and `get_cached_analysis`
- **Savings**: 90% on repeated analysis

### 4. Batch Operations
- **Never** process files one-by-one
- **Always** use `execute_bulk_fix` or `execute_autonomous_workflow`
- **Savings**: 99% (no confirmation stops!)

### 5. Use Thinking Tools for Planning
- **Never** have Augment Code plan complex tasks
- **Always** use `first_principles_thinking`, `systems_thinking`, etc.
- **Savings**: 80% on planning

---

## Guardrails

### Budget Limits
- `HUMAN_APPROVAL_REQUIRED_OVER=$10` - Ask user before expensive operations
- `MONTHLY_BUDGET=$25` - Hard limit on OpenAI Worker spending

### Safety Checks
- `max_files_changed` - Prevent accidental mass edits
- `require_green_tests` - Don't deploy broken code
- `dryRunOnly` - Preview changes before applying

### Cost Tracking
- Every workflow tracks actual cost vs estimated cost
- Learning algorithm improves estimates over time
- Monthly spend reports show savings

---

## Example: Full Workflow Execution

```javascript
// 1. User request
"Add 10 new Upstash Redis tools to Robinson's Toolkit"

// 2. Augment Code calls Architect MCP
const plan = await plan_work({
  goal: "Add 10 new Upstash Redis tools",
  budgets: { max_steps: 15, time_ms: 600000, max_files_changed: 5 }
});

// 3. Architect creates concrete plan with delegation
{
  steps: [
    { tool: "delegate_code_generation_autonomous-agent-mcp", params: {...} },
    { tool: "delegate_test_generation_autonomous-agent-mcp", params: {...} },
    { tool: "toolkit_call", params: { category: "github", toolName: "github_create_pr" } }
  ]
}

// 4. Augment Code executes plan (delegates to Autonomous Agent)
for (const step of plan.steps) {
  await callTool(step.tool, step.params);
}

// 5. Result: 10 tools added, tests passing, PR created
// Cost: ~5,000 credits (vs 130,000 if Augment did it itself!)
// Savings: 96%
```

---

## Next Steps

1. **Test workflows end-to-end** - Verify each pattern works
2. **Add more patterns** - Deployment, monitoring, debugging, etc.
3. **Optimize costs** - Track actual vs estimated, improve learning
4. **Add guardrails** - Prevent expensive mistakes
5. **Create recipes** - Pre-built workflows for common tasks

