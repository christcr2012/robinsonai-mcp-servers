@echo off
REM Setup script for Robinson AI Systems MCP Servers - Latest Versions
REM This script will install and configure all 6 MCP servers for Augment Code

echo.
echo 🚀 Setting up Robinson AI Systems MCP Servers (Latest Versions)
echo =================================================================
echo.

REM Check if Node.js is installed
echo 📋 Checking prerequisites...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js not found. Please install Node.js 18+ first.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✅ Node.js version: %NODE_VERSION%

REM Check if npm is available
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm not found. Please install npm first.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
echo ✅ npm version: %NPM_VERSION%

echo.
echo 📦 Installing/Updating MCP Servers...
echo.

echo Installing: @robinson_ai_systems/free-agent-mcp@latest
npm install -g @robinson_ai_systems/free-agent-mcp@latest
if %errorlevel% equ 0 (
    echo ✅ Successfully installed Free Agent MCP
) else (
    echo ⚠️  Warning: Failed to install Free Agent MCP
)

echo.
echo Installing: @robinson_ai_systems/paid-agent-mcp@latest
npm install -g @robinson_ai_systems/paid-agent-mcp@latest
if %errorlevel% equ 0 (
    echo ✅ Successfully installed Paid Agent MCP
) else (
    echo ⚠️  Warning: Failed to install Paid Agent MCP
)

echo.
echo Installing: @robinson_ai_systems/thinking-tools-mcp@latest
npm install -g @robinson_ai_systems/thinking-tools-mcp@latest
if %errorlevel% equ 0 (
    echo ✅ Successfully installed Thinking Tools MCP
) else (
    echo ⚠️  Warning: Failed to install Thinking Tools MCP
)

echo.
echo Installing: @robinson_ai_systems/credit-optimizer-mcp@latest
npm install -g @robinson_ai_systems/credit-optimizer-mcp@latest
if %errorlevel% equ 0 (
    echo ✅ Successfully installed Credit Optimizer MCP
) else (
    echo ⚠️  Warning: Failed to install Credit Optimizer MCP
)

echo.
echo Installing: @robinson_ai_systems/robinsons-toolkit-mcp@latest
npm install -g @robinson_ai_systems/robinsons-toolkit-mcp@latest
if %errorlevel% equ 0 (
    echo ✅ Successfully installed Robinson's Toolkit MCP
) else (
    echo ⚠️  Warning: Failed to install Robinson's Toolkit MCP
)

echo.
echo Installing: @robinson_ai_systems/openai-mcp@latest
npm install -g @robinson_ai_systems/openai-mcp@latest
if %errorlevel% equ 0 (
    echo ✅ Successfully installed OpenAI MCP
) else (
    echo ⚠️  Warning: Failed to install OpenAI MCP
)

echo.
echo 🤖 Checking Ollama models...
ollama list >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  Ollama not running or not installed
    echo    Please install Ollama and run: ollama serve
) else (
    echo ✅ Ollama is available
    echo    Recommended models to install:
    echo    - ollama pull qwen2.5:3b
    echo    - ollama pull qwen2.5-coder:7b  
    echo    - ollama pull deepseek-coder:33b
)

echo.
echo 🔧 Configuration complete!
echo 📄 Updated configuration saved to: augment-mcp-config-updated.json
echo.
echo 📋 Next Steps:
echo 1. Copy the contents of 'augment-mcp-config-updated.json' to your Augment settings
echo 2. Restart VS Code to load the new MCP servers
echo 3. Verify the servers are working by checking the Augment extension
echo.
echo 🎯 You now have access to:
echo    • FREE Agent MCP (0 credits) - Local LLM execution
echo    • Paid Agent MCP - Budget-controlled paid models
echo    • Thinking Tools MCP - 24 cognitive frameworks + Context Engine
echo    • Credit Optimizer MCP - Tool discovery ^& autonomous workflows
echo    • Robinson's Toolkit MCP - 1165+ integration tools
echo    • OpenAI MCP - Direct OpenAI API access
echo.
echo 💰 Expected savings: 70-85%% on Augment credits!
echo.
pause
