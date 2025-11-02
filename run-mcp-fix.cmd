@echo off
echo 🔧 Robinson AI MCP Complete Fix Tool
echo ==================================================

echo.
echo Current directory: %CD%
echo.

echo 1. Installing Global MCP Packages...
echo.

echo Installing @robinsonai/robinsons-toolkit-mcp...
call npm install -g @robinsonai/robinsons-toolkit-mcp
if %errorlevel% neq 0 (
    echo ❌ Failed to install @robinsonai/robinsons-toolkit-mcp
) else (
    echo ✅ @robinsonai/robinsons-toolkit-mcp installed successfully
)

echo.
echo Installing @robinsonai/free-agent-mcp...
call npm install -g @robinsonai/free-agent-mcp
if %errorlevel% neq 0 (
    echo ❌ Failed to install @robinsonai/free-agent-mcp
) else (
    echo ✅ @robinsonai/free-agent-mcp installed successfully
)

echo.
echo Installing @robinsonai/paid-agent-mcp...
call npm install -g @robinsonai/paid-agent-mcp
if %errorlevel% neq 0 (
    echo ❌ Failed to install @robinsonai/paid-agent-mcp
) else (
    echo ✅ @robinsonai/paid-agent-mcp installed successfully
)

echo.
echo Installing @robinsonai/thinking-tools-mcp...
call npm install -g @robinsonai/thinking-tools-mcp
if %errorlevel% neq 0 (
    echo ❌ Failed to install @robinsonai/thinking-tools-mcp
) else (
    echo ✅ @robinsonai/thinking-tools-mcp installed successfully
)

echo.
echo Installing @robinsonai/credit-optimizer-mcp...
call npm install -g @robinsonai/credit-optimizer-mcp
if %errorlevel% neq 0 (
    echo ❌ Failed to install @robinsonai/credit-optimizer-mcp
) else (
    echo ✅ @robinsonai/credit-optimizer-mcp installed successfully
)

echo.
echo 2. Building Local Packages...
echo.

if exist "packages\robinsons-toolkit-mcp\package.json" (
    echo Building robinsons-toolkit-mcp...
    cd packages\robinsons-toolkit-mcp
    call npm run build
    cd ..\..
    if %errorlevel% neq 0 (
        echo ❌ Failed to build robinsons-toolkit-mcp
    ) else (
        echo ✅ robinsons-toolkit-mcp built successfully
    )
) else (
    echo ⚠️  robinsons-toolkit-mcp package.json not found
)

if exist "packages\free-agent-mcp\package.json" (
    echo Building free-agent-mcp...
    cd packages\free-agent-mcp
    call npm run build
    cd ..\..
    if %errorlevel% neq 0 (
        echo ❌ Failed to build free-agent-mcp
    ) else (
        echo ✅ free-agent-mcp built successfully
    )
) else (
    echo ⚠️  free-agent-mcp package.json not found
)

echo.
echo 3. Updating VS Code Settings...
echo.

if exist "CORRECTED_AUGMENT_CONFIG.json" (
    echo Found CORRECTED_AUGMENT_CONFIG.json
    echo Please manually update your VS Code settings with this configuration
    echo Location: %APPDATA%\Code\User\settings.json
    echo ✅ Configuration file ready
) else (
    echo ❌ CORRECTED_AUGMENT_CONFIG.json not found
)

echo.
echo 🎯 Fix Process Complete!
echo.
echo Next steps:
echo 1. Update VS Code settings with CORRECTED_AUGMENT_CONFIG.json
echo 2. Restart VS Code completely (File ^> Exit, then reopen)
echo 3. Test MCP connection in Augment
echo.
pause
