# Install MCP Configuration for VS Code Augment
# Run this script to automatically install the ready-to-paste config

Write-Host "🔧 Robinson AI MCP Configuration Installer" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "READY_TO_PASTE_CONFIG.json")) {
    Write-Host "❌ Error: READY_TO_PASTE_CONFIG.json not found" -ForegroundColor Red
    Write-Host "   Please run this script from the robinsonai-mcp-servers directory" -ForegroundColor Yellow
    exit 1
}

# Ask user which config to use
Write-Host "Which configuration do you want to install?" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Basic (Ollama only - no API keys needed)" -ForegroundColor Green
Write-Host "2. Full (with API key placeholders - you'll need to edit)" -ForegroundColor Green
Write-Host ""
$choice = Read-Host "Enter choice (1 or 2)"

$sourceFile = ""
if ($choice -eq "1") {
    $sourceFile = "READY_TO_PASTE_CONFIG.json"
    Write-Host "✅ Installing basic configuration (Ollama only)" -ForegroundColor Green
} elseif ($choice -eq "2") {
    $sourceFile = "READY_TO_PASTE_CONFIG_WITH_INTEGRATIONS.json"
    Write-Host "✅ Installing full configuration (with API key placeholders)" -ForegroundColor Green
} else {
    Write-Host "❌ Invalid choice. Exiting." -ForegroundColor Red
    exit 1
}

# Backup existing config if it exists
if (Test-Path "augment-mcp-config.json") {
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $backupFile = "augment-mcp-config.backup.$timestamp.json"
    Copy-Item "augment-mcp-config.json" $backupFile
    Write-Host "📦 Backed up existing config to: $backupFile" -ForegroundColor Yellow
}

# Copy the config
Copy-Item $sourceFile "augment-mcp-config.json" -Force
Write-Host "✅ Configuration installed successfully!" -ForegroundColor Green
Write-Host ""

# Show what was installed
Write-Host "📋 Installed Configuration:" -ForegroundColor Cyan
Write-Host "   • Architect MCP (Strategic Planning)" -ForegroundColor White
Write-Host "   • Autonomous Agent MCP (Code Generation)" -ForegroundColor White
Write-Host "   • Credit Optimizer MCP (Autonomous Workflows)" -ForegroundColor White
Write-Host "   • Robinson's Toolkit MCP (912 Tools)" -ForegroundColor White
Write-Host ""

# Check Ollama
Write-Host "🔍 Checking Ollama..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -Method GET -TimeoutSec 2 -ErrorAction Stop
    Write-Host "✅ Ollama is running on http://localhost:11434" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Ollama is not running" -ForegroundColor Yellow
    Write-Host "   Start Ollama before using Architect or Autonomous Agent" -ForegroundColor Yellow
    Write-Host "   Run: ollama serve" -ForegroundColor White
}
Write-Host ""

# Next steps
Write-Host "📖 Next Steps:" -ForegroundColor Cyan
if ($choice -eq "2") {
    Write-Host "   1. Edit augment-mcp-config.json and replace YOUR_*_HERE with real API keys" -ForegroundColor Yellow
    Write-Host "   2. Remove any integrations you don't need" -ForegroundColor Yellow
    Write-Host "   3. Restart VS Code (Ctrl+Shift+P → 'Developer: Reload Window')" -ForegroundColor White
} else {
    Write-Host "   1. Restart VS Code (Ctrl+Shift+P → 'Developer: Reload Window')" -ForegroundColor White
}
Write-Host "   2. Test with: diagnose_architect, diagnose_autonomous_agent" -ForegroundColor White
Write-Host ""

Write-Host "✨ Installation complete!" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Tip: Run 'diagnose_architect' in Augment to verify everything works" -ForegroundColor Cyan

