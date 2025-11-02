@echo off
echo Setting up Robinson AI MCP Servers for Local Development...
echo.

REM Run the PowerShell script
powershell -ExecutionPolicy Bypass -File "Setup-Local-MCP-Servers.ps1"

echo.
echo Setup completed! Press any key to exit...
pause >nul
