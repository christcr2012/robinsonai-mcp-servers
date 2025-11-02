# Setup MCP Servers for Augment Code and Auggie CLI
# This script configures MCP servers for both VS Code extension and CLI

Write-Host "🔧 Setting up MCP Servers for Augment Code and Auggie CLI..." -ForegroundColor Green

# 1. Verify MCP server binaries exist
$mcpServers = @(
    "thinking-tools-mcp",
    "openai-mcp", 
    "paid-agent-mcp",
    "credit-optimizer-mcp",
    "free-agent-mcp",
    "robinsons-toolkit-mcp"
)

Write-Host "`n📦 Verifying MCP server installations..." -ForegroundColor Yellow
$missingServers = @()

foreach ($server in $mcpServers) {
    $cmdPath = "C:\nvm4w\nodejs\$server.cmd"
    if (Test-Path $cmdPath) {
        Write-Host "✅ $server - Found at $cmdPath" -ForegroundColor Green
    } else {
        Write-Host "❌ $server - Missing at $cmdPath" -ForegroundColor Red
        $missingServers += $server
    }
}

if ($missingServers.Count -gt 0) {
    Write-Host "`n⚠️  Missing servers detected. Installing..." -ForegroundColor Yellow
    foreach ($server in $missingServers) {
        Write-Host "Installing @robinsonai/$server..." -ForegroundColor Cyan
        npm install -g "@robinsonai/$server"
    }
}

# 2. Setup Auggie CLI configuration
Write-Host "`n🖥️  Setting up Auggie CLI configuration..." -ForegroundColor Yellow

$auggieConfigDir = "$env:USERPROFILE\.auggie"
$auggieConfigPath = "$auggieConfigDir\config.json"

# Create .auggie directory if it doesn't exist
if (!(Test-Path $auggieConfigDir)) {
    New-Item -ItemType Directory -Path $auggieConfigDir -Force | Out-Null
    Write-Host "Created directory: $auggieConfigDir" -ForegroundColor Green
}

# Copy auggie config
if (Test-Path "auggie-config.json") {
    Copy-Item "auggie-config.json" $auggieConfigPath -Force
    Write-Host "✅ Auggie CLI config installed at: $auggieConfigPath" -ForegroundColor Green
} else {
    Write-Host "❌ auggie-config.json not found in current directory" -ForegroundColor Red
}

# 3. Verify VS Code settings
Write-Host "`n📝 Verifying VS Code settings..." -ForegroundColor Yellow

$vscodeSettingsPath = ".vscode\settings.json"
if (Test-Path $vscodeSettingsPath) {
    Write-Host "✅ VS Code settings found at: $vscodeSettingsPath" -ForegroundColor Green
} else {
    Write-Host "❌ VS Code settings not found. Please ensure .vscode/settings.json exists." -ForegroundColor Red
}

Write-Host "`n🎉 MCP Server setup complete!" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Restart VS Code to load new MCP server settings" -ForegroundColor White
Write-Host "2. Open Augment settings panel and verify servers are connected" -ForegroundColor White
Write-Host "3. Test Auggie CLI with: auggie --help" -ForegroundColor White
Write-Host "4. Test MCP servers with agent commands" -ForegroundColor White
