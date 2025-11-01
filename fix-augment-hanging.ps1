# Fix Augment Extension Hanging Issue
# The extension is hanging because it's trying to execute non-existent .cmd files
# This script switches to the working npm exec configuration

Write-Host "🔧 FIXING AUGMENT EXTENSION HANGING ISSUE" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# Step 1: Find VS Code settings.json
$possiblePaths = @(
    "$env:APPDATA\Code\User\settings.json",
    "$env:USERPROFILE\AppData\Roaming\Code\User\settings.json",
    "$env:LOCALAPPDATA\Programs\Microsoft VS Code\User\settings.json"
)

$settingsPath = $null
foreach ($path in $possiblePaths) {
    if (Test-Path $path) {
        $settingsPath = $path
        break
    }
}

if (-not $settingsPath) {
    Write-Host "❌ Could not find VS Code settings.json" -ForegroundColor Red
    Write-Host "Checked paths:" -ForegroundColor Yellow
    $possiblePaths | ForEach-Object { Write-Host "  - $_" -ForegroundColor Gray }
    exit 1
}

Write-Host "✅ Found settings.json: $settingsPath" -ForegroundColor Green

# Step 2: Backup current settings
$backupPath = "$settingsPath.backup-$(Get-Date -Format 'yyyy-MM-dd-HH-mm-ss')"
Copy-Item $settingsPath $backupPath
Write-Host "✅ Backup created: $backupPath" -ForegroundColor Green

# Step 3: Read current settings
try {
    $settings = Get-Content $settingsPath -Raw | ConvertFrom-Json
    Write-Host "✅ Current settings loaded" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to parse settings.json: $_" -ForegroundColor Red
    exit 1
}

# Step 4: Load working MCP configuration
if (-not (Test-Path "AUGMENT_WORKING_CONFIG.json")) {
    Write-Host "❌ AUGMENT_WORKING_CONFIG.json not found" -ForegroundColor Red
    exit 1
}

try {
    $workingConfig = Get-Content "AUGMENT_WORKING_CONFIG.json" -Raw | ConvertFrom-Json
    Write-Host "✅ Working configuration loaded" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to parse AUGMENT_WORKING_CONFIG.json: $_" -ForegroundColor Red
    exit 1
}

# Step 5: Update MCP servers configuration
$settings.'augment.mcpServers' = $workingConfig.mcpServers
Write-Host "✅ MCP servers configuration updated" -ForegroundColor Green

# Step 6: Save updated settings
try {
    $settings | ConvertTo-Json -Depth 10 | Set-Content $settingsPath -Encoding UTF8
    Write-Host "✅ Settings saved successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to save settings: $_" -ForegroundColor Red
    Write-Host "Restoring backup..." -ForegroundColor Yellow
    Copy-Item $backupPath $settingsPath
    exit 1
}

# Step 7: Clear Augment caches
Write-Host "`n🧹 Clearing Augment caches..." -ForegroundColor Yellow

$cachePaths = @(
    "$env:APPDATA\Code\User\workspaceStorage",
    "$env:APPDATA\Code\User\globalStorage\Augment.vscode-augment",
    "$env:APPDATA\Code\CachedExtensions\Augment.vscode-augment",
    "$env:APPDATA\Code\logs"
)

foreach ($cachePath in $cachePaths) {
    if (Test-Path $cachePath) {
        try {
            Remove-Item $cachePath -Recurse -Force -ErrorAction SilentlyContinue
            Write-Host "  ✅ Cleared: $cachePath" -ForegroundColor Green
        } catch {
            Write-Host "  ⚠️  Could not clear: $cachePath" -ForegroundColor Yellow
        }
    }
}

Write-Host "`n✅ AUGMENT EXTENSION FIX COMPLETE!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Restart VS Code completely (close all windows)" -ForegroundColor White
Write-Host "2. Open VS Code and wait for Augment to initialize" -ForegroundColor White
Write-Host "3. Try opening Augment settings (should work now)" -ForegroundColor White
Write-Host "4. Test chat functionality" -ForegroundColor White
Write-Host ""
Write-Host "If still having issues:" -ForegroundColor Yellow
Write-Host "- Check that Ollama is running: ollama serve" -ForegroundColor Gray
Write-Host "- Verify MCP packages are installed: npm list -g | findstr robinsonai" -ForegroundColor Gray
Write-Host "- Check VS Code Developer Console for errors" -ForegroundColor Gray
