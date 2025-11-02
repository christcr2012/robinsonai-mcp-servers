@echo off
echo 🔧 Fixing MCP Connection Issues...
echo ==================================================

echo.
echo 📦 Step 1: Verifying MCP server installations...
echo.

echo Testing FREE Agent MCP...
npx @robinsonai/free-agent-mcp --help >nul 2>&1
if %errorlevel%==0 (
    echo ✅ free-agent-mcp - Installed and working
) else (
    echo ❌ free-agent-mcp - Installing...
    npm install -g @robinsonai/free-agent-mcp
)

echo Testing PAID Agent MCP...
npx @robinsonai/paid-agent-mcp --help >nul 2>&1
if %errorlevel%==0 (
    echo ✅ paid-agent-mcp - Installed and working
) else (
    echo ❌ paid-agent-mcp - Installing...
    npm install -g @robinsonai/paid-agent-mcp
)

echo Testing Robinson's Toolkit MCP...
npx @robinsonai/robinsons-toolkit-mcp --help >nul 2>&1
if %errorlevel%==0 (
    echo ✅ robinsons-toolkit-mcp - Installed and working
) else (
    echo ❌ robinsons-toolkit-mcp - Installing...
    npm install -g @robinsonai/robinsons-toolkit-mcp
)

echo Testing Thinking Tools MCP...
npx @robinsonai/thinking-tools-mcp --help >nul 2>&1
if %errorlevel%==0 (
    echo ✅ thinking-tools-mcp - Installed and working
) else (
    echo ❌ thinking-tools-mcp - Installing...
    npm install -g @robinsonai/thinking-tools-mcp
)

echo Testing Credit Optimizer MCP...
npx @robinsonai/credit-optimizer-mcp --help >nul 2>&1
if %errorlevel%==0 (
    echo ✅ credit-optimizer-mcp - Installed and working
) else (
    echo ❌ credit-optimizer-mcp - Installing...
    npm install -g @robinsonai/credit-optimizer-mcp
)

echo.
echo ⚙️  Step 2: Configuring Augment Code settings...
echo.

set "SETTINGS_PATH=%APPDATA%\Code\User\settings.json"
set "BACKUP_PATH=%APPDATA%\Code\User\settings.json.backup"

if exist "%SETTINGS_PATH%" (
    echo ✅ Backing up existing VS Code settings...
    copy "%SETTINGS_PATH%" "%BACKUP_PATH%" >nul
) else (
    echo ✅ Creating new VS Code settings file...
    if not exist "%APPDATA%\Code\User" mkdir "%APPDATA%\Code\User"
)

echo ✅ Copying MCP configuration to VS Code settings...
copy "AUGMENT_CODE_MCP_CONFIG.json" "%SETTINGS_PATH%" >nul

echo.
echo 🦙 Step 3: Testing Ollama connectivity...
echo.

curl -s http://127.0.0.1:11434/api/tags >nul 2>&1
if %errorlevel%==0 (
    echo ✅ Ollama is running and accessible
) else (
    echo ❌ Ollama not accessible at http://127.0.0.1:11434
    echo    Please start Ollama and ensure it's running on port 11434
)

echo.
echo 🎉 MCP Connection Fix Complete!
echo ==================================================
echo.
echo 📋 Next Steps:
echo 1. CLOSE VS Code completely (File ^> Exit)
echo 2. RESTART VS Code
echo 3. Open Augment Agent panel
echo 4. Test with: 'List available MCP tools'
echo 5. Try: 'Use delegate_code_generation to create a hello world function'
echo.
echo ✅ Expected Result:
echo - All 5 MCP servers should be connected
echo - Tools should be accessible without -mcp suffix
echo - FREE agent should handle most tasks (0 credits)
echo - 96%% cost savings through delegation!
echo.
pause
