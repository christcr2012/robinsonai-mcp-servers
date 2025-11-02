@echo off
echo 🚀 Robinson AI MCP Servers Publishing Script
echo ==========================================

echo.
echo 📋 Checking npm authentication...
npm whoami >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Not logged in to npm. Please run 'npm login' first.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('npm whoami') do set npm_user=%%i
echo ✅ Logged in as: %npm_user%

echo.
echo 📦 Publishing 8 MCP servers...

set published=0
set failed=0

echo.
echo 🔄 Publishing @robinsonai/free-agent-mcp v0.1.1...
cd packages\free-agent-mcp
npm publish --access public
if %errorlevel% equ 0 (
    echo ✅ Successfully published free-agent-mcp
    set /a published+=1
) else (
    echo ❌ Failed to publish free-agent-mcp
    set /a failed+=1
)
cd ..\..

echo.
echo 🔄 Publishing @robinsonai/paid-agent-mcp v0.2.0...
cd packages\paid-agent-mcp
npm publish --access public
if %errorlevel% equ 0 (
    echo ✅ Successfully published paid-agent-mcp
    set /a published+=1
) else (
    echo ❌ Failed to publish paid-agent-mcp
    set /a failed+=1
)
cd ..\..

echo.
echo 🔄 Publishing @robinsonai/thinking-tools-mcp v1.0.0...
cd packages\thinking-tools-mcp
npm publish --access public
if %errorlevel% equ 0 (
    echo ✅ Successfully published thinking-tools-mcp
    set /a published+=1
) else (
    echo ❌ Failed to publish thinking-tools-mcp
    set /a failed+=1
)
cd ..\..

echo.
echo 🔄 Publishing @robinsonai/credit-optimizer-mcp v0.1.1...
cd packages\credit-optimizer-mcp
npm publish --access public
if %errorlevel% equ 0 (
    echo ✅ Successfully published credit-optimizer-mcp
    set /a published+=1
) else (
    echo ❌ Failed to publish credit-optimizer-mcp
    set /a failed+=1
)
cd ..\..

echo.
echo 🔄 Publishing @robinsonai/github-mcp v2.0.0...
cd packages\github-mcp
npm publish --access public
if %errorlevel% equ 0 (
    echo ✅ Successfully published github-mcp
    set /a published+=1
) else (
    echo ❌ Failed to publish github-mcp
    set /a failed+=1
)
cd ..\..

echo.
echo 🔄 Publishing @robinsonai/vercel-mcp v1.0.0...
cd packages\vercel-mcp
npm publish --access public
if %errorlevel% equ 0 (
    echo ✅ Successfully published vercel-mcp
    set /a published+=1
) else (
    echo ❌ Failed to publish vercel-mcp
    set /a failed+=1
)
cd ..\..

echo.
echo 🔄 Publishing @robinsonai/neon-mcp v2.0.0...
cd packages\neon-mcp
npm publish --access public
if %errorlevel% equ 0 (
    echo ✅ Successfully published neon-mcp
    set /a published+=1
) else (
    echo ❌ Failed to publish neon-mcp
    set /a failed+=1
)
cd ..\..

echo.
echo 🔄 Publishing @robinsonai/openai-mcp v1.0.0...
cd packages\openai-mcp
npm publish --access public
if %errorlevel% equ 0 (
    echo ✅ Successfully published openai-mcp
    set /a published+=1
) else (
    echo ❌ Failed to publish openai-mcp
    set /a failed+=1
)
cd ..\..

echo.
echo 📊 PUBLISHING SUMMARY
echo ===================
echo ✅ Successfully published: %published% packages
echo ❌ Failed: %failed% packages
echo 📦 Total: 8 packages

if %published% gtr 0 (
    echo.
    echo 🎉 SUCCESS! You can now install these MCP servers:
    echo    npm install -g @robinsonai/free-agent-mcp
    echo    npm install -g @robinsonai/paid-agent-mcp
    echo    npm install -g @robinsonai/thinking-tools-mcp
    echo    npm install -g @robinsonai/credit-optimizer-mcp
    echo    npm install -g @robinsonai/github-mcp
    echo    npm install -g @robinsonai/vercel-mcp
    echo    npm install -g @robinsonai/neon-mcp
    echo    npm install -g @robinsonai/openai-mcp
)

echo.
echo ✨ Done!
pause
