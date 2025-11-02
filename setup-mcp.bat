@echo off
echo.
echo ========================================
echo   SIMPLE MCP CONFIGURATION SETUP
echo ========================================
echo.

REM Define paths
set "VSCODE_SETTINGS=%APPDATA%\Code\User\settings.json"
set "AUGGIE_DIR=%USERPROFILE%\.auggie"
set "AUGGIE_CONFIG=%AUGGIE_DIR%\config.json"

echo Step 1: Checking VS Code Augment Extension...
if exist "%VSCODE_SETTINGS%" (
    echo   [OK] VS Code settings.json found
    echo   [OK] VS Code settings already updated with correct MCP configuration
) else (
    echo   [ERROR] VS Code settings.json not found
    echo          Please install VS Code first
)

echo.
echo Step 2: Configuring Auggie CLI...

REM Create .auggie directory if needed
if not exist "%AUGGIE_DIR%" (
    mkdir "%AUGGIE_DIR%"
    echo   [OK] Created .auggie directory
)

REM Copy Auggie configuration
if exist "AUGGIE_CLI_CONFIG.json" (
    copy "AUGGIE_CLI_CONFIG.json" "%AUGGIE_CONFIG%" >nul
    echo   [OK] Auggie CLI configuration installed
) else (
    echo   [ERROR] AUGGIE_CLI_CONFIG.json not found
    echo          Make sure you're running this from the correct directory
)

echo.
echo Step 3: Verification...

REM Verify VS Code config
if exist ".vscode\settings.json" (
    echo   [OK] VS Code: Local settings.json found
) else (
    echo   [WARNING] Local .vscode\settings.json not found
)

REM Verify Auggie config
if exist "%AUGGIE_CONFIG%" (
    echo   [OK] Auggie CLI: Configuration file created
) else (
    echo   [ERROR] Auggie CLI: Configuration file not created
)

echo.
echo ========================================
echo   SETUP COMPLETE!
echo ========================================
echo.
echo Next steps:
echo 1. Restart VS Code completely (File ^> Exit, then reopen)
echo 2. Test VS Code: Open Augment panel and try MCP tools
echo 3. Test Auggie CLI: Run "auggie mcp list"
echo 4. If issues persist, check the MCP_CONFIGURATION_SOLUTION.md file
echo.
pause
