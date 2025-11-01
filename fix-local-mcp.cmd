@echo off
echo 🔧 Robinson AI MCP Local Fix Tool
echo ==================================================

echo.
echo Current directory: %CD%
echo.

echo 1. Building Local Packages...
echo.

if exist "packages\robinsons-toolkit-mcp\package.json" (
    echo Building robinsons-toolkit-mcp...
    cd packages\robinsons-toolkit-mcp
    call npm install
    call npm run build
    cd ..\..
    if %errorlevel% neq 0 (
        echo ❌ Failed to build robinsons-toolkit-mcp
    ) else (
        echo ✅ robinsons-toolkit-mcp built successfully
    )
) else (
    echo ❌ robinsons-toolkit-mcp package.json not found
)

echo.
if exist "packages\free-agent-mcp\package.json" (
    echo Building free-agent-mcp...
    cd packages\free-agent-mcp
    call npm install
    call npm run build
    cd ..\..
    if %errorlevel% neq 0 (
        echo ❌ Failed to build free-agent-mcp
    ) else (
        echo ✅ free-agent-mcp built successfully
    )
) else (
    echo ❌ free-agent-mcp package.json not found
)

echo.
if exist "packages\paid-agent-mcp\package.json" (
    echo Building paid-agent-mcp...
    cd packages\paid-agent-mcp
    call npm install
    call npm run build
    cd ..\..
    if %errorlevel% neq 0 (
        echo ❌ Failed to build paid-agent-mcp
    ) else (
        echo ✅ paid-agent-mcp built successfully
    )
) else (
    echo ❌ paid-agent-mcp package.json not found
)

echo.
if exist "packages\thinking-tools-mcp\package.json" (
    echo Building thinking-tools-mcp...
    cd packages\thinking-tools-mcp
    call npm install
    call npm run build
    cd ..\..
    if %errorlevel% neq 0 (
        echo ❌ Failed to build thinking-tools-mcp
    ) else (
        echo ✅ thinking-tools-mcp built successfully
    )
) else (
    echo ❌ thinking-tools-mcp package.json not found
)

echo.
if exist "packages\credit-optimizer-mcp\package.json" (
    echo Building credit-optimizer-mcp...
    cd packages\credit-optimizer-mcp
    call npm install
    call npm run build
    cd ..\..
    if %errorlevel% neq 0 (
        echo ❌ Failed to build credit-optimizer-mcp
    ) else (
        echo ✅ credit-optimizer-mcp built successfully
    )
) else (
    echo ❌ credit-optimizer-mcp package.json not found
)

echo.
echo 2. Creating npm links for local packages...
echo.

cd packages\robinsons-toolkit-mcp
call npm link
cd ..\free-agent-mcp
call npm link
cd ..\paid-agent-mcp
call npm link
cd ..\thinking-tools-mcp
call npm link
cd ..\credit-optimizer-mcp
call npm link
cd ..\..

echo.
echo 3. Testing robinsons-toolkit-mcp server...
echo.

if exist "packages\robinsons-toolkit-mcp\dist\index.js" (
    echo ✅ robinsons-toolkit-mcp dist/index.js exists
    echo Testing server startup...
    timeout 3 >nul 2>&1 & node packages\robinsons-toolkit-mcp\dist\index.js 2>&1 | findstr /C:"Robinson's Toolkit MCP server running"
    if %errorlevel% equ 0 (
        echo ✅ MCP server starts successfully
    ) else (
        echo ⚠️  MCP server may have issues - check manually
    )
) else (
    echo ❌ robinsons-toolkit-mcp dist/index.js not found
)

echo.
echo 🎯 Local Build Complete!
echo.
echo Next steps:
echo 1. Update VS Code settings with LOCAL_AUGMENT_CONFIG.json (see below)
echo 2. Restart VS Code completely (File ^> Exit, then reopen)
echo 3. Test MCP connection in Augment
echo.
pause
