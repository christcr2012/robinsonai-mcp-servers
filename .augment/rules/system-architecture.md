# Robinson AI MCP Servers - System Architecture

## 🏗️ Architecture Overview

**5-Server Simplified Architecture** (down from 7 servers)

```
User Request
     ↓
Augment Agent (YOU) ← Orchestrator
     ↓
     ├─→ FREE Agent MCP (Ollama) ← 0 credits, does most work
     ├─→ PAID Agent MCP (OpenAI/Claude) ← Use sparingly
     ├─→ Robinson's Toolkit MCP ← 906 integration tools
     ├─→ Thinking Tools MCP ← 24 cognitive frameworks
     └─→ Credit Optimizer MCP ← Tool discovery, templates
```

**Removed (Redundant):**
- ❌ Architect MCP - You do the planning
- ❌ Agent Orchestrator - You do the coordination

---

## 📦 Server Details

### 1. FREE Agent MCP (Autonomous Agent)
**Package:** `@robinsonai/free-agent-mcp`  
**Command:** `free-agent-mcp`  
**Cost:** $0.00 (runs on local Ollama)  
**Tools:** 17 tools  

**Purpose:** Do ALL code-related work for FREE
- Code generation (any language, any framework)
- Code analysis (find bugs, security issues, performance problems)
- Code refactoring (extract components, apply patterns)
- Test generation (unit tests, integration tests)
- Documentation generation

**Models:**
- Fast: `qwen2.5:3b` (simple tasks)
- Medium: `codellama:34b` (standard tasks)
- Complex: `deepseek-coder:33b` (expert tasks)

**Concurrency:** 15 workers (can handle 15 tasks simultaneously)

**Key Tools:**
- `delegate_code_generation_free-agent-mcp`
- `delegate_code_analysis_free-agent-mcp`
- `delegate_code_refactoring_free-agent-mcp`
- `delegate_test_generation_free-agent-mcp`
- `execute_versatile_task_autonomous-agent-mcp`

---

### 2. PAID Agent MCP (OpenAI Worker)
**Package:** `@robinsonai/paid-agent-mcp`  
**Command:** `paid-agent-mcp`  
**Cost:** Varies by model  
**Tools:** 17 tools  
**Budget:** $25/month (currently $13.89 remaining)

**Purpose:** Handle complex tasks that FREE agent can't do

**Worker Tiers:**
- **mini-worker** (gpt-4o-mini): $0.00015/1K input, $0.0006/1K output
- **balanced-worker** (gpt-4o): $0.0025/1K input, $0.01/1K output  
- **premium-worker** (o1-mini): $0.003/1K input, $0.012/1K output

**When to Use:**
- FREE agent fails or produces poor results
- Task requires reasoning beyond Ollama's capabilities
- Quality is critical and cost is acceptable

**Key Tools:**
- `execute_versatile_task_paid-agent-mcp`
- `openai_worker_run_job_paid-agent-mcp`
- `openai_worker_estimate_cost_paid-agent-mcp`

---

### 3. Robinson's Toolkit MCP (Integration Broker)
**Package:** `@robinsonai/robinsons-toolkit-mcp`  
**Command:** `robinsons-toolkit-mcp`  
**Cost:** ~100 credits per tool call  
**Tools:** 906 tools across 5 categories (exposed via 5 broker tools)

**Purpose:** Integrate with external services

**Categories:**
1. **GitHub** (241 tools)
   - Repos, issues, PRs, workflows, releases, secrets, webhooks
   - Organizations, teams, collaborators
   - Code scanning, security alerts
   - Gists, discussions, projects

2. **Vercel** (150 tools)
   - Projects, deployments, domains, DNS
   - Environment variables, webhooks
   - Edge Config, logs, analytics
   - Firewall, security, billing

3. **Neon** (166 tools)
   - Serverless Postgres databases
   - Projects, branches, endpoints
   - Connection pooling, roles, operations

4. **Upstash** (157 tools)
   - Redis operations (GET, SET, HSET, ZADD, etc.)
   - Database management
   - Serverless Redis

5. **Google Workspace** (192 tools)
   - Gmail (send, read, search, labels)
   - Drive (files, folders, sharing)
   - Calendar (events, scheduling)
   - Sheets, Docs, Forms

**Broker Pattern:**
```javascript
// 1. List categories
toolkit_list_categories_robinsons-toolkit-mcp()

// 2. List tools in category
toolkit_list_tools_robinsons-toolkit-mcp({ category: "github", limit: 10 })

// 3. Discover specific tool
toolkit_discover_robinsons-toolkit-mcp({ query: "create repo", limit: 5 })

// 4. Get tool schema
toolkit_get_tool_schema_robinsons-toolkit-mcp({ 
  category: "github", 
  tool_name: "github_create_repo" 
})

// 5. Execute tool
toolkit_call_robinsons-toolkit-mcp({
  category: "github",
  tool_name: "github_create_repo",
  arguments: { name: "my-repo", private: true }
})
```

**Why Broker Pattern?**
- Avoids loading 906 tool definitions into context
- Saves tokens and credits
- Dynamic discovery of tools
- Only loads what you need

---

### 4. Thinking Tools MCP (Cognitive Frameworks)
**Package:** `@robinsonai/thinking-tools-mcp`  
**Command:** `thinking-tools-mcp`  
**Cost:** ~50 credits per tool call  
**Tools:** 24 cognitive frameworks

**Purpose:** Help YOU (Augment) think better

**Available Frameworks:**
- `devils_advocate_thinking-tools-mcp` - Challenge assumptions
- `first_principles_thinking-tools-mcp` - Break down to fundamentals
- `root_cause_thinking-tools-mcp` - 5 Whys analysis
- `swot_analysis_thinking-tools-mcp` - Strengths/Weaknesses/Opportunities/Threats
- `premortem_analysis_thinking-tools-mcp` - Imagine failure scenarios
- `critical_thinking_thinking-tools-mcp` - Evaluate arguments
- `lateral_thinking_thinking-tools-mcp` - Creative problem solving
- `red_team_thinking-tools-mcp` - Attack the plan
- `blue_team_thinking-tools-mcp` - Defend the plan
- `decision_matrix_thinking-tools-mcp` - Weighted decision-making
- `socratic_questioning_thinking-tools-mcp` - Deep inquiry
- `systems_thinking_thinking-tools-mcp` - Understand interconnections
- `scenario_planning_thinking-tools-mcp` - Explore possible futures
- `brainstorming_thinking-tools-mcp` - Generate ideas
- `mind_mapping_thinking-tools-mcp` - Visual organization
- `sequential_thinking_thinking-tools-mcp` - Step-by-step reasoning
- `parallel_thinking_thinking-tools-mcp` - Explore multiple paths
- `reflective_thinking_thinking-tools-mcp` - Review and critique

**Plus Context7 Integration:**
- `context7_resolve_library_id` - Find library documentation
- `context7_get_library_docs` - Get docs for library
- `context7_search_libraries` - Search across libraries
- `context7_compare_versions` - Compare library versions
- `context7_get_examples` - Get code examples
- `context7_get_migration_guide` - Get migration guides

---

### 5. Credit Optimizer MCP (Tool Discovery & Templates)
**Package:** `@robinsonai/credit-optimizer-mcp`  
**Command:** `credit-optimizer-mcp`  
**Cost:** ~50 credits per tool call  
**Tools:** 40+ tools  
**Status:** ⚠️ Currently has connection issues

**Purpose:** Optimize credit usage and provide templates

**Key Features:**
- Tool discovery (find tools without AI)
- Workflow suggestions
- Scaffolding templates (0 credits!)
- Cost tracking and analytics
- Autonomous workflows
- Bulk operations

**When Working:**
- `discover_tools_credit-optimizer-mcp` - Find tools instantly
- `scaffold_feature_credit-optimizer-mcp` - Generate feature boilerplate
- `execute_autonomous_workflow_credit-optimizer-mcp` - Run multi-step workflows
- `get_credit_stats_credit-optimizer-mcp` - View savings

---

### 6. OpenAI MCP (Direct API Access)
**Package:** `@robinsonai/openai-mcp`  
**Command:** `openai-mcp`  
**Cost:** Varies by operation  
**Tools:** 200+ tools

**Purpose:** Direct access to OpenAI API

**Available Operations:**
- Chat completions (GPT-4, GPT-5, O3, O4-mini)
- Embeddings (text-embedding-3-small/large)
- Image generation (DALL-E 3)
- Audio (TTS, Whisper)
- Assistants API
- Fine-tuning
- Batch processing
- Vector stores
- Realtime API

**96 Models Available** including latest GPT-5, O3, O4-mini

---

## 💰 Cost Comparison

| Task | Augment Does It | FREE Agent | PAID Agent | Savings |
|------|----------------|------------|------------|---------|
| Generate 1 file | 13,000 credits | 0 credits | 500-2,000 credits | 96-100% |
| Analyze code | 13,000 credits | 0 credits | 500-1,000 credits | 96-100% |
| Refactor code | 13,000 credits | 0 credits | 500-1,500 credits | 96-100% |
| Write tests | 13,000 credits | 0 credits | 500-1,000 credits | 96-100% |

**Example: Add 10 new tools**
- Old way (Augment does it): 130,000 credits (~$13)
- New way (FREE agent): 0 credits ($0)
- **Savings: $13 (100%)**

---

## 🎯 Your Role as Orchestrator

**What YOU Should Do:**
1. ✅ Understand user requests
2. ✅ Break down complex tasks
3. ✅ Delegate to appropriate agents/tools
4. ✅ Verify results
5. ✅ Coordinate between tools
6. ✅ Use thinking tools for planning

**What YOU Should NOT Do:**
1. ❌ Write code yourself
2. ❌ Do analysis yourself
3. ❌ Refactor code yourself
4. ❌ Generate tests yourself
5. ❌ Do work that can be delegated

**Remember:** The user built this system to save 96% in costs. Your job is to USE it, not bypass it!

