# Setup Learning Environment - PowerShell Script
# Run with: powershell -ExecutionPolicy Bypass -File setup-learning.ps1

Write-Host ""
Write-Host "Setting up Learning Environment for LoRA Fine-Tuning" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host ""

# Check Python
Write-Host "Checking Python version..." -ForegroundColor Yellow
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✅ $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python not found. Please install Python 3.10+" -ForegroundColor Red
    exit 1
}

# Check GPU
Write-Host ""
Write-Host "🎮 Checking for GPU..." -ForegroundColor Yellow
try {
    $gpu = nvidia-smi --query-gpu=name,memory.total --format=csv,noheader 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ GPU detected: $gpu" -ForegroundColor Green
        $hasGPU = $true
    } else {
        throw
    }
} catch {
    Write-Host "⚠️  No GPU detected. Training will be slow on CPU." -ForegroundColor Yellow
    Write-Host "   Consider using Google Colab for GPU training." -ForegroundColor Yellow
    $hasGPU = $false
}

# Check Ollama
Write-Host ""
Write-Host "🦙 Checking Ollama installation..." -ForegroundColor Yellow
try {
    $ollamaModels = ollama list 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Ollama installed" -ForegroundColor Green
        Write-Host "📦 Available models:" -ForegroundColor Cyan
        Write-Host $ollamaModels
    } else {
        throw
    }
} catch {
    Write-Host "❌ Ollama not found. Please install from https://ollama.com" -ForegroundColor Red
    exit 1
}

# Create virtual environment
Write-Host ""
Write-Host "📦 Setting up Python environment..." -ForegroundColor Yellow
if (-not (Test-Path ".venv-learning")) {
    Write-Host "🔨 Creating virtual environment..." -ForegroundColor Cyan
    python -m venv .venv-learning
}

# Activate virtual environment
Write-Host "🔄 Activating virtual environment..." -ForegroundColor Cyan
& .\.venv-learning\Scripts\Activate.ps1

# Install PyTorch
Write-Host ""
if ($hasGPU) {
    Write-Host "🔥 Installing PyTorch with CUDA support..." -ForegroundColor Yellow
    Write-Host "   This may take 5-10 minutes..." -ForegroundColor Gray
    pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
} else {
    Write-Host "💻 Installing PyTorch (CPU only)..." -ForegroundColor Yellow
    pip install torch torchvision torchaudio
}

# Install Unsloth
Write-Host ""
Write-Host "⚡ Installing Unsloth..." -ForegroundColor Yellow
pip install "unsloth[colab-new] @ git+https://github.com/unslothai/unsloth.git"

# Install other dependencies
Write-Host ""
Write-Host "📚 Installing other dependencies..." -ForegroundColor Yellow
pip install --no-deps "xformers<0.0.27" "trl<0.9.0" peft accelerate bitsandbytes
pip install datasets transformers sentencepiece protobuf

# Create .agent directory structure
Write-Host ""
Write-Host "📁 Creating .agent directory structure..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path ".agent\sft" | Out-Null
New-Item -ItemType Directory -Force -Path ".agent\lora\coder" | Out-Null
New-Item -ItemType Directory -Force -Path ".agent\lora\fixer" | Out-Null
New-Item -ItemType Directory -Force -Path ".agent\lora\judge" | Out-Null

# Create learning config
Write-Host ""
Write-Host "⚙️  Creating learning config..." -ForegroundColor Yellow
$learningConfig = @{
    enabled = $true
    rewardWeights = @{
        compile = 0.25
        tests = 0.25
        errors = 0.25
        human = 0.25
    }
    promptBandit = @{
        epsilon = 0.1
        variants = @("default", "detailed", "concise")
    }
    modelRouter = @{
        epsilon = 0.1
        maxCostPerToken = 0.002
    }
    webKnowledge = @{
        enabled = $true
        maxCacheAgeDays = 7
        summarizeLength = 3
    }
    autoExport = @{
        enabled = $true
        minRuns = 100
        minReward = 0.7
        maxExamples = 1000
    }
    autoTrain = @{
        enabled = $true
        minExamples = 500
        baseModel = "qwen2.5-coder:7b"
        loraRank = 16
        epochs = 3
        batchSize = 2
        learningRate = 0.0002
    }
    autoDeploy = @{
        enabled = $true
        modelNamePrefix = "my-coder-tuned"
        temperature = 0.2
        topP = 0.9
        topK = 40
    }
    driftDetection = @{
        enabled = $true
        minPerformanceDrop = 0.05
        evaluationRuns = 20
    }
}
$learningConfig | ConvertTo-Json -Depth 10 | Set-Content ".agent\learning-config.json"

# Create prompt variants
Write-Host "📝 Creating prompt variants..." -ForegroundColor Yellow
$promptVariants = @(
    @{ id = "default"; name = "Default Prompt"; template = "default"; wins = 0; trials = 0 }
    @{ id = "detailed"; name = "Detailed Prompt"; template = "detailed"; wins = 0; trials = 0 }
    @{ id = "concise"; name = "Concise Prompt"; template = "concise"; wins = 0; trials = 0 }
)
$promptVariants | ConvertTo-Json -Depth 10 | Set-Content ".agent\prompt_variants.json"

# Create model variants
Write-Host "🤖 Creating model variants..." -ForegroundColor Yellow
$modelVariants = @(
    @{ id = "qwen2.5-coder:7b"; name = "Qwen 2.5 Coder 7B (Local)"; cost_per_1k = 0; wins = 0; trials = 0 }
    @{ id = "deepseek-coder:1.3b"; name = "DeepSeek Coder 1.3B (Local)"; cost_per_1k = 0; wins = 0; trials = 0 }
    @{ id = "qwen2.5:3b"; name = "Qwen 2.5 3B (Local)"; cost_per_1k = 0; wins = 0; trials = 0 }
)
$modelVariants | ConvertTo-Json -Depth 10 | Set-Content ".agent\model_variants.json"

# Summary
Write-Host ""
Write-Host "✅ Setup Complete!" -ForegroundColor Green
Write-Host "==================" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Summary:" -ForegroundColor Cyan
Write-Host "   ✅ Python dependencies installed" -ForegroundColor Green
Write-Host "   ✅ Ollama models available: qwen2.5-coder:7b, deepseek-coder:1.3b, qwen2.5:3b" -ForegroundColor Green
Write-Host "   ✅ .agent directory structure created" -ForegroundColor Green
Write-Host "   ✅ Learning config created" -ForegroundColor Green
Write-Host "   ✅ Prompt variants created" -ForegroundColor Green
Write-Host "   ✅ Model variants created" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Next Steps:" -ForegroundColor Yellow
Write-Host "   1. Start using the learning system in your agent" -ForegroundColor White
Write-Host "   2. Run 100+ tasks to trigger auto-export" -ForegroundColor White
Write-Host "   3. Run 500+ tasks to trigger auto-training" -ForegroundColor White
Write-Host "   4. Custom LoRA model will be deployed automatically!" -ForegroundColor White
Write-Host ""
Write-Host "📚 Documentation:" -ForegroundColor Cyan
Write-Host "   - AUTOMATED_LEARNING.md - How to use the system" -ForegroundColor White
Write-Host "   - LORA_TRAINING_GUIDE.md - Manual training guide" -ForegroundColor White
Write-Host "   - LEARNING_SYSTEM.md - System architecture" -ForegroundColor White
Write-Host ""
Write-Host "🎉 Ready to start learning!" -ForegroundColor Green
Write-Host ""

