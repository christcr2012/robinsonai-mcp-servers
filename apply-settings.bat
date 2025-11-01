@echo off
echo 🔧 Applying MCP Settings to VS Code...
echo ==================================================

echo.
echo 📁 Creating VS Code User directory if needed...
if not exist "%APPDATA%\Code\User" (
    mkdir "%APPDATA%\Code\User"
    echo ✅ Created VS Code User directory
) else (
    echo ✅ VS Code User directory exists
)

echo.
echo 💾 Backing up existing settings if they exist...
if exist "%APPDATA%\Code\User\settings.json" (
    copy "%APPDATA%\Code\User\settings.json" "%APPDATA%\Code\User\settings.json.backup" >nul
    echo ✅ Backup created: settings.json.backup
) else (
    echo 📝 No existing settings found - creating new file
)

echo.
echo ⚙️  Applying MCP configuration...
if exist "VS_CODE_SETTINGS.json" (
    copy "VS_CODE_SETTINGS.json" "%APPDATA%\Code\User\settings.json" >nul
    echo ✅ MCP configuration applied successfully!
) else (
    echo ❌ Configuration file not found: VS_CODE_SETTINGS.json
    pause
    exit /b 1
)

echo.
echo 🔍 Validating configuration...
if exist "%APPDATA%\Code\User\settings.json" (
    echo ✅ Settings file created successfully
) else (
    echo ❌ Failed to create settings file
    pause
    exit /b 1
)

echo.
echo 🎉 MCP Settings Applied Successfully!
echo ==================================================
echo.
echo 📋 Next Steps:
echo 1. CLOSE VS Code completely (File ^> Exit)
echo 2. RESTART VS Code
echo 3. Open Augment Agent panel
echo 4. Test with: 'List available MCP tools'
echo 5. Try: 'Use delegate_code_generation to create a hello world function'
echo.
echo ✅ Expected Result:
echo - All 6 MCP servers should be connected
echo - Tools should be accessible without -mcp suffix
echo - FREE agent should handle most tasks (0 credits)
echo - OpenAI MCP should provide 249 OpenAI tools
echo - 96%% cost savings through delegation!
echo.
echo 🔄 If you want to restore original settings:
echo Copy %%APPDATA%%\Code\User\settings.json.backup back to settings.json
echo.
pause
