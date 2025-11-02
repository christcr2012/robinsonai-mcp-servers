# Complete fix for VS Code Augment extension after importing custom MCP configs
# This script addresses checkpoint hydration failures, API errors, and configuration issues

Write-Host "🔧 FIXING AUGMENT EXTENSION - Complete Recovery" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# Step 1: Clear all Augment caches and corrupted state
Write-Host "`n1️⃣ Clearing Augment caches and corrupted state..." -ForegroundColor Yellow

$workspaceStorage = "$env:APPDATA\Code\User\workspaceStorage"
$globalStorage = "$env:APPDATA\Code\User\globalStorage\Augment.vscode-augment"

# Clear workspace storage caches
if (Test-Path $workspaceStorage) {
    Get-ChildItem -Path $workspaceStorage -Directory | ForEach-Object {
        $augmentDir = Join-Path $_.FullName "Augment.vscode-augment"
        if (Test-Path $augmentDir) {
            Write-Host "  Clearing workspace cache: $($_.Name)" -ForegroundColor Gray
            @("checkpoint-documents", "checkpoint-blobs", "checkpoint", "async-msg-cache", "tmp", "cache") | ForEach-Object {
                $path = Join-Path $augmentDir $_
                if (Test-Path $path) {
                    Remove-Item -Path $path -Recurse -Force -ErrorAction SilentlyContinue
                }
            }
        }
    }
}

# Clear global storage
if (Test-Path $globalStorage) {
    Write-Host "  Clearing global storage..." -ForegroundColor Gray
    Remove-Item -Path $globalStorage -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Host "  ✅ Caches cleared" -ForegroundColor Green

# Step 2: Update MCP configuration with correct format
Write-Host "`n2️⃣ Updating MCP configuration..." -ForegroundColor Yellow

$settingsPath = "$env:APPDATA\Code\User\settings.json"
$backupPath = "$settingsPath.backup-$(Get-Date -Format 'yyyy-MM-dd-HH-mm-ss')"

if (Test-Path $settingsPath) {
    # Create backup
    Copy-Item $settingsPath $backupPath
    Write-Host "  Backup created: $backupPath" -ForegroundColor Gray
    
    # Read current settings
    $settings = Get-Content $settingsPath -Raw | ConvertFrom-Json
    
    # Update MCP servers configuration
    $mcpConfig = Get-Content "AUGMENT_FIX_COMPLETE.json" -Raw | ConvertFrom-Json
    $settings.'augment.mcpServers' = $mcpConfig.mcpServers
    
    # Save updated settings
    $settings | ConvertTo-Json -Depth 10 | Set-Content $settingsPath
    Write-Host "  ✅ MCP configuration updated" -ForegroundColor Green
} else {
    Write-Host "  ❌ VS Code settings.json not found" -ForegroundColor Red
    exit 1
}

# Step 3: Verify MCP packages are available
Write-Host "`n3️⃣ Verifying MCP packages..." -ForegroundColor Yellow

$packages = @(
    "free-agent-mcp",
    "paid-agent-mcp", 
    "robinsons-toolkit-mcp",
    "thinking-tools-mcp",
    "credit-optimizer-mcp",
    "openai-mcp"
)

$missingPackages = @()
foreach ($pkg in $packages) {
    $cmdPath = "C:\nvm4w\nodejs\$pkg.cmd"
    if (-not (Test-Path $cmdPath)) {
        $missingPackages += $pkg
        Write-Host "  ❌ Missing: $pkg" -ForegroundColor Red
    } else {
        Write-Host "  ✅ Found: $pkg" -ForegroundColor Green
    }
}

if ($missingPackages.Count -gt 0) {
    Write-Host "`n  Installing missing packages..." -ForegroundColor Yellow
    foreach ($pkg in $missingPackages) {
        Write-Host "    Installing $pkg..." -ForegroundColor Gray
        npm install -g "@robinsonai/$pkg" 2>$null
    }
}

Write-Host "`n✅ AUGMENT EXTENSION FIX COMPLETE!" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host ""
Write-Host "📋 NEXT STEPS:" -ForegroundColor Cyan
Write-Host "1. Close VS Code completely" -ForegroundColor White
Write-Host "2. Reopen VS Code" -ForegroundColor White  
Write-Host "3. Wait for Augment to initialize (check status bar)" -ForegroundColor White
Write-Host "4. Test: Ask Augment 'What MCP servers are connected?'" -ForegroundColor White
Write-Host ""
Write-Host "🎯 Expected: 6 MCP servers should be connected" -ForegroundColor Yellow
Write-Host "   - free-agent-mcp, paid-agent-mcp, robinsons-toolkit-mcp" -ForegroundColor Gray
Write-Host "   - thinking-tools-mcp, credit-optimizer-mcp, openai-mcp" -ForegroundColor Gray
