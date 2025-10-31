@echo off
echo.
echo Setting up Learning Environment
echo ================================
echo.

echo Checking Python...
python --version
if %errorlevel% neq 0 (
    echo ERROR: Python not found
    exit /b 1
)

echo.
echo Checking GPU...
nvidia-smi --query-gpu=name --format=csv,noheader 2>nul
if %errorlevel% equ 0 (
    echo GPU detected
    set GPU=1
) else (
    echo No GPU - training will be slow
    set GPU=0
)

echo.
echo Checking Ollama...
ollama list
if %errorlevel% neq 0 (
    echo ERROR: Ollama not found
    exit /b 1
)

echo.
echo Creating virtual environment...
if not exist .venv-learning (
    python -m venv .venv-learning
)

echo.
echo Activating virtual environment...
call .venv-learning\Scripts\activate.bat

echo.
echo Installing PyTorch...
if "%GPU%"=="1" (
    pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
) else (
    pip install torch torchvision torchaudio
)

echo.
echo Installing Unsloth...
pip install "unsloth[colab-new] @ git+https://github.com/unslothai/unsloth.git"

echo.
echo Installing other dependencies...
pip install --no-deps "xformers<0.0.27" "trl<0.9.0" peft accelerate bitsandbytes
pip install datasets transformers sentencepiece protobuf

echo.
echo Creating directories...
if not exist .agent\sft mkdir .agent\sft
if not exist .agent\lora\coder mkdir .agent\lora\coder
if not exist .agent\lora\fixer mkdir .agent\lora\fixer
if not exist .agent\lora\judge mkdir .agent\lora\judge

echo.
echo Setup complete!
echo.
echo Next steps:
echo 1. Integrate learning system into your agent
echo 2. Run 100+ tasks to trigger auto-export
echo 3. Run 500+ tasks to trigger auto-training
echo.
pause

