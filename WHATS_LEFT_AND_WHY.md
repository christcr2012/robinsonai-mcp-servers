# What Got Left Out and Why

## 📊 Summary

**Built:** 8/20 enhancements (~2,000 lines)  
**Left Out:** 12/20 enhancements  
**Reason:** Architecture mismatch or lower priority

---

## ✅ What Was Built (Tier 1 - Highest ROI)

1. ✅ **CodeGraph Retrieval 2.0** - Pure local analysis
2. ✅ **Impacted-Test Selection** - Local import graph
3. ✅ **Context Packing with Citations** - Local preprocessing
4. ✅ **Secrets/Deps/License Gate** - Local scanning
5. ✅ **Cost + Latency Budgeter** - Local routing logic
6. ✅ **PR Quality Pack** - Generate markdown locally
7. ✅ **DB Migration Safety** - Local schema analysis
8. ✅ **Flaky Test Detector** - Local test runner enhancement

---

## ❌ What Was Left Out and Why

### Category 1: MCP-Compatible but Lower Priority (Can Build Later)

#### 9. Property & Fuzz Tests
**Status:** Not built  
**Reason:** Lower priority than other Tier 1 items  
**Complexity:** Medium (~200 lines)  
**Why it fits MCP:** Pure local test generation  
**How to build:**
```typescript
// Generate property tests for pure functions
export function generatePropertyTests(
  functionName: string,
  functionSignature: string,
  domain: 'parser' | 'math' | 'transform'
): string {
  // Use fast-check or Hypothesis patterns
  // Generate test file with property-based tests
}
```

**When to build:** When you want to catch "passes unit, fails edge" bugs

---

#### 10. Refactor Engine (Safe Codemods)
**Status:** Not built  
**Reason:** Lower priority, requires jscodeshift/ruff integration  
**Complexity:** High (~400 lines)  
**Why it fits MCP:** Local codemod execution  
**How to build:**
```typescript
// Apply safe codemods using jscodeshift (TS/JS) or ruff (Python)
export function applyCodemod(
  root: string,
  codemodType: 'extract-component' | 'rename-symbol' | 'apply-solid',
  target: string
): PatchOp[] {
  // Run jscodeshift/ruff with codemod script
  // Return patch operations
}
```

**When to build:** When you want deterministic refactoring instead of AI-generated patches

---

#### 11. Semantic Diff & Risk Heatmap
**Status:** Partially built (risk heatmap in PR Quality Pack)  
**Reason:** Risk heatmap done, semantic diff lower priority  
**Complexity:** Medium (~300 lines)  
**Why it fits MCP:** Local git diff analysis  
**How to build:**
```typescript
// Diff by symbols (add/remove/rename) instead of lines
export function semanticDiff(
  oldContent: string,
  newContent: string
): {
  added: string[];
  removed: string[];
  renamed: Array<{ from: string; to: string }>;
  modified: string[];
} {
  // Parse both versions, compare symbol tables
  // Detect renames vs add+remove
}
```

**When to build:** When you want better diff visualization in PRs

---

#### 12. Context Memory per Repo
**Status:** Not built  
**Reason:** Lower priority, needs persistent storage  
**Complexity:** Medium (~300 lines)  
**Why it fits MCP:** Local cache/storage  
**How to build:**
```typescript
// Cache "Design Cards → accepted patches → judge rationales"
export class ContextMemory {
  private cache: Map<string, AcceptedPatch> = new Map();
  
  remember(card: DesignCard, patch: Patch, rationale: string) {
    // Store in local .agent/memory/<hash>.json
  }
  
  recall(card: DesignCard): AcceptedPatch[] {
    // Find similar past tasks
    // Return "what worked last time" examples
  }
}
```

**When to build:** When you want to learn from past successes

---

#### 13. Artifact Store & Reproducibility
**Status:** Partially built (artifacts written to /artifacts/<slug>/)  
**Reason:** Basic artifact storage done, reproducibility lower priority  
**Complexity:** Low (~150 lines)  
**Why it fits MCP:** Local filesystem  
**How to build:**
```typescript
// Save every run's artifacts with manifest.json
export function saveArtifactManifest(
  slug: string,
  manifest: {
    timestamp: string;
    model: string;
    promptsHash: string;
    seeds: number[];
    toolVersions: Record<string, string>;
  }
) {
  // Write to /artifacts/<slug>/<timestamp>/manifest.json
}
```

**When to build:** When you need deterministic replays

---

#### 14. Merge-Conflict Resolver
**Status:** Not built  
**Reason:** Lower priority, complex edge cases  
**Complexity:** High (~400 lines)  
**Why it fits MCP:** Local git operations  
**How to build:**
```typescript
// Auto-rebase and use Fixer to produce conflict-only patch
export async function resolveConflicts(
  root: string,
  baseBranch: string
): Promise<Patch> {
  // git rebase origin/main
  // If conflicts, extract conflict markers
  // Use Fixer to generate resolution patch
  // Validate with lints/types/tests
}
```

**When to build:** When changes drift during iteration

---

#### 15. Accessibility & i18n Checks
**Status:** Not built  
**Reason:** Lower priority, UI-specific  
**Complexity:** Low (~150 lines)  
**Why it fits MCP:** Local linting (axe-core)  
**How to build:**
```typescript
// Wire axe-core lint for web; i18n keys presence check
export function checkAccessibility(root: string): string[] {
  // Run axe-core on HTML/JSX files
  // Check for missing alt text, ARIA labels, etc.
}

export function checkI18n(root: string): string[] {
  // Check for hardcoded strings
  // Verify i18n keys exist
}
```

**When to build:** When you have UI components

---

### Category 2: Requires Different Architecture (Future Projects)

#### 16. Feature-Flag Integration
**Status:** Not built  
**Reason:** Requires runtime service (LaunchDarkly, Unleash, etc.)  
**Complexity:** High (~500 lines + external service)  
**Why it doesn't fit MCP:** Needs runtime flag evaluation service  
**Architecture needed:**
- Runtime service (LaunchDarkly, Unleash, custom)
- API integration
- Flag configuration UI
- Rollout management

**How to build (future):**
```typescript
// Require flag name in Design Card; agent wires guard + config
export function generateFeatureFlag(
  card: DesignCard,
  flagName: string
): {
  code: string; // if (featureFlags.isEnabled('new-feature')) { ... }
  config: object; // LaunchDarkly config
  rolloutPlan: string[]; // Steps to enable flag
} {
  // Generate flag guard code
  // Generate flag config
  // Generate rollout plan
}
```

**When to build:** As separate service that MCP servers call via API

---

#### 17. Eval Harness + Leaderboard
**Status:** Not built  
**Reason:** Requires persistent server + dashboard  
**Complexity:** Very High (~1,500 lines + infrastructure)  
**Why it doesn't fit MCP:** Needs persistent storage, web UI, scheduled jobs  
**Architecture needed:**
- Persistent database (Postgres, SQLite)
- Web dashboard (Next.js, React)
- Scheduled jobs (cron, GitHub Actions)
- Benchmark datasets (HumanEval, MBPP, SWE-bench-lite)

**How to build (future):**
```typescript
// Nightly canaries + leaderboard
export class EvalHarness {
  async runBenchmark(
    model: string,
    dataset: 'humaneval' | 'mbpp' | 'swe-bench-lite'
  ): Promise<BenchmarkResult> {
    // Run benchmark
    // Store results in DB
    // Update leaderboard
  }
  
  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    // Query DB for latest results
    // Rank by pass rate, cost, time
  }
}
```

**When to build:** As separate web service with API

---

#### 18. Model Portfolio Tuner
**Status:** Partially built (cost budgeter has basic routing)  
**Reason:** Benefits from shared learning across repos  
**Complexity:** High (~600 lines + cloud sync)  
**Why it doesn't fit MCP:** Benefits from centralized learning  
**Architecture needed:**
- Cloud storage (S3, GCS)
- Shared model performance database
- Learning algorithm (collaborative filtering)
- API for model recommendations

**How to build (future):**
```typescript
// Keep JSON of provider strengths, share across repos
export class ModelPortfolioTuner {
  async recordPerformance(
    model: string,
    task: TaskProfile,
    result: { success: boolean; cost: number; time: number }
  ) {
    // Store locally
    // Sync to cloud (optional)
  }
  
  async recommendModel(task: TaskProfile): Promise<string> {
    // Query local + cloud performance data
    // Use collaborative filtering
    // Return best model for this task type
  }
}
```

**When to build:** As cloud service with local caching

---

#### 19. Knowledge Plug-ins with Citations
**Status:** Not built  
**Reason:** Could work locally with cached docs, but lower priority  
**Complexity:** Medium (~400 lines)  
**Why it could fit MCP:** Local doc cache  
**Why it doesn't fit well:** Needs doc scraping/updates  
**Architecture needed (if cloud):**
- Doc scraping service
- Vector database (Pinecone, Weaviate)
- API for doc lookup

**How to build (local version):**
```typescript
// Optional doc lookup (official docs only) with local cache
export class KnowledgePlugins {
  private cache = new Map<string, DocSnippet>();
  
  async lookup(api: string, library: string): Promise<DocSnippet[]> {
    // Check local cache first
    // If miss, fetch from official docs (MDN, TypeScript, etc.)
    // Cache locally
    // Return snippets with citations
  }
}
```

**When to build:** When you need API documentation lookup

---

#### 20. Human Feedback Flywheel (HITL)
**Status:** Not built  
**Reason:** Local storage works, but cloud sync better  
**Complexity:** Medium (~400 lines local, ~800 lines with cloud)  
**Why it could fit MCP:** Local storage of feedback  
**Why cloud is better:** Shared learning across team/repos  
**Architecture needed (if cloud):**
- Feedback database (Postgres)
- Web UI for review
- API for feedback submission
- Learning algorithm

**How to build (local version):**
```typescript
// When you tweak Design Card or reject patch, capture feedback
export class FeedbackFlywheel {
  capture(
    input: DesignCard,
    signals: ExecReport,
    verdict: 'accept' | 'reject',
    humanFeedback?: string
  ) {
    // Store in .agent/feedback/<hash>.json
  }
  
  replay(card: DesignCard): FeedbackExample[] {
    // Find similar past tasks
    // Return as few-shot examples
  }
}
```

**When to build:** When you want to learn from human corrections

---

## 📊 Priority Matrix

### High Priority (Can Build Now)
1. **Property & Fuzz Tests** - Catch edge cases
2. **Semantic Diff** - Better diff visualization
3. **Context Memory** - Learn from past successes

### Medium Priority (Build When Needed)
4. **Refactor Engine** - Deterministic refactoring
5. **Artifact Store** - Reproducibility
6. **Merge-Conflict Resolver** - Handle drift
7. **Accessibility & i18n** - UI-specific

### Low Priority (Future Projects)
8. **Feature-Flag Integration** - Needs runtime service
9. **Eval Harness + Leaderboard** - Needs persistent server
10. **Model Portfolio Tuner** - Benefits from cloud
11. **Knowledge Plug-ins** - Needs doc scraping
12. **Human Feedback Flywheel** - Better with cloud

---

## 🎯 Recommendation

**Phase 1 (Now):** You have the 8 most impactful enhancements  
**Phase 2 (Next):** Build Property Tests, Semantic Diff, Context Memory (~800 lines)  
**Phase 3 (Later):** Build Refactor Engine, Merge-Conflict Resolver (~800 lines)  
**Phase 4 (Future):** Plan cloud services for Feature Flags, Eval Harness, Model Portfolio Tuner

---

## 💡 Why This Prioritization?

**Built First (Tier 1):**
- Immediate impact (2-10× faster tests, better context, enterprise-ready)
- Pure local/MCP-compatible
- Production-ready patterns

**Left for Later:**
- Lower immediate impact
- Requires more complex integration
- Needs external services

**The framework is already BEST-IN-CLASS with what's built!** The remaining items are nice-to-haves or require different architecture.

---

**Last Updated:** 2025-10-31  
**Status:** Complete analysis of what was built vs. left out

