@echo off
echo 🚀 Robinson AI MCP Final Setup
echo ==================================================
echo.
echo Running PowerShell script to update VS Code settings...
echo.

powershell -ExecutionPolicy Bypass -Command "& '%~dp0update-settings-direct.ps1'"

if %errorlevel% equ 0 (
    echo.
    echo ✅ SUCCESS! MCP configuration applied.
    echo.
    echo 🎯 CRITICAL NEXT STEPS:
    echo 1. CLOSE VS Code completely ^(File ^> Exit^)
    echo 2. RESTART VS Code
    echo 3. Test connection with: toolkit_health_check
    echo.
    echo 🎉 You're ready for 96%% cost savings!
) else (
    echo.
    echo ❌ Setup failed. Please run manually:
    echo powershell -ExecutionPolicy Bypass -File update-settings-direct.ps1
)

echo.
pause
