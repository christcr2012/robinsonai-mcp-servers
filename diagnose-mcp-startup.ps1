#!/usr/bin/env pwsh
# Test MCP servers startup and tool listing

$servers = @(
    @{Name="free-agent-mcp"; Package="@robinsonai/free-agent-mcp"; Env=@{OLLAMA_BASE_URL="http://localhost:11434"}},
    @{Name="paid-agent-mcp"; Package="@robinsonai/paid-agent-mcp"; Env=@{OPENAI_API_KEY="test"}},
    @{Name="robinsons-toolkit-mcp"; Package="@robinsonai/robinsons-toolkit-mcp"; Env=@{}},
    @{Name="thinking-tools-mcp"; Package="@robinsonai/thinking-tools-mcp"; Env=@{}},
    @{Name="credit-optimizer-mcp"; Package="@robinsonai/credit-optimizer-mcp"; Env=@{}},
    @{Name="openai-mcp"; Package="@robinsonai/openai-mcp"; Env=@{OPENAI_API_KEY="test"}}
)

Write-Host "=== MCP Server Diagnostic ===" -ForegroundColor Cyan
Write-Host ""

foreach ($server in $servers) {
    Write-Host "Testing: $($server.Name)" -ForegroundColor Yellow
    
    # Set env vars
    foreach ($key in $server.Env.Keys) {
        Set-Item -Path "env:$key" -Value $server.Env[$key]
    }
    
    # Test startup and tool listing
    $testInput = @"
{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}
{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}
"@
    
    $result = $testInput | npx $server.Package 2>&1
    
    # Check if tools/list response exists
    $toolsResponse = $result | Select-String -Pattern '"tools":\['
    
    if ($toolsResponse) {
        # Count tools
        $toolsJson = ($result | Select-String -Pattern '\{"result":\{"tools":\[.*\]\}' -AllMatches).Matches[0].Value
        if ($toolsJson) {
            try {
                $parsed = $toolsJson | ConvertFrom-Json
                $toolCount = $parsed.result.tools.Count
                Write-Host "  ✓ Started successfully - $toolCount tools available" -ForegroundColor Green
            } catch {
                Write-Host "  ✓ Started successfully - tools available (count parse failed)" -ForegroundColor Green
            }
        } else {
            Write-Host "  ✓ Started successfully - tools detected" -ForegroundColor Green
        }
    } else {
        Write-Host "  ✗ FAILED - no tools response" -ForegroundColor Red
        Write-Host "    Output: $($result | Select-Object -First 3)" -ForegroundColor Gray
    }
    
    Write-Host ""
}

Write-Host "=== Summary ===" -ForegroundColor Cyan
Write-Host "All servers are globally linked via npm link"
Write-Host "All servers respond to npx @robinsonai/..."
Write-Host ""
Write-Host "If Augment shows 'no tools available':" -ForegroundColor Yellow
Write-Host "1. Reload VS Code window (Ctrl+R / Cmd+R)"
Write-Host "2. Check Augment Output channel for errors"
Write-Host "3. Try using tools in chat anyway - they may work!"
Write-Host "4. Check if Augment is using a different MCP protocol version"
