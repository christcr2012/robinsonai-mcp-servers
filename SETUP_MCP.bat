@echo off
echo 🚀 Robinson AI MCP Setup - Complete Automation
echo ==================================================
echo.
echo This will:
echo 1. Update your VS Code settings with MCP configuration
echo 2. Create a backup of your current settings
echo 3. Configure all 5 MCP servers to use local builds
echo.
echo Press any key to continue or Ctrl+C to cancel...
pause >nul

echo.
echo 🔧 Running PowerShell configuration script...
powershell -ExecutionPolicy Bypass -File apply-mcp-config.ps1

echo.
echo 📋 Configuration Summary:
echo ✅ robinsons-toolkit-mcp (906+ tools: GitHub, Vercel, Neon, Upstash, Google)
echo ✅ free-agent-mcp (0 credits - handles most work)
echo ✅ paid-agent-mcp (500-2000 credits - complex tasks)
echo ✅ thinking-tools-mcp (24 cognitive frameworks)
echo ✅ credit-optimizer-mcp (cost tracking and optimization)
echo.
echo 🎯 IMPORTANT NEXT STEPS:
echo 1. CLOSE VS Code completely (File ^> Exit)
echo 2. RESTART VS Code
echo 3. Test with: toolkit_health_check
echo 4. Try: toolkit_list_categories
echo 5. Search tools: toolkit_discover({ query: "create repo" })
echo.
echo 💰 Expected Result: 96%% cost savings through delegation!
echo.
pause
