# Apply MCP Settings to VS Code
# This script updates VS Code settings with MCP server configuration

Write-Host "🔧 Applying MCP Settings to VS Code..." -ForegroundColor Green
Write-Host "=" * 50

# Define paths
$settingsPath = "$env:APPDATA\Code\User\settings.json"
$backupPath = "$env:APPDATA\Code\User\settings.json.backup"
$configPath = "VS_CODE_SETTINGS.json"

# Create VS Code User directory if it doesn't exist
$userDir = "$env:APPDATA\Code\User"
if (-not (Test-Path $userDir)) {
    Write-Host "📁 Creating VS Code User directory..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $userDir -Force | Out-Null
    Write-Host "✅ Created: $userDir" -ForegroundColor Green
}

# Backup existing settings if they exist
if (Test-Path $settingsPath) {
    Write-Host "💾 Backing up existing VS Code settings..." -ForegroundColor Yellow
    Copy-Item $settingsPath $backupPath -Force
    Write-Host "✅ Backup created: $backupPath" -ForegroundColor Green
} else {
    Write-Host "📝 No existing settings found - creating new file" -ForegroundColor Yellow
}

# Check if our config file exists
if (-not (Test-Path $configPath)) {
    Write-Host "❌ Configuration file not found: $configPath" -ForegroundColor Red
    Write-Host "   Please ensure VS_CODE_SETTINGS.json exists in the current directory" -ForegroundColor Yellow
    exit 1
}

# Copy our configuration to VS Code settings
Write-Host "⚙️  Applying MCP configuration..." -ForegroundColor Yellow
try {
    Copy-Item $configPath $settingsPath -Force
    Write-Host "✅ MCP configuration applied successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to apply configuration: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Validate the configuration
Write-Host "🔍 Validating configuration..." -ForegroundColor Yellow
try {
    $settings = Get-Content $settingsPath -Raw | ConvertFrom-Json
    if ($settings.'augment.mcpServers') {
        $serverCount = ($settings.'augment.mcpServers' | Get-Member -MemberType NoteProperty).Count
        Write-Host "✅ Configuration valid - $serverCount MCP servers configured" -ForegroundColor Green
        
        # List configured servers
        Write-Host "`n📋 Configured MCP Servers:" -ForegroundColor Cyan
        $settings.'augment.mcpServers' | Get-Member -MemberType NoteProperty | ForEach-Object {
            Write-Host "   ✓ $($_.Name)" -ForegroundColor Green
        }
    } else {
        Write-Host "❌ Configuration invalid - no augment.mcpServers found" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Configuration validation failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test Ollama connectivity
Write-Host "`n🦙 Testing Ollama connectivity..." -ForegroundColor Yellow
try {
    $ollamaResponse = Invoke-RestMethod -Uri "http://127.0.0.1:11434/api/tags" -Method GET -TimeoutSec 5
    if ($ollamaResponse.models -and $ollamaResponse.models.Count -gt 0) {
        Write-Host "✅ Ollama is running with $($ollamaResponse.models.Count) models" -ForegroundColor Green
        Write-Host "   Models: $($ollamaResponse.models.name -join ', ')" -ForegroundColor Gray
    } else {
        Write-Host "⚠️  Ollama is running but no models found" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Ollama not accessible at http://127.0.0.1:11434" -ForegroundColor Red
    Write-Host "   FREE Agent MCP will not work without Ollama" -ForegroundColor Yellow
    Write-Host "   Please start Ollama and ensure it's running on port 11434" -ForegroundColor Yellow
}

Write-Host "`n🎉 MCP Settings Applied Successfully!" -ForegroundColor Green
Write-Host "=" * 50

Write-Host "`n📋 Next Steps:" -ForegroundColor Cyan
Write-Host "1. CLOSE VS Code completely (File > Exit)" -ForegroundColor White
Write-Host "2. RESTART VS Code" -ForegroundColor White
Write-Host "3. Open Augment Agent panel" -ForegroundColor White
Write-Host "4. Test with: 'List available MCP tools'" -ForegroundColor White
Write-Host "5. Try: 'Use delegate_code_generation to create a hello world function'" -ForegroundColor White

Write-Host "`n✅ Expected Result:" -ForegroundColor Green
Write-Host "- All 6 MCP servers should be connected" -ForegroundColor White
Write-Host "- Tools should be accessible without -mcp suffix" -ForegroundColor White
Write-Host "- FREE agent should handle most tasks (0 credits)" -ForegroundColor White
Write-Host "- OpenAI MCP should provide 249 OpenAI tools" -ForegroundColor White
Write-Host "- 96`% cost savings through delegation!" -ForegroundColor White

Write-Host "`n🔄 If you want to restore original settings:" -ForegroundColor Yellow
Write-Host "Copy $backupPath back to $settingsPath" -ForegroundColor Gray

Write-Host "`nPress any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
