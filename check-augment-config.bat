@echo off
echo Checking Augment Configuration...
echo.

REM Check if settings.json exists
set SETTINGS_PATH=%APPDATA%\Code\User\settings.json
if not exist "%SETTINGS_PATH%" (
    echo ERROR: VS Code settings.json not found at %SETTINGS_PATH%
    echo.
    echo Possible locations:
    echo - %APPDATA%\Code\User\settings.json
    echo - %USERPROFILE%\AppData\Roaming\Code\User\settings.json
    echo - %LOCALAPPDATA%\Programs\Microsoft VS Code\User\settings.json
    pause
    exit /b 1
)

echo Found settings.json: %SETTINGS_PATH%
echo.

REM Check MCP configuration using PowerShell
echo Checking MCP servers configuration...
powershell -Command "& {try {$settings = Get-Content '%SETTINGS_PATH%' -Raw | ConvertFrom-Json; $mcpServers = $settings.'augment.mcpServers'; if ($mcpServers) {Write-Host 'MCP Servers found:' -ForegroundColor Green; $mcpServers.PSObject.Properties | ForEach-Object {Write-Host ('  - ' + $_.Name + ': ' + $_.Value.command) -ForegroundColor White}} else {Write-Host 'No MCP servers configured' -ForegroundColor Red}} catch {Write-Host ('Error reading settings: ' + $_.Exception.Message) -ForegroundColor Red}}"

echo.
echo Checking if MCP packages are available...
npm list -g 2>nul | findstr robinsonai
if %ERRORLEVEL% neq 0 (
    echo No @robinsonai packages found globally
    echo.
    echo Try installing them:
    echo npm install -g @robinsonai/free-agent-mcp
    echo npm install -g @robinsonai/paid-agent-mcp
    echo npm install -g @robinsonai/robinsons-toolkit-mcp
    echo npm install -g @robinsonai/thinking-tools-mcp
    echo npm install -g @robinsonai/credit-optimizer-mcp
    echo npm install -g @robinsonai/openai-mcp
)

echo.
echo Checking Ollama...
curl -s http://localhost:11434/api/tags >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo Ollama is running
) else (
    echo Ollama is not running or not accessible
    echo Start it with: ollama serve
)

echo.
echo ========================================
echo Configuration check complete
echo ========================================
pause
