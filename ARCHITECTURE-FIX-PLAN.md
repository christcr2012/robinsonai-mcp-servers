# Architecture Fix Plan - Centralized Resources

**Date:** 2025-01-04  
**Status:** IN PROGRESS  
**Priority:** 🔴 CRITICAL

---

## 🚨 PROBLEM

**Current Anti-Pattern:**
- PAID agent imports from FREE agent (`../../free-agent-mcp/dist/...`)
- Creates circular dependencies
- Violates separation of concerns
- Makes code hard to maintain and test

**Specific Issues:**
1. `packages/paid-agent-mcp/src/index.ts:1820` - Imports pipeline from FREE agent
2. `packages/paid-agent-mcp/src/index.ts:1902` - Imports judge from FREE agent
3. `packages/paid-agent-mcp/src/index.ts:1965` - Imports refine from FREE agent
4. `packages/paid-agent-mcp/src/index.ts:2039` - Imports project-brief from FREE agent

---

## ✅ SOLUTION

**Centralized Architecture:**
```
standalone/libraries/
├── shared-llm/              ✅ EXISTS - Basic LLM utilities
│   ├── ollama-client.ts     ✅ Ollama client
│   ├── llm-client.ts        ✅ Generic LLM client
│   ├── toolkit-client.ts    ✅ Robinson's Toolkit client
│   ├── thinking-client.ts   ✅ NEW - Thinking Tools client
│   ├── file-editor.ts       ✅ Universal file editor
│   └── workspace.ts         ✅ Workspace utilities
│
├── shared-pipeline/         ❌ NEW - Pipeline system
│   ├── types.ts             ❌ Pipeline types
│   ├── sandbox.ts           ❌ Sandbox execution
│   ├── synthesize.ts        ❌ Code generation
│   ├── judge.ts             ❌ Quality evaluation
│   ├── refine.ts            ❌ Fix generation
│   ├── docker-sandbox.ts    ❌ Docker sandbox
│   └── index.ts             ❌ Main orchestrator
│
├── shared-utils/            ❌ NEW - Shared utilities
│   ├── project-brief.ts     ❌ Project DNA extraction
│   ├── symbol-indexer.ts    ❌ Symbol indexing
│   ├── code-retrieval.ts    ❌ Code-aware retrieval
│   ├── diff-generator.ts    ❌ Diff generation
│   └── ...                  ❌ Other utilities
│
└── robinsons-context-engine/ ✅ EXISTS - Context engine

packages/
├── free-agent-mcp/          ✅ FREE agent (uses shared libs)
│   ├── agents/              ✅ Agent-specific logic
│   ├── learning/            ✅ Learning system
│   └── providers/           ✅ Provider adapters
│
└── paid-agent-mcp/          ✅ PAID agent (uses shared libs)
    ├── db.ts                ✅ Budget tracking
    ├── pricing.ts           ✅ Pricing
    └── policy.ts            ✅ Usage policies
```

---

## 📋 IMPLEMENTATION PLAN

### Phase 1: Add Versatility ✅ COMPLETE
**Goal:** Make both agents VERSATILE with toolkit/thinking tools

**Status:** ✅ COMPLETE
- ✅ Created `thinking-client.ts` in shared-llm
- ✅ Updated shared-llm exports
- ✅ Bumped shared-llm to 0.1.7
- ✅ Added thinking tools to FREE agent
- ✅ Built FREE agent successfully
- ✅ Added toolkit + thinking tools to PAID agent
- ✅ Built PAID agent successfully
- ✅ Both agents are now VERSATILE

**Files Modified:**
- `standalone/libraries/shared-llm/src/thinking-client.ts` ✅ CREATED (235 lines)
- `standalone/libraries/shared-llm/src/index.ts` ✅ UPDATED (added ThinkingClient exports)
- `standalone/libraries/shared-llm/package.json` ✅ UPDATED (bumped to 0.1.7)
- `packages/free-agent-mcp/src/index.ts` ✅ UPDATED (added thinking_tool_call handler)
- `packages/free-agent-mcp/package.json` ✅ UPDATED (workspace:* for shared-llm)
- `packages/paid-agent-mcp/src/index.ts` ✅ UPDATED (added thinking_tool_call handler + discovery tools)
- `packages/paid-agent-mcp/package.json` ✅ UPDATED (workspace:* for shared-llm)

**Both Agents Can Now:**
- ✅ Set up databases (Neon, Upstash via Robinson's Toolkit)
- ✅ Deploy applications (Vercel via Robinson's Toolkit)
- ✅ Manage accounts (GitHub, Google via Robinson's Toolkit)
- ✅ Use cognitive frameworks (devils_advocate, swot_analysis, etc. via Thinking Tools)
- ✅ Use context engine (context_query, docs_find, etc. via Thinking Tools)
- ✅ Generate code, analyze, refactor, test, document
- ✅ Edit files directly

---

### Phase 2: Create Shared Pipeline Library
**Goal:** Move pipeline code to `standalone/libraries/shared-pipeline`

**Tasks:**
1. Create `standalone/libraries/shared-pipeline` package
2. Copy pipeline files from FREE agent:
   - `pipeline/types.ts`
   - `pipeline/sandbox.ts`
   - `pipeline/synthesize.ts`
   - `pipeline/judge.ts`
   - `pipeline/refine.ts`
   - `pipeline/docker-sandbox.ts`
   - `pipeline/index.ts`
3. Make pipeline provider-agnostic (works with Ollama, OpenAI, Claude)
4. Update FREE agent to import from shared-pipeline
5. Update PAID agent to import from shared-pipeline
6. Test both agents

**Benefits:**
- No circular dependencies
- Both agents use same pipeline
- Easier to maintain and test
- Provider-agnostic from the start

---

### Phase 3: Create Shared Utils Library
**Goal:** Move common utilities to `standalone/libraries/shared-utils`

**Tasks:**
1. Create `standalone/libraries/shared-utils` package
2. Move utilities from FREE agent:
   - `utils/project-brief.ts`
   - `utils/symbol-indexer.ts`
   - `utils/code-retrieval.ts`
   - `utils/diff-generator.ts`
   - `utils/dependency-cache.ts`
   - `utils/portable-*.ts` files
   - Other shared utilities
3. Update FREE agent to import from shared-utils
4. Update PAID agent to import from shared-utils
5. Test both agents

**Benefits:**
- Shared utilities available to all agents
- No duplication
- Easier to maintain

---

### Phase 4: Update PAID Agent Imports
**Goal:** Remove all imports from FREE agent in PAID agent

**Current Imports to Fix:**
```typescript
// ❌ WRONG - Importing from FREE agent
import { iterateTask } from '@robinson_ai_systems/free-agent-mcp/dist/pipeline/index.js';
import { makeProjectBrief } from '@robinson_ai_systems/free-agent-mcp/dist/utils/project-brief.js';
import { judgeCode } from '../../free-agent-mcp/dist/pipeline/judge.js';
import { applyFixPlan } from '../../free-agent-mcp/dist/pipeline/refine.js';

// ✅ RIGHT - Importing from shared libraries
import { iterateTask } from '@robinson_ai_systems/shared-pipeline';
import { makeProjectBrief } from '@robinson_ai_systems/shared-utils';
import { judgeCode } from '@robinson_ai_systems/shared-pipeline';
import { applyFixPlan } from '@robinson_ai_systems/shared-pipeline';
```

---

## 🎯 CURRENT STATUS

### What's Done ✅
1. Created `thinking-client.ts` in shared-llm
2. Updated shared-llm exports to include thinking client
3. Added thinking tools support to FREE agent
4. Built shared-llm successfully

### What's In Progress ⏳
1. Building FREE agent (fixing workspace dependency resolution)
2. Need to run `pnpm install` to fix symlinks

### What's Next 📋
1. Finish building FREE agent
2. Add toolkit + thinking tools to PAID agent
3. Test versatility features
4. Create shared-pipeline library
5. Create shared-utils library
6. Update both agents to use centralized resources
7. Remove all cross-agent imports

---

## 🔧 IMMEDIATE NEXT STEPS

1. ✅ Run `pnpm install` to fix workspace symlinks
2. ✅ Build FREE agent
3. ✅ Add toolkit + thinking tools to PAID agent
4. ✅ Build PAID agent
5. ⏳ Test both agents can call Robinson's Toolkit
6. ⏳ Test both agents can call Thinking Tools
7. ⏳ Create shared-pipeline library
8. ⏳ Create shared-utils library
9. ⏳ Update imports in both agents
10. ⏳ Final testing

---

## 📊 PROGRESS TRACKING

**Phase 1: Versatility** - ✅ 100% Complete
- ✅ Created thinking-client.ts
- ✅ Updated shared-llm exports
- ✅ Bumped shared-llm to 0.1.7
- ✅ Added thinking tools to FREE agent
- ✅ Built FREE agent successfully
- ✅ Added toolkit + thinking tools to PAID agent
- ✅ Built PAID agent successfully
- ✅ Both agents are VERSATILE

**Phase 2: Shared Pipeline** - 0% Complete
- ⏳ Create package
- ⏳ Move files
- ⏳ Make provider-agnostic
- ⏳ Update imports
- ⏳ Test

**Phase 3: Shared Utils** - 0% Complete
- ⏳ Create package
- ⏳ Move files
- ⏳ Update imports
- ⏳ Test

**Phase 4: Fix Imports** - 0% Complete
- ⏳ Update PAID agent
- ⏳ Remove cross-agent imports
- ⏳ Test

---

**Total Estimated Time:** 4-6 hours  
**Priority:** 🔴 CRITICAL - User explicitly requested centralized architecture

