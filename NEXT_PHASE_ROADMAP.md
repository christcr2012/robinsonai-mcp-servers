# Next Phase Roadmap

## 🎯 What to Build Next

Based on the autonomous build, here's a clear roadmap for future enhancements.

---

## Phase 2: High-Priority MCP-Compatible Enhancements

**Estimated Effort:** ~800 lines, 1-2 sessions  
**Impact:** High  
**Complexity:** Medium

### 1. Property & Fuzz Tests (~200 lines)
**File:** `packages/free-agent-mcp/src/agents/property-tests.ts`

**What it does:**
- Auto-generate property-based tests for pure functions
- Use fast-check (JS/TS) or Hypothesis (Python) patterns
- Catch "passes unit, fails edge" bugs

**Integration points:**
- `agent-cli.ts` - Add `--property-tests` flag
- `judge-fixer-prompts.ts` - Include property test results in verdict

**Starter code:**
```typescript
export function generatePropertyTests(
  functionName: string,
  functionSignature: string,
  domain: 'parser' | 'math' | 'transform'
): { path: string; content: string } {
  // Detect function domain
  // Generate fast-check/Hypothesis test
  // Return test file
}
```

---

### 2. Semantic Diff (~300 lines)
**File:** `packages/free-agent-mcp/src/agents/semantic-diff.ts`

**What it does:**
- Diff by symbols (add/remove/rename) instead of lines
- Color risky ops (public API, schema, concurrency)
- Show in PR Quality Pack

**Integration points:**
- `pr-quality-pack.ts` - Add semantic diff section
- `code-graph.ts` - Use symbol index for diff

**Starter code:**
```typescript
export function semanticDiff(
  oldContent: string,
  newContent: string
): {
  added: string[];
  removed: string[];
  renamed: Array<{ from: string; to: string }>;
  modified: string[];
  risk: 'low' | 'medium' | 'high';
} {
  // Parse both versions
  // Compare symbol tables
  // Detect renames vs add+remove
  // Assess risk level
}
```

---

### 3. Context Memory (~300 lines)
**File:** `packages/free-agent-mcp/src/agents/context-memory.ts`

**What it does:**
- Cache "Design Cards → accepted patches → judge rationales"
- When new task is similar, pre-load "what worked last time"
- Learn from past successes

**Integration points:**
- `agent-cli.ts` - Load similar past tasks
- `context-packing.ts` - Include past examples

**Starter code:**
```typescript
export class ContextMemory {
  private cacheDir = '.agent/memory';
  
  remember(card: DesignCard, patch: Patch, rationale: string) {
    // Hash card for similarity matching
    // Store in .agent/memory/<hash>.json
  }
  
  recall(card: DesignCard, limit = 3): AcceptedPatch[] {
    // Find similar past tasks (cosine similarity on card text)
    // Return top N matches
  }
}
```

---

## Phase 3: Medium-Priority MCP-Compatible Enhancements

**Estimated Effort:** ~800 lines, 1-2 sessions  
**Impact:** Medium  
**Complexity:** High

### 4. Refactor Engine (~400 lines)
**File:** `packages/free-agent-mcp/src/agents/refactor-engine.ts`

**What it does:**
- Apply safe codemods using jscodeshift (TS/JS) or ruff (Python)
- Deterministic refactoring instead of AI-generated patches
- Fixer emits codemod intents; runner applies them

**Integration points:**
- `agent-cli.ts` - Add `--use-codemods` flag
- `judge-fixer-prompts.ts` - Fixer can emit codemod intents

**Starter code:**
```typescript
export function applyCodemod(
  root: string,
  codemodType: 'extract-component' | 'rename-symbol' | 'apply-solid',
  target: string
): PatchOp[] {
  // Detect language
  // Run jscodeshift/ruff with codemod script
  // Parse output into PatchOp[]
}
```

---

### 5. Merge-Conflict Resolver (~400 lines)
**File:** `packages/free-agent-mcp/src/agents/merge-conflict-resolver.ts`

**What it does:**
- Auto-rebase when changes drift
- Use Fixer to produce conflict-only patch
- Validate with lints/types/tests

**Integration points:**
- `agent-cli.ts` - Add `--resolve-conflicts` flag
- `judge-fixer-prompts.ts` - Fixer handles conflict markers

**Starter code:**
```typescript
export async function resolveConflicts(
  root: string,
  baseBranch: string
): Promise<Patch> {
  // git rebase origin/main
  // If conflicts, extract conflict markers
  // Use Fixer to generate resolution patch
  // Validate with quality gates
}
```

---

## Phase 4: Future Projects (Require Different Architecture)

**Estimated Effort:** Varies, separate projects  
**Impact:** High (for specific use cases)  
**Complexity:** Very High

### 6. Feature-Flag Integration
**Architecture:** Runtime service (LaunchDarkly, Unleash, custom)  
**Estimated Effort:** ~500 lines + service setup  

**What it needs:**
- Runtime flag evaluation service
- API integration
- Flag configuration UI
- Rollout management

**When to build:** When you need gradual rollouts

---

### 7. Eval Harness + Leaderboard
**Architecture:** Persistent server + web dashboard  
**Estimated Effort:** ~1,500 lines + infrastructure  

**What it needs:**
- Persistent database (Postgres, SQLite)
- Web dashboard (Next.js, React)
- Scheduled jobs (cron, GitHub Actions)
- Benchmark datasets (HumanEval, MBPP, SWE-bench-lite)

**When to build:** When you need regression tracking

---

### 8. Model Portfolio Tuner
**Architecture:** Cloud service with local caching  
**Estimated Effort:** ~600 lines + cloud sync  

**What it needs:**
- Cloud storage (S3, GCS)
- Shared model performance database
- Learning algorithm (collaborative filtering)
- API for model recommendations

**When to build:** When you want shared learning across repos

---

## 🎯 Recommended Build Order

**Immediate (Phase 2):**
1. Property & Fuzz Tests - Catch edge cases
2. Semantic Diff - Better PR visualization
3. Context Memory - Learn from past successes

**Next (Phase 3):**
4. Refactor Engine - Deterministic refactoring
5. Merge-Conflict Resolver - Handle drift

**Future (Phase 4):**
6. Feature-Flag Integration - Gradual rollouts
7. Eval Harness + Leaderboard - Regression tracking
8. Model Portfolio Tuner - Shared learning

---

## 💡 Quick Start: Build Phase 2 Now

**To build Phase 2 enhancements, just say:**
> "Build Phase 2 enhancements: Property Tests, Semantic Diff, Context Memory"

I'll autonomously build all 3 (~800 lines) in a single session!

---

## 📊 Current Status

**Built (Phase 1):** 8 enhancements, ~2,000 lines ✅  
**Ready to Build (Phase 2):** 3 enhancements, ~800 lines  
**Ready to Build (Phase 3):** 2 enhancements, ~800 lines  
**Future Projects (Phase 4):** 3 projects, requires different architecture

---

**Last Updated:** 2025-10-31  
**Status:** Roadmap complete, ready for Phase 2!

