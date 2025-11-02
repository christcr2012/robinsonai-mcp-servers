@echo off
echo Fixing Augment Extension Hanging Issue...
echo.

REM Find VS Code settings.json
set SETTINGS_PATH=%APPDATA%\Code\User\settings.json
if not exist "%SETTINGS_PATH%" (
    echo ERROR: VS Code settings.json not found at %SETTINGS_PATH%
    pause
    exit /b 1
)

echo Found settings.json: %SETTINGS_PATH%

REM Create backup
set BACKUP_PATH=%SETTINGS_PATH%.backup-%date:~-4,4%-%date:~-10,2%-%date:~-7,2%-%time:~0,2%-%time:~3,2%-%time:~6,2%
copy "%SETTINGS_PATH%" "%BACKUP_PATH%" >nul
echo Backup created: %BACKUP_PATH%

REM Check if working config exists
if not exist "AUGMENT_WORKING_CONFIG.json" (
    echo ERROR: AUGMENT_WORKING_CONFIG.json not found
    pause
    exit /b 1
)

echo.
echo Updating MCP configuration to use npm exec instead of .cmd files...

REM Use PowerShell to update the JSON
powershell -Command "& {$settings = Get-Content '%SETTINGS_PATH%' -Raw | ConvertFrom-Json; $workingConfig = Get-Content 'AUGMENT_WORKING_CONFIG.json' -Raw | ConvertFrom-Json; $settings.'augment.mcpServers' = $workingConfig.mcpServers; $settings | ConvertTo-Json -Depth 10 | Set-Content '%SETTINGS_PATH%' -Encoding UTF8}"

if %ERRORLEVEL% neq 0 (
    echo ERROR: Failed to update settings
    copy "%BACKUP_PATH%" "%SETTINGS_PATH%" >nul
    echo Restored backup
    pause
    exit /b 1
)

echo Configuration updated successfully!

REM Clear Augment caches
echo.
echo Clearing Augment caches...
if exist "%APPDATA%\Code\User\workspaceStorage" rmdir /s /q "%APPDATA%\Code\User\workspaceStorage" 2>nul
if exist "%APPDATA%\Code\User\globalStorage\Augment.vscode-augment" rmdir /s /q "%APPDATA%\Code\User\globalStorage\Augment.vscode-augment" 2>nul
if exist "%APPDATA%\Code\CachedExtensions\Augment.vscode-augment" rmdir /s /q "%APPDATA%\Code\CachedExtensions\Augment.vscode-augment" 2>nul
echo Caches cleared

echo.
echo ========================================
echo AUGMENT EXTENSION FIX COMPLETE!
echo ========================================
echo.
echo Next steps:
echo 1. Restart VS Code completely (close all windows)
echo 2. Open VS Code and wait for Augment to initialize
echo 3. Try opening Augment settings (should work now)
echo 4. Test chat functionality
echo.
echo If still having issues:
echo - Check that Ollama is running: ollama serve
echo - Verify MCP packages: npm list -g ^| findstr robinsonai
echo - Check VS Code Developer Console for errors
echo.
pause
