# Learning System - Compact Learning from Every Run

## 🎯 Overview

The Learning System teaches your agent from its own attempts using signals you already generate. This gives **real, quick lift without any training yet**, and sets you up for **LoRA fine-tuning** to evolve your local Ollama models.

**Key Features:**
1. ✅ **SQLite Experience Memory** - Durable, queryable, easy to back up
2. ✅ **Reward Calculation** - Composite score from compile/lint/type/test/coverage/human
3. ✅ **Prompt Portfolio Bandit** - ε-greedy selection of best prompts
4. ✅ **Model Router** - Route easy→local, hard→API based on learned performance
5. ✅ **Context Shaper** - Learn which retrieval bundles correlate with success
6. ✅ **Safe Web Knowledge** - Whitelist + cache + summarize official docs
7. ✅ **LoRA Fine-Tuning** - Export SFT datasets for training custom adapters

---

## 📊 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Learning Loop                             │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Reward       │  │ Prompt       │  │ Model        │      │
│  │ Calculation  │  │ Bandit       │  │ Router       │      │
│  │              │  │ (ε-greedy)   │  │ (ε-greedy)   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                            │                                 │
│                    ┌───────▼────────┐                        │
│                    │  Experience DB │                        │
│                    │  (SQLite)      │                        │
│                    └───────┬────────┘                        │
│                            │                                 │
│         ┌──────────────────┼──────────────────┐              │
│         │                  │                  │              │
│  ┌──────▼──────┐  ┌────────▼────────┐  ┌─────▼──────┐      │
│  │ runs        │  │ signals         │  │ pairs      │      │
│  │ (metadata)  │  │ (quality gates) │  │ (SFT data) │      │
│  └─────────────┘  └─────────────────┘  └────────────┘      │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗄️ SQLite Schema

### Tables

**runs** - One row per agent execution
```sql
CREATE TABLE runs (
  id INTEGER PRIMARY KEY,
  ts DATETIME DEFAULT CURRENT_TIMESTAMP,
  task_slug TEXT,
  model_name TEXT,
  prompt_id TEXT,
  reward REAL CHECK(reward >= 0 AND reward <= 1),
  cost_tokens INT,
  duration_ms INT
);
```

**signals** - Structured quality metrics
```sql
CREATE TABLE signals (
  run_id INTEGER REFERENCES runs(id),
  lint_errors INT,
  type_errors INT,
  tests_failed INT,
  coverage_pct REAL,
  schema_errors INT,
  boundary_errors INT
);
```

**pairs** - Anonymized datasets for fine-tuning
```sql
CREATE TABLE pairs (
  id INTEGER PRIMARY KEY,
  task_slug TEXT,
  role TEXT CHECK(role IN ('coder','fixer','judge')),
  prompt_json TEXT,
  output_json TEXT,
  label REAL CHECK(label >= 0 AND label <= 1)
);
```

**web_cache** - Cached documentation pages
```sql
CREATE TABLE web_cache (
  url TEXT PRIMARY KEY,
  html TEXT,
  fetched_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 💡 Reward Calculation

### Formula

```
reward = 0.25 * compile + 0.25 * tests + 0.25 * (1 - error_rate) + 0.25 * human_accept
```

Where:
- **compile**: 1 if passes, 0 if fails
- **tests**: tests_passed / tests_total (or 1 if no tests)
- **error_rate**: (lint + type + schema + boundary) / 100 (capped at 1)
- **human_accept**: 1 if accepted, 0 if rejected, 0.5 if unknown

### Example

```typescript
import { LearningLoop } from './learning/index.js';

const loop = new LearningLoop(repoRoot);

const reward = loop.calculateReward({
  compile_pass: true,
  lint_errors: 2,
  type_errors: 0,
  tests_passed: 8,
  tests_total: 10,
  coverage_pct: 85,
  schema_errors: 0,
  boundary_errors: 0,
  human_accept: true,
});

console.log(`Reward: ${reward}`); // 0.93
```

---

## 🎰 Prompt Portfolio Bandit

### ε-Greedy Strategy

- **Exploration (ε=0.1):** 10% of the time, pick a random prompt variant
- **Exploitation (1-ε=0.9):** 90% of the time, pick the best prompt by win rate

### Prompt Variants

Stored in `.agent/prompt_variants.json`:

```json
[
  {
    "id": "default",
    "name": "Default Prompt",
    "template": "default",
    "wins": 45.2,
    "trials": 50
  },
  {
    "id": "detailed",
    "name": "Detailed Prompt",
    "template": "detailed",
    "wins": 38.7,
    "trials": 42
  },
  {
    "id": "concise",
    "name": "Concise Prompt",
    "template": "concise",
    "wins": 12.1,
    "trials": 15
  }
]
```

### Usage

```typescript
// Select prompt variant
const variant = loop.selectPromptVariant();
console.log(`Using prompt: ${variant.name}`);

// ... run agent with this prompt ...

// Update with reward
loop.updatePromptVariant(variant.id, reward);
```

---

## 🤖 Model Router

### Strategy

- **Easy tasks** (scaffold, simple refactor) → local model (free)
- **Hard tasks** (schema changes, public API) → API model (paid)
- Use ε-greedy to explore alternatives

### Model Variants

Stored in `.agent/model_variants.json`:

```json
[
  {
    "id": "qwen2.5-coder:7b",
    "name": "Qwen 2.5 Coder 7B (Local)",
    "cost_per_1k": 0,
    "wins": 120.5,
    "trials": 150
  },
  {
    "id": "gpt-4o-mini",
    "name": "GPT-4o Mini (API)",
    "cost_per_1k": 0.15,
    "wins": 45.8,
    "trials": 50
  }
]
```

### Usage

```typescript
// Select model based on task complexity and budget
const model = loop.selectModel('medium', 0.20); // Max $0.20/1k tokens
console.log(`Using model: ${model.name}`);

// ... run agent with this model ...

// Update with reward
loop.updateModelVariant(model.id, reward);
```

---

## 🌐 Safe Web Knowledge

### Whitelisted Domains

Only fetch from official docs:
- `developer.mozilla.org` (MDN)
- `www.typescriptlang.org` (TypeScript)
- `react.dev` (React)
- `nextjs.org` (Next.js)
- `docs.python.org` (Python)
- And 20+ more...

### Usage

```typescript
import { WebKnowledge } from './learning/index.js';

const web = new WebKnowledge(repoRoot);

// Fetch and cache a page
const page = await web.fetchPage('https://react.dev/reference/react/useState');

if (page) {
  console.log(page.title);
  console.log(page.summary); // First 3 paragraphs
}

// Search for docs
const results = await web.searchDocs('hooks', 'react');
const prompt = web.formatForPrompt(results);

// Include in agent prompt
const fullPrompt = `${basePrompt}\n\n${prompt}`;
```

### Design Card Integration

```yaml
# .agent/tasks/my-task.yaml
name: add-react-hooks
web: on  # Enable web knowledge
```

```typescript
if (web.isWebEnabled(designCard)) {
  const docs = await web.searchDocs(designCard.goals[0], 'react');
  // Include docs in prompt
}
```

---

## 📦 LoRA Fine-Tuning

### Export SFT Datasets

```bash
# Export high-quality examples (reward ≥ 0.7)
node packages/free-agent-mcp/src/learning/make-sft.ts . --min-reward=0.7 --limit=1000
```

**Output:**
- `.agent/sft/coder_sft.jsonl` - Coder role (spec → code)
- `.agent/sft/fixer_sft.jsonl` - Fixer role (diagnostics → patch)
- `.agent/sft/judge_sft.jsonl` - Judge role (code → verdict)

### Train LoRA Adapter

See `LORA_TRAINING_GUIDE.md` for full details.

```bash
# 1. Train with Unsloth
python train_lora.py --data .agent/sft/coder_sft.jsonl --base qwen2.5-coder:7b

# 2. Convert to GGUF
# (done automatically by Unsloth)

# 3. Create Ollama Modelfile
cat > coder-tuned.Modelfile <<EOF
FROM qwen2.5-coder:7b
ADAPTER ./coder_adapter.gguf
SYSTEM You are a precise code generator...
EOF

# 4. Serve with Ollama
ollama create my-coder-tuned -f coder-tuned.Modelfile
ollama run my-coder-tuned
```

---

## 🔄 Integration with Agent Pipeline

### Record Every Run

```typescript
import { LearningLoop } from './learning/index.js';

const loop = new LearningLoop(repoRoot);

// Select prompt and model
const prompt = loop.selectPromptVariant();
const model = loop.selectModel('medium', 0.20);

// Run agent
const startTime = Date.now();
const result = await runAgent(designCard, prompt, model);
const duration = Date.now() - startTime;

// Calculate reward
const reward = loop.calculateReward({
  compile_pass: result.compile_pass,
  lint_errors: result.lint_errors,
  type_errors: result.type_errors,
  tests_passed: result.tests_passed,
  tests_total: result.tests_total,
  coverage_pct: result.coverage_pct,
  schema_errors: result.schema_errors,
  boundary_errors: result.boundary_errors,
  human_accept: undefined, // Will be set later
});

// Record run
loop.recordRun(
  designCard.name,
  model.id,
  prompt.id,
  {
    compile_pass: result.compile_pass,
    lint_errors: result.lint_errors,
    type_errors: result.type_errors,
    tests_passed: result.tests_passed,
    tests_total: result.tests_total,
    coverage_pct: result.coverage_pct,
    schema_errors: result.schema_errors,
    boundary_errors: result.boundary_errors,
  },
  result.cost_tokens,
  duration,
  JSON.stringify(result.prompt),
  JSON.stringify(result.output),
  'coder'
);
```

---

## 📊 Analytics

### Get Stats

```typescript
const stats = loop.getStats();

console.log('Recent Stats (last 100 runs):');
console.log(`  Avg Reward: ${stats.recentStats.avgReward.toFixed(2)}`);
console.log(`  Avg Cost: ${stats.recentStats.avgCost} tokens`);
console.log(`  Avg Duration: ${stats.recentStats.avgDuration}ms`);

console.log('\nModel Performance:');
stats.modelPerformance.forEach(m => {
  console.log(`  ${m.model_name}: ${m.avg_reward.toFixed(2)} (${m.count} runs)`);
});

console.log('\nPrompt Performance:');
stats.promptPerformance.forEach(p => {
  console.log(`  ${p.prompt_id}: ${p.avg_reward.toFixed(2)} (${p.count} runs)`);
});
```

---

## 🎯 Expected Results

### Immediate (No Training)
- **Prompt selection:** +5-10% win rate from bandit
- **Model routing:** +10-20% cost savings
- **Context shaping:** +5-10% compile rate

### After 1 Week (100-500 examples)
- **LoRA fine-tuning:** +5-10% compile rate
- **Convention score:** +10-15%

### After 1 Month (500-2000 examples)
- **LoRA fine-tuning:** +10-20% compile rate
- **Convention score:** +20-30%
- **Fewer iterations:** -1 to -2 per task

### After 3 Months (2000+ examples)
- **LoRA fine-tuning:** +20-30% compile rate
- **Convention score:** +30-50%
- **Fewer iterations:** -2 to -3 per task
- **Model knows your codebase patterns**

---

## 📚 Files

- `src/learning/experience-db.ts` - SQLite database wrapper
- `src/learning/learning-loop.ts` - Reward calculation, bandit, router
- `src/learning/make-sft.ts` - SFT dataset exporter
- `src/learning/web-knowledge.ts` - Safe web access
- `src/learning/index.ts` - Exports
- `LORA_TRAINING_GUIDE.md` - Full LoRA training guide

---

**Last Updated:** 2025-10-31  
**Status:** Production-ready! Start learning from every run! 🚀

