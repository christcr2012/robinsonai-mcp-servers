@echo off
echo 🔍 Robinson AI MCP Server Diagnostic Tool
echo ==================================================

echo.
echo 1. Checking VS Code MCP Configuration...
if exist "%APPDATA%\Code\User\settings.json" (
    echo ✅ Found VS Code settings.json
    findstr "augment.mcpServers" "%APPDATA%\Code\User\settings.json" >nul
    if %errorlevel%==0 (
        echo ✅ Found augment.mcpServers configuration
    ) else (
        echo ❌ No augment.mcpServers found in settings.json
    )
) else (
    echo ❌ VS Code settings.json not found
)

echo.
echo 2. Checking Global NPM Package Installation...
echo Checking @robinsonai/robinsons-toolkit-mcp...
npm list -g @robinsonai/robinsons-toolkit-mcp >nul 2>&1
if %errorlevel%==0 (
    echo ✅ @robinsonai/robinsons-toolkit-mcp is installed globally
) else (
    echo ❌ @robinsonai/robinsons-toolkit-mcp is NOT installed globally
)

echo Checking @robinsonai/free-agent-mcp...
npm list -g @robinsonai/free-agent-mcp >nul 2>&1
if %errorlevel%==0 (
    echo ✅ @robinsonai/free-agent-mcp is installed globally
) else (
    echo ❌ @robinsonai/free-agent-mcp is NOT installed globally
)

echo.
echo 3. Checking Local Build Status...
if exist "packages\robinsons-toolkit-mcp\dist\index.js" (
    echo ✅ Built: packages\robinsons-toolkit-mcp\dist\index.js
) else (
    echo ❌ Missing: packages\robinsons-toolkit-mcp\dist\index.js
)

if exist "packages\free-agent-mcp\dist\index.js" (
    echo ✅ Built: packages\free-agent-mcp\dist\index.js
) else (
    echo ❌ Missing: packages\free-agent-mcp\dist\index.js
)

echo.
echo 4. Checking Environment Variables...
if defined GITHUB_TOKEN (
    echo ✅ GITHUB_TOKEN is set
) else (
    echo ⚠️  GITHUB_TOKEN not set
)

if defined VERCEL_TOKEN (
    echo ✅ VERCEL_TOKEN is set
) else (
    echo ⚠️  VERCEL_TOKEN not set
)

if defined NEON_API_KEY (
    echo ✅ NEON_API_KEY is set
) else (
    echo ⚠️  NEON_API_KEY not set
)

echo.
echo 5. Testing Node.js and NPM...
node --version
npm --version

echo.
echo 🎯 Diagnosis Complete!
echo Check the results above to identify issues.
pause
