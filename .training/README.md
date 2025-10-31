# 🎓 Training System Documentation

This folder contains all documentation and tools for the automated LoRA training system.

## 📚 Quick Start

**Want to train your model? Start here:**

1. **Read:** [`AUTOMATED_TRAINING_GUIDE.md`](./AUTOMATED_TRAINING_GUIDE.md) - Complete automation guide
2. **Check status:** `npm run check-training`
3. **Train:** `npm run train-colab -- --role=coder`
4. **Deploy:** Follow instructions in the guide

## 📁 Files in This Folder

### 🚀 Main Guides

- **[`AUTOMATED_TRAINING_GUIDE.md`](./AUTOMATED_TRAINING_GUIDE.md)** ⭐ START HERE
  - Complete automation guide
  - 3 levels of automation explained
  - Step-by-step workflow
  - Deployment instructions

### 📖 System Documentation

- **[`LEARNING_SYSTEM_COMPLETE.md`](./LEARNING_SYSTEM_COMPLETE.md)**
  - Complete learning system overview
  - Architecture and components
  - Expected impact and timeline

- **[`AUTOMATED_LEARNING_COMPLETE.md`](./AUTOMATED_LEARNING_COMPLETE.md)**
  - Automation implementation details
  - Before/after comparison
  - File structure

### 🛠️ Setup Scripts

- **[`setup.bat`](./setup.bat)** - Windows setup script (working!)
- **[`setup-learning.ps1`](./setup-learning.ps1)** - PowerShell setup script
- **[`setup-learning-environment.bat`](./setup-learning-environment.bat)** - Alternative Windows setup
- **[`setup-learning-environment.sh`](./setup-learning-environment.sh)** - Linux/Mac setup
- **[`SETUP_GUIDE.md`](./SETUP_GUIDE.md)** - Manual setup instructions

### 📓 Colab Notebooks

- **[`colab/AUTO_TRAIN_LORA.ipynb`](./colab/AUTO_TRAIN_LORA.ipynb)**
  - One-click training notebook
  - Pre-configured for your repo
  - Upload to Google Colab and run

## 🎯 Quick Commands

```bash
# Check if ready to train
npm run check-training

# Watch for training opportunities
npm run watch-training

# Open Colab for training
npm run train-colab -- --role=coder
npm run train-colab -- --role=fixer
npm run train-colab -- --role=judge
```

## 🔄 Workflow Overview

```
1. Use Agent (automatic)
   ↓
2. Collect Data (automatic)
   ↓
3. Export SFT (automatic after 100 runs)
   ↓
4. Check Status (npm run check-training)
   ↓
5. Train (npm run train-colab -- --role=coder)
   ↓
6. Click "Run All" in Colab
   ↓
7. Download Adapter (automatic)
   ↓
8. Deploy to Ollama (3 commands)
   ↓
9. Enjoy +20-30% Better Performance! 🎉
```

## 📊 Expected Results

| Timeline | Examples | Compile Rate | Convention Score |
|----------|----------|--------------|------------------|
| Week 2-3 | 500+ | +10-15% | +15-20% |
| Week 4-6 | 1000+ | +20-25% | +25-35% |
| Month 2-3 | 2000+ | +25-35% | +35-50% |

## 🎓 Learning Path

**New to the system?** Read in this order:

1. [`AUTOMATED_TRAINING_GUIDE.md`](./AUTOMATED_TRAINING_GUIDE.md) - How to train
2. [`LEARNING_SYSTEM_COMPLETE.md`](./LEARNING_SYSTEM_COMPLETE.md) - How it works
3. [`AUTOMATED_LEARNING_COMPLETE.md`](./AUTOMATED_LEARNING_COMPLETE.md) - Implementation details

**Just want to train?** 

1. Open [`AUTOMATED_TRAINING_GUIDE.md`](./AUTOMATED_TRAINING_GUIDE.md)
2. Jump to "Level 2: One-Click Colab Training"
3. Follow the steps

## 🆘 Troubleshooting

### "Not enough examples"

```bash
# Check how many you have
wc -l .agent/sft/coder_sft.jsonl

# Need 500+ lines
# Keep using the agent to collect more data
```

### "Colab training failed"

- **Out of memory:** Reduce `BATCH_SIZE` from 2 to 1
- **Timeout:** Reduce `MAX_STEPS` from 100 to 50
- **No GPU:** Enable GPU (Runtime → Change runtime type → GPU)

### "Adapter not working"

```bash
# Check base model exists
ollama list | grep qwen2.5-coder

# Check adapter file exists
ls .agent/lora/coder/lora_adapter_gguf/

# Verify Modelfile path
cat .agent/Modelfile.coder
```

## 🔗 Related Files

### In Main Repo

- **Learning System Code:** `packages/free-agent-mcp/src/learning/`
  - `experience-db.ts` - SQLite database
  - `learning-loop.ts` - Reward calculation
  - `make-sft.ts` - SFT exporter
  - `auto-learner.ts` - Automation orchestrator
  - `auto-train-monitor.ts` - Training monitor
  - `pipeline-integration.ts` - Easy integration

### GitHub Actions

- **Workflow:** `.github/workflows/auto-train-lora.yml`
- **Action:** `.github/actions/train-lora-colab/action.yml`

## 💡 Tips

1. **Train regularly** - Every 2-4 weeks as you accumulate data
2. **Start with coder** - Most impactful role
3. **Use free Colab** - No need for local GPU
4. **Monitor progress** - Check stats with `npm run check-training`
5. **Keep old adapters** - You can always roll back

## 🎉 You're Ready!

Everything you need is in this folder. Start with [`AUTOMATED_TRAINING_GUIDE.md`](./AUTOMATED_TRAINING_GUIDE.md) and you'll be training in minutes!

**Questions?** Check the troubleshooting section in the guide.

**Ready to train?** Run `npm run check-training` to see if you have enough data!

