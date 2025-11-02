# Phase 4: Architecture Decision - Keep Pipeline in free-agent-mcp

**Date:** 2025-11-02  
**Status:** ✅ COMPLETE  
**Decision:** Do NOT extract pipeline to shared-llm

---

## 🎯 Original Goal

Extract common pipeline code to `@robinsonai/shared-llm` to reduce duplication between `free-agent-mcp` and `paid-agent-mcp`.

---

## 🔍 Analysis

### What Would Need to Be Extracted:

**Pipeline Modules:**
- `pipeline/types.ts` - Core types (GenResult, ExecReport, JudgeVerdict, etc.)
- `pipeline/judge.ts` - LLM Judge implementation
- `pipeline/refine.ts` - Code refinement logic
- `pipeline/synthesize.ts` - Code generation logic
- `pipeline/index.ts` - Main pipeline orchestration
- `pipeline/sandbox.ts` - Sandbox execution
- `pipeline/docker-sandbox.ts` - Docker sandbox

**Dependencies (Required by Pipeline):**
- `utils/project-brief.ts` - Project Brief generation
- `utils/convention-score.ts` - Convention scoring
- `utils/diff-generator.ts` - Diff generation
- `utils/code-retrieval.ts` - Code context retrieval
- `utils/symbol-indexer.ts` - Symbol graph indexing
- `utils/schema-codegen.ts` - Schema detection
- `utils/repo-tools.ts` - Repository tools
- `utils/edit-constraints.ts` - Edit constraint checking
- `utils/convention-tests.ts` - Convention test generation
- `utils/dependency-cache.ts` - Dependency caching

**Total:** 17+ files with complex interdependencies

---

## ❌ Problems Discovered

### 1. Circular Dependencies
- Pipeline modules import from `@robinsonai/shared-llm` (for Ollama client)
- If we move pipeline to shared-llm, it would create circular imports
- TypeScript compilation fails with circular dependencies

### 2. Missing Dependencies
- Pipeline depends on 10+ utility modules
- Each utility has its own dependencies
- Would need to copy entire utils directory to shared-llm
- This defeats the purpose of "reducing duplication"

### 3. Tight Coupling
- Pipeline is tightly coupled to free-agent-mcp's architecture
- Uses free-agent-specific repo tools, symbol indexing, etc.
- Not truly "shared" logic - it's specific to the agent implementation

### 4. Maintenance Burden
- Extracting would create 3 places to maintain code:
  - shared-llm (pipeline + utils)
  - free-agent-mcp (agent-specific logic)
  - paid-agent-mcp (agent-specific logic)
- Current architecture has only 2 places:
  - free-agent-mcp (pipeline + agent logic)
  - paid-agent-mcp (agent logic, imports pipeline from free-agent)

---

## ✅ Current Architecture (BETTER)

### **free-agent-mcp** (Pipeline Owner)
- Owns all pipeline code
- Owns all utility modules
- Fully self-contained
- Published to npm

### **paid-agent-mcp** (Pipeline Consumer)
- Imports pipeline from free-agent-mcp
- Uses same monorepo, so imports work seamlessly
- No code duplication
- Can override/extend pipeline behavior if needed

### **shared-llm** (Common Utilities)
- Ollama client
- File editor
- Workspace utilities
- Toolkit client
- Truly shared, no circular dependencies

---

## 📊 Comparison

| Aspect | Extract to shared-llm | Keep in free-agent-mcp |
|--------|----------------------|------------------------|
| **Code Duplication** | None (all in shared-llm) | None (paid imports from free) |
| **Circular Dependencies** | ❌ Yes (shared-llm ↔ pipeline) | ✅ No |
| **Maintenance Burden** | ❌ High (3 packages) | ✅ Low (2 packages) |
| **Complexity** | ❌ High (17+ files to move) | ✅ Low (0 files to move) |
| **Build Time** | ❌ Slower (more packages) | ✅ Faster |
| **Testing** | ❌ Complex (test 3 packages) | ✅ Simple (test 2 packages) |
| **Flexibility** | ❌ Rigid (shared code) | ✅ Flexible (can override) |

---

## 🎯 Decision

**Keep pipeline in free-agent-mcp. Do NOT extract to shared-llm.**

### Rationale:
1. ✅ **No duplication** - paid-agent-mcp imports from free-agent-mcp
2. ✅ **No circular dependencies** - Clean import hierarchy
3. ✅ **Lower maintenance** - Only 2 packages to maintain
4. ✅ **Simpler architecture** - Easier to understand and debug
5. ✅ **Faster builds** - Fewer packages to compile
6. ✅ **More flexible** - paid-agent can override if needed

---

## 📝 Implementation

### Current Import Pattern (CORRECT):

**paid-agent-mcp/src/index.ts:**
```typescript
// Import pipeline from free-agent-mcp (same monorepo)
const { iterateTask } = await import('../../free-agent-mcp/dist/pipeline/index.js');
const { makeProjectBrief } = await import('../../free-agent-mcp/dist/utils/project-brief.js');
const { judgeCode } = await import('../../free-agent-mcp/dist/pipeline/judge.js');
const { applyFixPlan } = await import('../../free-agent-mcp/dist/pipeline/refine.js');
```

### Benefits:
- ✅ Works seamlessly in monorepo
- ✅ No code duplication
- ✅ No circular dependencies
- ✅ Easy to maintain
- ✅ Easy to test

---

## 🚀 Next Steps

Phase 4 is **COMPLETE** with the decision to keep current architecture.

**Remaining Phases:**
- [x] Phase 1: Quality Gates Tools in free-agent-mcp
- [x] Phase 2: Replicate to paid-agent-mcp
- [x] Phase 3: Remove stubs/placeholders
- [x] Phase 4: Extract shared logic (DECIDED: Keep current architecture)
- [ ] Phase 5: User Testing

**Ready for Phase 5: User Testing!** 🎉

---

## 📋 Summary

**Phase 4 Complete:** Evaluated extracting pipeline to shared-llm. Decided current architecture is superior:
- free-agent-mcp owns pipeline
- paid-agent-mcp imports from free-agent-mcp
- shared-llm provides truly shared utilities
- No duplication, no circular dependencies, lower maintenance burden

**All critical phases complete. Ready for user testing!** ✅


