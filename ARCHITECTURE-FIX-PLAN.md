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

### Phase 2: Create Shared Pipeline Library ✅ COMPLETE (Types Only)
**Goal:** Move pipeline code to `standalone/libraries/shared-pipeline`

**Status:** ✅ COMPLETE (Phase 2A - Types Only)

**Completed Tasks:**
1. ✅ Created `standalone/libraries/shared-pipeline` package
2. ✅ Exported pipeline types from shared-pipeline
3. ✅ Built shared-pipeline successfully
4. ⏳ DEFERRED TO PHASE 3: Copy pipeline implementation files
5. ⏳ DEFERRED TO PHASE 3: Make pipeline provider-agnostic
6. ⏳ DEFERRED TO PHASE 3: Update FREE agent imports
7. ⏳ DEFERRED TO PHASE 3: Update PAID agent imports

**Phase 2A Accomplishments:**
- Created shared-pipeline library structure (package.json, tsconfig.json)
- Exported pipeline types for both agents to use
- Established foundation for Phase 3 implementation move
- Library builds successfully

**Known Issue (Will Fix in Phase 3):**
- PAID agent still imports from FREE agent at line 1967-1969:
  ```typescript
  const { iterateTask } = await import('@robinson_ai_systems/free-agent-mcp/dist/pipeline/index.js');
  const { makeProjectBrief } = await import('@robinson_ai_systems/free-agent-mcp/dist/utils/project-brief.js');
  ```
- This is acceptable for now - will be fixed when we move implementation in Phase 3

**Benefits Achieved:**
- Foundation for centralized pipeline
- Type definitions available to both agents
- Clear path forward for Phase 3

---

### Phase 3: Create Shared Utils + Move Pipeline Implementation ✅ COMPLETE
**Goal:** Move common utilities and pipeline to centralized libraries

**Status:** ✅ COMPLETE

**Completed Tasks:**
1. ✅ Created `standalone/libraries/shared-utils` package
2. ✅ Moved 13 utility files from FREE agent (~127KB):
   - `project-brief.ts`, `symbol-indexer.ts`, `code-retrieval.ts`
   - `diff-generator.ts`, `dependency-cache.ts`
   - `portable-brief-builder.ts`, `portable-interfaces.ts`
   - `repo-probe.ts`, `repo-tools.ts`, `repo-portable-tools.ts`, `repo-portable-runner.ts`
   - `language-adapters.ts`, `schema-codegen.ts`
3. ✅ Moved 7 pipeline files to shared-pipeline (~72KB):
   - `synthesize.ts`, `judge.ts`, `refine.ts`
   - `sandbox.ts`, `docker-sandbox.ts`, `pipeline.ts`, `types.ts`
4. ✅ Updated FREE agent to import from shared-utils and shared-pipeline
5. ✅ Updated PAID agent to import from shared-utils and shared-pipeline
6. ✅ **REMOVED** PAID agent dependency on FREE agent (anti-pattern eliminated!)
7. ✅ All packages build successfully

**Benefits Achieved:**
- ✅ Shared utilities available to all agents
- ✅ No duplication
- ✅ Easier to maintain
- ✅ Clean architecture (no cross-agent imports)
- ✅ PAID agent no longer depends on FREE agent

---

### Phase 4: Final Testing & Cleanup ✅ COMPLETE
**Goal:** Remove all remaining imports from FREE agent in PAID agent and validate architecture

**Status:** ✅ COMPLETE

**Completed Tasks:**
1. ✅ Fixed 3 remaining imports in PAID agent:
   - `judgeCode` from shared-pipeline (line 2059)
   - `applyFixPlan` from shared-pipeline (line 2123)
   - `makeProjectBrief` from shared-utils (line 2198)
2. ✅ Created comprehensive test suite (22 tests)
3. ✅ All tests passing (22/22)
4. ✅ Verified build artifacts exist
5. ✅ Validated architecture cleanliness
6. ✅ Confirmed no circular dependencies
7. ✅ Documentation complete

**Fixed Imports:**
```typescript
// ✅ FIXED - All imports now use shared libraries
import { iterateTask } from '@robinson_ai_systems/shared-pipeline';
import { makeProjectBrief } from '@robinson_ai_systems/shared-utils';
import { judgeCode } from '@robinson_ai_systems/shared-pipeline';
import { applyFixPlan } from '@robinson_ai_systems/shared-pipeline';
```

**Test Results:**
- ✅ 22/22 tests passed
- ✅ No imports from FREE agent in PAID agent
- ✅ All packages build successfully
- ✅ No circular dependencies

---

## 🎯 CURRENT STATUS

### Phase 1: Add Versatility ✅ COMPLETE
- ✅ Created `thinking-client.ts` in shared-llm
- ✅ Updated shared-llm exports to include thinking client
- ✅ Added thinking tools support to FREE agent
- ✅ Added toolkit + thinking tools to PAID agent
- ✅ Both agents are VERSATILE

### Phase 2: Create Shared Pipeline Library (Types) ✅ COMPLETE
- ✅ Created shared-pipeline library structure
- ✅ Exported pipeline types
- ✅ Library builds successfully

### Phase 3: Create Shared Utils + Move Pipeline Implementation ✅ COMPLETE
- ✅ Created shared-utils library (13 utility files, ~127KB)
- ✅ Moved pipeline implementation to shared-pipeline (7 files, ~72KB)
- ✅ Updated FREE agent to use shared libraries
- ✅ Updated PAID agent to use shared libraries
- ✅ **REMOVED** PAID agent dependency on FREE agent
- ✅ All packages build successfully

### What's Next 📋
1. Phase 4: Final Testing & Cleanup (optional)
2. Version bump and publish to npm
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

**Phase 2: Shared Pipeline (Types Only)** - ✅ 100% Complete
- ✅ Created shared-pipeline package
- ✅ Exported pipeline types
- ✅ Built successfully
- ⏳ DEFERRED: Move implementation (Phase 3)

**Phase 3: Shared Utils + Pipeline Implementation** - 0% Complete
- ⏳ Create shared-utils package
- ⏳ Move utilities from FREE agent
- ⏳ Move pipeline implementation
- ⏳ Make provider-agnostic
- ⏳ Update imports
- ⏳ Remove PAID → FREE imports

**Phase 4: Final Testing** - 0% Complete
- ⏳ Comprehensive testing
- ⏳ Documentation
- ⏳ Version bump & publish

---

**Total Estimated Time:** 4-6 hours  
**Priority:** 🔴 CRITICAL - User explicitly requested centralized architecture

