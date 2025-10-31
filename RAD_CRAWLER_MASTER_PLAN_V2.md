# RAD Crawler - Master Plan V2
**Revised with Proper Understanding**
**Created:** 2025-10-29
**Status:** READY FOR EXECUTION (after Phase 0 & Phase 1-7)
**Total Time:** 35-50 hours
**Cost:** $0 (free tiers + local Ollama)
**Priority:** Execute AFTER OpenAI MCP and Toolkit expansion

---

## ⚠️ **IMPORTANT: Execution Order**

**DO NOT START THIS UNTIL PHASE 0 AND PHASE 1-7 ARE COMPLETE!**

1. **Phase 0 (6-8h):** Complete OpenAI MCP (259 tools) ⚡ **DO THIS FIRST**
2. **Phase 1-7 (8-12h):** Robinson's Toolkit Expansion (1000+ tools) ⚡ **DO THIS SECOND**
3. **Phase 8+ (35-50h):** RAD Crawler System (this document) ⬅️ **YOU ARE HERE**

**See:** `HANDOFF_TO_NEW_AGENT.md` for complete execution order

---

## 🎯 **Vision: Self-Replicating RAD Crawler System**

Build a **self-replicating RAD crawler** that can spawn unlimited instances on demand, with:
- **Shared knowledge base by default** (ONE Neon DB = "Treasure Trove" for all AI agents)
- **Optional isolated databases** (for paying customers who need privacy)
- **Future: Dual-write capability** (customer DB + shared DB for discounted rate)
- **Fully autonomous spawning** (one command creates entire infrastructure)

---

## 🏗️ **Core Architecture**

### **Default: Shared Knowledge Base**
```
RAD Crawler Instances (Fly.io):
├─ Instance 1: Cortiware docs     ┐
├─ Instance 2: Robinson AI docs   ├─→ ONE Shared Neon DB
├─ Instance 3: Client project     │   (Your "Treasure Trove")
└─ Instance N: Public docs        ┘

Benefits:
- All AI agents share ONE massive knowledge base
- Exponential learning over time
- Cross-project insights
- Zero cost (Neon free tier)
```

### **Optional: Isolated Databases**
```
Special Customer RAD Crawler:
└─→ Separate Neon DB (private, isolated)

Use Cases:
- Customer pays for private/confidential crawling
- Compliance requirements (HIPAA, SOC 2)
- Data residency requirements
```

### **Future: Dual-Write**
```
Customer RAD Crawler:
├─→ Customer's Private DB (they pay for)
└─→ Your Shared DB (discounted rate for sharing)

Benefits:
- Customer gets private search
- You gain knowledge (with permission)
- Customer gets 30% discount
```

---

## 📋 **Phase Breakdown**

### **Phase 1: Foundation (8-12 hours)**
Build core RAD crawler with shared knowledge base.

#### **1.1: Neon Database Schema (1-2 hours)**
- Deploy RAD schema to shared Neon database
- Tables: `sources`, `documents`, `chunks`, `embeddings`, `searches`
- Add `instance_id` column (track which crawler instance created data)
- Safety limits (prevent overflow of 512MB free tier)

#### **1.2: Vercel API Package (3-4 hours)**
- 4 API endpoints: `/crawl`, `/search`, `/status`, `/health`
- Smart caching layer (instant repeat searches)
- Batch embedding generation (5-10x faster)
- Hybrid search ranking (keyword + semantic)

#### **1.3: Advanced Features (3-4 hours)**
- Incremental crawling (only re-crawl changed pages)
- Priority queue system (important pages first)
- Automatic chunking strategy (smart document splitting)
- Deduplication (no duplicate content)

#### **1.4: Testing & Documentation (2-3 hours)**
- Comprehensive smoke tests
- Deployment guide
- Bring-up checklist

**Deliverable:** Production-ready RAD crawler writing to shared DB

---

### **Phase 2: Self-Replication (6-8 hours)**
Enable autonomous spawning of RAD crawler instances.

#### **2.1: Spawn Orchestration (3-4 hours)**
Create `rad_spawn_crawler` tool that:
1. Builds Docker image (if not exists)
2. Pushes to Docker Hub
3. Creates Fly.io app
4. Configures environment variables (DB connection, instance ID)
5. Deploys crawler
6. Starts crawl job
7. Returns instance info (API URL, status)

#### **2.2: Instance Management (2-3 hours)**
- `rad_list_crawlers` - List all instances
- `rad_destroy_crawler` - Tear down instance
- `rad_configure_database` - Set DB routing (shared/isolated/dual)
- `rad_get_instance_status` - Health check

#### **2.3: Database Routing (1-2 hours)**
- Default: All instances write to shared DB
- Option: Create isolated DB for specific instance
- Future: Dual-write configuration

**Deliverable:** One-command RAD instance spawning

---

### **Phase 3: OpenAI Agent Builder Integration (4-6 hours)**
Leverage OpenAI's new agent tools to enhance RAD crawlers.

#### **3.1: Responses API Integration (2-3 hours)**
Replace current LLM calls with Responses API:
- Use `web_search` built-in tool for real-time crawling
- Use `file_search` built-in tool for document retrieval
- Stateful conversations (no manual history management)
- Built-in tool orchestration

#### **3.2: Agents SDK for Multi-Agent Coordination (2-3 hours)**
Create agent network:
- **Crawler Agent:** Web scraping, content extraction
- **Indexer Agent:** Embedding generation, chunking
- **Search Agent:** Query processing, result ranking
- **Coordinator Agent:** Routes between agents, handles handoffs

Benefits:
- Automatic agent loops (no manual orchestration)
- Built-in guardrails (prevent unsafe operations)
- Tracing (monitor workflows, debug issues)
- Separation of concerns (focused agents)

**Deliverable:** RAD crawler powered by OpenAI Agent Builder

---

### **Phase 4: Shared Knowledge "Treasure Trove" (3-4 hours)**
Extend RAD to store ALL agent activity in shared DB.

#### **4.1: Agent Log Schema (1-2 hours)**
Extend RAD schema:
- `agent_logs` table (Architect plans, Autonomous Agent code, etc.)
- `agent_conversations` table (full chat history)
- `agent_decisions` table (what worked, what didn't)
- All stored as `source.kind = 'agent-log'`

#### **4.2: Cross-Agent Knowledge Search (1-2 hours)**
- Agents search past work before creating new
- Architect finds similar plans
- Autonomous Agent finds similar code
- Credit Optimizer learns which tools work best

#### **4.3: Knowledge Graph (1 hour)**
- Link web docs ↔ code ↔ agent logs
- Cross-references between all knowledge types

**Deliverable:** All agents share ONE database, exponential learning

---

### **Phase 5: Redis Agent Coordination (2-3 hours)**
Prevent duplicate work across multiple agents/crawlers.

#### **5.1: Task Queue (1-2 hours)**
- Redis task queue (pending, active, completed, failed)
- Atomic task claiming (only one agent per task)
- Heartbeat monitoring (detect stuck agents)
- Task priority queue

#### **5.2: Multiple Crawler Coordination (1 hour)**
- Multiple RAD crawlers run simultaneously
- No duplicate crawling (check queue first)
- Distributed workload

**Deliverable:** True multi-agent coordination, no conflicts

---

### **Phase 6: Learning System for Credit Optimizer (3-4 hours)**
Track costs, learn patterns, optimize over time.

#### **6.1: Hybrid Storage (1-2 hours)**
- SQLite (local, fast writes): Token usage, costs, execution times
- Postgres (shared, Neon): Aggregated patterns, success rates, trends

#### **6.2: Analytics & Forecasting (1-2 hours)**
- `get_token_analytics` - Usage patterns and costs
- `get_cost_forecast` - Predict future costs
- `get_tool_recommendations` - Suggest best tool combinations
- `detect_cost_anomalies` - Alert on unusual spending

#### **6.3: Continuous Optimization (1 hour)**
- Learn which tool combinations work best
- Recommend budget optimizations
- Share learning across all agents

**Deliverable:** Agents get smarter and cheaper over time

---

### **Phase 7: Autonomous Setup Orchestration (2-3 hours)**
Zero-human-intervention deployment.

#### **7.1: One-Command Setup (2-3 hours)**
```bash
rad-spawn cortiware-docs --urls https://docs.cortiware.com

# Behind the scenes (autonomous):
✓ Creating Neon database...
✓ Deploying schema...
✓ Building Docker image...
✓ Pushing to Docker Hub...
✓ Creating Fly.io app...
✓ Deploying crawler...
✓ Starting crawl job...
✓ Done! API: https://rad-cortiware-docs.fly.dev
```

**Deliverable:** From zero to production in <10 minutes, fully automated

---

### **Phase 8: Isolated Database Support (2-3 hours)**
For paying customers who need privacy.

#### **8.1: Database Isolation (1-2 hours)**
- Create separate Neon DB for specific customer
- Configure crawler to write to isolated DB
- Strict tenant isolation (no cross-contamination)

#### **8.2: Billing & Quotas (1 hour)**
- Track usage per customer
- Enforce crawl limits
- Usage-based billing

**Deliverable:** Privacy-focused RAD for paying customers

---

### **Phase 9: Dual-Write Support (2-3 hours) - FUTURE**
Offer discounted rate for customers who share data.

#### **9.1: Dual-Write Configuration (1-2 hours)**
- Write to customer's private DB
- Also write to your shared DB
- Customer gets 30% discount

#### **9.2: Permission Management (1 hour)**
- Customer explicitly opts in
- Can revoke permission anytime
- Transparent data usage

**Deliverable:** Win-win: customer saves money, you gain knowledge

---

## 🔧 **Required Tools (From Comprehensive Toolkit Expansion)**

### **Already Have:**
- ✅ Neon tools (173 tools) - Database management
- ✅ Upstash Redis (140 tools, expanding to 250) - Job queues, coordination
- ✅ Vercel tools (150 tools) - API deployment

### **Need to Build:**
- ❌ Fly.io tools (60 tools) - Deploy crawler instances
- ❌ Docker tools (100 tools) - Build/push images
- ❌ OpenAI Agent Builder tools (20 tools) - Responses API, Agents SDK integration
- ❌ RAD Orchestration tools (10 tools) - Spawn, list, destroy, configure

**Total New Tools:** ~190 tools

---

## 📊 **Timeline & Priorities**

| Phase | Name | Time | Priority | Dependencies |
|-------|------|------|----------|--------------|
| 1 | Foundation | 8-12h | **HIGH** | None |
| 2 | Self-Replication | 6-8h | **HIGH** | Phase 1 |
| 3 | OpenAI Agent Builder | 4-6h | **HIGH** | Phase 1 |
| 4 | Shared Knowledge | 3-4h | **HIGH** | Phase 1 |
| 5 | Redis Coordination | 2-3h | **HIGH** | None |
| 6 | Learning System | 3-4h | **HIGH** | Phase 4 |
| 7 | Autonomous Setup | 2-3h | **MEDIUM** | Phases 1-6 |
| 8 | Isolated DB | 2-3h | **LOW** | Phase 1 |
| 9 | Dual-Write | 2-3h | **LOW** | Phase 8 |

**Total Core Work (Phases 1-7):** 28-40 hours  
**Total with Privacy Features (Phases 1-9):** 32-46 hours  
**Total Cost:** $0 (all free tiers)

---

## 🚀 **Execution Strategy**

### **Step 1: Build Comprehensive Toolkit (8-12 hours)**
From `COMPREHENSIVE_TOOLKIT_EXPANSION_SPEC.md`:
1. Upstash Redis expansion (140 → 250 tools)
2. Fly.io integration (0 → 60 tools)
3. Docker integration (0 → 100 tools)
4. OpenAI Agent Builder integration (0 → 20 tools)

### **Step 2: Execute RAD Phases (28-40 hours)**
1. Phase 1: Foundation
2. Phase 2: Self-Replication
3. Phase 3: OpenAI Agent Builder
4. Phase 4: Shared Knowledge
5. Phase 5: Redis Coordination
6. Phase 6: Learning System
7. Phase 7: Autonomous Setup

### **Step 3: Optional Privacy Features (4-6 hours)**
8. Phase 8: Isolated DB (when first paying customer)
9. Phase 9: Dual-Write (when offering discounts)

---

## 💰 **Business Model (Future)**

### **Tier 1: Free (Your Use)**
- Crawlers write to shared DB
- Builds your AI agent knowledge base
- $0 cost

### **Tier 2: Private Crawling ($99/mo)**
- Isolated database
- Complete privacy
- Compliance-ready

### **Tier 3: Shared Crawling ($69/mo - 30% discount)**
- Private DB + shared DB
- Customer saves money
- You gain knowledge

---

## 📝 **Files to Remove (Outdated)**

These files are superseded by this master plan:
- `RAD_CRAWLER_COMPLETE.md` ✅ REMOVED
- `RAD_CRAWLER_INTEGRATION_PLAN.md` ✅ REMOVED
- `RAD_EXTRACTION_COMPLETE.md` ✅ REMOVED
- `RAD_INTEGRATION_COMPLETE.md` ✅ REMOVED
- `RAD_REMAINING_WORK_SPEC.md` ✅ REMOVED
- `RAD_SYSTEM_AUDIT.md` ✅ REMOVED
- `QUICK_START_RAD.md` ✅ REMOVED
- `RAD_MASTER_PLAN.md` (old version) ✅ REMOVED

Keep only:
- `RAD_CRAWLER_MASTER_PLAN_V2.md` (this file)
- `RAD_PHASE_1_NEON_SCHEMA_DEPLOYMENT.md`
- `RAD_PHASE_2_VERCEL_API_PACKAGE.md`
- `RAD_PHASE_3_COMPREHENSIVE_TESTING.md`
- `RAD_PHASE_4_DOCUMENTATION_DEPLOYMENT.md`

---

## 📚 **Related Documentation**

- **`HANDOFF_TO_NEW_AGENT.md`** - Start here for complete context and execution order
- **`HANDOFF_COMPLETE_SUMMARY.md`** - Summary of what was completed
- **`OPENAI_MCP_COMPREHENSIVE_SPEC.md`** - Phase 0 (must complete first!)
- **`COMPREHENSIVE_TOOLKIT_EXPANSION_SPEC.md`** - Phase 1-7 (must complete second!)
- **`RAD_DOCUMENTATION_SUMMARY.md`** - Consolidated RAD documentation summary

---

**Ready to build the comprehensive toolkit, then execute RAD phases!**

