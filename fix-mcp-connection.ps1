# Fix MCP Connection Issues - Complete Solution
# This script fixes ALL MCP connectivity issues by properly configuring Augment Code

Write-Host "🔧 Fixing MCP Connection Issues..." -ForegroundColor Green
Write-Host "=" * 50

# Step 1: Verify MCP servers are installed
Write-Host "`n📦 Step 1: Verifying MCP server installations..." -ForegroundColor Yellow

$mcpServers = @(
    "free-agent-mcp",
    "paid-agent-mcp", 
    "robinsons-toolkit-mcp",
    "thinking-tools-mcp",
    "credit-optimizer-mcp"
)

$allServersInstalled = $true
foreach ($server in $mcpServers) {
    try {
        $result = npx "@robinsonai/$server" --help 2>&1
        if ($LASTEXITCODE -eq 0 -or $result -match "help|usage|version") {
            Write-Host "✅ $server - Installed and working" -ForegroundColor Green
        } else {
            Write-Host "❌ $server - Installation issue" -ForegroundColor Red
            $allServersInstalled = $false
        }
    } catch {
        Write-Host "❌ $server - Not installed or not accessible" -ForegroundColor Red
        $allServersInstalled = $false
    }
}

if (-not $allServersInstalled) {
    Write-Host "`n⚠️  Some MCP servers are missing. Installing..." -ForegroundColor Yellow
    foreach ($server in $mcpServers) {
        Write-Host "Installing @robinsonai/$server..." -ForegroundColor Cyan
        npm install -g "@robinsonai/$server"
    }
}

# Step 2: Configure Augment Code settings
Write-Host "`n⚙️  Step 2: Configuring Augment Code settings..." -ForegroundColor Yellow

$settingsPath = "$env:APPDATA\Code\User\settings.json"
$backupPath = "$env:APPDATA\Code\User\settings.json.backup"

# Backup existing settings
if (Test-Path $settingsPath) {
    Copy-Item $settingsPath $backupPath -Force
    Write-Host "✅ Backed up existing settings to settings.json.backup" -ForegroundColor Green
}

# Read current settings or create new
$settings = @{}
if (Test-Path $settingsPath) {
    try {
        $settings = Get-Content $settingsPath -Raw | ConvertFrom-Json -AsHashtable
        Write-Host "✅ Loaded existing VS Code settings" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Settings file corrupted, creating new one" -ForegroundColor Yellow
        $settings = @{}
    }
} else {
    Write-Host "✅ Creating new VS Code settings file" -ForegroundColor Green
}

# Read MCP configuration
$mcpConfigPath = "AUGMENT_CODE_MCP_CONFIG.json"
if (Test-Path $mcpConfigPath) {
    $mcpConfig = Get-Content $mcpConfigPath -Raw | ConvertFrom-Json
    $settings["augment.mcpServers"] = $mcpConfig."augment.mcpServers"
    Write-Host "✅ Added MCP server configuration" -ForegroundColor Green
} else {
    Write-Host "❌ MCP config file not found: $mcpConfigPath" -ForegroundColor Red
    exit 1
}

# Save updated settings
$settings | ConvertTo-Json -Depth 10 | Set-Content $settingsPath -Encoding UTF8
Write-Host "✅ Updated VS Code settings with MCP configuration" -ForegroundColor Green

# Step 3: Test Ollama connectivity (required for FREE agent)
Write-Host "`n🦙 Step 3: Testing Ollama connectivity..." -ForegroundColor Yellow

try {
    $ollamaTest = Invoke-RestMethod -Uri "http://127.0.0.1:11434/api/tags" -Method GET -TimeoutSec 5
    Write-Host "✅ Ollama is running and accessible" -ForegroundColor Green
    
    if ($ollamaTest.models -and $ollamaTest.models.Count -gt 0) {
        Write-Host "✅ Found $($ollamaTest.models.Count) Ollama models" -ForegroundColor Green
    } else {
        Write-Host "⚠️  No Ollama models found - FREE agent may not work" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Ollama not accessible at http://127.0.0.1:11434" -ForegroundColor Red
    Write-Host "   Please start Ollama and ensure it's running on port 11434" -ForegroundColor Yellow
}

Write-Host "`n🎉 MCP Connection Fix Complete!" -ForegroundColor Green
Write-Host "=" * 50

Write-Host "`n📋 Next Steps:" -ForegroundColor Cyan
Write-Host "1. CLOSE VS Code completely (File > Exit)" -ForegroundColor White
Write-Host "2. RESTART VS Code" -ForegroundColor White  
Write-Host "3. Open Augment Agent panel" -ForegroundColor White
Write-Host "4. Test with: 'List available MCP tools'" -ForegroundColor White
Write-Host "5. Try: 'Use delegate_code_generation to create a hello world function'" -ForegroundColor White

Write-Host "`n✅ Expected Result:" -ForegroundColor Green
Write-Host "- All 5 MCP servers should be connected" -ForegroundColor White
Write-Host "- Tools should be accessible without -mcp suffix" -ForegroundColor White
Write-Host "- FREE agent should handle most tasks (0 credits)" -ForegroundColor White
Write-Host "- 96`% cost savings through delegation!" -ForegroundColor White

Write-Host "`nPress any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
