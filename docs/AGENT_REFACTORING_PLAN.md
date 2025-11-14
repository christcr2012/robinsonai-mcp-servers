# Agent Refactoring Plan - Make Agents Production-Ready

**Goal**: Make Free Agent MCP and Paid Agent MCP robust, reliable, self-contained packages that can be installed from npm without workspace dependencies.

## Current State Assessment

### Free Agent MCP (v0.14.1)
- ❌ Has `workspace:*` dependencies in devDependencies
- ❌ Imports from `@robinson_ai_systems/shared-llm`, `shared-pipeline`, `shared-utils`
- ❌ Imports from `@robinson_ai_systems/free-agent-core`
- ✅ Pattern learning crash fixed (v0.14.1)
- ⚠️ Patch generation issues (generates invalid patches)

### Paid Agent MCP (v0.12.2)
- ❌ Has `workspace:*` dependencies in devDependencies
- ❌ Imports from `@robinson_ai_systems/shared-llm`, `shared-pipeline`, `shared-utils`
- ✅ Has local copies of shared-pipeline and shared-llm in `src/shared/`
- ✅ Bundles free-agent-core via tsup with `@fa/core` alias
- ✅ ESM bundling fixed (v0.12.2 - externalized pg, fast-glob)
- ⚠️ Patch generation issues (generates patches for wrong files)

### Shared Packages
- `packages/free-agent-core` - Core agent logic (task orchestration, patch generation)
- `packages/shared-llm` - LLM client, model routing, MCP clients
- `packages/shared-pipeline` - Quality gates pipeline (judge, refine, synthesize)
- `packages/shared-utils` - Utility functions (diff generation, project brief)

### Legacy Packages
- `packages/credit-optimizer-mcp` - Needs assessment and potential retirement

## Architecture Decision: Option A (Self-Contained Packages)

Each published MCP package must be **fully self-contained**:
- ✅ All code under its own `src/` tree
- ✅ Only normal npm dependencies in `package.json`
- ❌ No `workspace:*` dependencies
- ❌ No imports from `../../shared-*` or other packages

## Phase Breakdown

### Phase 0: Lock in Architecture & Safety Rails ✅
- [x] Assess current state
- [x] Document architecture decision
- [ ] Create enforcement rules

### Phase 1: Clean Up Legacy Metrics & Credit Optimizer
- [ ] Normalize metrics to provider-agnostic
- [ ] Migrate legacy OpenAI worker tools
- [ ] Retire credit-optimizer-mcp

### Phase 2: Make Free & Paid Agent MCP Truly Self-Contained
- [ ] Inline shared-llm into both agents
- [ ] Inline shared-pipeline into both agents
- [ ] Inline shared-utils into both agents
- [ ] Inline free-agent-core into both agents
- [ ] Update all imports to local paths
- [ ] Remove workspace dependencies
- [ ] Fix build configs

### Phase 3: Fix Free Agent Runtime & Patch Generation
- [x] Pattern learning crash (fixed in v0.14.1)
- [ ] Patch generation issues (invalid patches)
- [ ] File selection logic
- [ ] Path validation

### Phase 4: Paid Agent Specific Hardening
- [ ] Confirm Agent Core usage
- [ ] Migrate legacy tools
- [x] Verify ESM bundling (fixed in v0.12.2)

### Phase 5: Integrate With Agent Cortex & RAD Crawler
- [ ] Ensure agents can call RAD tools
- [ ] Ensure agents can call Cortex tools
- [ ] Test basic CRUD operations

### Phase 6: Update & Sanity-Check All MCP Servers
- [ ] Build all packages
- [ ] Verify no workspace deps
- [ ] Test MCP connections

### Phase 7: Minimal Regression Tests
- [ ] Test Free Agent
- [ ] Test Paid Agent
- [ ] Test RAD + Cortex

### Phase 8: Document What Changed
- [ ] Create architecture docs
- [ ] Create publishing checklist

## Next Steps

1. Start with Phase 1: Clean up legacy metrics
2. Move to Phase 2: Make packages self-contained
3. Fix patch generation issues in Phase 3
4. Test everything in Phases 6-7
5. Document in Phase 8

