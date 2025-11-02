@echo off
setlocal enabledelayedexpansion

echo ========================================
echo Robinson AI MCP Servers - Local Setup
echo ========================================
echo.

echo Step 1: Installing root dependencies...
echo =======================================
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install root dependencies
    pause
    exit /b 1
)
echo SUCCESS: Root dependencies installed
echo.

echo Step 2: Building all packages...
echo ================================
call npm run build
if errorlevel 1 (
    echo ERROR: Failed to build packages
    pause
    exit /b 1
)
echo SUCCESS: All packages built
echo.

echo Step 3: Linking MCP servers globally...
echo =======================================

set "servers=free-agent-mcp paid-agent-mcp robinsons-toolkit-mcp thinking-tools-mcp credit-optimizer-mcp openai-mcp"

for %%s in (%servers%) do (
    echo.
    echo Linking %%s...
    cd packages\%%s
    if exist dist\ (
        call npm unlink -g 2>nul
        call npm link
        if errorlevel 1 (
            echo WARNING: Failed to link %%s
        ) else (
            echo SUCCESS: Linked %%s
        )
    ) else (
        echo WARNING: No dist folder found for %%s
    )
    cd ..\..
)

echo.
echo Step 4: Verifying installations...
echo ==================================

echo Checking globally linked commands:
where free-agent-mcp 2>nul && echo SUCCESS: free-agent-mcp found || echo WARNING: free-agent-mcp not found
where paid-agent-mcp 2>nul && echo SUCCESS: paid-agent-mcp found || echo WARNING: paid-agent-mcp not found
where robinsons-toolkit-mcp 2>nul && echo SUCCESS: robinsons-toolkit-mcp found || echo WARNING: robinsons-toolkit-mcp not found
where thinking-tools-mcp 2>nul && echo SUCCESS: thinking-tools-mcp found || echo WARNING: thinking-tools-mcp not found
where credit-optimizer-mcp 2>nul && echo SUCCESS: credit-optimizer-mcp found || echo WARNING: credit-optimizer-mcp not found
where openai-mcp 2>nul && echo SUCCESS: openai-mcp found || echo WARNING: openai-mcp not found

echo.
echo ========================================
echo Setup completed!
echo ========================================
echo.
echo Your MCP servers are now built and linked globally.
echo You can use them in your MCP configuration files.
echo.
echo Commands available:
echo - free-agent-mcp
echo - paid-agent-mcp  
echo - robinsons-toolkit-mcp
echo - thinking-tools-mcp
echo - credit-optimizer-mcp
echo - openai-mcp
echo.
pause
