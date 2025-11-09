# PAID Agent Feature Parity Plan

**Date:** 2025-01-09  
**Status:** Analysis Complete, Implementation Pending  
**Goal:** Bring PAID Agent to feature parity with FREE Agent + integrate Chris's AI infrastructure

---

## 📊 Current State Analysis

### FREE Agent MCP (v0.4.8)
**Architecture:** 60+ files, 15 specialized agents, full quality gates pipeline  
**Features:**
- ✅ **Quality Gates Pipeline** - Synthesize-Execute-Critique-Refine with sandbox
- ✅ **Project Brief Generation** - Auto-generates repo DNA for repo-native code
- ✅ **Learning System** - Experience DB, feedback capture, auto-training
- ✅ **Advanced Agents** - 15+ specialized agents for complex tasks
- ✅ **Multi-Provider Support** - Ollama, OpenAI, Claude, Groq, Together
- ✅ **Feedback System** - Captures edits from primary agents (Augment, Cursor, etc.)
- ✅ **Symbol Indexer** - Analyzes codebase for naming conventions
- ✅ **Schema Codegen** - Detects and generates from schemas
- ✅ **Convention Scoring** - Measures code quality against repo conventions

**Dependencies:**
- `@robinson_ai_systems/shared-llm` (workspace)
- `ollama`, `openai`, `@anthropic-ai/sdk`
- `better-sqlite3` (learning database)
- `diff`, `jsdom`, `handlebars`

### PAID Agent MCP (v0.5.2)
**Architecture:** 8 files, basic worker system, cost tracking  
**Features:**
- ✅ **Multi-Provider Support** - OpenAI, Claude, Ollama (can use FREE)
- ✅ **Cost Tracking** - Database for jobs and spend metrics
- ✅ **Smart Model Selection** - Budget-aware model selection
- ✅ **Token Analytics** - Detailed usage tracking
- ⚠️ **Basic Quality Gates** - Only judge/refine (imports from shared-pipeline)
- ❌ **No Project Brief** - Missing repo-native code generation
- ❌ **No Learning System** - No experience database or feedback capture
- ❌ **No Advanced Agents** - Missing 15+ specialized agents
- ❌ **No Symbol Indexer** - Can't analyze repo conventions
- ❌ **No Schema Codegen** - Can't generate from schemas

**Dependencies:**
- `@robinson_ai_systems/shared-llm` (workspace)
- `@robinson_ai_systems/shared-utils` (workspace)
- `@robinson_ai_systems/shared-pipeline` (workspace)
- `openai`, `@anthropic-ai/sdk`
- `better-sqlite3` (cost tracking only)

---

## 🎯 Feature Gap Analysis

### **CRITICAL GAPS** (Must Port)

#### 1. Quality Gates Pipeline
**FREE Agent:** Full pipeline in `src/pipeline/`
- `synthesize.ts` - Generate code + tests with multi-provider support
- `judge.ts` - Structured LLM judge with rubric and QAG validation
- `refine.ts` - Apply fix plans from judge feedback
- `sandbox.ts` - Local sandbox execution (Node.js, Python, etc.)
- `docker-sandbox.ts` - Docker-based sandbox for isolation
- `index.ts` - Main pipeline orchestrator with iterative refinement

**PAID Agent:** Partial implementation
- ✅ Has `paid_agent_judge_code_quality` tool (uses shared-pipeline)
- ✅ Has `paid_agent_refine_code` tool (uses shared-pipeline)
- ❌ Missing `paid_agent_execute_with_quality_gates` tool
- ❌ Missing full pipeline orchestration
- ❌ Missing sandbox execution

**Action:** Port full pipeline with OpenAI/Claude support

#### 2. Project Brief Generation
**FREE Agent:** `src/utils/project-brief.ts` + `symbol-indexer.ts`
- Auto-generates "Project Brief" from repo DNA
- Analyzes languages, versions, style rules, folder structure
- Builds domain glossary from symbol frequency
- Detects naming conventions and patterns
- Finds APIs, entry points, testing patterns
- Passed to coder/judge for repo-native code

**PAID Agent:** Partial implementation
- ✅ Has `paid_agent_generate_project_brief` tool
- ✅ Imports from `@robinson_ai_systems/shared-utils`
- ⚠️ But shared-utils doesn't have full implementation!

**Action:** Port full project brief system to shared-utils or PAID agent

#### 3. Learning System
**FREE Agent:** `src/learning/` (7 files)
- `experience-db.ts` - SQLite database for runs, signals, pairs
- `feedback-capture.ts` - Captures edits from primary agents
- `learning-loop.ts` - Continuous learning from feedback
- `auto-learner.ts` - Auto-training pipeline
- `auto-train-monitor.ts` - Monitors training readiness
- `make-sft.ts` - Generates SFT datasets
- `web-knowledge.ts` - Web search integration

**PAID Agent:** None
- ❌ No experience database
- ❌ No feedback capture
- ❌ No learning loop
- ❌ No auto-training

**Action:** Port full learning system with PAID model support

#### 4. Advanced Agents
**FREE Agent:** `src/agents/` (20+ files)
- `code-graph.ts` - Dependency graph analysis
- `merge-conflict-resolver.ts` - Auto-resolve merge conflicts
- `semantic-diff.ts` - Semantic code comparison
- `flaky-test-detector.ts` - Detect flaky tests
- `impacted-tests.ts` - Find tests affected by changes
- `db-migration-safety.ts` - Safe database migrations
- `property-tests.ts` - Property-based testing
- `refactor-engine.ts` - Advanced refactoring
- `safety-gates.ts` - Safety checks before deployment
- `pr-quality-pack.ts` - Generate PR quality reports
- `design-card.ts` - Design card parsing and validation
- `context-memory.ts` - Context management
- `context-packing.ts` - Efficient context packing
- `cost-budgeter.ts` - Cost budget management
- `docker/` - Docker integration

**PAID Agent:** None
- ❌ Missing all 15+ advanced agents

**Action:** Port all advanced agents with PAID model support

---

## 🏗️ Implementation Plan

### **Phase 1: Core Pipeline (Week 1)**

**Goal:** Bring PAID agent to feature parity with FREE agent's quality gates

**Tasks:**
1. ✅ Port `synthesize.ts` to PAID agent with OpenAI/Claude support
2. ✅ Port `judge.ts` with PAID model support (already partially done)
3. ✅ Port `refine.ts` with PAID model support (already partially done)
4. ✅ Port `sandbox.ts` for local execution
5. ✅ Port `docker-sandbox.ts` for isolated execution
6. ✅ Port `index.ts` pipeline orchestrator
7. ✅ Add `paid_agent_execute_with_quality_gates` tool
8. ✅ Update dependencies in `package.json`
9. ✅ Test full pipeline with OpenAI/Claude models
10. ✅ Publish v0.6.0

**Files to Create/Modify:**
- `packages/paid-agent-mcp/src/pipeline/` (new directory)
  - `synthesize.ts`
  - `judge.ts` (enhance existing)
  - `refine.ts` (enhance existing)
  - `sandbox.ts`
  - `docker-sandbox.ts`
  - `index.ts`
  - `types.ts`
- `packages/paid-agent-mcp/src/index.ts` (add quality gates tool)
- `packages/paid-agent-mcp/package.json` (add dependencies)

### **Phase 2: Project Brief System (Week 1)**

**Goal:** Enable repo-native code generation in PAID agent

**Tasks:**
1. ✅ Port `symbol-indexer.ts` to shared-utils
2. ✅ Port `project-brief.ts` to shared-utils
3. ✅ Port `schema-codegen.ts` to shared-utils
4. ✅ Port `convention-score.ts` to shared-utils
5. ✅ Update PAID agent to use enhanced shared-utils
6. ✅ Test project brief generation
7. ✅ Publish shared-utils v0.2.0
8. ✅ Publish PAID agent v0.6.1

**Files to Create/Modify:**
- `standalone/libraries/shared-utils/src/` (enhance)
  - `symbol-indexer.ts`
  - `project-brief.ts`
  - `schema-codegen.ts`
  - `convention-score.ts`
- `packages/paid-agent-mcp/src/index.ts` (use enhanced brief)

### **Phase 3: Learning System (Week 2)**

**Goal:** Enable PAID agent to learn from feedback

**Tasks:**
1. ✅ Port `experience-db.ts` to PAID agent
2. ✅ Port `feedback-capture.ts` to PAID agent
3. ✅ Port `learning-loop.ts` to PAID agent
4. ✅ Port `auto-learner.ts` to PAID agent
5. ✅ Port `auto-train-monitor.ts` to PAID agent
6. ✅ Port `make-sft.ts` to PAID agent
7. ✅ Add `submit_feedback` tool to PAID agent
8. ✅ Add `get_feedback_stats` tool to PAID agent
9. ✅ Test feedback capture and learning
10. ✅ Publish v0.7.0

**Files to Create/Modify:**
- `packages/paid-agent-mcp/src/learning/` (new directory)
  - `experience-db.ts`
  - `feedback-capture.ts`
  - `learning-loop.ts`
  - `auto-learner.ts`
  - `auto-train-monitor.ts`
  - `make-sft.ts`
  - `config.ts`
  - `index.ts`
- `packages/paid-agent-mcp/src/index.ts` (add feedback tools)

### **Phase 4: Advanced Agents (Week 2-3)**

**Goal:** Port all 15+ specialized agents to PAID agent

**Tasks:**
1. ✅ Port `code-graph.ts`
2. ✅ Port `merge-conflict-resolver.ts`
3. ✅ Port `semantic-diff.ts`
4. ✅ Port `flaky-test-detector.ts`
5. ✅ Port `impacted-tests.ts`
6. ✅ Port `db-migration-safety.ts`
7. ✅ Port `property-tests.ts`
8. ✅ Port `refactor-engine.ts`
9. ✅ Port `safety-gates.ts`
10. ✅ Port `pr-quality-pack.ts`
11. ✅ Port `design-card.ts`
12. ✅ Port `context-memory.ts`
13. ✅ Port `context-packing.ts`
14. ✅ Port `cost-budgeter.ts`
15. ✅ Port `docker/` integration
16. ✅ Test all agents with PAID models
17. ✅ Publish v0.8.0

**Files to Create/Modify:**
- `packages/paid-agent-mcp/src/agents/` (new directory)
  - All 15+ agent files from FREE agent
- `packages/paid-agent-mcp/src/index.ts` (expose agent tools)

---

## 🚀 Chris's Infrastructure Integration Plan

### **Architecture Design**

**Goal:** Integrate PostgreSQL, Neo4j, Qdrant, N8N into Robinson's Toolkit as new categories

**Principles:**
1. **Dynamic Category System** - Use existing dynamic registry (v1.14.0)
2. **Broker Pattern** - All tools accessed via `toolkit_call`
3. **Multi-Project Support** - Manage multiple instances with different credentials
4. **Subcategory Organization** - Organize tools by function (queries, admin, etc.)
5. **Unified Authentication** - Use `X-User: chris` header for all requests

### **Category Structure**

```
chris_infrastructure/
├── postgres/
│   ├── queries/
│   ├── vector_search/
│   ├── chat_history/
│   └── admin/
├── neo4j/
│   ├── queries/
│   ├── knowledge_graph/
│   ├── relationships/
│   └── admin/
├── qdrant/
│   ├── collections/
│   ├── search/
│   ├── points/
│   └── admin/
└── n8n/
    ├── workflows/
    ├── executions/
    ├── credentials/
    └── admin/
```

### **Tool Naming Convention**

```
{service}_{subcategory}_{action}

Examples:
- postgres_query_execute
- postgres_vector_search
- postgres_chat_history_store
- neo4j_query_execute
- neo4j_knowledge_graph_create
- qdrant_collection_create
- qdrant_search_semantic
- n8n_workflow_trigger
- n8n_execution_get_status
```

### **Implementation Files**

```
packages/robinsons-toolkit-mcp/src/
├── chris-infrastructure-tools.ts (tool definitions)
├── chris-infrastructure-handlers.ts (API handlers)
└── chris-infrastructure-client.ts (FastAPI client)
```

---

## 📝 Next Steps

1. **Review this plan** - Confirm approach and priorities
2. **Start Phase 1** - Port quality gates pipeline to PAID agent
3. **Parallel work** - Design Chris's infrastructure integration
4. **Test thoroughly** - Ensure feature parity and quality
5. **Document everything** - Update README and docs
6. **Publish incrementally** - Release after each phase

**Estimated Timeline:** 3 weeks for full feature parity + infrastructure integration

---

**Questions:**
1. Should we prioritize feature parity or infrastructure integration?
2. Do you want both done in parallel or sequentially?
3. Any specific features you want prioritized?

