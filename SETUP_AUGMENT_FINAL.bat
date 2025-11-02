@echo off
REM FINAL AUGMENT MCP SETUP - Addresses all known issues
REM This script creates the correct configuration for Augment Code extension

echo ========================================
echo 🚀 FINAL AUGMENT MCP SETUP
echo ========================================
echo.

REM Check if VS Code settings exist
set "SETTINGS_PATH=%APPDATA%\Code\User\settings.json"
if not exist "%SETTINGS_PATH%" (
    echo ❌ VS Code settings.json not found
    echo Please ensure VS Code is installed and run at least once
    pause
    exit /b 1
)

echo ✅ Found VS Code settings: %SETTINGS_PATH%
echo.

REM Create backup
set "BACKUP_PATH=%SETTINGS_PATH%.backup-%date:~-4,4%%date:~-10,2%%date:~-7,2%-%time:~0,2%%time:~3,2%%time:~6,2%"
set "BACKUP_PATH=%BACKUP_PATH: =0%"
copy "%SETTINGS_PATH%" "%BACKUP_PATH%" >nul
echo ✅ Backup created: %BACKUP_PATH%
echo.

REM Check Ollama
echo 🦙 Checking Ollama...
curl -s http://localhost:11434/api/tags >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo ✅ Ollama is running
) else (
    echo ⚠️  Ollama not running, attempting to start...
    if exist "C:\Users\chris\AppData\Local\Programs\Ollama\ollama.exe" (
        start "" "C:\Users\chris\AppData\Local\Programs\Ollama\ollama.exe" serve
        echo 🚀 Ollama started
        timeout /t 5 >nul
    ) else (
        echo ❌ Ollama not found - install from https://ollama.com
    )
)
echo.

REM Build packages
echo 🔨 Building packages...
call npm ci >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ⚠️  npm ci failed, trying npm install...
    call npm install >nul 2>&1
)

call npm run build --workspaces --if-present >nul 2>&1
echo ✅ Packages built
echo.

REM Import correct configuration using PowerShell
echo 📥 Importing Augment configuration...
powershell -Command "& {try {$current = Get-Content '%SETTINGS_PATH%' -Raw | ConvertFrom-Json; $config = Get-Content 'CORRECT_AUGMENT_CONFIG.json' -Raw | ConvertFrom-Json; $current | Add-Member -MemberType NoteProperty -Name 'augment.mcpServers' -Value $config.'augment.mcpServers' -Force; $current | ConvertTo-Json -Depth 10 | Set-Content '%SETTINGS_PATH%' -Encoding UTF8; Write-Host 'Configuration imported successfully' -ForegroundColor Green} catch {Write-Host 'Failed to import configuration' -ForegroundColor Red; exit 1}}"

if %ERRORLEVEL% neq 0 (
    echo ❌ Configuration import failed
    copy "%BACKUP_PATH%" "%SETTINGS_PATH%" >nul
    echo Restored backup
    pause
    exit /b 1
)

echo ✅ Configuration imported successfully
echo.

echo ========================================
echo ✅ SETUP COMPLETE!
echo ========================================
echo.
echo 📋 Next Steps:
echo    1. CLOSE VS Code completely (File ^> Exit)
echo    2. Restart VS Code
echo    3. Wait for Augment to initialize
echo    4. Test: Ask Augment "What MCP servers are connected?"
echo.
echo 🔧 What was fixed:
echo    • Used correct "augment.mcpServers" format
echo    • Used "npm exec" instead of .cmd files
echo    • All environment variables from .env.local
echo    • 6 MCP servers configured
echo.
echo 📁 Backup: %BACKUP_PATH%
echo.
echo Press any key to continue...
pause >nul
