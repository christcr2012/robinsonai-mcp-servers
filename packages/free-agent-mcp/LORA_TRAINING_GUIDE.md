# LoRA Training & Ollama Integration Guide

## 🎯 Overview

This guide shows you how to **evolve your local Ollama model** with LoRA adapters trained on your own successful runs. This means:
- Your agent learns from its own experience
- All agents benefit from shared learning
- No need to rebuild full GGUF from scratch
- Serve custom models via Ollama with `ADAPTER` directive

---

## 📊 Workflow

```
1. Curate Data (make-sft.ts)
   ↓
2. Fine-Tune LoRA (Unsloth/PEFT)
   ↓
3. Convert to GGUF (Unsloth tools)
   ↓
4. Create Modelfile (Ollama)
   ↓
5. Serve Custom Model (ollama run)
```

---

## Step 1: Curate Training Data

### Export SFT Datasets

```bash
# Export high-quality examples (reward ≥ 0.7)
node packages/free-agent-mcp/src/learning/make-sft.ts . --min-reward=0.7 --limit=1000
```

This creates:
- `.agent/sft/coder_sft.jsonl` - Coder role (spec → code)
- `.agent/sft/fixer_sft.jsonl` - Fixer role (diagnostics → patch)
- `.agent/sft/judge_sft.jsonl` - Judge role (code → verdict)

### JSONL Format

```jsonl
{"instruction": "You are a precise code generator...", "input": "# Project Context\n...", "output": "# src/foo.ts\n```\n..."}
{"instruction": "You are a code fixer...", "input": "# Diagnostics\n...", "output": "{\"patch\": [...]}"}
```

---

## Step 2: Fine-Tune with LoRA

### Install Unsloth

```bash
pip install "unsloth[colab-new] @ git+https://github.com/unslothai/unsloth.git"
pip install --no-deps "xformers<0.0.27" "trl<0.9.0" peft accelerate bitsandbytes
```

### Training Script (train_lora.py)

```python
from unsloth import FastLanguageModel
import torch

# Load base model
model, tokenizer = FastLanguageModel.from_pretrained(
    model_name = "unsloth/qwen2.5-coder-7b-bnb-4bit",  # 4-bit quantized
    max_seq_length = 4096,
    dtype = None,
    load_in_4bit = True,
)

# Add LoRA adapters
model = FastLanguageModel.get_peft_model(
    model,
    r = 16,  # LoRA rank
    target_modules = ["q_proj", "k_proj", "v_proj", "o_proj",
                      "gate_proj", "up_proj", "down_proj"],
    lora_alpha = 16,
    lora_dropout = 0,
    bias = "none",
    use_gradient_checkpointing = "unsloth",
    random_state = 3407,
)

# Load dataset
from datasets import load_dataset
dataset = load_dataset("json", data_files=".agent/sft/coder_sft.jsonl", split="train")

# Format for training
def formatting_prompts_func(examples):
    instructions = examples["instruction"]
    inputs       = examples["input"]
    outputs      = examples["output"]
    texts = []
    for instruction, input, output in zip(instructions, inputs, outputs):
        text = f"### Instruction:\n{instruction}\n\n### Input:\n{input}\n\n### Response:\n{output}"
        texts.append(text)
    return { "text" : texts, }

dataset = dataset.map(formatting_prompts_func, batched = True)

# Train
from trl import SFTTrainer
from transformers import TrainingArguments

trainer = SFTTrainer(
    model = model,
    tokenizer = tokenizer,
    train_dataset = dataset,
    dataset_text_field = "text",
    max_seq_length = 4096,
    args = TrainingArguments(
        per_device_train_batch_size = 2,
        gradient_accumulation_steps = 4,
        warmup_steps = 5,
        max_steps = 60,  # Small dataset, few steps
        learning_rate = 2e-4,
        fp16 = not torch.cuda.is_bf16_supported(),
        bf16 = torch.cuda.is_bf16_supported(),
        logging_steps = 1,
        optim = "adamw_8bit",
        weight_decay = 0.01,
        lr_scheduler_type = "linear",
        seed = 3407,
        output_dir = "outputs",
    ),
)

trainer.train()

# Save LoRA adapter
model.save_pretrained("lora_adapter")
tokenizer.save_pretrained("lora_adapter")
```

### Run Training

```bash
python train_lora.py
```

**Expected time:** 5-30 minutes on GPU (depending on dataset size)

---

## Step 3: Convert LoRA to GGUF

### Option A: Unsloth Built-in Conversion

```python
# Add to train_lora.py after training
model.save_pretrained_gguf("coder_adapter", tokenizer, quantization_method = "q4_k_m")
```

This creates:
- `coder_adapter-unsloth.Q4_K_M.gguf` - Merged model (base + adapter)
- `coder_adapter-unsloth-adapter.gguf` - Adapter only (smaller)

### Option B: Manual Conversion (llama.cpp)

```bash
# Clone llama.cpp
git clone https://github.com/ggerganov/llama.cpp
cd llama.cpp

# Convert LoRA to GGUF
python convert-lora-to-ggml.py ../lora_adapter --outfile ../coder_adapter.gguf --outtype q4_k_m
```

---

## Step 4: Create Ollama Modelfile

### Modelfile (coder-tuned.Modelfile)

```dockerfile
# Base model (must match the model used for fine-tuning)
FROM qwen2.5-coder:7b

# Attach LoRA adapter
ADAPTER ./coder_adapter-unsloth-adapter.gguf

# System prompt
SYSTEM You are a precise code generator that follows project conventions. Generate code that compiles, passes tests, and matches the project style.

# Parameters
PARAMETER temperature 0.2
PARAMETER top_p 0.9
PARAMETER top_k 40
```

### Create Model

```bash
ollama create my-coder-tuned -f coder-tuned.Modelfile
```

---

## Step 5: Serve Custom Model

### Test Locally

```bash
ollama run my-coder-tuned
```

### Use in Agent

```typescript
// In learning-loop.ts or agent code
const model = 'my-coder-tuned';  // Use your custom model

const response = await ollamaGenerate({
  model,
  prompt: '...',
  options: { temperature: 0.2 },
});
```

---

## 🔄 Continuous Learning Loop

### Weekly Training Schedule

```bash
#!/bin/bash
# weekly-train.sh

# 1. Export new high-quality examples
node packages/free-agent-mcp/src/learning/make-sft.ts . --min-reward=0.7 --limit=1000

# 2. Train LoRA adapter
python train_lora.py

# 3. Convert to GGUF
# (done automatically by Unsloth)

# 4. Update Ollama model
ollama create my-coder-tuned -f coder-tuned.Modelfile

# 5. Test
ollama run my-coder-tuned "Write a React component for a user profile"

echo "✅ Model updated!"
```

### Cron Job (Run Every Sunday)

```bash
0 0 * * 0 /path/to/weekly-train.sh
```

---

## 📊 Curriculum Learning

### Train Separate Adapters by Task Type

```bash
# Easy tasks (scaffold, simple refactor)
node make-sft.ts . --min-reward=0.7 --task-type=scaffold > scaffold_sft.jsonl
python train_lora.py --data scaffold_sft.jsonl --output scaffold_adapter

# Medium tasks (refactor, feature)
node make-sft.ts . --min-reward=0.7 --task-type=refactor > refactor_sft.jsonl
python train_lora.py --data refactor_sft.jsonl --output refactor_adapter

# Hard tasks (schema, public API)
node make-sft.ts . --min-reward=0.7 --task-type=schema > schema_sft.jsonl
python train_lora.py --data schema_sft.jsonl --output schema_adapter
```

### Router Picks Adapter by Task

```typescript
// In learning-loop.ts
selectAdapter(taskComplexity: 'easy' | 'medium' | 'hard'): string {
  const adapters = {
    easy: 'my-coder-scaffold',
    medium: 'my-coder-refactor',
    hard: 'my-coder-schema',
  };
  return adapters[taskComplexity];
}
```

---

## 🛡️ Drift Detection

### Pin Last Good Adapter

```bash
# Before training new adapter
cp coder_adapter.gguf coder_adapter.backup.gguf

# After training, compare win rates
# If new adapter performs worse, rollback
cp coder_adapter.backup.gguf coder_adapter.gguf
ollama create my-coder-tuned -f coder-tuned.Modelfile
```

### Automated Drift Detection

```typescript
// In learning-loop.ts
async detectDrift(newAdapter: string, oldAdapter: string): Promise<boolean> {
  const newStats = await this.db.getAverageRewardByModel(newAdapter);
  const oldStats = await this.db.getAverageRewardByModel(oldAdapter);
  
  // If new adapter is >5% worse, it's drift
  const drift = newStats.avg_reward < oldStats.avg_reward * 0.95;
  
  if (drift) {
    console.warn('⚠️  Drift detected! Rolling back to old adapter.');
  }
  
  return drift;
}
```

---

## 📚 Resources

### Unsloth
- GitHub: https://github.com/unslothai/unsloth
- Docs: https://docs.unsloth.ai/
- Colab: https://colab.research.google.com/drive/1Ys44kVvmeZtnICzWz0xgpRnrIOjZAuxp

### Ollama
- Modelfile ADAPTER: https://github.com/ollama/ollama/blob/main/docs/modelfile.md#adapter
- Serving fine-tuned models: https://ollama.com/blog/fine-tuning

### llama.cpp
- LoRA→GGUF conversion: https://github.com/ggerganov/llama.cpp/blob/master/convert-lora-to-ggml.py

---

## 🎯 Expected Results

### After 1 Week (100-500 examples)
- **Compile rate:** +5-10%
- **Test pass rate:** +3-5%
- **Convention score:** +10-15%

### After 1 Month (500-2000 examples)
- **Compile rate:** +10-20%
- **Test pass rate:** +5-10%
- **Convention score:** +20-30%
- **Fewer iterations:** -1 to -2 per task

### After 3 Months (2000+ examples)
- **Compile rate:** +20-30%
- **Test pass rate:** +10-15%
- **Convention score:** +30-50%
- **Fewer iterations:** -2 to -3 per task
- **Model knows your codebase patterns**

---

**Last Updated:** 2025-10-31  
**Status:** Ready to use! Start collecting data and train your first adapter! 🚀

