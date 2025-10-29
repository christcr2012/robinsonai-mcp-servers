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
│  - Manages overall workflow                             │
│  - Decides when to delegate vs do work itself           │
│  - Has access to ALL 6 servers                          │
└─────────────────────────────────────────────────────────┘
         │
         ├──────────────────────────────────────────┐
         │                                          │
         ▼                                          ▼
┌──────────────────┐                    ┌──────────────────┐
│  OpenAI Worker   │                    │ Thinking Tools   │
│  (Paid, Premium) │                    │ (Cognitive Tools)│
│                  │                    │                  │
│ - Agents SDK     │                    │ - Devil's Advocate│
│ - Responses API  │                    │ - SWOT Analysis  │
│ - Coordination   │                    │ - Premortem      │
└──────────────────┘                    │ - Critical Think │
         │                              │ - 15+ frameworks │
         │                              └──────────────────┘
         │                                     ▲
         ▼                                     │
┌─────────────────────────────────────────────┼──────────┐
│         OpenAI Agent Coordinator            │          │
│  (Uses Agents SDK for handoffs)             │          │
└─────────────────────────────────────────────┼──────────┘
         │           │           │            │
         ▼           ▼           ▼            │
    ┌────────┐  ┌────────┐  ┌────────┐       │
    │Architect│  │Autonomous│ │Credit  │       │
    │  Agent  │  │  Agent   │ │Optimizer│      │
    │        │  │          │ │  Agent  │       │
    │ (Uses  │  │ (Uses    │ │ (Uses   │       │
    │Thinking│  │Thinking  │ │Thinking │       │
    │ Tools) │  │ Tools)   │ │ Tools)  │───────┘
    └────────┘  └────────┘  └────────┘
         │           │           │
         └───────────┴───────────┘
                     │
                     ▼
           ┌──────────────────┐
           │ Robinson's Toolkit│
           │   (714 tools)     │
           │                   │
           │ - GitHub          │
           │ - Vercel          │
           │ - Neon            │
           │ - Upstash         │
           │ - Google          │
           └──────────────────┘
```

**Key Clarification:**
- **Thinking Tools MCP** is NOT an agent - it's a TOOL SERVER
- All agents (Augment, Architect, Autonomous, Credit Optimizer) can USE thinking tools
- Agents can strategically use thinking tools to collaborate (e.g., two agents using devil's advocate to debate)

**Agent Roles:**

1. **Augment Code** (Primary Orchestrator)
   - **Specialty:** Overall workflow management, user interaction
   - **Delegates to:** Architect (planning), Autonomous (code gen), Credit Optimizer (tool discovery)
   - **Uses:** Thinking Tools for critical decisions, OpenAI Worker for premium tasks
   - **Autonomy:** Decides when delegation costs more than doing work itself

2. **Architect Agent** (architect-mcp)
   - **Specialty:** Planning, decomposition, work plans
   - **Handoff to:** Autonomous Agent (for free execution), Credit Optimizer (for tool discovery)
   - **Uses:** Thinking Tools (premortem, SWOT) for plan validation
   - **Guardrails:** Max plan size, budget limits

3. **Autonomous Agent** (autonomous-agent-mcp)
   - **Specialty:** Code generation, analysis, refactoring (FREE via Ollama)
   - **Handoff to:** Architect (for replanning), Credit Optimizer (for scaffolding)
   - **Uses:** Thinking Tools (critical thinking) for code quality
   - **Guardrails:** Code quality checks, security scans

4. **Credit Optimizer Agent** (credit-optimizer-mcp)
   - **Specialty:** Tool discovery, workflow execution, scaffolding
   - **Handoff to:** Autonomous Agent (for code gen), Architect (for complex workflows)
   - **Uses:** Thinking Tools (decision matrix) for tool selection
   - **Guardrails:** Cost limits, tool availability checks

**Implementation:**
```typescript
// Create agent network using OpenAI Agents SDK
const architectAgent = await openai_agent_create({
  name: "Architect",
  instructions: "You are a planning and decomposition expert...",
  tools: ["plan_work", "decompose_spec", "get_plan_status"],
  handoffs: [
    { to: "Autonomous", when: "need_code_generation" },
    { to: "CreditOptimizer", when: "need_tool_discovery" }
  ]
});

const autonomousAgent = await openai_agent_create({
  name: "Autonomous",
  instructions: "You are a code generation expert using FREE Ollama models...",
  tools: ["delegate_code_generation", "delegate_code_analysis"],
  handoffs: [
    { to: "Architect", when: "need_replanning" },
    { to: "CreditOptimizer", when: "need_scaffolding" }
  ]
});

// ... create other agents
```

**Deliverable:** 4 coordinated agents with handoffs configured

---

### **Task 3: Create Coordination Workflows (30 min)**

**Workflow 1: Build Feature (Coordinated)**
```
User Request → Augment → Architect Agent
                              ↓
                    Create work plan
                              ↓
                    Handoff to Thinking Agent
                              ↓
                    Devil's advocate analysis
                              ↓
                    Handoff back to Architect
                              ↓
                    Revised plan
                              ↓
                    Handoff to Credit Optimizer
                              ↓
                    Discover tools, scaffold structure
                              ↓
                    Handoff to Autonomous Agent
                              ↓
                    Generate code (FREE via Ollama)
                              ↓
                    Return to Augment
```

**Workflow 2: Fix Errors (Coordinated)**
```
User: "Fix these 50 type errors"
         ↓
    Augment → Credit Optimizer Agent
                   ↓
         Execute bulk fix workflow
                   ↓
         Handoff to Autonomous Agent
                   ↓
         Generate fixes (FREE)
                   ↓
         Handoff to Thinking Agent
                   ↓
         Critical analysis of fixes
                   ↓
         Return to Augment
```

**Workflow 3: Build Phase 1-7 (Coordinated)**
```
User: "Build comprehensive toolkit expansion"
         ↓
    Augment → Architect Agent
                   ↓
         Decompose into 300+ tool specs
                   ↓
         Handoff to Thinking Agent
                   ↓
         Premortem analysis (what could go wrong?)
                   ↓
         Handoff to Credit Optimizer
                   ↓
         Scaffold tool structures
                   ↓
         Handoff to Autonomous Agent
                   ↓
         Generate 300+ tools (FREE via Ollama)
                   ↓
         Return to Augment for review
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
