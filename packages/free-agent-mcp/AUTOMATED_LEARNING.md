# Automated Learning System - Zero-Touch Learning

## 🎯 Overview

The Automated Learning System provides **zero-touch learning** - your agent automatically:
1. ✅ Records every run with quality signals
2. ✅ Exports SFT datasets when threshold is reached (100+ runs)
3. ✅ Trains LoRA adapters when enough data is available (500+ examples)
4. ✅ Deploys trained models to Ollama automatically
5. ✅ Detects drift and rolls back if performance drops

**No manual intervention required!** Just run your agent and it learns from every execution.

---

## 🚀 Quick Start

### 1. Enable Automated Learning

```typescript
import { LearningPipeline } from './learning/index.js';

const learning = new LearningPipeline(repoRoot);

// Select prompt and model using bandit/router
const prompt = learning.selectPrompt();
const model = learning.selectModel('medium', 0.002);

// Fetch web knowledge if enabled
const webKnowledge = await learning.fetchWebKnowledge(designCard, query, library);

// Run your agent
const result = await runYourAgent(designCard, prompt, model, webKnowledge);

// Record run (triggers automation if thresholds met)
await learning.recordRun(
  designCard.name,
  model.id,
  prompt.id,
  result,
  'coder'
);

learning.close();
```

### 2. Configure Automation (Optional)

Create `.agent/learning-config.json`:

```json
{
  "enabled": true,
  "autoExport": {
    "enabled": true,
    "minRuns": 100,
    "minReward": 0.7,
    "maxExamples": 1000
  },
  "autoTrain": {
    "enabled": true,
    "minExamples": 500,
    "baseModel": "qwen2.5-coder:7b",
    "loraRank": 16,
    "epochs": 3
  },
  "autoDeploy": {
    "enabled": true,
    "modelNamePrefix": "my-coder-tuned"
  }
}
```

### 3. Run Your Agent

That's it! The system will automatically:
- Record every run
- Export SFT datasets after 100 runs
- Train LoRA adapters after 500 examples
- Deploy to Ollama automatically

---

## 📊 Automation Flow

```
Run Agent
    ↓
Record Run (learning.recordRun)
    ↓
Check Thresholds
    ↓
    ├─→ 100+ runs? → Auto-Export SFT Dataset
    │                      ↓
    │                 500+ examples? → Auto-Train LoRA
    │                                       ↓
    │                                  Auto-Deploy to Ollama
    │                                       ↓
    │                                  Update Model Variants
    └─→ Continue
```

---

## ⚙️ Configuration Options

### Learning System

```typescript
{
  enabled: boolean; // Enable/disable learning system
  
  rewardWeights: {
    compile: 0.25,  // Weight for compile pass/fail
    tests: 0.25,    // Weight for test pass rate
    errors: 0.25,   // Weight for error rate (lint/type/schema/boundary)
    human: 0.25,    // Weight for human accept/reject
  },
}
```

### Prompt Bandit

```typescript
{
  promptBandit: {
    epsilon: 0.1,  // Exploration rate (10% random)
    variants: ['default', 'detailed', 'concise'],
  },
}
```

### Model Router

```typescript
{
  modelRouter: {
    epsilon: 0.1,  // Exploration rate
    maxCostPerToken: 0.002,  // Max $2/1M tokens
  },
}
```

### Auto-Export

```typescript
{
  autoExport: {
    enabled: true,
    minRuns: 100,      // Export after 100 runs
    minReward: 0.7,    // Only export high-quality runs (reward ≥ 0.7)
    maxExamples: 1000, // Max examples per export
  },
}
```

### Auto-Train

```typescript
{
  autoTrain: {
    enabled: true,
    minExamples: 500,           // Train after 500 examples
    baseModel: 'qwen2.5-coder:7b',
    loraRank: 16,               // LoRA rank (16 is good default)
    epochs: 3,                  // Training epochs
    batchSize: 2,
    learningRate: 2e-4,
  },
}
```

### Auto-Deploy

```typescript
{
  autoDeploy: {
    enabled: true,
    modelNamePrefix: 'my-coder-tuned',  // Model name: my-coder-tuned-coder
    temperature: 0.2,
    topP: 0.9,
    topK: 40,
  },
}
```

### Drift Detection

```typescript
{
  driftDetection: {
    enabled: true,
    minPerformanceDrop: 0.05,  // 5% drop triggers rollback
    evaluationRuns: 20,        // Evaluate over 20 runs
  },
}
```

---

## 📁 File Structure

After automation runs, you'll see:

```
.agent/
├── experience.db                 # SQLite database
├── learning-config.json          # Configuration
├── prompt_variants.json          # Prompt bandit state
├── model_variants.json           # Model router state
├── sft/
│   ├── coder_sft.jsonl          # Exported SFT datasets
│   ├── fixer_sft.jsonl
│   └── judge_sft.jsonl
├── lora/
│   ├── coder/                   # Trained LoRA adapters
│   │   ├── adapter-unsloth-adapter.gguf
│   │   └── ...
│   ├── fixer/
│   └── judge/
├── train_coder.py               # Auto-generated training scripts
├── train_fixer.py
├── train_judge.py
├── Modelfile.coder              # Auto-generated Modelfiles
├── Modelfile.fixer
├── Modelfile.judge
├── last-export-coder.txt        # Tracking files
├── last-export-fixer.txt
├── last-train-coder.txt
└── last-train-fixer.txt
```

---

## 🔄 Automation Triggers

### Auto-Export Trigger

**Condition:** `highQualityRuns.length >= config.autoExport.minRuns`

**Action:**
1. Query top pairs with `reward >= minReward`
2. Export to `.agent/sft/{role}_sft.jsonl`
3. Update `.agent/last-export-{role}.txt`

**Example:**
```
✅ Recorded run 105 (reward: 0.85)
📦 Auto-exporting SFT dataset for coder...
✅ Exported 105 coder examples to .agent/sft/coder_sft.jsonl
```

### Auto-Train Trigger

**Condition:** `sftExamples.length >= config.autoTrain.minExamples`

**Action:**
1. Generate Python training script
2. Run training with Unsloth/PEFT
3. Convert LoRA to GGUF
4. Update `.agent/last-train-{role}.txt`

**Example:**
```
✅ Exported 505 coder examples
🚀 Auto-training LoRA adapter for coder...
   Dataset: .agent/sft/coder_sft.jsonl
   Output: .agent/lora/coder
🔧 Training LoRA adapter for coder...
[Training progress...]
✅ LoRA training complete for coder
```

### Auto-Deploy Trigger

**Condition:** Training completes successfully

**Action:**
1. Create Ollama Modelfile
2. Run `ollama create {modelName} -f Modelfile`
3. Add to model variants
4. Ready to use!

**Example:**
```
✅ LoRA training complete for coder
🚀 Deploying to Ollama: my-coder-tuned-coder
   Run with: ollama run my-coder-tuned-coder
✅ Model deployed: my-coder-tuned-coder
✅ Added my-coder-tuned-coder to model variants
```

---

## 📊 Monitoring

### Get Learning Stats

```typescript
const stats = learning.getStats();

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

### Check Automation Status

```bash
# Check if SFT datasets exist
ls -lh .agent/sft/

# Check if LoRA adapters exist
ls -lh .agent/lora/

# Check Ollama models
ollama list | grep my-coder-tuned
```

---

## 🎯 Expected Timeline

### Day 1-7 (0-100 runs)
- ✅ Prompt bandit learns best variants (+5-10% win rate)
- ✅ Model router learns best models (+10-20% cost savings)
- ⏳ Collecting data for SFT export

### Day 7-14 (100-500 runs)
- ✅ Auto-export triggered (100+ runs)
- ✅ SFT datasets created
- ⏳ Collecting data for LoRA training

### Day 14-30 (500+ runs)
- ✅ Auto-train triggered (500+ examples)
- ✅ LoRA adapter trained
- ✅ Auto-deploy to Ollama
- ✅ Custom model available (+10-20% compile rate)

### Month 2-3 (1000-2000+ runs)
- ✅ Continuous learning (weekly re-training)
- ✅ Model knows your codebase patterns
- ✅ +20-30% compile rate
- ✅ +30-50% convention score
- ✅ -2 to -3 iterations per task

---

## 🛡️ Safety Features

### Drift Detection

If new model performs worse than old model:
1. Detect performance drop (>5%)
2. Rollback to previous adapter
3. Log warning
4. Continue with old model

### Backup Adapters

Before deploying new adapter:
```bash
cp .agent/lora/coder/adapter.gguf .agent/lora/coder/adapter.backup.gguf
```

### Manual Override

Disable automation anytime:
```json
{
  "autoExport": { "enabled": false },
  "autoTrain": { "enabled": false },
  "autoDeploy": { "enabled": false }
}
```

---

## 🚀 Advanced Usage

### Curriculum Learning

Train separate adapters by task type:
```typescript
// Easy tasks → scaffold adapter
// Medium tasks → refactor adapter
// Hard tasks → schema adapter

const adapter = selectAdapterByComplexity(taskComplexity);
const model = `my-coder-tuned-${adapter}`;
```

### Multi-Role Learning

Train separate adapters for each role:
```typescript
// Coder role: spec → code
// Fixer role: diagnostics → patch
// Judge role: code → verdict

await learning.recordRun(taskSlug, modelName, promptId, result, 'coder');
await learning.recordRun(taskSlug, modelName, promptId, result, 'fixer');
await learning.recordRun(taskSlug, modelName, promptId, result, 'judge');
```

---

## 📚 Files

- `src/learning/config.ts` - Configuration management
- `src/learning/auto-learner.ts` - Automated learning orchestrator
- `src/learning/pipeline-integration.ts` - Easy pipeline hooks
- `src/learning/index.ts` - Exports

---

**Last Updated:** 2025-10-31  
**Status:** Production-ready! Zero-touch learning is live! 🚀

