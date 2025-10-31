# Learning System Setup Guide

## ✅ What You Already Have

Based on your system:
- ✅ **Python 3.14.0** installed
- ✅ **Ollama** installed with models:
  - `qwen2.5-coder:7b` (4.7 GB) - Best for code generation
  - `deepseek-coder:1.3b` (776 MB) - Fast, lightweight
  - `qwen2.5:3b` (1.9 GB) - General purpose
- ✅ **Learning system code** (11 files, ~2,900 lines)

---

## 🚀 Quick Setup (5 Minutes)

### Step 1: Install Python Dependencies

```bash
# Create virtual environment (recommended)
python -m venv .venv-learning

# Activate it
# Windows (Git Bash):
source .venv-learning/Scripts/activate
# Windows (CMD):
.venv-learning\Scripts\activate.bat
# Linux/Mac:
source .venv-learning/bin/activate

# Install PyTorch (choose GPU or CPU version)
# GPU version (if you have NVIDIA GPU):
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121

# CPU version (if no GPU):
pip install torch torchvision torchaudio

# Install Unsloth (for fast LoRA training)
pip install "unsloth[colab-new] @ git+https://github.com/unslothai/unsloth.git"

# Install other dependencies
pip install --no-deps "xformers<0.0.27" "trl<0.9.0" peft accelerate bitsandbytes
pip install datasets transformers sentencepiece protobuf
```

### Step 2: Create .agent Directory Structure

```bash
mkdir -p .agent/sft
mkdir -p .agent/lora/coder
mkdir -p .agent/lora/fixer
mkdir -p .agent/lora/judge
```

### Step 3: Create Configuration Files

The learning system will auto-create these on first run, but you can create them manually:

**`.agent/learning-config.json`:**
```json
{
  "enabled": true,
  "autoExport": {
    "enabled": true,
    "minRuns": 100,
    "minReward": 0.7
  },
  "autoTrain": {
    "enabled": true,
    "minExamples": 500,
    "baseModel": "qwen2.5-coder:7b"
  },
  "autoDeploy": {
    "enabled": true,
    "modelNamePrefix": "my-coder-tuned"
  }
}
```

**`.agent/prompt_variants.json`:**
```json
[
  {"id": "default", "name": "Default", "wins": 0, "trials": 0},
  {"id": "detailed", "name": "Detailed", "wins": 0, "trials": 0},
  {"id": "concise", "name": "Concise", "wins": 0, "trials": 0}
]
```

**`.agent/model_variants.json`:**
```json
[
  {"id": "qwen2.5-coder:7b", "name": "Qwen Coder 7B", "cost_per_1k": 0, "wins": 0, "trials": 0},
  {"id": "deepseek-coder:1.3b", "name": "DeepSeek 1.3B", "cost_per_1k": 0, "wins": 0, "trials": 0}
]
```

---

## 🎯 Alternative: Use Google Colab (Recommended for Training)

If you don't have a GPU or want faster training, use Google Colab:

1. **Export SFT data locally** (after 100+ runs)
2. **Upload to Google Colab**
3. **Train LoRA adapter** (free GPU!)
4. **Download adapter**
5. **Deploy to local Ollama**

See `LORA_TRAINING_GUIDE.md` for Colab notebook template.

---

## 📊 Verify Setup

### Check Python Dependencies

```bash
python -c "import torch; print(f'PyTorch: {torch.__version__}')"
python -c "import transformers; print(f'Transformers: {transformers.__version__}')"
python -c "import peft; print(f'PEFT: {peft.__version__}')"
```

### Check Ollama Models

```bash
ollama list
```

Should show:
- `qwen2.5-coder:7b`
- `deepseek-coder:1.3b`
- `qwen2.5:3b`

### Check GPU (Optional)

```bash
# NVIDIA GPU:
nvidia-smi

# Check PyTorch GPU:
python -c "import torch; print(f'CUDA available: {torch.cuda.is_available()}')"
```

---

## 🚀 Start Using the Learning System

### Option 1: Integrate into Your Agent

```typescript
import { LearningPipeline } from './packages/free-agent-mcp/src/learning/index.js';

const learning = new LearningPipeline(repoRoot);

// Select prompt and model
const prompt = learning.selectPrompt();
const model = learning.selectModel('medium', 0.002);

// Run your agent
const result = await runYourAgent(designCard, prompt, model);

// Record run (triggers automation)
await learning.recordRun(
  designCard.name,
  model.id,
  prompt.id,
  result,
  'coder'
);

learning.close();
```

### Option 2: Manual Testing

```bash
# Build the learning system
cd packages/free-agent-mcp
npm run build

# Test the learning loop
node dist/learning/pipeline-integration.js
```

---

## 📈 What Happens Next

### After 100 Runs
```
✅ Recorded run 105 (reward: 0.85)
📦 Auto-exporting SFT dataset for coder...
✅ Exported 105 examples to .agent/sft/coder_sft.jsonl
```

### After 500 Examples
```
✅ Exported 505 examples
🚀 Auto-training LoRA adapter for coder...
   Dataset: .agent/sft/coder_sft.jsonl
   Output: .agent/lora/coder
🔧 Training LoRA adapter...
[Training progress...]
✅ LoRA training complete
```

### After Training
```
✅ LoRA training complete
🚀 Deploying to Ollama: my-coder-tuned-coder
✅ Model deployed
✅ Added to model variants
```

---

## 🛠️ Troubleshooting

### "No module named 'unsloth'"

```bash
pip install "unsloth[colab-new] @ git+https://github.com/unslothai/unsloth.git"
```

### "CUDA out of memory"

Reduce batch size in `.agent/learning-config.json`:
```json
{
  "autoTrain": {
    "batchSize": 1  // Reduce from 2 to 1
  }
}
```

### "Training is very slow"

Use Google Colab for training (free GPU):
1. Export SFT data locally
2. Upload to Colab
3. Train with free T4 GPU
4. Download adapter
5. Deploy to local Ollama

### "Ollama model not found"

Pull the model:
```bash
ollama pull qwen2.5-coder:7b
```

---

## 📚 Documentation

- **AUTOMATED_LEARNING.md** - How to use the automated system
- **LORA_TRAINING_GUIDE.md** - Manual training guide + Colab template
- **LEARNING_SYSTEM.md** - System architecture

---

## ✅ Checklist

- [ ] Python 3.10+ installed
- [ ] Virtual environment created
- [ ] PyTorch installed (GPU or CPU)
- [ ] Unsloth installed
- [ ] Other dependencies installed (peft, transformers, etc.)
- [ ] Ollama installed
- [ ] Ollama models pulled (qwen2.5-coder:7b)
- [ ] .agent directory structure created
- [ ] Configuration files created
- [ ] Learning system integrated into agent

---

## 🎉 You're Ready!

Once setup is complete, just run your agent and it will:
1. ✅ Record every run
2. ✅ Export SFT datasets after 100 runs
3. ✅ Train LoRA adapters after 500 examples
4. ✅ Deploy to Ollama automatically

**Zero manual intervention required!**

