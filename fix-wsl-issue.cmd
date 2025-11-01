@echo off
echo 🔧 Fixing WSL Issue for MCP Servers
echo =====================================
echo.

echo 1. Attempting to fix WSL configuration...
powershell.exe -Command "& {wsl --unregister Ubuntu 2>$null; Write-Host 'WSL Ubuntu unregistered'}"

echo.
echo 2. Testing if PowerShell commands work now...
powershell.exe -Command "& {Get-ChildItem node_modules\@robinsonai | Select-Object -First 5 | Format-Table Name}"

echo.
echo 3. Testing MCP server directly...
powershell.exe -Command "& {node packages\free-agent-mcp\dist\index.js --help 2>&1 | Select-Object -First 10}"

echo.
echo 4. Running diagnostic script...
powershell.exe -ExecutionPolicy Bypass -File diagnose-mcp-servers.ps1

echo.
echo Fix attempt complete. Check output above for results.
pause
