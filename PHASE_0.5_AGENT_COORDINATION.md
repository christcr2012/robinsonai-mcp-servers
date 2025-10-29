# Phase 0.5: OpenAI MCP Integration & Agent Coordination

**Created:** 2025-10-29
**Updated:** 2025-10-29 (Added Augment Code Rules/Guidelines)
**Status:** CRITICAL - Execute AFTER Phase 0, BEFORE Phase 1-7
**Time:** 2.5-3.5 hours
**Purpose:** Put the new OpenAI MCP to WORK improving your 6-server system

---

## 🎯 **Why This Phase Exists**

**User's Insight:** "The OpenAI toolkit is extremely powerful. If we put it to use very well, the 6 server system may be able to help us with the rest of it."

**The Problem:**
- You just built 259 OpenAI tools (Agents SDK, Responses API, etc.)
- But if you don't USE them to coordinate your agents, they're useless
- Your agents are "practically useless" because they don't coordinate
- **Fix coordination FIRST, then let coordinated agents build Phase 1-7**

**The Solution:**
1. Build OpenAI MCP (Phase 0) ✅
2. **Configure agent coordination (Phase 0.5)** ⬅️ YOU ARE HERE
3. Use coordinated agents to build Phase 1-7 (faster, better quality)
4. Use coordinated agents to build Phase 8+ (RAD crawler)

---

## 🏗️ **Your Current 6-Server System**

### **Current Servers:**
1. **architect-mcp** - Planning, decomposition, work plans
2. **autonomous-agent-mcp** - Local LLM execution (Ollama, free)
3. **credit-optimizer-mcp** - Tool discovery, workflows, scaffolding
4. **thinking-tools-mcp** - Cognitive frameworks (devil's advocate, SWOT, etc.)
5. **openai-worker-mcp** - OpenAI API execution (paid, cost-aware)
6. **robinsons-toolkit-mcp** - 714 integration tools (GitHub, Vercel, Neon, etc.)

### **Current Problems:**
1. ❌ **No coordination** - Agents don't know about each other
2. ❌ **No handoffs** - Can't pass work between agents
3. ❌ **No guardrails** - No safety checks
4. ❌ **No tracing** - Can't see what agents are doing
5. ❌ **Credit Optimizer broken** - Designed for old broker pattern

---

## 📋 **Phase 0.5 Tasks**

### **Task 1: Fix Credit Optimizer (1 hour)**

**Problem:** Credit Optimizer was designed for old Robinson's Toolkit broker pattern. Now you have:
- Direct access to 714 toolkit tools
- Direct access to 259 OpenAI tools
- No broker pattern needed

**Solution:** Update Credit Optimizer to work with new architecture

**Changes Needed:**
1. Remove broker_call() references
2. Update tool discovery to use direct tool calls
3. Update autonomous workflows to use OpenAI Agents SDK
4. Add coordination with OpenAI MCP for multi-agent workflows

**Files to Update:**
- `packages/credit-optimizer-mcp/src/index.ts`
- `packages/credit-optimizer-mcp/src/tool-index.json`

**Deliverable:** Credit Optimizer works with direct tool access + OpenAI coordination

---

### **Task 2: Create Agent Coordination Network (1 hour)**

**Goal:** Use OpenAI Agents SDK to create coordinated agent network

**Agent Network Design:**

```
┌─────────────────────────────────────────────────────────┐
│           AUGMENT CODE (Primary Orchestrator)           │
│  - Takes user request                                   │
│  - Decides what to do itself vs delegate to 6-server    │
│  - Has access to ALL 6 servers                          │
└─────────────────────────────────────────────────────────┘
         │
         │ (Delegates complex/large tasks)
         ▼
┌─────────────────────────────────────────────────────────┐
│              ARCHITECT AGENT (Planner)                  │
│  - Creates execution plan                               │
│  - Uses Thinking Tools for plan validation              │
│  - Delegates work to maximize parallel execution        │
│  - Avoids tool conflicts between workers                │
└─────────────────────────────────────────────────────────┘
         │
         │ (Sends plan + cost estimate)
         ▼
┌─────────────────────────────────────────────────────────┐
│         CREDIT OPTIMIZER AGENT (Cost Controller)        │
│  - Estimates costs for plan                             │
│  - Enforces cost control barriers                       │
│  - Requests user approval if over budget                │
│  - Routes work to cheapest capable worker               │
└─────────────────────────────────────────────────────────┘
         │
         │ (After approval, delegates to workers)
         ├──────────────────────┬──────────────────────┐
         ▼                      ▼                      ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ AUTONOMOUS AGENT │  │ AUTONOMOUS AGENT │  │  OPENAI WORKER   │
│   (Worker #1)    │  │   (Worker #2)    │  │  (Paid Worker)   │
│                  │  │                  │  │                  │
│ - FREE (Ollama)  │  │ - FREE (Ollama)  │  │ - PAID (OpenAI)  │
│ - Code gen       │  │ - Code gen       │  │ - Specialized    │
│ - Analysis       │  │ - Analysis       │  │ - Massive tasks  │
│ - Refactoring    │  │ - Refactoring    │  │ - Premium models │
└──────────────────┘  └──────────────────┘  └──────────────────┘
         │                      │                      │
         │ (All workers can access these tool servers) │
         ├──────────────────────┴──────────────────────┤
         │                                             │
         ▼                                             ▼
┌──────────────────┐                        ┌──────────────────┐
│ THINKING TOOLS   │                        │ ROBINSON'S       │
│ (Tool Server)    │                        │ TOOLKIT          │
│                  │                        │ (Tool Server)    │
│ - Devil's Adv.   │                        │                  │
│ - SWOT           │                        │ - GitHub (100+)  │
│ - Premortem      │                        │ - Vercel (100+)  │
│ - Critical Think │                        │ - Neon (200+)    │
│ - 15+ frameworks │                        │ - Upstash (140+) │
│                  │                        │ - Google (100+)  │
└──────────────────┘                        └──────────────────┘
```

**Key Architecture Principles:**

1. **Augment Code** decides what to do itself vs delegate
2. **Architect** creates plan and maximizes parallel execution
3. **Credit Optimizer** enforces cost controls and routes to cheapest worker
4. **Multiple Autonomous Agents** work in parallel (FREE via Ollama)
5. **OpenAI Worker** only for specialized/massive tasks (PAID, optional)
6. **Thinking Tools** and **Robinson's Toolkit** are TOOL SERVERS (not agents)

---

**Agent Roles:**

### **1. Augment Code (Primary Orchestrator)**
- **Receives:** User request
- **Decides:** Do it myself vs delegate to 6-server system
- **Delegates to:** Architect Agent (for complex/large tasks)
- **Does itself:** Quick edits, simple tasks, immediate responses
- **Uses:** All 6 servers as needed
- **Autonomy:** Full autonomy to override delegation when appropriate

### **2. Architect Agent (Planner)**
- **Receives:** Complex task from Augment
- **Creates:** Execution plan with work breakdown
- **Uses:** Thinking Tools (premortem, SWOT) to validate plan
- **Optimizes:** Parallel execution by avoiding tool conflicts
  - Example: Assigns GitHub work to Worker #1, Vercel work to Worker #2 simultaneously
- **Delegates to:** Credit Optimizer (with plan + cost estimate)
- **Guardrails:** Max plan size, complexity limits

### **3. Credit Optimizer Agent (Cost Controller)**
- **Receives:** Plan from Architect
- **Estimates:** Cost for entire plan
- **Checks:** Against cost control barriers
- **Requests:** User approval if over budget (e.g., >$10)
- **Routes:** Work to cheapest capable worker
  - Autonomous Agent (FREE) for standard tasks
  - OpenAI Worker (PAID) only when necessary
- **Delegates to:** Multiple workers in parallel
- **Guardrails:** Monthly budget limits, per-task cost limits

### **4. Autonomous Agent (FREE Worker)**
- **Receives:** Work from Credit Optimizer
- **Executes:** Code generation, analysis, refactoring
- **Uses:** Ollama (FREE local LLM)
- **Can access:** Thinking Tools, Robinson's Toolkit
- **Multiple instances:** Can run 2-3+ in parallel
- **Returns:** Results to Credit Optimizer → Architect → Augment

### **5. OpenAI Worker (PAID Worker - Optional)**
- **Receives:** Specialized/massive tasks from Credit Optimizer
- **Executes:** Tasks requiring premium models
- **Uses:** OpenAI API (GPT-4, o1, etc.)
- **Can access:** Thinking Tools, Robinson's Toolkit
- **Use cases:**
  - Massive tasks (1000+ lines of code)
  - Specialized tasks (complex algorithms, advanced reasoning)
  - When quality > cost
- **Returns:** Results to Credit Optimizer → Architect → Augment

**Implementation:**
```typescript
// 1. Create Architect Agent (Planner)
const architectAgent = await openai_agent_create({
  name: "Architect",
  instructions: `You are a planning expert.
    - Break down tasks into parallel work units
    - Maximize parallel execution by avoiding tool conflicts
    - Use thinking tools to validate plans
    - Estimate costs and delegate to Credit Optimizer`,
  tools: [
    "plan_work",
    "decompose_spec",
    "get_plan_status",
    // Thinking Tools access
    "premortem_analysis",
    "swot_analysis",
    "devils_advocate"
  ],
  handoffs: [
    { to: "CreditOptimizer", when: "plan_ready", with: "plan + cost_estimate" }
  ]
});

// 2. Create Credit Optimizer Agent (Cost Controller)
const creditOptimizerAgent = await openai_agent_create({
  name: "CreditOptimizer",
  instructions: `You control costs and route work efficiently.
    - Estimate costs for plans
    - Check against cost control barriers ($10 limit, $25 monthly budget)
    - Request user approval if over budget
    - Route work to cheapest capable worker (prefer FREE Autonomous)
    - Only use OpenAI Worker when necessary`,
  tools: [
    "estimate_cost",
    "check_budget",
    "request_approval",
    "discover_tools",
    "execute_autonomous_workflow",
    // Thinking Tools access
    "decision_matrix"
  ],
  handoffs: [
    { to: "AutonomousWorker", when: "standard_task", with: "work_unit" },
    { to: "OpenAIWorker", when: "specialized_task", with: "work_unit" }
  ]
});

// 3. Create Autonomous Agent Workers (FREE via Ollama)
// Can create multiple instances for parallel execution
const autonomousWorker = await openai_agent_create({
  name: "AutonomousWorker",
  instructions: `You execute code generation tasks using FREE Ollama.
    - Generate code, analyze, refactor
    - Use thinking tools for quality checks
    - Access Robinson's Toolkit as needed`,
  tools: [
    "delegate_code_generation",
    "delegate_code_analysis",
    "delegate_code_refactoring",
    // Thinking Tools access
    "critical_thinking",
    // Robinson's Toolkit access (all 714 tools available)
    "github_*", "vercel_*", "neon_*", "upstash_*"
  ],
  handoffs: [
    { to: "CreditOptimizer", when: "task_complete", with: "results" }
  ]
});

// 4. Create OpenAI Worker (PAID - Optional)
const openaiWorker = await openai_agent_create({
  name: "OpenAIWorker",
  instructions: `You handle specialized/massive tasks using premium OpenAI models.
    - Only used when Autonomous Agents can't handle it
    - Use GPT-4, o1, or other premium models as needed`,
  tools: [
    "run_job", // OpenAI Worker MCP tool
    // Thinking Tools access
    "critical_thinking",
    "devils_advocate",
    // Robinson's Toolkit access
    "github_*", "vercel_*", "neon_*", "upstash_*"
  ],
  handoffs: [
    { to: "CreditOptimizer", when: "task_complete", with: "results" }
  ]
});
```

**Deliverable:** 3 coordinated agents + 1 optional paid worker configured

---

### **Task 3: Create Coordination Workflows (30 min)**

**Workflow 1: Build Feature (Coordinated)**
```
User: "Build authentication system"
         ↓
    Augment Code (decides to delegate)
         ↓
    Architect Agent
         ├─ Creates execution plan
         ├─ Uses premortem_analysis (Thinking Tools)
         ├─ Optimizes for parallel execution
         └─ Estimates costs ($15)
         ↓
    Credit Optimizer Agent
         ├─ Checks cost estimate ($15)
         ├─ Requests user approval (over $10 limit)
         ├─ User approves
         └─ Routes work to workers
         ↓
    ┌────────────────┬────────────────┐
    ↓                ↓                ↓
Autonomous Worker 1  Autonomous Worker 2  (OpenAI Worker - not needed)
├─ Auth component   ├─ API endpoints
├─ Uses critical_thinking (Thinking Tools)
├─ Uses github_* (Robinson's Toolkit)
└─ FREE (Ollama)    └─ FREE (Ollama)
    ↓                ↓
    └────────────────┴────────────────┘
                     ↓
            Credit Optimizer (collects results)
                     ↓
            Architect (validates)
                     ↓
            Augment Code (reviews & tests)
```

**Workflow 2: Fix Errors (Coordinated)**
```
User: "Fix these 50 type errors"
         ↓
    Augment Code (decides to delegate)
         ↓
    Architect Agent
         ├─ Analyzes errors
         ├─ Groups by file/pattern
         └─ Creates fix plan
         ↓
    Credit Optimizer Agent
         ├─ Estimates cost ($0 - bulk fix is FREE)
         ├─ No approval needed
         └─ Routes to Autonomous Worker
         ↓
    Autonomous Worker
         ├─ Executes execute_bulk_fix (Credit Optimizer tool)
         └─ FREE (Ollama)
         ↓
    Credit Optimizer (collects results)
         ↓
    Augment Code (reviews & commits)
```

**Workflow 3: Build Phase 1-7 (Coordinated)**
```
User: "Build 300+ toolkit tools"
         ↓
    Augment Code (delegates large task)
         ↓
    Architect Agent
         ├─ Creates 7-phase plan
         ├─ Uses premortem_analysis (Thinking Tools)
         ├─ Breaks into 50+ parallel work units
         ├─ Avoids tool conflicts (GitHub vs Vercel vs Neon)
         └─ Estimates costs ($45)
         ↓
    Credit Optimizer Agent
         ├─ Checks cost estimate ($45)
         ├─ Requests user approval (over $10, under $25 monthly)
         ├─ User approves
         └─ Routes work to multiple workers
         ↓
    ┌────────────────┬────────────────┬────────────────┐
    ↓                ↓                ↓                ↓
Autonomous Worker 1  Autonomous Worker 2  Autonomous Worker 3  (OpenAI Worker - not needed)
├─ Upstash tools    ├─ Fly.io tools     ├─ Docker tools
├─ FREE (Ollama)    ├─ FREE (Ollama)    ├─ FREE (Ollama)
└─ 110 tools        └─ 60 tools         └─ 100 tools
    ↓                ↓                ↓
    └────────────────┴────────────────┴────────────────┘
                     ↓
            Credit Optimizer (collects results)
                     ↓
            Architect (validates)
                     ↓
            Augment Code (reviews & tests)

Result: 270 tools built, 90% FREE via Ollama, ~$5 actual cost
```

**Deliverable:** 3 coordination workflows configured

---

### **Task 4: Add Guardrails (30 min)**

**Guardrail 1: Cost Protection**
```typescript
await openai_agent_guardrail_create({
  agent: "Autonomous",
  type: "cost_limit",
  config: {
    max_cost_per_task: 0, // FREE only (Ollama)
    escalate_to: "openai-worker-mcp" // Only if user approves
  }
});
```

**Guardrail 2: Quality Checks**
```typescript
await openai_agent_guardrail_create({
  agent: "Autonomous",
  type: "code_quality",
  config: {
    no_placeholders: true,
    no_stubs: true,
    no_test_data: true,
    production_ready: true
  }
});
```

**Guardrail 3: Budget Limits**
```typescript
await openai_agent_guardrail_create({
  agent: "CreditOptimizer",
  type: "monthly_budget",
  config: {
    max_monthly_spend: 25, // User's budget
    alert_at: 10,
    require_approval_over: 10
  }
});
```

**Deliverable:** Safety guardrails configured for all agents

---

### **Task 5: Configure Augment Code Rules & Guidelines (30 min)**

**Goal:** Add workspace guidelines to help Augment Code instinctively use the 6-server system

**Reference:** https://docs.augmentcode.com/setup-augment/guidelines#workspace-guidelines

**Location:** `.augment/rules/` directory in workspace root

**Guidelines to Add:**

#### **Rule 1: Server System Overview** (`.augment/rules/1-server-system.md`)
```markdown
# 6-Server System Overview

You have access to 6 MCP servers that can dramatically reduce your credit usage:

## FREE Servers (Use Liberally):
1. **autonomous-agent-mcp** - Code generation via Ollama (0 credits)
2. **thinking-tools-mcp** - 15+ cognitive frameworks (0 credits)
3. **robinsons-toolkit-mcp** - 714 integration tools (0 credits)

## PAID Servers (Use Strategically):
4. **architect-mcp** - Planning & decomposition (minimal credits)
5. **credit-optimizer-mcp** - Tool discovery & workflows (minimal credits)
6. **openai-worker-mcp** - Premium OpenAI features (paid, use sparingly)

## Decision Framework:
- **Simple tasks (<50 lines):** Do it yourself (faster)
- **Medium tasks (50-200 lines):** Delegate to autonomous-agent-mcp (FREE)
- **Large tasks (200+ lines):** Use architect-mcp to plan, then delegate (saves credits)
- **Bulk operations (50+ files):** Use credit-optimizer-mcp workflows (saves 99% credits)
```

#### **Rule 2: When to Delegate** (`.augment/rules/2-delegation-strategy.md`)
```markdown
# Delegation Strategy

## ALWAYS Delegate to Autonomous Agent When:
- Generating 50+ lines of code
- Creating multiple similar files
- Refactoring large codebases
- Generating tests for existing code
- Analyzing code for issues
- **Why:** FREE via Ollama, saves 90%+ credits

## ALWAYS Use Credit Optimizer When:
- Fixing 10+ similar errors across files
- Scaffolding new features (components + API + tests)
- Bulk refactoring patterns
- Applying migrations across codebase
- **Why:** Autonomous workflows save 99% credits

## ALWAYS Use Thinking Tools When:
- Making architectural decisions
- Evaluating tradeoffs
- Finding flaws in plans (devil's advocate)
- Risk analysis (premortem)
- **Why:** FREE and improves decision quality

## Do It Yourself When:
- Quick edits (<50 lines)
- User needs immediate response
- Task requires deep context you already have
- Delegation overhead > task complexity
- **Why:** Sometimes faster to just do it
```

#### **Rule 3: Cost-Aware Workflows** (`.augment/rules/3-cost-optimization.md`)
```markdown
# Cost Optimization Patterns

## Pattern 1: Plan → Delegate → Review
```
User: "Build authentication system"
You: Use architect-mcp to create plan (2 min, minimal credits)
     → Delegate to autonomous-agent-mcp for code gen (FREE)
     → Review and test (2 min, minimal credits)
Result: 90% credit savings
```

## Pattern 2: Bulk Operations
```
User: "Fix 50 type errors"
You: Use credit-optimizer-mcp execute_bulk_fix (FREE, autonomous)
     → Review results (1 min, minimal credits)
Result: 99% credit savings vs fixing manually
```

## Pattern 3: Critical Thinking
```
User: "Should we use Redis or Postgres for caching?"
You: Use thinking-tools-mcp decision_matrix (FREE)
     → Use thinking-tools-mcp devils_advocate (FREE)
     → Present analysis to user
Result: Better decision + 0 credits
```

## Anti-Pattern: Don't Over-Delegate
```
User: "Change variable name from 'x' to 'count'"
Bad: Delegate to autonomous-agent-mcp (overhead > task)
Good: Just do it yourself (5 seconds)
```
```

#### **Rule 4: Agent Coordination** (`.augment/rules/4-agent-coordination.md`)
```markdown
# Agent Coordination Patterns

## Multi-Agent Workflow Example:
```
User: "Build comprehensive Upstash Redis tools"

Step 1: Use thinking-tools-mcp premortem_analysis
        → Identify risks before starting

Step 2: Use architect-mcp plan_work
        → Break into 110 tool specifications

Step 3: Use thinking-tools-mcp devils_advocate
        → Challenge the plan, find gaps

Step 4: Use credit-optimizer-mcp scaffold_feature
        → Generate tool structure (FREE)

Step 5: Use autonomous-agent-mcp delegate_code_generation
        → Generate all 110 tools (FREE via Ollama)

Step 6: Review and test
        → You verify quality

Result: 300+ lines of code, 95% FREE
```

## When Agents Should Collaborate:
- **Architect + Thinking:** Validate plans before execution
- **Autonomous + Thinking:** Code quality analysis
- **Credit Optimizer + Autonomous:** Scaffolding + code generation
- **You + All Agents:** Complex multi-phase projects
```

#### **Rule 5: Autonomy Guidelines** (`.augment/rules/5-autonomy.md`)
```markdown
# Autonomy & Decision Making

## You Have Full Autonomy To:
- Decide when delegation costs more than doing work yourself
- Skip delegation for trivial tasks
- Use paid OpenAI Worker when quality/speed justifies cost
- Override these guidelines when user needs require it

## Trust Your Judgment On:
- **Speed vs Cost:** Sometimes faster to do it yourself
- **Context Preservation:** You have conversation context agents don't
- **User Intent:** You understand nuance better than agents
- **Quality Requirements:** You know when "good enough" is acceptable

## But Consider:
- **Credit Budget:** User has limited Augment credits
- **Free Alternatives:** Ollama is FREE and often good enough
- **Learning Curve:** User wants to see agents in action
- **Scalability:** Patterns you establish now scale to larger tasks

## Example Decision Tree:
```
Task: Generate 200-line React component

Option A: Do it yourself
- Time: 3 minutes
- Cost: ~50 Augment credits
- Quality: Excellent (you have full context)

Option B: Delegate to autonomous-agent-mcp
- Time: 4 minutes (1 min setup + 2 min generation + 1 min review)
- Cost: 0 credits (FREE Ollama)
- Quality: Good (may need minor tweaks)

Decision: Delegate (saves 50 credits for 1 extra minute)
```

## When to Override and Do It Yourself:
- User explicitly asks you to do it
- Task is <30 seconds of work
- You're already in the middle of the file
- Delegation would break conversation flow
- User needs immediate response (emergency fix)
```

**Implementation:**
```bash
# Create rules directory
mkdir -p .augment/rules

# Create rule files
echo "..." > .augment/rules/1-server-system.md
echo "..." > .augment/rules/2-delegation-strategy.md
echo "..." > .augment/rules/3-cost-optimization.md
echo "..." > .augment/rules/4-agent-coordination.md
echo "..." > .augment/rules/5-autonomy.md
```

**Deliverable:** 5 Augment Code guidelines configured to optimize 6-server usage

---

## 🚀 **Execution Plan**

### **Step 1: Complete Phase 0 (6-8 hours)**
Build all 259 OpenAI MCP tools

### **Step 2: Execute Phase 0.5 (2.5-3.5 hours)** ⬅️ THIS PHASE
1. Fix Credit Optimizer (1h)
2. Create agent coordination network (1h)
3. Create coordination workflows (30min)
4. Add guardrails (30min)
5. Configure Augment Code rules/guidelines (30min)

### **Step 3: TEST Coordination (30 min)**
Run a real coordinated workflow:
```
Task: "Add 10 new Upstash Redis tools"
Expected: Architect → Thinking → Credit Optimizer → Autonomous → Done
Result: 10 tools built with 0 Augment credits (all Ollama)
```

### **Step 4: Use Coordinated Agents for Phase 1-7 (8-12 hours)**
Now your agents can help build the 300+ toolkit tools!

---

## ✅ **Success Criteria**

- [ ] Credit Optimizer works with direct tool access (not broker pattern)
- [ ] 3 agents configured with Agents SDK (Architect, Autonomous, Credit Optimizer)
- [ ] Thinking Tools accessible to all agents (not an agent itself)
- [ ] Handoffs working between agents
- [ ] Guardrails protecting against costs/quality issues
- [ ] Augment Code rules/guidelines configured (5 files in `.augment/rules/`)
- [ ] Test workflow completes successfully
- [ ] Agents can coordinate to build Phase 1-7
- [ ] Augment Code instinctively uses 6-server system

---

## 📊 **Expected Benefits**

**Before Phase 0.5:**
- Augment does all work manually
- High credit usage
- Slow progress
- No coordination

**After Phase 0.5:**
- Agents coordinate automatically
- 90%+ work done by FREE Ollama
- 10x faster progress
- Quality guardrails ensure production-ready code

**Example:**
- **Task:** Build 300+ toolkit tools
- **Without coordination:** 8-12 hours of Augment credits
- **With coordination:** 2-3 hours Augment (planning) + 6-9 hours Ollama (FREE)
- **Savings:** ~$50-100 in Augment credits

---

## 🔗 **Related Documentation**

- **`HANDOFF_TO_NEW_AGENT.md`** - Overall execution order
- **`OPENAI_MCP_COMPREHENSIVE_SPEC.md`** - Phase 0 (build this first)
- **`COMPREHENSIVE_TOOLKIT_EXPANSION_SPEC.md`** - Phase 1-7 (use coordinated agents)
- **`RAD_CRAWLER_MASTER_PLAN_V2.md`** - Phase 8+ (use coordinated agents)

---

**This is the MISSING LINK between building tools and actually using them! 🚀**
