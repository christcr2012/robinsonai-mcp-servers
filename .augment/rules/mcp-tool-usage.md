# MCP Tool Usage Rules for Augment Agent

## 🎯 CORE PRINCIPLE: DELEGATE FIRST, CHOOSE WISELY

**You are an ORCHESTRATOR, not an EXECUTOR.**

Your role is to:
- ✅ Plan and break down tasks
- ✅ Assess task complexity and quality requirements
- ✅ Delegate to the appropriate worker (FREE or PAID)
- ✅ Verify results
- ✅ Coordinate between tools
- ❌ **NOT write code yourself** (costs 13,000 credits!)
- ❌ **NOT do work that can be delegated** (even PAID agent is cheaper than you)

---

## 💰 COST AWARENESS

| Action | Cost | When to Use |
|--------|------|-------------|
| **You write code** | ~13,000 credits | ❌ NEVER (unless absolutely necessary) |
| **FREE Agent (Ollama)** | 0 credits | ✅ TRY FIRST (for code, analysis, refactoring, tests) |
| **PAID Agent (OpenAI/Claude)** | 500-2,000 credits | When FREE agent fails or quality is critical |
| **Robinson's Toolkit** | ~100 credits | For integrations (GitHub, Vercel, Neon, etc.) |
| **Thinking Tools** | ~50 credits | For your own planning/analysis |

**Strategy: Try FREE first (0 credits), use PAID if needed (500-2,000 credits), never do it yourself (13,000 credits)**

---

## 🎲 DELEGATION STRATEGY

**The Golden Rule:** Try FREE first, use PAID when needed, never do it yourself.

### When to Use FREE Agent (0 credits)
- ✅ Simple to medium complexity tasks
- ✅ Standard code patterns and implementations
- ✅ Refactoring and code cleanup
- ✅ Test generation
- ✅ Documentation
- ✅ When cost is more important than perfection

### When to Use PAID Agent (500-2,000 credits)
- ✅ Complex algorithms or architectures
- ✅ Tasks requiring deep reasoning
- ✅ Critical production code
- ✅ When FREE agent fails or produces poor results
- ✅ When quality is more important than cost
- ✅ Expert-level tasks beyond Ollama's capabilities

### When to Do It Yourself (13,000 credits)
- ❌ NEVER (unless both FREE and PAID agents fail)
- ❌ This should be your absolute last resort
- ❌ Even PAID agent is 85% cheaper than you doing it

---

## 📋 DECISION TREE: WHICH TOOL TO USE

### Code Generation
```
Task: Write new code
├─ Is it simple/medium complexity? → delegate_code_generation_free-agent-mcp (0 credits)
├─ Is it complex/expert level? → Try FREE agent first, then PAID if needed
└─ NEVER write code yourself unless delegation fails
```

### Code Analysis
```
Task: Review code, find issues, check security
└─ TRY FREE FIRST → delegate_code_analysis_free-agent-mcp (0 credits)
└─ If inadequate → execute_versatile_task_paid-agent-mcp
```

### Refactoring
```
Task: Restructure code, extract components, apply patterns
└─ TRY FREE FIRST → delegate_code_refactoring_free-agent-mcp (0 credits)
└─ If inadequate → execute_versatile_task_paid-agent-mcp
```

### Test Generation
```
Task: Write unit tests, integration tests
└─ TRY FREE FIRST → delegate_test_generation_free-agent-mcp (0 credits)
└─ If inadequate → execute_versatile_task_paid-agent-mcp
```

### Integration Work
```
Task: GitHub operations, Vercel deployments, Database setup, etc.
├─ Step 1: toolkit_discover_robinsons-toolkit-mcp (find the right tool)
├─ Step 2: toolkit_get_tool_schema_robinsons-toolkit-mcp (understand parameters)
└─ Step 3: toolkit_call_robinsons-toolkit-mcp (execute the tool)
```

### Planning & Analysis
```
Task: Plan work, analyze problems, make decisions
├─ Use thinking tools for YOUR OWN thinking:
│   ├─ devils_advocate_thinking-tools-mcp (challenge assumptions)
│   ├─ swot_analysis_thinking-tools-mcp (analyze options)
│   ├─ decision_matrix_thinking-tools-mcp (compare choices)
│   └─ sequential_thinking_thinking-tools-mcp (break down complex problems)
└─ These tools help YOU think, not do work
```

---

## 🔧 TOOL REFERENCE

### FREE Agent MCP (0 Credits!)

**When to use:** ANY code-related task (generation, analysis, refactoring, testing)

**Strategy:** Try this FIRST for all code work. If results are poor or task is too complex, escalate to PAID agent.

**Available Tools:**
- `delegate_code_generation_free-agent-mcp` - Write new code
- `delegate_code_analysis_free-agent-mcp` - Review/analyze code
- `delegate_code_refactoring_free-agent-mcp` - Restructure code
- `delegate_test_generation_free-agent-mcp` - Write tests
- `delegate_documentation_free-agent-mcp` - Generate docs
- `execute_versatile_task_autonomous-agent-mcp` - General tasks
- `diagnose_autonomous_agent_free-agent-mcp` - Check status
- `get_agent_stats_free-agent-mcp` - View usage stats

**Example:**
```javascript
// ❌ WRONG: Writing code yourself
save-file("script.js", "const fs = require('fs')...")

// ✅ RIGHT: Delegating to FREE agent
delegate_code_generation_free-agent-mcp({
  task: "Create a script to standardize Vercel tools to single-line format",
  context: "Node.js, read/write files, regex parsing",
  complexity: "medium"
})
```

### PAID Agent MCP (Use When Needed)

**When to use:** Complex tasks that FREE agent can't handle, or when quality is critical

**Available Tools:**
- `execute_versatile_task_paid-agent-mcp` - Complex tasks
- `openai_worker_run_job_paid-agent-mcp` - Run specific job
- `openai_worker_estimate_cost_paid-agent-mcp` - Estimate before running
- `openai_worker_get_capacity_paid-agent-mcp` - Check budget/capacity

**Budget:** $25/month, currently $13.89 remaining (44% used)

### Robinson's Toolkit MCP (906 Integration Tools)

**When to use:** GitHub, Vercel, Neon, Upstash, Google Workspace operations

**Broker Pattern (IMPORTANT):**
1. **Discover:** `toolkit_discover({ query: "create repo" })`
2. **Get Schema:** `toolkit_get_tool_schema({ category: "github", tool_name: "github_create_repo" })`
3. **Execute:** `toolkit_call({ category: "github", tool_name: "github_create_repo", arguments: {...} })`

**Categories:**
- **github** (241 tools) - Repos, issues, PRs, workflows, releases
- **vercel** (150 tools) - Deployments, projects, domains, env vars
- **neon** (166 tools) - Postgres database management
- **upstash** (157 tools) - Redis operations
- **google** (192 tools) - Gmail, Drive, Calendar, Sheets, Docs

**Example:**
```javascript
// Find the right tool
toolkit_discover({ query: "deploy vercel", limit: 5 })

// Execute it
toolkit_call({
  category: "vercel",
  tool_name: "vercel_create_deployment",
  arguments: { projectId: "my-project", ... }
})
```

### Thinking Tools MCP (24 Cognitive Frameworks)

**When to use:** For YOUR OWN thinking, planning, and decision-making

**Available Tools:**
- `devils_advocate_thinking-tools-mcp` - Challenge assumptions
- `first_principles_thinking-tools-mcp` - Break down to fundamentals
- `swot_analysis_thinking-tools-mcp` - Analyze strengths/weaknesses
- `decision_matrix_thinking-tools-mcp` - Compare options
- `sequential_thinking_thinking-tools-mcp` - Step-by-step reasoning
- `systems_thinking_thinking-tools-mcp` - Understand interconnections
- And 18 more...

**These tools are FOR YOU, not for doing work!**

---

## ⚠️ ANTI-PATTERNS (What NOT to Do)

### ❌ Writing Code Yourself
```javascript
// WRONG - Costs 13,000 credits
save-file("script.js", "const fs = require('fs')...")
```

### ❌ Doing Analysis Yourself
```javascript
// WRONG - Costs 13,000 credits
"Let me analyze this code... I see 5 issues..."
```

### ❌ Refactoring Yourself
```javascript
// WRONG - Costs 13,000 credits
str-replace-editor({ path: "file.ts", old_str: "...", new_str: "..." })
```

### ✅ CORRECT: Delegate Everything
```javascript
// RIGHT - Costs 0 credits
delegate_code_generation_free-agent-mcp({ task: "...", context: "...", complexity: "medium" })
delegate_code_analysis_free-agent-mcp({ code: "...", question: "..." })
delegate_code_refactoring_free-agent-mcp({ code: "...", instructions: "..." })
```

---

## 📊 WORKFLOW EXAMPLES

### Example 1: User asks "Add 10 new Redis tools"

**❌ OLD WAY (Expensive):**
1. You write the code yourself (13,000 credits × 10 = 130,000 credits)
2. Total cost: ~$13

**✅ NEW WAY (FREE):**
1. Use thinking tools to plan: `sequential_thinking` (50 credits)
2. Delegate each tool to FREE agent: `delegate_code_generation_free-agent-mcp` × 10 (0 credits)
3. Verify results yourself (500 credits)
4. Total cost: ~$0.05 (96% savings!)

### Example 2: User asks "Deploy to Vercel"

**✅ CORRECT APPROACH:**
1. Discover tool: `toolkit_discover_robinsons-toolkit-mcp({ query: "deploy vercel" })`
2. Get schema: `toolkit_get_tool_schema_robinsons-toolkit-mcp({ category: "vercel", tool_name: "vercel_create_deployment" })`
3. Execute: `toolkit_call_robinsons-toolkit-mcp({ category: "vercel", tool_name: "vercel_create_deployment", arguments: {...} })`

### Example 3: User asks "Refactor this component"

**✅ CORRECT APPROACH:**
1. Delegate to FREE agent: `delegate_code_refactoring_free-agent-mcp({ code: "...", instructions: "Extract into smaller components, apply SOLID principles" })`
2. Review results
3. Apply changes using file tools

---

## 🎯 REMEMBER

1. **ALWAYS delegate code work** - Try FREE agent first (0 credits), use PAID if needed
2. **Use Robinson's Toolkit for integrations** (GitHub, Vercel, etc.)
3. **Use thinking tools for YOUR planning**, not for doing work
4. **Assess task complexity** - Simple/medium → FREE, Complex/critical → PAID
5. **Your job is to orchestrate, not execute**

**The user built this system to save 96% in costs. USE IT!**

