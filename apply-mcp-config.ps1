# Automatically update VS Code settings with MCP configuration
param(
    [switch]$Backup = $true
)

Write-Host "🔧 Updating VS Code Settings for MCP" -ForegroundColor Cyan
Write-Host "=" * 50

$settingsPath = "$env:APPDATA\Code\User\settings.json"
$configPath = "LOCAL_AUGMENT_CONFIG.json"

# Check if VS Code settings exist
if (-not (Test-Path $settingsPath)) {
    Write-Host "❌ VS Code settings.json not found at: $settingsPath" -ForegroundColor Red
    Write-Host "   Please make sure VS Code is installed and has been run at least once." -ForegroundColor Gray
    exit 1
}

# Check if our config exists
if (-not (Test-Path $configPath)) {
    Write-Host "❌ LOCAL_AUGMENT_CONFIG.json not found" -ForegroundColor Red
    exit 1
}

try {
    # Backup current settings
    if ($Backup) {
        $backupPath = "$settingsPath.backup.$(Get-Date -Format 'yyyyMMdd-HHmmss')"
        Copy-Item $settingsPath $backupPath
        Write-Host "✅ Backup created: $backupPath" -ForegroundColor Green
    }

    # Read current settings
    Write-Host "📖 Reading current VS Code settings..." -ForegroundColor Yellow
    $currentSettings = Get-Content $settingsPath -Raw | ConvertFrom-Json

    # Read MCP configuration
    Write-Host "📖 Reading MCP configuration..." -ForegroundColor Yellow
    $mcpConfig = Get-Content $configPath -Raw | ConvertFrom-Json

    # Update settings with MCP configuration
    Write-Host "🔄 Updating settings..." -ForegroundColor Yellow
    $currentSettings | Add-Member -MemberType NoteProperty -Name "augment.mcpServers" -Value $mcpConfig.'augment.mcpServers' -Force

    # Write back to settings
    Write-Host "💾 Saving updated settings..." -ForegroundColor Yellow
    $currentSettings | ConvertTo-Json -Depth 10 | Set-Content $settingsPath -Encoding UTF8

    Write-Host "✅ VS Code settings updated successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 MCP Servers Configured:" -ForegroundColor Cyan
    $mcpConfig.'augment.mcpServers'.PSObject.Properties | ForEach-Object {
        Write-Host "   • $($_.Name)" -ForegroundColor White
    }

    Write-Host ""
    Write-Host "🎯 Next Steps:" -ForegroundColor Cyan
    Write-Host "1. Close VS Code completely (File > Exit)" -ForegroundColor Gray
    Write-Host "2. Restart VS Code" -ForegroundColor Gray
    Write-Host "3. Open Augment and test with: toolkit_health_check" -ForegroundColor Gray
    Write-Host ""
    Write-Host "🔍 If you have issues, check the backup at:" -ForegroundColor Yellow
    if ($Backup) {
        Write-Host "   $backupPath" -ForegroundColor Gray
    }

} catch {
    Write-Host "❌ Error updating settings: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   You may need to manually update the settings." -ForegroundColor Gray
    exit 1
}

Write-Host ""
Write-Host "🎉 Configuration Complete!" -ForegroundColor Green
