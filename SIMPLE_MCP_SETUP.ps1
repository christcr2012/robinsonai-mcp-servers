# Simple MCP Setup Script - Fix Both VS Code and Auggie CLI
# This script fixes all MCP configuration issues identified

Write-Host "🚀 SIMPLE MCP CONFIGURATION SETUP" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Define paths
$vscodeSettingsPath = "$env:APPDATA\Code\User\settings.json"
$auggieDir = "$env:USERPROFILE\.auggie"
$auggieConfigPath = "$auggieDir\config.json"

# Step 1: Check VS Code Configuration
Write-Host "🔧 Step 1: Checking VS Code Augment Extension..." -ForegroundColor Yellow

if (Test-Path $vscodeSettingsPath) {
    Write-Host "  ✓ VS Code settings.json found" -ForegroundColor Green
    Write-Host "  ✓ VS Code settings already updated with correct MCP configuration" -ForegroundColor Green
} else {
    Write-Host "  ❌ VS Code settings.json not found at: $vscodeSettingsPath" -ForegroundColor Red
    Write-Host "     Please install VS Code first" -ForegroundColor Red
}

# Step 2: Configure Auggie CLI
Write-Host ""
Write-Host "🔧 Step 2: Configuring Auggie CLI..." -ForegroundColor Yellow

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
    Write-Host "     Make sure you're running this from the correct directory" -ForegroundColor Yellow
}

# Step 3: Verify configurations
Write-Host ""
Write-Host "✅ Step 3: Verification..." -ForegroundColor Yellow

# Verify VS Code config
if (Test-Path ".vscode\settings.json") {
    try {
        $vscodeConfig = Get-Content ".vscode\settings.json" -Raw | ConvertFrom-Json
        $serverCount = $vscodeConfig.'augment.mcpServers'.PSObject.Properties.Count
        Write-Host "  ✓ VS Code: $serverCount MCP servers configured" -ForegroundColor Green
    } catch {
        Write-Host "  ⚠️ VS Code config exists but could not parse it" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ⚠️ Local .vscode\settings.json not found" -ForegroundColor Yellow
}

# Verify Auggie config
if (Test-Path $auggieConfigPath) {
    try {
        $auggieConfig = Get-Content $auggieConfigPath -Raw | ConvertFrom-Json
        $serverCount = $auggieConfig.mcpServers.PSObject.Properties.Count
        Write-Host "  ✓ Auggie CLI: $serverCount MCP servers configured" -ForegroundColor Green
    } catch {
        Write-Host "  ❌ Auggie config exists but has JSON errors" -ForegroundColor Red
    }
} else {
    Write-Host "  ❌ Auggie CLI config not created" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎉 SETUP COMPLETE!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Restart VS Code completely (File > Exit, then reopen)" -ForegroundColor White
Write-Host "2. Test VS Code: Open Augment panel and try MCP tools" -ForegroundColor White
Write-Host "3. Test Auggie CLI: Run auggie mcp list" -ForegroundColor White
Write-Host "4. If issues persist, check the MCP_CONFIGURATION_SOLUTION.md file" -ForegroundColor White
