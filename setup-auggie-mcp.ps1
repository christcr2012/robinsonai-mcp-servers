# Setup Auggie CLI MCP Configuration
# This script configures all 6 MCP servers for Auggie CLI

Write-Host "🚀 Setting up Auggie CLI MCP Configuration..." -ForegroundColor Cyan

# Define Auggie config directory and file
$auggieDir = "$env:USERPROFILE\.auggie"
$auggieConfigPath = "$auggieDir\config.json"

# Create .auggie directory if it doesn't exist
if (!(Test-Path $auggieDir)) {
    New-Item -ItemType Directory -Path $auggieDir -Force
    Write-Host "  ✓ Created .auggie directory" -ForegroundColor Green
}

# Copy the configuration
$sourceConfig = "AUGGIE_CLI_CONFIG.json"
if (Test-Path $sourceConfig) {
    Copy-Item $sourceConfig $auggieConfigPath -Force
    Write-Host "  ✓ Copied MCP configuration to ~/.auggie/config.json" -ForegroundColor Green
} else {
    Write-Host "  ❌ Source config file not found: $sourceConfig" -ForegroundColor Red
    exit 1
}

# Verify the configuration
if (Test-Path $auggieConfigPath) {
    $config = Get-Content $auggieConfigPath -Raw | ConvertFrom-Json
    $serverCount = $config.mcpServers.PSObject.Properties.Count
    Write-Host "  ✓ Configuration verified: $serverCount MCP servers configured" -ForegroundColor Green
    
    # List configured servers
    Write-Host "  📋 Configured servers:" -ForegroundColor Yellow
    $config.mcpServers.PSObject.Properties | ForEach-Object {
        Write-Host "    • $($_.Name)" -ForegroundColor White
    }
} else {
    Write-Host "  ❌ Failed to create configuration file" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Auggie CLI MCP setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Restart any open terminals" -ForegroundColor White
Write-Host "2. Test with: auggie mcp list" -ForegroundColor White
Write-Host "3. Start interactive mode: auggie" -ForegroundColor White
