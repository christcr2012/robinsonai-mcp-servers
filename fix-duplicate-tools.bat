@echo off
echo 🔧 Fixing duplicate tool names in MCP servers...
echo.

echo 📦 Building paid-agent-mcp with duplicate tools removed...
cd packages\paid-agent-mcp
call npx tsc
if %ERRORLEVEL% neq 0 (
    echo ❌ Build failed for paid-agent-mcp
    cd ..\..
    pause
    exit /b 1
)
cd ..\..

echo ✅ paid-agent-mcp rebuilt successfully
echo.

echo 📦 Building free-agent-mcp (contains file editing tools)...
cd packages\free-agent-mcp
call npx tsc
if %ERRORLEVEL% neq 0 (
    echo ❌ Build failed for free-agent-mcp
    cd ..\..
    pause
    exit /b 1
)
cd ..\..

echo ✅ free-agent-mcp rebuilt successfully
echo.

echo 🎯 Fix Summary:
echo ✅ Removed duplicate file editing tools from paid-agent-mcp:
echo    - file_str_replace
echo    - file_insert  
echo    - file_save
echo    - file_delete
echo    - file_read
echo.
echo ✅ File editing tools remain available in free-agent-mcp
echo.
echo 🚀 Next steps:
echo 1. Restart Augment to reload MCP servers
echo 2. Test that MCP servers work without "Duplicate tool names" error
echo 3. Use free-agent-mcp for file operations (0 credits!)
echo.
pause
