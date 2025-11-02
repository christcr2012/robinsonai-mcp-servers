# Agent Enhancement Implementation Plan
## Improving FREE and PAID Agents with ChatGPT Features

**Status:** 🚧 IN PROGRESS
**Goal:** Enhance existing FREE and PAID agent MCPs with quality gates, learning, and model evolution
**Estimated Timeline:** 8-12 weeks

---

## 📋 Overview

This plan implements the full coding agent features described in the ChatGPT conversation at `C:\Users\chris\OneDrive\Desktop\instructions.txt`.

**IMPORTANT:** We are NOT building a new separate coding agent. We are **enhancing the existing FREE and PAID agent MCPs** with these capabilities.

**What We Have:**
- ✅ `packages/autonomous-agent-mcp/` - FREE Agent (Ollama, 0 credits)
- ✅ `packages/openai-worker-mcp/` - PAID Agent (OpenAI/Claude)
- ✅ `packages/thinking-tools-mcp/` - Cognitive frameworks
- ✅ `packages/credit-optimizer-mcp/` - Tool discovery, templates
- ✅ `packages/robinsons-toolkit-mcp/` - 1,165 integration tools

**What We're Adding to FREE/PAID Agents:**
- 🚧 Quality gates (formatter, linter, type checker, tests, coverage, security)
- 🚧 LLM Judge with structured rubric
- 🚧 Synthesize-Execute-Critique-Refine loop
- 🚧 Repo-native code generation with Project Brief
- 🚧 SQLite experience memory for learning
- 🚧 LoRA training pipeline for model evolution (FREE agent only)
- 🚧 Advanced features (impacted tests, flaky detection, refactor engine)

---

## 🎯 Phase 1: Core Pipeline Infrastructure (Weeks 1-2)

**Goal:** Build the Synthesize-Execute-Critique-Refine loop with quality gates

### 1.1: Design Card Parser
**What:** Parse YAML/JSON task specifications  
**Input Format:**
```yaml
task: "Add user authentication"
goals:
  - Implement login endpoint
  - Add JWT token generation
  - Create user session management
acceptance_criteria:
  - All tests pass
  - Coverage >= 80%
  - No security vulnerabilities
  - API matches OpenAPI spec
allowed_paths:
  - src/auth/**
  - tests/auth/**
constraints:
  - Use existing User model
  - Follow REST conventions
```

**Deliverables:**
- [ ] `packages/autonomous-agent-mcp/src/design-card/parser.ts` - Parse and validate Design Cards
- [ ] `packages/autonomous-agent-mcp/src/design-card/schema.ts` - TypeScript types and Zod schema
- [ ] `packages/autonomous-agent-mcp/tests/design-card/parser.test.ts` - Unit tests
- [ ] `packages/openai-worker-mcp/src/design-card/` - Same for PAID agent

### 1.2: Quality Gates Runner
**What:** Run all quality checks and produce structured results  

**Gates to Implement:**
1. **Formatter** - prettier (JS/TS), black (Python), rustfmt (Rust)
2. **Linter** - eslint (JS/TS), ruff (Python), clippy (Rust)
3. **Type Checker** - tsc (TypeScript), mypy (Python), cargo check (Rust)
4. **Tests** - jest/vitest (JS/TS), pytest (Python), cargo test (Rust)
5. **Coverage** - c8/nyc (JS/TS), coverage.py (Python), tarpaulin (Rust)
6. **Security** - npm audit, safety (Python), cargo audit (Rust)

**Output Format:**
```typescript
interface GateResults {
  formatter: { passed: boolean; issues: string[] };
  linter: { passed: boolean; issues: LintIssue[] };
  typeChecker: { passed: boolean; errors: TypeError[] };
  tests: { passed: boolean; total: number; failed: number; output: string };
  coverage: { passed: boolean; percentage: number; threshold: number };
  security: { passed: boolean; vulnerabilities: Vulnerability[] };
}
```

**Deliverables:**
- [ ] `packages/autonomous-agent-mcp/src/gates/runner.ts` - Main gate runner
- [ ] `packages/autonomous-agent-mcp/src/gates/formatter.ts` - Formatter gate
- [ ] `packages/autonomous-agent-mcp/src/gates/linter.ts` - Linter gate
- [ ] `packages/autonomous-agent-mcp/src/gates/type-checker.ts` - Type checker gate
- [ ] `packages/autonomous-agent-mcp/src/gates/tests.ts` - Test runner gate
- [ ] `packages/autonomous-agent-mcp/src/gates/coverage.ts` - Coverage gate
- [ ] `packages/autonomous-agent-mcp/src/gates/security.ts` - Security gate
- [ ] `packages/autonomous-agent-mcp/tests/gates/` - Unit tests for all gates
- [ ] `packages/openai-worker-mcp/src/gates/` - Same for PAID agent (shared logic)

### 1.3: LLM Judge with Rubric
**What:** Use LLM to evaluate code quality with structured scoring

**Rubric Categories:**
1. **Correctness** (0-10) - Does it solve the problem?
2. **Style Adherence** (0-10) - Matches repo conventions?
3. **Test Quality** (0-10) - Good test coverage and assertions?
4. **Security** (0-10) - No vulnerabilities or unsafe patterns?
5. **Performance** (0-10) - Efficient algorithms and data structures?

**Verdict Format:**
```typescript
interface Verdict {
  scores: {
    correctness: number;
    style: number;
    tests: number;
    security: number;
    performance: number;
  };
  overallScore: number; // Average of all scores
  passed: boolean; // true if overallScore >= 7.0
  reasoning: string; // Detailed explanation
  suggestions: string[]; // Actionable improvements
  gateResults: GateResults; // From quality gates
}
```

**Deliverables:**
- [ ] `packages/autonomous-agent-mcp/src/judge/rubric.ts` - Scoring rubric definition
- [ ] `packages/autonomous-agent-mcp/src/judge/evaluator.ts` - LLM-as-a-judge (uses Ollama)
- [ ] `packages/autonomous-agent-mcp/src/judge/prompts.ts` - Judge prompts
- [ ] `packages/autonomous-agent-mcp/tests/judge/` - Unit tests
- [ ] `packages/openai-worker-mcp/src/judge/evaluator.ts` - LLM-as-a-judge (uses OpenAI)

### 1.4: Synthesize-Execute-Critique-Refine Loop
**What:** Main pipeline that orchestrates the entire process

**Flow:**
```
1. SYNTHESIZE: Generate code from Design Card
   ↓
2. EXECUTE: Run quality gates
   ↓
3. CRITIQUE: Judge evaluates code + gate results
   ↓
4. REFINE: If verdict.passed = false, fix issues and loop
   ↓
5. DONE: If verdict.passed = true or max iterations reached
```

**Configuration:**
```typescript
interface PipelineConfig {
  maxIterations: number; // Default: 3
  minScore: number; // Default: 7.0
  requiredGates: string[]; // Gates that must pass
  model: 'free' | 'paid'; // Which agent to use
}
```

**Deliverables:**
- [ ] `packages/autonomous-agent-mcp/src/pipeline/synthesize.ts` - Code generation step
- [ ] `packages/autonomous-agent-mcp/src/pipeline/execute.ts` - Quality gates step
- [ ] `packages/autonomous-agent-mcp/src/pipeline/critique.ts` - Judge evaluation step
- [ ] `packages/autonomous-agent-mcp/src/pipeline/refine.ts` - Fix issues step
- [ ] `packages/autonomous-agent-mcp/src/pipeline/orchestrator.ts` - Main loop
- [ ] `packages/autonomous-agent-mcp/tests/pipeline/` - Integration tests
- [ ] `packages/openai-worker-mcp/src/pipeline/` - Same for PAID agent

### 1.5: Enhanced Tool Interface
**What:** Add new tools to FREE/PAID agents for pipeline execution

**New Tools to Add:**
- `execute_with_quality_gates` - Run code generation with full pipeline
- `judge_code_quality` - Evaluate code with LLM judge
- `refine_code` - Fix issues based on judge feedback

**Strategy:**
- FREE Agent uses these tools internally when `quality: "best"` is specified
- PAID Agent uses these tools when `minQuality: "premium"` is specified
- Augment can call these tools directly for fine-grained control

**Deliverables:**
- [ ] `packages/autonomous-agent-mcp/src/tools/execute-with-gates.ts` - New tool
- [ ] `packages/autonomous-agent-mcp/src/tools/judge-quality.ts` - New tool
- [ ] `packages/autonomous-agent-mcp/src/tools/refine-code.ts` - New tool
- [ ] `packages/openai-worker-mcp/src/tools/` - Same for PAID agent
- [ ] Update tool registration in both agents

---

## 🎯 Phase 2: Repo-Native Code Generation (Weeks 3-4)

**Goal:** Generate code that matches existing codebase conventions

### 2.1: Project Brief Auto-Generator
**What:** Analyze codebase to extract conventions and patterns

**What to Extract:**
- Language and framework (TypeScript + Node.js, Python + FastAPI, etc.)
- Naming conventions (camelCase vs snake_case, PascalCase for classes)
- Import patterns (relative vs absolute, barrel exports)
- File organization (feature folders, layered architecture)
- Common patterns (factory functions, dependency injection, error handling)
- Testing conventions (describe/it vs test, mocking patterns)

**Output Format:**
```typescript
interface ProjectBrief {
  language: string;
  framework: string;
  namingConventions: {
    variables: 'camelCase' | 'snake_case';
    functions: 'camelCase' | 'snake_case';
    classes: 'PascalCase' | 'snake_case';
    files: 'kebab-case' | 'camelCase' | 'PascalCase';
  };
  importStyle: 'relative' | 'absolute' | 'mixed';
  architecture: {
    layering: string[]; // ['controllers', 'services', 'repositories']
    boundaries: string[]; // ['No direct DB access from controllers']
  };
  commonPatterns: Pattern[];
  testingConventions: TestingConventions;
}
```

**Deliverables:**
- [ ] `packages/autonomous-agent-mcp/src/repo-analysis/brief-generator.ts`
- [ ] `packages/autonomous-agent-mcp/src/repo-analysis/naming-analyzer.ts`
- [ ] `packages/autonomous-agent-mcp/src/repo-analysis/import-analyzer.ts`
- [ ] `packages/autonomous-agent-mcp/src/repo-analysis/architecture-analyzer.ts`
- [ ] `packages/autonomous-agent-mcp/tests/repo-analysis/` - Unit tests
- [ ] Share with PAID agent via common package or duplicate

### 2.2: Symbol Graph Builder
**What:** Index all identifiers and their relationships

**What to Index:**
- Function/method definitions and call sites
- Class definitions and instantiations
- Import/export relationships
- Type definitions and usages

**Deliverables:**
- [ ] `packages/autonomous-agent-mcp/src/symbol-graph/indexer.ts`
- [ ] `packages/autonomous-agent-mcp/src/symbol-graph/retriever.ts`
- [ ] `packages/autonomous-agent-mcp/src/symbol-graph/similarity.ts`
- [ ] `packages/autonomous-agent-mcp/tests/symbol-graph/` - Unit tests
- [ ] Share with PAID agent

### 2.3: Few-Shot Example Retriever
**What:** Find relevant examples from codebase for prompts

**Deliverables:**
- [ ] `packages/autonomous-agent-mcp/src/examples/retriever.ts`
- [ ] `packages/autonomous-agent-mcp/tests/examples/` - Unit tests
- [ ] Share with PAID agent

---

## 🎯 Phase 3: Learning Infrastructure (Weeks 5-6)

**Goal:** Learn from successes and failures to improve over time

### 3.1: SQLite Experience Memory
**Schema:**
```sql
CREATE TABLE runs (
  id INTEGER PRIMARY KEY,
  task TEXT,
  code TEXT,
  verdict JSON,
  timestamp INTEGER
);

CREATE TABLE signals (
  id INTEGER PRIMARY KEY,
  run_id INTEGER,
  signal_type TEXT, -- 'test_pass', 'coverage', 'judge_score', etc.
  value REAL,
  FOREIGN KEY (run_id) REFERENCES runs(id)
);

CREATE TABLE training_pairs (
  id INTEGER PRIMARY KEY,
  prompt TEXT,
  completion TEXT,
  reward REAL,
  created_at INTEGER
);
```

**Deliverables:**
- [ ] `packages/autonomous-agent-mcp/src/learning/database.ts`
- [ ] `packages/autonomous-agent-mcp/src/learning/schema.sql`
- [ ] `packages/autonomous-agent-mcp/tests/learning/` - Unit tests
- [ ] `packages/openai-worker-mcp/src/learning/` - PAID agent also learns (shared DB)

### 3.2: Reward Calculation
**What:** Calculate reward from signals for learning

**Formula:**
```
reward = (
  0.3 * tests_passed_ratio +
  0.2 * coverage_percentage +
  0.2 * judge_score +
  0.2 * (1 - iterations_used / max_iterations) +
  0.1 * security_score
)
```

**Deliverables:**
- [ ] `packages/autonomous-agent-mcp/src/learning/reward.ts`
- [ ] `packages/autonomous-agent-mcp/tests/learning/reward.test.ts`
- [ ] Share with PAID agent

### 3.3: Learning Loop
**What:** Store runs and extract training pairs

**Deliverables:**
- [ ] `packages/autonomous-agent-mcp/src/learning/recorder.ts`
- [ ] `packages/autonomous-agent-mcp/src/learning/extractor.ts`
- [ ] `packages/autonomous-agent-mcp/tests/learning/` - Unit tests
- [ ] Share with PAID agent

---

## 🎯 Phase 4: Model Evolution (Weeks 7-8)

**Goal:** Train LoRA adapters to improve Ollama models (FREE agent only)

**Note:** This phase only applies to FREE agent (Ollama). PAID agent uses OpenAI/Claude models which we can't fine-tune directly.

### 4.1: SFT Dataset Export
**What:** Export training pairs from SQLite to JSONL format

**Deliverables:**
- [ ] `packages/autonomous-agent-mcp/src/training/export.ts`
- [ ] `packages/autonomous-agent-mcp/tests/training/` - Unit tests

### 4.2: LoRA Training Pipeline
**What:** Train LoRA adapters using exported datasets

**Deliverables:**
- [ ] `packages/autonomous-agent-mcp/src/training/lora-trainer.ts`
- [ ] `packages/autonomous-agent-mcp/scripts/train-lora.sh`

### 4.3: Ollama Adapter Integration
**What:** Create Modelfiles with ADAPTER directive

**Deliverables:**
- [ ] `packages/autonomous-agent-mcp/src/training/modelfile-generator.ts`
- [ ] `packages/autonomous-agent-mcp/scripts/update-ollama-model.sh`

---

## 🎯 Phase 5: n8n Integration (Weeks 9-10)

**Goal:** Automate workflows with n8n

### 5.1: PR Labeled Trigger
**What:** Run agent when PR is labeled "ai-review"

**Deliverables:**
- [ ] `n8n-workflows/pr-labeled-trigger.json`

### 5.2: Weekly LoRA Training
**What:** Train LoRA adapters weekly from experience

**Deliverables:**
- [ ] `n8n-workflows/weekly-lora-training.json`

### 5.3: Docs Caching
**What:** Fetch and cache documentation

**Deliverables:**
- [ ] `n8n-workflows/docs-caching.json`

---

## 🎯 Phase 6: Advanced Features (Weeks 11-12)

**Goal:** Add sophisticated capabilities

### 6.1: Impacted Test Selection
**What:** Run only tests that touch changed symbols

**Deliverables:**
- [ ] `packages/autonomous-agent-mcp/src/testing/impacted-tests.ts`
- [ ] Share with PAID agent

### 6.2: Flaky Test Detection
**What:** Identify and quarantine flaky tests

**Deliverables:**
- [ ] `packages/autonomous-agent-mcp/src/testing/flaky-detector.ts`
- [ ] Share with PAID agent

### 6.3: Refactor Engine
**What:** Automated refactoring with safety checks

**Deliverables:**
- [ ] `packages/autonomous-agent-mcp/src/refactor/engine.ts`
- [ ] Share with PAID agent

---

## 📊 Success Metrics

**Phase 1:** Pipeline runs end-to-end, quality gates work  
**Phase 2:** Generated code matches repo conventions  
**Phase 3:** Experience memory stores runs and calculates rewards  
**Phase 4:** LoRA adapters improve model performance  
**Phase 5:** n8n workflows automate agent triggers  
**Phase 6:** Advanced features reduce manual work  

---

## 🚀 Getting Started

**Next Steps:**
1. Review existing `packages/autonomous-agent-mcp/` structure
2. Review existing `packages/openai-worker-mcp/` structure
3. Install new dependencies (zod, better-sqlite3, etc.)
4. Start with Phase 1.1: Design Card Parser in autonomous-agent-mcp
5. Replicate to openai-worker-mcp where applicable

**Key Principle:** We're ENHANCING existing agents, not building a new one!

**Ready to begin!** 🎯

