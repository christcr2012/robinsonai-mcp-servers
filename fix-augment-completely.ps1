# Complete Augment Fix Script
# Run this with VS Code CLOSED

$ErrorActionPreference = 'Stop'

Write-Host "`n=== AUGMENT COMPLETE FIX ===" -ForegroundColor Cyan
Write-Host "This will:" -ForegroundColor Yellow
Write-Host "  1. Verify VS Code is closed" -ForegroundColor Yellow
Write-Host "  2. Clear ALL Augment extension state" -ForegroundColor Yellow
Write-Host "  3. Restore working MCP config" -ForegroundColor Yellow
Write-Host "  4. Clean up settings.json" -ForegroundColor Yellow
Write-Host ""

# Step 1: Kill VS Code if running
$procs = Get-Process -Name code -ErrorAction SilentlyContinue
if ($procs) {
    Write-Host "Closing VS Code..." -ForegroundColor Yellow
    $procs | Stop-Process -Force
    Start-Sleep -Seconds 3
}

# Step 2: Paths
$settingsPath = "$env:APPDATA\Code\User\settings.json"
$globalStorage = "$env:APPDATA\Code\User\globalStorage\Augment.vscode-augment"
$workspaceStorage = "$env:APPDATA\Code\User\workspaceStorage"

# Step 3: Clear Augment globalStorage
if (Test-Path $globalStorage) {
    Write-Host "Clearing Augment globalStorage..." -ForegroundColor Yellow
    Remove-Item $globalStorage -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "  ✓ Cleared" -ForegroundColor Green
}

# Step 4: Clear Augment workspaceStorage
Get-ChildItem $workspaceStorage -Directory -ErrorAction SilentlyContinue | ForEach-Object {
    $augPath = Join-Path $_.FullName "Augment.vscode-augment"
    if (Test-Path $augPath) {
        Write-Host "Clearing workspace storage: $($_.Name)" -ForegroundColor Yellow
        Remove-Item $augPath -Recurse -Force -ErrorAction SilentlyContinue
    }
}
Write-Host "  ✓ Workspace storage cleared" -ForegroundColor Green

# Step 5: Fix settings.json - restore MCP config
Write-Host "Updating settings.json..." -ForegroundColor Yellow

if (Test-Path $settingsPath) {
    $settings = Get-Content $settingsPath -Raw | ConvertFrom-Json
    
    # Remove any broken Augment settings
    $augmentProps = $settings.PSObject.Properties | Where-Object { $_.Name -like "augment.*" }
    foreach ($prop in $augmentProps) {
        $settings.PSObject.Properties.Remove($prop.Name)
    }
    
    # Add clean MCP config
    $settings | Add-Member -MemberType NoteProperty -Name "augment.mcpServers" -Value @{
        "architect-mcp" = @{
            command = "npx"
            args = @("architect-mcp")
            env = @{
                OLLAMA_BASE_URL = "http://localhost:11434"
                ARCHITECT_FAST_MODEL = "qwen2.5:3b"
                ARCHITECT_STD_MODEL = "deepseek-coder:33b"
                ARCHITECT_BIG_MODEL = "qwen2.5-coder:32b"
            }
        }
        "autonomous-agent-mcp" = @{
            command = "npx"
            args = @("autonomous-agent-mcp")
            env = @{
                OLLAMA_BASE_URL = "http://localhost:11434"
            }
        }
        "credit-optimizer-mcp" = @{
            command = "npx"
            args = @("credit-optimizer-mcp")
            env = @{}
        }
    } -Force
    
    # Save
    $settings | ConvertTo-Json -Depth 10 | Set-Content $settingsPath -Force
    Write-Host "  ✓ MCP servers configured" -ForegroundColor Green
    
} else {
    Write-Host "  ✗ settings.json not found at $settingsPath" -ForegroundColor Red
    exit 1
}

Write-Host "`n=== FIX COMPLETE ===" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Open VS Code" -ForegroundColor White
Write-Host "  2. Sign in: Ctrl+Shift+P → 'Augment: Sign In'" -ForegroundColor White
Write-Host "  3. Test chat - should work immediately" -ForegroundColor White
Write-Host ""
