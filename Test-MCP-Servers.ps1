# Test MCP Servers Script
# This script tests if all MCP servers are properly installed and working

Write-Host "🧪 TESTING MCP SERVERS - Robinson AI" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Check if servers are installed
Write-Host "📦 Test 1: Checking MCP Server Installation..." -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green

$servers = @{
    "FREE Agent MCP" = "@robinsonai/free-agent-mcp"
    "PAID Agent MCP" = "@robinsonai/paid-agent-mcp"
    "Robinson's Toolkit MCP" = "@robinsonai/robinsons-toolkit-mcp"
    "Thinking Tools MCP" = "@robinsonai/thinking-tools-mcp"
    "Credit Optimizer MCP" = "@robinsonai/credit-optimizer-mcp"
    "OpenAI MCP" = "@robinsonai/openai-mcp"
}

$allInstalled = $true

foreach ($serverName in $servers.Keys) {
    $package = $servers[$serverName]
    Write-Host "Testing $serverName..." -ForegroundColor Yellow
    
    try {
        # Test if package is available
        $result = npm list -g $package 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ $serverName - Installed globally" -ForegroundColor Green
            
            # Test if command works
            $helpResult = npx $package --help 2>&1
            if ($LASTEXITCODE -eq 0 -or $helpResult -match "help|usage|version") {
                Write-Host "   ✅ Command responds properly" -ForegroundColor Green
            } else {
                Write-Host "   ⚠️  Command may have issues" -ForegroundColor Yellow
            }
        } else {
            Write-Host "❌ $serverName - NOT installed globally" -ForegroundColor Red
            $allInstalled = $false
        }
    } catch {
        Write-Host "❌ $serverName - Error testing: $($_.Exception.Message)" -ForegroundColor Red
        $allInstalled = $false
    }
}

# Test 2: Check Ollama
Write-Host ""
Write-Host "🦙 Test 2: Checking Ollama Connection..." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

try {
    $response = Invoke-RestMethod -Uri "http://127.0.0.1:11434/api/tags" -Method Get -TimeoutSec 5
    Write-Host "✅ Ollama is running and accessible" -ForegroundColor Green
    Write-Host "   Available models: $($response.models.Count)" -ForegroundColor Gray
    
    # List some models
    if ($response.models.Count -gt 0) {
        Write-Host "   Models:" -ForegroundColor Gray
        $response.models | Select-Object -First 5 | ForEach-Object {
            Write-Host "     - $($_.name)" -ForegroundColor Gray
        }
    }
} catch {
    Write-Host "❌ Ollama not accessible at http://127.0.0.1:11434" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Gray
    $allInstalled = $false
}

# Test 3: Check Augment Configuration
Write-Host ""
Write-Host "⚙️  Test 3: Checking Augment Code Configuration..." -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green

$settingsPath = "$env:APPDATA\Code\User\settings.json"

if (Test-Path $settingsPath) {
    Write-Host "✅ VS Code settings.json found" -ForegroundColor Green
    
    try {
        $settings = Get-Content $settingsPath -Raw | ConvertFrom-Json
        if ($settings.'augment.mcpServers') {
            Write-Host "✅ augment.mcpServers configuration found" -ForegroundColor Green
            $serverCount = ($settings.'augment.mcpServers' | Get-Member -MemberType NoteProperty).Count
            Write-Host "   Configured servers: $serverCount" -ForegroundColor Gray
            
            # List configured servers
            $settings.'augment.mcpServers' | Get-Member -MemberType NoteProperty | ForEach-Object {
                Write-Host "     - $($_.Name)" -ForegroundColor Gray
            }
        } else {
            Write-Host "❌ No augment.mcpServers configuration found" -ForegroundColor Red
            $allInstalled = $false
        }
    } catch {
        Write-Host "❌ Error reading settings.json: $($_.Exception.Message)" -ForegroundColor Red
        $allInstalled = $false
    }
} else {
    Write-Host "❌ VS Code settings.json not found at: $settingsPath" -ForegroundColor Red
    $allInstalled = $false
}

# Test Results
Write-Host ""
Write-Host "📊 TEST RESULTS SUMMARY" -ForegroundColor Cyan
Write-Host "=======================" -ForegroundColor Cyan

if ($allInstalled) {
    Write-Host ""
    Write-Host "🎉 ALL TESTS PASSED!" -ForegroundColor Green
    Write-Host ""
    Write-Host "✅ All MCP servers are installed and configured" -ForegroundColor Green
    Write-Host "✅ Ollama is running and accessible" -ForegroundColor Green
    Write-Host "✅ Augment Code is properly configured" -ForegroundColor Green
    Write-Host ""
    Write-Host "🚀 READY TO USE!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Open Augment Code" -ForegroundColor White
    Write-Host "2. Test with: 'List available MCP tools'" -ForegroundColor White
    Write-Host "3. Try: 'Use delegate_code_generation to create a hello world function'" -ForegroundColor White
    Write-Host ""
    Write-Host "Expected tools:" -ForegroundColor Cyan
    Write-Host "- delegate_code_generation_free-agent-mcp" -ForegroundColor White
    Write-Host "- delegate_code_analysis_free-agent-mcp" -ForegroundColor White
    Write-Host "- execute_versatile_task_paid-agent-mcp" -ForegroundColor White
    Write-Host "- toolkit_discover_robinsons-toolkit-mcp" -ForegroundColor White
    Write-Host "- sequential_thinking_thinking-tools-mcp" -ForegroundColor White
    Write-Host "- discover_tools_credit-optimizer-mcp" -ForegroundColor White
    Write-Host "- openai_chat_completions_openai-mcp" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "❌ SOME TESTS FAILED" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please run the fix script:" -ForegroundColor Yellow
    Write-Host "  .\Fix-MCP-Servers.ps1" -ForegroundColor White
    Write-Host ""
    Write-Host "Or the batch file:" -ForegroundColor Yellow
    Write-Host "  .\FIX_MCP_SERVERS_COMPLETE.bat" -ForegroundColor White
}

Write-Host ""
Read-Host "Press Enter to exit"
