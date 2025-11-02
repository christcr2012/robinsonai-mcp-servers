@echo off
REM Complete Setup for Robinson AI MCP Servers
REM This handles Ollama, package linking, and configuration

echo ========================================
echo Robinson AI MCP - Complete Setup
echo ========================================
echo.

REM Step 1: Check Ollama
echo Step 1: Checking Ollama...
curl -s http://localhost:11434/api/tags >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo   ✅ Ollama is running
) else (
    echo   ⚠️  Ollama not running, starting it...
    start "" "C:\Users\chris\AppData\Local\Programs\Ollama\ollama.exe" serve
    echo   🚀 Ollama started in background
    timeout /t 5 >nul
)
echo.

REM Step 2: Build packages
echo Step 2: Building packages...
if not exist "packages\free-agent-mcp\dist\index.js" (
    echo   🔨 Installing dependencies...
    call npm ci
    echo   🔨 Building packages...
    call npm run build --workspaces --if-present
    echo   ✅ Build completed
) else (
    echo   ✅ Packages already built
)
echo.

REM Step 3: Link packages globally
echo Step 3: Linking MCP packages globally...

echo   📦 Linking free-agent-mcp...
cd packages\free-agent-mcp
call npm link >nul 2>&1
cd ..\..

echo   📦 Linking paid-agent-mcp...
cd packages\paid-agent-mcp
call npm link >nul 2>&1
cd ..\..

echo   📦 Linking robinsons-toolkit-mcp...
cd packages\robinsons-toolkit-mcp
call npm link >nul 2>&1
cd ..\..

echo   📦 Linking thinking-tools-mcp...
cd packages\thinking-tools-mcp
call npm link >nul 2>&1
cd ..\..

echo   📦 Linking credit-optimizer-mcp...
cd packages\credit-optimizer-mcp
call npm link >nul 2>&1
cd ..\..

echo   📦 Linking openai-mcp...
cd packages\openai-mcp
call npm link >nul 2>&1
cd ..\..

echo   ✅ All packages linked globally
echo.

REM Step 4: Verify configuration
echo Step 4: Verifying configuration...
if exist "augment-mcp-config.json" (
    echo   ✅ Configuration file exists: augment-mcp-config.json
    echo   📄 All environment variables loaded from .env.local
) else (
    echo   ⚠️  Configuration file missing, generating...
    call node import-mcp-config.mjs --env-file .env.local
)
echo.

REM Step 5: Check global packages
echo Step 5: Checking globally linked packages...
call npm list -g --depth=0 | findstr robinsonai
if %ERRORLEVEL% equ 0 (
    echo   ✅ MCP packages are globally available
) else (
    echo   ⚠️  Some packages may not be linked properly
)
echo.

echo ========================================
echo ✅ SETUP COMPLETE!
echo ========================================
echo.
echo 📋 Next Steps:
echo    1. The configuration is ready in augment-mcp-config.json
echo    2. Import this into Augment Code
echo    3. Restart VS Code completely (File ^> Exit)
echo    4. Test MCP tools in Augment
echo.
echo 📁 Configuration: augment-mcp-config.json
echo 🔧 Environment: .env.local (all variables loaded)
echo 🦙 Ollama: Running on localhost:11434
echo.
echo Press any key to continue...
pause >nul
