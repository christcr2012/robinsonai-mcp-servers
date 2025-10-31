@echo off
REM Setup Learning Environment - Install all dependencies for LoRA fine-tuning (Windows)

echo.
echo 🔧 Setting up Learning Environment for LoRA Fine-Tuning
echo ========================================================
echo.

REM Check Python version
echo 📋 Checking Python version...
python --version
if %errorlevel% neq 0 (
    echo ❌ Python not found. Please install Python 3.10+
    exit /b 1
)

REM Check if we have GPU
echo.
echo 🎮 Checking for GPU...
nvidia-smi --query-gpu=name,memory.total --format=csv,noheader 2>nul
if %errorlevel% equ 0 (
    set HAS_GPU=true
    echo ✅ GPU detected!
) else (
    set HAS_GPU=false
    echo ⚠️  No GPU detected. Training will be VERY slow on CPU.
    echo    Consider using Google Colab for GPU training.
)

REM Check Ollama
echo.
echo 🦙 Checking Ollama installation...
ollama list >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Ollama installed
    echo 📦 Available models:
    ollama list
) else (
    echo ❌ Ollama not found. Please install from https://ollama.com
    exit /b 1
)

REM Install Python dependencies
echo.
echo 📦 Installing Python dependencies...
echo    This may take 5-10 minutes...

REM Create virtual environment (optional but recommended)
if not exist ".venv-learning" (
    echo 🔨 Creating virtual environment...
    python -m venv .venv-learning
)

REM Activate virtual environment
call .venv-learning\Scripts\activate.bat

REM Install PyTorch (GPU or CPU version)
if "%HAS_GPU%"=="true" (
    echo 🔥 Installing PyTorch with CUDA support...
    pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
) else (
    echo 💻 Installing PyTorch (CPU only)...
    pip install torch torchvision torchaudio
)

REM Install Unsloth (for fast LoRA training)
echo ⚡ Installing Unsloth...
pip install "unsloth[colab-new] @ git+https://github.com/unslothai/unsloth.git"

REM Install other dependencies
echo 📚 Installing other dependencies...
pip install --no-deps "xformers<0.0.27" "trl<0.9.0" peft accelerate bitsandbytes
pip install datasets transformers sentencepiece protobuf

REM Install Node.js dependencies (if not already installed)
echo.
echo 📦 Installing Node.js dependencies...
call npm install

REM Create .agent directory structure
echo.
echo 📁 Creating .agent directory structure...
if not exist ".agent\sft" mkdir .agent\sft
if not exist ".agent\lora\coder" mkdir .agent\lora\coder
if not exist ".agent\lora\fixer" mkdir .agent\lora\fixer
if not exist ".agent\lora\judge" mkdir .agent\lora\judge

REM Create default learning config
echo.
echo ⚙️  Creating default learning config...
(
echo {
echo   "enabled": true,
echo   "rewardWeights": {
echo     "compile": 0.25,
echo     "tests": 0.25,
echo     "errors": 0.25,
echo     "human": 0.25
echo   },
echo   "promptBandit": {
echo     "epsilon": 0.1,
echo     "variants": ["default", "detailed", "concise"]
echo   },
echo   "modelRouter": {
echo     "epsilon": 0.1,
echo     "maxCostPerToken": 0.002
echo   },
echo   "webKnowledge": {
echo     "enabled": true,
echo     "maxCacheAgeDays": 7,
echo     "summarizeLength": 3
echo   },
echo   "autoExport": {
echo     "enabled": true,
echo     "minRuns": 100,
echo     "minReward": 0.7,
echo     "maxExamples": 1000
echo   },
echo   "autoTrain": {
echo     "enabled": true,
echo     "minExamples": 500,
echo     "baseModel": "qwen2.5-coder:7b",
echo     "loraRank": 16,
echo     "epochs": 3,
echo     "batchSize": 2,
echo     "learningRate": 0.0002
echo   },
echo   "autoDeploy": {
echo     "enabled": true,
echo     "modelNamePrefix": "my-coder-tuned",
echo     "temperature": 0.2,
echo     "topP": 0.9,
echo     "topK": 40
echo   },
echo   "driftDetection": {
echo     "enabled": true,
echo     "minPerformanceDrop": 0.05,
echo     "evaluationRuns": 20
echo   }
echo }
) > .agent\learning-config.json

REM Create prompt variants
echo.
echo 📝 Creating prompt variants...
(
echo [
echo   {
echo     "id": "default",
echo     "name": "Default Prompt",
echo     "template": "default",
echo     "wins": 0,
echo     "trials": 0
echo   },
echo   {
echo     "id": "detailed",
echo     "name": "Detailed Prompt",
echo     "template": "detailed",
echo     "wins": 0,
echo     "trials": 0
echo   },
echo   {
echo     "id": "concise",
echo     "name": "Concise Prompt",
echo     "template": "concise",
echo     "wins": 0,
echo     "trials": 0
echo   }
echo ]
) > .agent\prompt_variants.json

REM Create model variants
echo.
echo 🤖 Creating model variants...
(
echo [
echo   {
echo     "id": "qwen2.5-coder:7b",
echo     "name": "Qwen 2.5 Coder 7B (Local)",
echo     "cost_per_1k": 0,
echo     "wins": 0,
echo     "trials": 0
echo   },
echo   {
echo     "id": "deepseek-coder:1.3b",
echo     "name": "DeepSeek Coder 1.3B (Local)",
echo     "cost_per_1k": 0,
echo     "wins": 0,
echo     "trials": 0
echo   },
echo   {
echo     "id": "qwen2.5:3b",
echo     "name": "Qwen 2.5 3B (Local)",
echo     "cost_per_1k": 0,
echo     "wins": 0,
echo     "trials": 0
echo   }
echo ]
) > .agent\model_variants.json

REM Summary
echo.
echo ✅ Setup Complete!
echo ==================
echo.
echo 📊 Summary:
echo    ✅ Python dependencies installed
echo    ✅ Ollama models available: qwen2.5-coder:7b, deepseek-coder:1.3b, qwen2.5:3b
echo    ✅ .agent directory structure created
echo    ✅ Learning config created
echo    ✅ Prompt variants created
echo    ✅ Model variants created
echo.
echo 🚀 Next Steps:
echo    1. Start using the learning system in your agent
echo    2. Run 100+ tasks to trigger auto-export
echo    3. Run 500+ tasks to trigger auto-training
echo    4. Custom LoRA model will be deployed automatically!
echo.
echo 📚 Documentation:
echo    - AUTOMATED_LEARNING.md - How to use the system
echo    - LORA_TRAINING_GUIDE.md - Manual training guide
echo    - LEARNING_SYSTEM.md - System architecture
echo.
echo 🎉 Ready to start learning!
echo.
pause

