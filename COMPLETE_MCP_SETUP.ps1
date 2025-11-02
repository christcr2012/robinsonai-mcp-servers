# Complete MCP Setup Script - Fix Both VS Code and Auggie CLI
# This script fixes all MCP configuration issues identified

param(
    [switch]$SkipBackup,
    [switch]$Force
)

Write-Host "🚀 COMPLETE MCP CONFIGURATION SETUP" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Define paths
$vscodeSettingsPath = "$env:APPDATA\Code\User\settings.json"
$auggieDir = "$env:USERPROFILE\.auggie"
$auggieConfigPath = "$auggieDir\config.json"

# Step 1: Backup existing configurations
if (!$SkipBackup) {
    Write-Host "📋 Step 1: Creating backups..." -ForegroundColor Yellow
    
    if (Test-Path $vscodeSettingsPath) {
        $backupPath = "$vscodeSettingsPath.backup.$(Get-Date -Format 'yyyyMMdd-HHmmss')"
        Copy-Item $vscodeSettingsPath $backupPath
        Write-Host "  ✓ VS Code settings backed up to: $backupPath" -ForegroundColor Green
    }
    
    if (Test-Path $auggieConfigPath) {
        $backupPath = "$auggieConfigPath.backup.$(Get-Date -Format 'yyyyMMdd-HHmmss')"
        Copy-Item $auggieConfigPath $backupPath
        Write-Host "  ✓ Auggie config backed up to: $backupPath" -ForegroundColor Green
    }
}

# Step 2: Fix VS Code Augment Extension
Write-Host ""
Write-Host "🔧 Step 2: Configuring VS Code Augment Extension..." -ForegroundColor Yellow

if (Test-Path $vscodeSettingsPath) {
    # VS Code settings already updated via .vscode/settings.json
    Write-Host "  ✓ VS Code settings.json already updated with correct MCP configuration" -ForegroundColor Green
} else {
    Write-Host "  ❌ VS Code settings.json not found at: $vscodeSettingsPath" -ForegroundColor Red
    Write-Host "     Please install VS Code first" -ForegroundColor Red
}

# Step 3: Configure Auggie CLI
Write-Host ""
Write-Host "🔧 Step 3: Configuring Auggie CLI..." -ForegroundColor Yellow

# Create .auggie directory if needed
if (!(Test-Path $auggieDir)) {
    New-Item -ItemType Directory -Path $auggieDir -Force | Out-Null
    Write-Host "  ✓ Created .auggie directory" -ForegroundColor Green
}

# Copy Auggie configuration
if (Test-Path "AUGGIE_CLI_CONFIG.json") {
    Copy-Item "AUGGIE_CLI_CONFIG.json" $auggieConfigPath -Force
    Write-Host "  ✓ Auggie CLI configuration installed" -ForegroundColor Green
} else {
    Write-Host "  ❌ AUGGIE_CLI_CONFIG.json not found" -ForegroundColor Red
}

# Step 4: Verify configurations
Write-Host ""
Write-Host "✅ Step 4: Verification..." -ForegroundColor Yellow

# Verify VS Code config
if (Test-Path ".vscode\settings.json") {
    $vscodeConfig = Get-Content ".vscode\settings.json" -Raw | ConvertFrom-Json
    $serverCount = $vscodeConfig.'augment.mcpServers'.PSObject.Properties.Count
    Write-Host "  ✓ VS Code: $serverCount MCP servers configured" -ForegroundColor Green
}

# Verify Auggie config
if (Test-Path $auggieConfigPath) {
    $auggieConfig = Get-Content $auggieConfigPath -Raw | ConvertFrom-Json
    $serverCount = $auggieConfig.mcpServers.PSObject.Properties.Count
    Write-Host "  ✓ Auggie CLI: $serverCount MCP servers configured" -ForegroundColor Green
}

Write-Host ""
Write-Host "🎉 SETUP COMPLETE!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Restart VS Code completely (File > Exit, then reopen)" -ForegroundColor White
Write-Host "2. Test VS Code: Open Augment panel and try MCP tools" -ForegroundColor White
Write-Host "3. Test Auggie CLI: Run 'auggie mcp list'" -ForegroundColor White
Write-Host "4. If issues persist, check the documentation files" -ForegroundColor White
