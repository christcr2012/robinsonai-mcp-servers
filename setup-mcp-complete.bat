@echo off
echo 🔧 Setting up MCP Servers for Augment Code and Auggie CLI...
echo.

REM 1. Verify MCP server binaries exist
echo 📦 Verifying MCP server installations...
set "missing_servers="

for %%s in (thinking-tools-mcp openai-mcp paid-agent-mcp credit-optimizer-mcp free-agent-mcp robinsons-toolkit-mcp) do (
    if exist "C:\nvm4w\nodejs\%%s.cmd" (
        echo ✅ %%s - Found
    ) else (
        echo ❌ %%s - Missing
        set "missing_servers=!missing_servers! %%s"
    )
)

REM 2. Install missing servers if any
if not "%missing_servers%"=="" (
    echo.
    echo ⚠️  Installing missing servers...
    for %%s in (%missing_servers%) do (
        echo Installing @robinsonai/%%s...
        npm install -g "@robinsonai/%%s"
    )
)

REM 3. Setup Auggie CLI configuration
echo.
echo 🖥️  Setting up Auggie CLI configuration...

if not exist "%USERPROFILE%\.auggie" (
    mkdir "%USERPROFILE%\.auggie"
    echo Created directory: %USERPROFILE%\.auggie
)

if exist "auggie-config.json" (
    copy "auggie-config.json" "%USERPROFILE%\.auggie\config.json" >nul
    echo ✅ Auggie CLI config installed
) else (
    echo ❌ auggie-config.json not found
)

REM 4. Verify VS Code settings
echo.
echo 📝 Verifying VS Code settings...

if exist ".vscode\settings.json" (
    echo ✅ VS Code settings found
) else (
    echo ❌ VS Code settings not found
)

echo.
echo 🎉 MCP Server setup complete!
echo.
echo Next steps:
echo 1. Restart VS Code to load new MCP server settings
echo 2. Open Augment settings panel and verify servers are connected
echo 3. Test Auggie CLI with: auggie --help
echo 4. Test MCP servers with agent commands
echo.
pause
