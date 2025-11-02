# Agent Enhancement Strategy
## Improving FREE and PAID Agents (Not Building a New Agent)

**Date:** 2025-11-02  
**Status:** 🎯 CLARIFIED  

---

## ✅ **Key Clarification**

**WRONG APPROACH:** Build a separate `coding-agent` package  
**RIGHT APPROACH:** Enhance existing `autonomous-agent-mcp` (FREE) and `openai-worker-mcp` (PAID)

---

## 🏗️ **Architecture**

### Current State
```
User Request
     ↓
Augment Agent (orchestrator)
     ↓
     ├─→ autonomous-agent-mcp (FREE Agent - Ollama, 0 credits)
     ├─→ openai-worker-mcp (PAID Agent - OpenAI/Claude)
     ├─→ thinking-tools-mcp (Cognitive frameworks)
     ├─→ credit-optimizer-mcp (Tool discovery, templates)
     └─→ robinsons-toolkit-mcp (1,165 integration tools)
```

### Enhanced State (After Implementation)
```
User Request
     ↓
Augment Agent (orchestrator)
     ↓
     ├─→ autonomous-agent-mcp (FREE Agent - ENHANCED)
     │   ├─ Quality Gates (formatter, linter, type, tests, coverage, security)
     │   ├─ LLM Judge (Ollama-based evaluation)
     │   ├─ Synthesize-Execute-Critique-Refine Loop
     │   ├─ Repo-Native Generation (Project Brief, symbol graph)
     │   ├─ SQLite Experience Memory (learning)
     │   └─ LoRA Training Pipeline (model evolution)
     │
     ├─→ openai-worker-mcp (PAID Agent - ENHANCED)
     │   ├─ Quality Gates (same as FREE)
     │   ├─ LLM Judge (OpenAI-based evaluation)
     │   ├─ Synthesize-Execute-Critique-Refine Loop
     │   ├─ Repo-Native Generation (shared with FREE)
     │   └─ SQLite Experience Memory (shared DB with FREE)
     │
     ├─→ thinking-tools-mcp (unchanged)
     ├─→ credit-optimizer-mcp (unchanged)
     └─→ robinsons-toolkit-mcp (unchanged)
```

---

## 📦 **What We're Adding to Each Agent**

### FREE Agent (autonomous-agent-mcp)

**New Directories:**
```
packages/autonomous-agent-mcp/
├─ src/
│  ├─ design-card/        # Parse YAML/JSON task specs
│  ├─ gates/              # Quality gates (formatter, linter, etc.)
│  ├─ judge/              # LLM-as-a-judge with Ollama
│  ├─ pipeline/           # Synthesize-Execute-Critique-Refine loop
│  ├─ repo-analysis/      # Project Brief, naming, imports
│  ├─ symbol-graph/       # Index identifiers and relationships
│  ├─ examples/           # Few-shot example retrieval
│  ├─ learning/           # SQLite experience memory
│  ├─ training/           # LoRA training pipeline
│  ├─ testing/            # Impacted tests, flaky detection
│  └─ refactor/           # Refactor engine
```

**New Tools:**
- `execute_with_quality_gates` - Run code generation with full pipeline
- `judge_code_quality` - Evaluate code with LLM judge (Ollama)
- `refine_code` - Fix issues based on judge feedback
- `generate_project_brief` - Auto-analyze repo conventions
- `train_lora_adapter` - Train LoRA from experience memory

### PAID Agent (openai-worker-mcp)

**New Directories:**
```
packages/openai-worker-mcp/
├─ src/
│  ├─ design-card/        # Same as FREE (shared logic)
│  ├─ gates/              # Same as FREE (shared logic)
│  ├─ judge/              # LLM-as-a-judge with OpenAI
│  ├─ pipeline/           # Same as FREE (shared logic)
│  ├─ repo-analysis/      # Shared with FREE
│  ├─ symbol-graph/       # Shared with FREE
│  ├─ examples/           # Shared with FREE
│  ├─ learning/           # Shared DB with FREE
│  ├─ testing/            # Shared with FREE
│  └─ refactor/           # Shared with FREE
```

**New Tools:**
- `execute_with_quality_gates` - Same as FREE
- `judge_code_quality` - Evaluate code with LLM judge (OpenAI)
- `refine_code` - Same as FREE
- `generate_project_brief` - Shared with FREE

**Note:** PAID agent does NOT have LoRA training (can't fine-tune OpenAI models directly)

---

## 🔄 **Shared vs Agent-Specific Logic**

### Shared Logic (Both Agents)
- Design Card parsing
- Quality gates runner (formatter, linter, type checker, tests, coverage, security)
- Pipeline orchestration (Synthesize-Execute-Critique-Refine)
- Repo analysis (Project Brief, naming, imports, architecture)
- Symbol graph (indexing, retrieval, similarity)
- Few-shot example retrieval
- Experience memory (shared SQLite database)
- Impacted test selection
- Flaky test detection
- Refactor engine

### Agent-Specific Logic

**FREE Agent Only:**
- LLM Judge using Ollama models (qwen2.5-coder:7b, deepseek-coder:33b)
- LoRA training pipeline
- Ollama Modelfile generation with ADAPTER directive

**PAID Agent Only:**
- LLM Judge using OpenAI models (gpt-4o, o1-mini)

---

## 🎯 **How It Works**

### Example 1: Simple Code Generation (No Quality Gates)
```typescript
// User calls FREE agent directly
delegate_code_generation_free-agent-mcp({
  task: "Create a user login function",
  context: "Node.js, Express, JWT",
  complexity: "medium"
})

// FREE agent generates code using Ollama
// Returns code immediately (no quality gates)
```

### Example 2: Code Generation with Quality Gates
```typescript
// User calls FREE agent with quality flag
execute_with_quality_gates({
  task: "Create a user login function",
  context: "Node.js, Express, JWT",
  complexity: "medium",
  quality: "best" // Triggers full pipeline
})

// FREE agent runs:
// 1. SYNTHESIZE: Generate code with Ollama
// 2. EXECUTE: Run quality gates (formatter, linter, tests, etc.)
// 3. CRITIQUE: Judge evaluates code (Ollama-based)
// 4. REFINE: Fix issues if judge score < 7.0
// 5. Repeat up to 3 iterations
// Returns final code + verdict
```

### Example 3: Repo-Native Code Generation
```typescript
// First, generate Project Brief (one-time)
generate_project_brief({
  repoPath: "/path/to/repo"
})
// Analyzes repo and caches conventions

// Then, generate code
execute_with_quality_gates({
  task: "Create a user login function",
  context: "Node.js, Express, JWT",
  useProjectBrief: true, // Uses cached conventions
  complexity: "medium",
  quality: "best"
})

// FREE agent:
// - Retrieves Project Brief
// - Finds similar functions in repo (symbol graph)
// - Generates code matching repo conventions
// - Runs quality gates
// - Returns code that looks like it was written by the team
```

### Example 4: Learning from Experience
```typescript
// After each run, FREE agent automatically:
// 1. Stores run in SQLite (task, code, verdict, timestamp)
// 2. Extracts signals (test_pass, coverage, judge_score)
// 3. Calculates reward
// 4. Stores training pairs (prompt, completion, reward)

// Weekly (via n8n workflow):
train_lora_adapter({
  minReward: 0.7, // Only learn from good runs
  maxPairs: 1000
})

// FREE agent:
// - Exports training pairs from SQLite to JSONL
// - Trains LoRA adapter
// - Creates new Ollama Modelfile with ADAPTER
// - Updates model (qwen2.5-coder:7b-v2)
// - Future runs use improved model
```

---

## 💡 **Key Benefits**

### 1. **No New Package**
- Leverage existing FREE and PAID agent infrastructure
- No need to duplicate MCP server setup
- Reuse existing tool registration, error handling, logging

### 2. **Shared Learning**
- Both FREE and PAID agents write to same SQLite database
- Learn from each other's successes and failures
- PAID agent's high-quality outputs train FREE agent's LoRA adapters

### 3. **Gradual Rollout**
- Add features incrementally to existing agents
- No breaking changes to current tools
- New tools are opt-in (quality gates only run if requested)

### 4. **Cost Optimization**
- FREE agent gets better over time (LoRA training)
- Need PAID agent less frequently as FREE agent improves
- Shared experience memory maximizes learning

---

## 🚀 **Implementation Phases**

### Phase 1: Core Pipeline (Weeks 1-2)
**Target:** `autonomous-agent-mcp` and `openai-worker-mcp`
- Add Design Card parser
- Add quality gates runner
- Add LLM Judge (Ollama for FREE, OpenAI for PAID)
- Add Synthesize-Execute-Critique-Refine loop
- Add new tools: `execute_with_quality_gates`, `judge_code_quality`, `refine_code`

### Phase 2: Repo-Native Generation (Weeks 3-4)
**Target:** `autonomous-agent-mcp` (shared with PAID)
- Add Project Brief auto-generator
- Add symbol graph builder
- Add few-shot example retriever
- Add new tool: `generate_project_brief`

### Phase 3: Learning Infrastructure (Weeks 5-6)
**Target:** `autonomous-agent-mcp` (shared DB with PAID)
- Add SQLite experience memory
- Add reward calculation
- Add learning loop (auto-record runs)

### Phase 4: Model Evolution (Weeks 7-8)
**Target:** `autonomous-agent-mcp` only
- Add SFT dataset export
- Add LoRA training pipeline
- Add Ollama adapter integration
- Add new tool: `train_lora_adapter`

### Phase 5: n8n Integration (Weeks 9-10)
**Target:** External workflows
- Create PR labeled trigger
- Create weekly LoRA training workflow
- Create docs caching workflow

### Phase 6: Advanced Features (Weeks 11-12)
**Target:** `autonomous-agent-mcp` (shared with PAID)
- Add impacted test selection
- Add flaky test detection
- Add refactor engine

---

## 📊 **Success Metrics**

**Phase 1 Complete:**
- ✅ `execute_with_quality_gates` tool works end-to-end
- ✅ Quality gates run and produce structured results
- ✅ LLM Judge evaluates code with scores
- ✅ Refine loop fixes issues automatically

**Phase 2 Complete:**
- ✅ Project Brief auto-generates from repo
- ✅ Generated code matches repo conventions
- ✅ Symbol graph retrieves relevant examples

**Phase 3 Complete:**
- ✅ Runs stored in SQLite after each execution
- ✅ Rewards calculated from signals
- ✅ Training pairs extracted

**Phase 4 Complete:**
- ✅ LoRA adapters trained from experience
- ✅ Ollama models updated with adapters
- ✅ FREE agent performance improves over time

**Phase 5 Complete:**
- ✅ n8n workflows trigger agent automatically
- ✅ Weekly LoRA training runs without manual intervention

**Phase 6 Complete:**
- ✅ Impacted tests run automatically
- ✅ Flaky tests detected and quarantined
- ✅ Refactor engine works safely

---

## 🎯 **Next Steps**

1. **Review existing agent structure**
   - Examine `packages/autonomous-agent-mcp/src/` layout
   - Examine `packages/openai-worker-mcp/src/` layout
   - Identify where to add new directories

2. **Install dependencies**
   - `zod` - Schema validation for Design Cards
   - `better-sqlite3` - Experience memory database
   - Language-specific tools (prettier, eslint, tsc, jest, etc.)

3. **Start Phase 1.1: Design Card Parser**
   - Create `packages/autonomous-agent-mcp/src/design-card/`
   - Implement parser and schema
   - Write unit tests
   - Replicate to `packages/openai-worker-mcp/`

**Ready to enhance the agents!** 🚀

