# Clean Up Conflicting MCP Configuration Files
# This script removes redundant and conflicting configuration files

Write-Host "🧹 CLEANING UP CONFLICTING MCP CONFIGURATION FILES" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

# Define files to keep (the correct/working ones)
$filesToKeep = @(
    "AUGGIE_CLI_CONFIG.json",           # ✅ Correct Auggie CLI config
    "COMPLETE_MCP_SETUP.ps1",           # ✅ Main setup script
    "setup-auggie-mcp.ps1",             # ✅ Auggie setup script
    ".vscode\settings.json"             # ✅ VS Code config (already fixed)
)

# Define files to remove (redundant/conflicting)
$filesToRemove = @(
    "auggie-config.json",               # ❌ Old format
    "augment-mcp-config.json",          # ❌ Redundant
    "FIXED_MCP_CONFIG.json",            # ❌ Superseded
    "CORRECTED_AUGMENT_CONFIG.json",    # ❌ Superseded
    "CORRECT_AUGMENT_CONFIG.json",      # ❌ Superseded
    "AUGMENT_WORKING_CONFIG.json",      # ❌ Superseded
    "LOCAL_AUGMENT_CONFIG.json",        # ❌ Superseded
    "AUGMENT_FIX_COMPLETE.json",        # ❌ Superseded
    "MCP_SERVERS_IMPORT.json",          # ❌ Superseded
    "MCP_SERVERS_IMPORT.secrets.json",  # ❌ Superseded
    "MCP_HEALTH.json"                   # ❌ Superseded
)

# Define import files to remove (too many variants)
$importFilesToRemove = @(
    "AUGMENT_IMPORT_ALL_6_SERVERS.json",
    "AUGMENT_IMPORT_ALL_6_SERVERS_ALIGNED.json",
    "AUGMENT_IMPORT_CLEAN.json",
    "AUGMENT_IMPORT_CORE_5_SERVERS.json",
    "AUGMENT_IMPORT_FOR_UI.json",
    "AUGMENT_IMPORT_MINIMAL.json"
)

Write-Host "📋 Files to keep:" -ForegroundColor Green
$filesToKeep | ForEach-Object {
    if (Test-Path $_) {
        Write-Host "  ✓ $_" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ $_ (not found)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "🗑️ Removing redundant configuration files..." -ForegroundColor Yellow

$removedCount = 0

# Remove main config files
$filesToRemove | ForEach-Object {
    if (Test-Path $_) {
        Remove-Item $_ -Force
        Write-Host "  ✓ Removed: $_" -ForegroundColor Red
        $removedCount++
    }
}

# Remove import files
$importFilesToRemove | ForEach-Object {
    if (Test-Path $_) {
        Remove-Item $_ -Force
        Write-Host "  ✓ Removed: $_" -ForegroundColor Red
        $removedCount++
    }
}

# Remove import files from imports directory
if (Test-Path "imports") {
    Get-ChildItem "imports" -Filter "*.json" | ForEach-Object {
        Remove-Item $_.FullName -Force
        Write-Host "  ✓ Removed: imports\$($_.Name)" -ForegroundColor Red
        $removedCount++
    }
}

Write-Host ""
Write-Host "✅ Cleanup complete!" -ForegroundColor Green
Write-Host "   Removed $removedCount redundant files" -ForegroundColor White
Write-Host ""
Write-Host "📁 Remaining configuration files:" -ForegroundColor Yellow
Write-Host "  • .vscode\settings.json (VS Code Augment Extension)" -ForegroundColor White
Write-Host "  • AUGGIE_CLI_CONFIG.json (Template for Auggie CLI)" -ForegroundColor White
Write-Host "  • ~/.auggie/config.json (Actual Auggie CLI config)" -ForegroundColor White
Write-Host ""
Write-Host "🎯 Next: Run COMPLETE_MCP_SETUP.ps1 to apply configurations" -ForegroundColor Cyan
