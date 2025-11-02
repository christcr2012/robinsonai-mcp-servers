# 5-Server MCP Validation Test Suite

## 📋 Overview

This document contains the complete validation test suite adapted from the ChatGPT conversation.
Run these tests in order to verify all 5 MCP servers are working correctly.

**Source:** ChatGPT conversation (https://chatgpt.com/share/69079b97-17c8-800b-801a-487167e0a6b2)
**Date:** 2025-11-02
**Architecture:** 5-Server System (Augment handles planning/coordination)

## 🏗️ Architecture Note

**Original Plan:** 6 servers with architect-mcp and agent-orchestrator-mcp
**Current System:** 5 servers where Augment Agent handles planning and coordination

**Current 5 Servers:**
1. FREE Agent MCP (autonomous-agent-mcp) - 0 credits
2. PAID Agent MCP (openai-worker-mcp) - Use when needed
3. Thinking Tools MCP - Cognitive frameworks
4. Credit Optimizer MCP - Tool discovery & templates
5. Robinson's Toolkit MCP - 1165 integration tools

---

## 🔧 Prerequisites

### 1. Ollama Models
Ensure these models are installed:
```bash
ollama pull qwen2.5:3b
ollama pull deepseek-coder:33b
ollama pull qwen2.5-coder:32b
```

### 2. Augment Configuration
Use the template configuration:
1. Open Augment → Settings → Tools → MCP Servers
2. Use `augment-mcp-config.TEMPLATE.json` as reference
3. Add your API keys (OPENAI_API_KEY, GITHUB_TOKEN, etc.)
4. Ensure AUGMENT_WORKSPACE_ROOT is set to ${workspaceFolder}
5. Restart Augment (Developer: Reload Window)

### 3. Verify Server Status
Check that all 5 servers are connected in Augment's MCP status indicator:
- ✅ Free Agent MCP
- ✅ Paid Agent MCP
- ✅ Thinking Tools MCP
- ✅ Credit Optimizer MCP
- ✅ Robinson's Toolkit MCP

---

## ✅ PHASE 1: Health Checks (No Keys Required)

### Test 1.1: Thinking Tools MCP
```
Use tool thinking-tools-mcp.devils_advocate with {
  "context": "Validate MCP orchestration end-to-end with minimal cost",
  "depth": "quick"
}
```

**Expected Result:**
- ✅ Returns challenges, risks, counterarguments
- ✅ No errors about workspace root
- ✅ Creates artifact in `.robctx/thinking/`

---

```
Use tool thinking-tools-mcp.decision_matrix with {
  "options": ["DeepSeek", "Qwen", "Llama"],
  "criteria": ["speed", "accuracy", "VRAM"],
  "context": "Pick a default local model"
}
```

**Expected Result:**
- ✅ Returns scored matrix with recommendations
- ✅ All options evaluated against all criteria

---

### Test 1.2: Autonomous Agent MCP (FREE)
```
Use tool autonomous-agent-mcp.diagnose_autonomous_agent with {}
```

**Expected Result:**
- ✅ Returns Ollama connection status
- ✅ Shows available models
- ✅ Reports concurrency settings
- ✅ Shows stats database status

---

```
Use tool autonomous-agent-mcp.delegate_code_generation with {
  "goal": "Create a TypeScript function that sums an array safely",
  "constraints": "No external deps"
}
```

**Expected Result:**
- ✅ Returns generated TypeScript code
- ✅ Code includes type safety
- ✅ No external dependencies used
- ✅ Includes basic error handling

---

### Test 1.3: Augment Planning (Manual Test)
**Note:** Augment Agent now handles planning directly (no architect-mcp)

**Test Scenario:**
Ask Augment: "Create a CLI that greets a user and logs to a file. Break this down into tasks."

**Expected Result:**
- ✅ Augment uses `add_tasks` to create task list
- ✅ Tasks are concrete and actionable
- ✅ Tasks include: scaffold, implement, test, document
- ✅ Augment can delegate each task to FREE/PAID agents

**Verification:**
```
Use tool view_tasklist
```

**Expected Output:**
- ✅ Shows task hierarchy
- ✅ Tasks have clear descriptions
- ✅ Can track progress with task states

---

### Test 1.4: Credit Optimizer MCP
```
Use tool credit-optimizer-mcp.discover_tools with {
  "query": "vercel",
  "limit": 10
}
```

**Expected Result:**
- ✅ Returns list of Vercel-related tools
- ✅ Shows tool names and descriptions
- ✅ No errors

---

```
Use tool credit-optimizer-mcp.get_credit_stats with {}
```

**Expected Result:**
- ✅ Returns usage statistics
- ✅ Shows credits saved
- ✅ Breakdown by task type

---

```
Use tool credit-optimizer-mcp.diagnose_credit_optimizer with {}
```

**Expected Result:**
- ✅ Returns health status
- ✅ Shows tool index status
- ✅ Reports template availability
- ✅ Cache status

---

### Test 1.5: Robinson's Toolkit MCP
```
Use tool robinsons-toolkit-mcp.diagnose_environment with {}
```

**Expected Result:**
- ✅ Returns environment status
- ✅ Lists available integrations
- ✅ Shows which API keys are configured
- ✅ No crashes if keys missing (lazy loader)

---

```
Use tool robinsons-toolkit-mcp.discover_tools with {
  "query": "*",
  "limit": 25
}
```

**Expected Result:**
- ✅ Returns list of available tools
- ✅ Shows tools from multiple categories
- ✅ Includes tool descriptions

---

## 💰 PHASE 2: Paid Agent Tests (Requires OPENAI_API_KEY)

### Test 2.1: OpenAI Worker MCP - Cost Estimation
```
Use tool openai-worker-mcp.estimate_cost with {
  "agent": "mini-worker",
  "estimated_input_tokens": 1500,
  "estimated_output_tokens": 800
}
```

**Expected Result:**
- ✅ Returns cost estimate in USD
- ✅ Shows model being used (gpt-4o-mini)
- ✅ Breaks down input/output costs

---

### Test 2.2: OpenAI Worker MCP - Run Job
```
Use tool openai-worker-mcp.run_job with {
  "agent": "mini-worker",
  "task": "Rewrite this function to be pure and add JSDoc",
  "input_refs": ["function add(a,b){c=a+b;return c;}"]
}
```

**Expected Result:**
- ✅ Returns rewritten code
- ✅ Code is pure (no side effects)
- ✅ Includes JSDoc comments
- ✅ Budget tracking updated

---

### Test 2.3: OpenAI Worker MCP - Spend Stats
```
Use tool openai-worker-mcp.get_spend_stats with {}
```

**Expected Result:**
- ✅ Returns monthly spend
- ✅ Shows remaining budget
- ✅ Lists recent jobs
- ✅ Warns if approaching budget limit

---

## 🔗 PHASE 3: Integration Tests (Requires API Keys)

### Test 3.1: GitHub Integration (Requires GITHUB_TOKEN)
```
Use tool robinsons-toolkit-mcp.broker_call with {
  "server": "github-mcp",
  "tool": "list_repos",
  "args": {"user": "YOUR_GITHUB_USERNAME"}
}
```

**Expected Result:**
- ✅ Returns list of repositories
- ✅ Shows repo names and descriptions
- ✅ No authentication errors

---

### Test 3.2: Vercel Integration (Requires VERCEL_TOKEN)
```
Use tool robinsons-toolkit-mcp.broker_call with {
  "server": "vercel-mcp",
  "tool": "list_projects",
  "args": {}
}
```

**Expected Result:**
- ✅ Returns list of Vercel projects
- ✅ Shows project names and URLs
- ✅ No authentication errors

---

## 🚀 PHASE 4: Multi-Agent Stress Test (Budget-Safe)

### Test 4.1: Augment-Led Planning Workflow
**Test Scenario:**
Ask Augment: "Create a small CLI utility that prints a greeting and writes a log file; add a unit test. Break this into tasks and execute using FREE agents."

**Expected Workflow:**
1. ✅ Augment creates task list with `add_tasks`
2. ✅ Augment delegates code generation to FREE Agent
3. ✅ Augment delegates test generation to FREE Agent
4. ✅ Augment verifies results
5. ✅ Augment marks tasks complete

**Verification:**
```
Use tool view_tasklist
```

**Expected Result:**
- ✅ All tasks marked COMPLETE
- ✅ Code generated by FREE Agent (0 credits)
- ✅ Tests generated by FREE Agent (0 credits)
- ✅ Total cost: ~$0 (vs ~$13 if Augment did it)

---

### Test 4.2: Execute Work in Parallel
```
Use tool autonomous-agent-mcp.delegate_code_generation with {
  "goal": "Implement CLI and file logger in TypeScript (no external deps)",
  "constraints": "Keep it cross-platform; minimal code; use Node fs APIs"
}
```

**Expected Result:**
- ✅ Returns TypeScript code
- ✅ Code is cross-platform
- ✅ Uses Node.js fs APIs
- ✅ No external dependencies

---

```
Use tool openai-worker-mcp.estimate_cost with {
  "agent": "mini-worker",
  "estimated_input_tokens": 1200,
  "estimated_output_tokens": 800
}
```

**Expected Result:**
- ✅ Returns cost estimate
- ✅ Cost is reasonable (< $0.01)

---

```
Use tool thinking-tools-mcp.premortem_analysis with {
  "project": "MCP E2E validation",
  "context": "5 servers; local LLMs; budget caps; Augment-led planning"
}
```

**Expected Result:**
- ✅ Returns failure scenarios
- ✅ Identifies risks
- ✅ Suggests mitigations

---

```
Use tool credit-optimizer-mcp.discover_tools with {
  "query": "github",
  "limit": 10
}
```

**Expected Result:**
- ✅ Returns GitHub-related tools
- ✅ Shows tool categories

---

### Test 4.3: Close the Loop (Telemetry)
```
Use tool paid-agent-mcp.openai_worker_get_spend_stats with {}
```

```
Use tool free-agent-mcp.get_agent_stats with {
  "period": "today"
}
```

```
Use tool credit-optimizer-mcp.get_credit_stats with {
  "period": "today"
}
```

**Expected Results:**
- ✅ All stats tools return data
- ✅ Budget tracking is accurate
- ✅ FREE agent shows 0 cost
- ✅ PAID agent shows actual spend (if used)
- ✅ Credit optimizer shows savings vs doing work yourself

---

## 📊 VALIDATION CHECKLIST

### Critical Pass/Fail Gates (5-Server System)

#### Gate 1: Augment Planning Works ✅
- [ ] Augment can break down tasks using `add_tasks`
- [ ] Tasks are concrete and actionable
- [ ] Augment delegates to appropriate agents (FREE/PAID)
- [ ] Task tracking works with `view_tasklist`

#### Gate 2: All 5 Servers Respond ✅
- [ ] thinking-tools-mcp: devils_advocate works
- [ ] free-agent-mcp: diagnose works
- [ ] free-agent-mcp: delegate_code_generation works
- [ ] paid-agent-mcp: estimate_cost works
- [ ] credit-optimizer-mcp: discover_tools works
- [ ] robinsons-toolkit-mcp: toolkit_health_check works

#### Gate 3: Workspace Resolution Works ✅
- [ ] think_collect_evidence uses correct repo root
- [ ] think_auto_packet creates files in correct location
- [ ] ctx_web_crawl_step writes to correct directory
- [ ] No "file not found" errors after writes
- [ ] AUGMENT_WORKSPACE_ROOT env var is set

#### Gate 4: Budget Protection Works ✅
- [ ] PAID agent respects MONTHLY_BUDGET
- [ ] Concurrent job limits enforced (MAX_OLLAMA_CONCURRENCY, MAX_OPENAI_CONCURRENCY)
- [ ] Cost estimates accurate
- [ ] FREE agent shows 0 cost
- [ ] No surprise charges

---

## 🐛 Troubleshooting

### Issue: "Duplicate tool names" error
**Solution:** Ensure thinking-tools-mcp@1.4.8 or later is installed

### Issue: Augment doesn't create tasks
**Solution:** Ensure task management tools are available (add_tasks, update_tasks, view_tasklist)

### Issue: Files created in wrong directory
**Solution:** Verify AUGMENT_WORKSPACE_ROOT is set in config

### Issue: OpenAI worker refuses calls
**Solution:** Check OPENAI_API_KEY is set in config

### Issue: Toolkit "missing credentials"
**Solution:** This is expected if tokens aren't set; toolkit still works for discovery

---

## 📝 Test Results Template

```
# 5-Server Validation Results
Date: ___________
Tester: ___________

## Phase 1: Health Checks
- [ ] Test 1.1: Thinking Tools - devils_advocate
- [ ] Test 1.1: Thinking Tools - decision_matrix
- [ ] Test 1.2: FREE Agent - diagnose
- [ ] Test 1.2: FREE Agent - code_generation
- [ ] Test 1.3: Augment Planning - task creation
- [ ] Test 1.3: Augment Planning - task delegation
- [ ] Test 1.4: Credit Optimizer - discover_tools
- [ ] Test 1.4: Credit Optimizer - get_credit_stats
- [ ] Test 1.4: Credit Optimizer - diagnose
- [ ] Test 1.5: Toolkit - toolkit_health_check
- [ ] Test 1.5: Toolkit - toolkit_discover

## Phase 2: Paid Agent Tests
- [ ] Test 2.1: estimate_cost
- [ ] Test 2.2: execute_versatile_task
- [ ] Test 2.3: get_spend_stats

## Phase 3: Integration Tests
- [ ] Test 3.1: GitHub integration
- [ ] Test 3.2: Vercel integration

## Phase 4: Multi-Agent Stress Test
- [ ] Test 4.1: Augment-led planning workflow
- [ ] Test 4.2: Execute work in parallel (FREE agents)
- [ ] Test 4.3: Telemetry (all stats tools)

## Critical Gates (5-Server System)
- [ ] Gate 1: Augment planning works (task management)
- [ ] Gate 2: All 5 servers respond
- [ ] Gate 3: Workspace resolution works
- [ ] Gate 4: Budget protection works

## Issues Found
(List any failures or unexpected behavior)

## Overall Status
- [ ] PASS - All tests passed
- [ ] PARTIAL - Some tests failed
- [ ] FAIL - Critical failures
```

---

## 🎯 Success Criteria (5-Server System)

**System is READY when:**
1. ✅ All 5 servers connect without errors
2. ✅ Augment can plan and delegate work using task management tools
3. ✅ FREE agents handle most work (0 credits)
4. ✅ PAID agents used only when needed (budget-protected)
5. ✅ Workspace resolution works correctly on Windows
6. ✅ Budget tracking prevents overspend
7. ✅ All health checks pass
8. ✅ Multi-agent stress test completes successfully with minimal cost


