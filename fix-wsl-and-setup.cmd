@echo off
echo Fixing WSL issues and setting up MCP servers...
echo.

echo Step 1: Attempting to fix WSL...
echo ================================

REM Try to shutdown WSL completely
echo Shutting down WSL...
wsl.exe --shutdown 2>nul

REM Wait a moment
timeout /t 3 /nobreak >nul

REM Try to unregister any broken distributions
echo Attempting to clean up broken WSL distributions...
wsl.exe --unregister Ubuntu 2>nul
wsl.exe --unregister Ubuntu-20.04 2>nul
wsl.exe --unregister Ubuntu-22.04 2>nul
wsl.exe --unregister Debian 2>nul

REM Install a fresh Ubuntu distribution
echo Installing fresh Ubuntu distribution...
wsl.exe --install -d Ubuntu --no-launch

echo.
echo Step 2: Testing npm access...
echo =============================

REM Try to find npm using full Windows paths
set "NODE_PATH="
for /f "tokens=*" %%i in ('where node.exe 2^>nul') do set "NODE_PATH=%%i"

if defined NODE_PATH (
    echo Found Node.js at: %NODE_PATH%
    
    REM Get the directory and look for npm
    for %%i in ("%NODE_PATH%") do set "NODE_DIR=%%~dpi"
    set "NPM_PATH=%NODE_DIR%npm.cmd"
    
    if exist "%NPM_PATH%" (
        echo Found npm at: %NPM_PATH%
        echo Testing npm...
        "%NPM_PATH%" --version
        if errorlevel 1 (
            echo ERROR: npm test failed
        ) else (
            echo SUCCESS: npm is working
            goto :setup_mcp
        )
    ) else (
        echo ERROR: npm.cmd not found in Node.js directory
    )
) else (
    echo ERROR: Node.js not found in PATH
)

echo.
echo Please install Node.js from https://nodejs.org/ if not already installed
echo Then restart this script.
pause
exit /b 1

:setup_mcp
echo.
echo Step 3: Setting up MCP servers...
echo =================================

echo Installing dependencies...
"%NPM_PATH%" install
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo Building packages...
"%NPM_PATH%" run build
if errorlevel 1 (
    echo ERROR: Failed to build packages
    pause
    exit /b 1
)

echo.
echo Step 4: Linking MCP servers...
echo ==============================

set "packages=free-agent-mcp paid-agent-mcp robinsons-toolkit-mcp thinking-tools-mcp credit-optimizer-mcp openai-mcp"

for %%p in (%packages%) do (
    echo.
    echo Linking %%p...
    cd packages\%%p
    if exist dist\ (
        "%NPM_PATH%" link
        if errorlevel 1 (
            echo WARNING: Failed to link %%p
        ) else (
            echo SUCCESS: Linked %%p
        )
    ) else (
        echo WARNING: No dist folder for %%p
    )
    cd ..\..
)

echo.
echo ========================================
echo Setup completed!
echo ========================================
echo.
echo If you still have issues, try:
echo 1. Restart your terminal as Administrator
echo 2. Run: wsl --install Ubuntu
echo 3. Reboot your computer
echo 4. Run this script again
echo.
pause
