#!/bin/bash
# Setup Learning Environment - Install all dependencies for LoRA fine-tuning

echo "🔧 Setting up Learning Environment for LoRA Fine-Tuning"
echo "========================================================"
echo ""

# Check Python version
echo "📋 Checking Python version..."
python --version
if [ $? -ne 0 ]; then
    echo "❌ Python not found. Please install Python 3.10+"
    exit 1
fi

# Check if we have GPU
echo ""
echo "🎮 Checking for GPU..."
if command -v nvidia-smi &> /dev/null; then
    nvidia-smi --query-gpu=name,memory.total --format=csv,noheader
    HAS_GPU=true
    echo "✅ GPU detected!"
else
    echo "⚠️  No GPU detected. Training will be VERY slow on CPU."
    echo "   Consider using Google Colab for GPU training."
    HAS_GPU=false
fi

# Check Ollama
echo ""
echo "🦙 Checking Ollama installation..."
if command -v ollama &> /dev/null; then
    echo "✅ Ollama installed"
    echo "📦 Available models:"
    ollama list
else
    echo "❌ Ollama not found. Please install from https://ollama.com"
    exit 1
fi

# Install Python dependencies
echo ""
echo "📦 Installing Python dependencies..."
echo "   This may take 5-10 minutes..."

# Create virtual environment (optional but recommended)
if [ ! -d ".venv-learning" ]; then
    echo "🔨 Creating virtual environment..."
    python -m venv .venv-learning
fi

# Activate virtual environment
if [ -f ".venv-learning/Scripts/activate" ]; then
    source .venv-learning/Scripts/activate  # Windows Git Bash
elif [ -f ".venv-learning/bin/activate" ]; then
    source .venv-learning/bin/activate      # Linux/Mac
fi

# Install PyTorch (GPU or CPU version)
if [ "$HAS_GPU" = true ]; then
    echo "🔥 Installing PyTorch with CUDA support..."
    pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
else
    echo "💻 Installing PyTorch (CPU only)..."
    pip install torch torchvision torchaudio
fi

# Install Unsloth (for fast LoRA training)
echo "⚡ Installing Unsloth..."
pip install "unsloth[colab-new] @ git+https://github.com/unslothai/unsloth.git"

# Install other dependencies
echo "📚 Installing other dependencies..."
pip install --no-deps "xformers<0.0.27" "trl<0.9.0" peft accelerate bitsandbytes
pip install datasets transformers sentencepiece protobuf

# Install Node.js dependencies (if not already installed)
echo ""
echo "📦 Installing Node.js dependencies..."
npm install

# Create .agent directory structure
echo ""
echo "📁 Creating .agent directory structure..."
mkdir -p .agent/sft
mkdir -p .agent/lora/coder
mkdir -p .agent/lora/fixer
mkdir -p .agent/lora/judge

# Create default learning config
echo ""
echo "⚙️  Creating default learning config..."
cat > .agent/learning-config.json <<EOF
{
  "enabled": true,
  "rewardWeights": {
    "compile": 0.25,
    "tests": 0.25,
    "errors": 0.25,
    "human": 0.25
  },
  "promptBandit": {
    "epsilon": 0.1,
    "variants": ["default", "detailed", "concise"]
  },
  "modelRouter": {
    "epsilon": 0.1,
    "maxCostPerToken": 0.002
  },
  "webKnowledge": {
    "enabled": true,
    "maxCacheAgeDays": 7,
    "summarizeLength": 3
  },
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
    "epochs": 3,
    "batchSize": 2,
    "learningRate": 0.0002
  },
  "autoDeploy": {
    "enabled": true,
    "modelNamePrefix": "my-coder-tuned",
    "temperature": 0.2,
    "topP": 0.9,
    "topK": 40
  },
  "driftDetection": {
    "enabled": true,
    "minPerformanceDrop": 0.05,
    "evaluationRuns": 20
  }
}
EOF

# Create prompt variants
echo ""
echo "📝 Creating prompt variants..."
cat > .agent/prompt_variants.json <<EOF
[
  {
    "id": "default",
    "name": "Default Prompt",
    "template": "default",
    "wins": 0,
    "trials": 0
  },
  {
    "id": "detailed",
    "name": "Detailed Prompt",
    "template": "detailed",
    "wins": 0,
    "trials": 0
  },
  {
    "id": "concise",
    "name": "Concise Prompt",
    "template": "concise",
    "wins": 0,
    "trials": 0
  }
]
EOF

# Create model variants
echo ""
echo "🤖 Creating model variants..."
cat > .agent/model_variants.json <<EOF
[
  {
    "id": "qwen2.5-coder:7b",
    "name": "Qwen 2.5 Coder 7B (Local)",
    "cost_per_1k": 0,
    "wins": 0,
    "trials": 0
  },
  {
    "id": "deepseek-coder:1.3b",
    "name": "DeepSeek Coder 1.3B (Local)",
    "cost_per_1k": 0,
    "wins": 0,
    "trials": 0
  },
  {
    "id": "qwen2.5:3b",
    "name": "Qwen 2.5 3B (Local)",
    "cost_per_1k": 0,
    "wins": 0,
    "trials": 0
  }
]
EOF

# Summary
echo ""
echo "✅ Setup Complete!"
echo "=================="
echo ""
echo "📊 Summary:"
echo "   ✅ Python dependencies installed"
echo "   ✅ Ollama models available: qwen2.5-coder:7b, deepseek-coder:1.3b, qwen2.5:3b"
echo "   ✅ .agent directory structure created"
echo "   ✅ Learning config created"
echo "   ✅ Prompt variants created"
echo "   ✅ Model variants created"
echo ""
echo "🚀 Next Steps:"
echo "   1. Start using the learning system in your agent"
echo "   2. Run 100+ tasks to trigger auto-export"
echo "   3. Run 500+ tasks to trigger auto-training"
echo "   4. Custom LoRA model will be deployed automatically!"
echo ""
echo "📚 Documentation:"
echo "   - AUTOMATED_LEARNING.md - How to use the system"
echo "   - LORA_TRAINING_GUIDE.md - Manual training guide"
echo "   - LEARNING_SYSTEM.md - System architecture"
echo ""
echo "🎉 Ready to start learning!"

