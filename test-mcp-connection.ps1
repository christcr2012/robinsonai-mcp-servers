# Test MCP Server Connections
# This script tests if MCP servers are properly configured and accessible

Write-Host "🧪 Testing MCP Server Connections..." -ForegroundColor Green

# Test MCP server binaries
$mcpServers = @(
    "thinking-tools-mcp",
    "openai-mcp", 
    "paid-agent-mcp",
    "credit-optimizer-mcp",
    "free-agent-mcp",
    "robinsons-toolkit-mcp"
)

Write-Host "`n📦 Testing MCP server binaries..." -ForegroundColor Yellow

foreach ($server in $mcpServers) {
    $cmdPath = "C:\nvm4w\nodejs\$server.cmd"
    if (Test-Path $cmdPath) {
        Write-Host "✅ $server - Binary exists" -ForegroundColor Green
        
        # Try to run server with --help or --version to test basic functionality
        try {
            $result = & $cmdPath --help 2>&1
            if ($LASTEXITCODE -eq 0 -or $result -match "help|usage|version") {
                Write-Host "   ✅ Server responds to commands" -ForegroundColor Green
            } else {
                Write-Host "   ⚠️  Server may have issues (exit code: $LASTEXITCODE)" -ForegroundColor Yellow
            }
        } catch {
            Write-Host "   ⚠️  Could not test server execution: $($_.Exception.Message)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "❌ $server - Binary missing at $cmdPath" -ForegroundColor Red
    }
}

# Test Auggie CLI config
Write-Host "`n🖥️  Testing Auggie CLI configuration..." -ForegroundColor Yellow

$auggieConfigPath = "$env:USERPROFILE\.auggie\config.json"
if (Test-Path $auggieConfigPath) {
    Write-Host "✅ Auggie config exists at: $auggieConfigPath" -ForegroundColor Green
    
    try {
        $config = Get-Content $auggieConfigPath | ConvertFrom-Json
        if ($config.mcpServers) {
            $serverCount = ($config.mcpServers | Get-Member -MemberType NoteProperty).Count
            Write-Host "   ✅ Config contains $serverCount MCP servers" -ForegroundColor Green
        } else {
            Write-Host "   ❌ Config missing mcpServers section" -ForegroundColor Red
        }
    } catch {
        Write-Host "   ❌ Config file is invalid JSON: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "❌ Auggie config not found at: $auggieConfigPath" -ForegroundColor Red
}

# Test VS Code settings
Write-Host "`n📝 Testing VS Code settings..." -ForegroundColor Yellow

$vscodeSettingsPath = ".vscode\settings.json"
if (Test-Path $vscodeSettingsPath) {
    Write-Host "✅ VS Code settings exist at: $vscodeSettingsPath" -ForegroundColor Green
    
    try {
        $settings = Get-Content $vscodeSettingsPath | ConvertFrom-Json
        if ($settings.'augment.mcpServers') {
            $serverCount = ($settings.'augment.mcpServers' | Get-Member -MemberType NoteProperty).Count
            Write-Host "   ✅ Settings contain $serverCount MCP servers" -ForegroundColor Green
        } else {
            Write-Host "   ❌ Settings missing augment.mcpServers section" -ForegroundColor Red
        }
    } catch {
        Write-Host "   ❌ Settings file is invalid JSON: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "❌ VS Code settings not found at: $vscodeSettingsPath" -ForegroundColor Red
}

Write-Host "`n📊 Test Summary:" -ForegroundColor Cyan
Write-Host "- Check above for any ❌ or ⚠️  items that need attention" -ForegroundColor White
Write-Host "- Restart VS Code if settings were just created" -ForegroundColor White
Write-Host "- Test actual MCP functionality in Augment Agent" -ForegroundColor White
