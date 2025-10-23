#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Test RAD Crawler integration in Robinson's Toolkit MCP

.DESCRIPTION
    Validates that RAD tools are properly integrated and accessible
#>

Write-Host "=== RAD Crawler Integration Test ===" -ForegroundColor Cyan
Write-Host ""

# Test 1: Check if robinsons-toolkit-mcp is globally linked
Write-Host "[1/5] Checking if robinsons-toolkit-mcp is globally available..." -ForegroundColor Yellow
$toolkitCmd = Get-Command robinsons-toolkit-mcp -ErrorAction SilentlyContinue
if ($toolkitCmd) {
    Write-Host "  ✅ robinsons-toolkit-mcp found at: $($toolkitCmd.Source)" -ForegroundColor Green
} else {
    Write-Host "  ❌ robinsons-toolkit-mcp not found globally" -ForegroundColor Red
    Write-Host "  Run: cd packages/robinsons-toolkit-mcp && npm link" -ForegroundColor Yellow
    exit 1
}

# Test 2: Check environment variables
Write-Host ""
Write-Host "[2/5] Checking environment variables..." -ForegroundColor Yellow
$neonDb = $env:NEON_DATABASE_URL
$ollamaUrl = $env:OLLAMA_BASE_URL

if ($neonDb) {
    Write-Host "  ✅ NEON_DATABASE_URL is set" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  NEON_DATABASE_URL not set (RAD tools will fail)" -ForegroundColor Yellow
}

if ($ollamaUrl) {
    Write-Host "  ✅ OLLAMA_BASE_URL is set: $ollamaUrl" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  OLLAMA_BASE_URL not set (using default: http://localhost:11434)" -ForegroundColor Yellow
}

# Test 3: Check Ollama is running
Write-Host ""
Write-Host "[3/5] Checking Ollama service..." -ForegroundColor Yellow
try {
    $ollamaBase = if ($ollamaUrl) { $ollamaUrl } else { "http://localhost:11434" }
    $response = Invoke-RestMethod -Uri "$ollamaBase/api/tags" -Method Get -TimeoutSec 5
    $models = $response.models | Select-Object -ExpandProperty name
    Write-Host "  ✅ Ollama is running" -ForegroundColor Green
    
    # Check for required models
    if ($models -contains "bge-small") {
        Write-Host "  ✅ bge-small model found" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  bge-small model not found (run: ollama pull bge-small)" -ForegroundColor Yellow
    }
    
    if ($models -contains "qwen2.5-coder:1.5b") {
        Write-Host "  ✅ qwen2.5-coder:1.5b model found" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  qwen2.5-coder:1.5b model not found (run: ollama pull qwen2.5-coder:1.5b)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ❌ Ollama is not running or not accessible" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Test MCP server initialization
Write-Host ""
Write-Host "[4/5] Testing MCP server initialization..." -ForegroundColor Yellow

$initRequest = @{
    jsonrpc = "2.0"
    id = 1
    method = "initialize"
    params = @{
        protocolVersion = "2024-11-05"
        capabilities = @{
            tools = @{}
        }
        clientInfo = @{
            name = "test"
            version = "1.0"
        }
    }
} | ConvertTo-Json -Depth 10 -Compress

try {
    $initResponse = $initRequest | robinsons-toolkit-mcp 2>&1 | Select-Object -First 1
    if ($initResponse -match '"serverInfo"') {
        Write-Host "  ✅ MCP server initialized successfully" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Unexpected initialization response" -ForegroundColor Yellow
        Write-Host "  Response: $initResponse" -ForegroundColor Gray
    }
} catch {
    Write-Host "  ❌ Failed to initialize MCP server" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: Test tools/list to check for rad.* tools
Write-Host ""
Write-Host "[5/5] Checking for rad.* tools..." -ForegroundColor Yellow

$listRequest = @{
    jsonrpc = "2.0"
    id = 2
    method = "tools/list"
    params = @{}
} | ConvertTo-Json -Depth 10 -Compress

try {
    # Start the server process
    $process = Start-Process -FilePath "robinsons-toolkit-mcp" -NoNewWindow -PassThru -RedirectStandardInput "stdin.txt" -RedirectStandardOutput "stdout.txt" -RedirectStandardError "stderr.txt"
    
    # Send initialize request
    $initRequest | Out-File -FilePath "stdin.txt" -Encoding utf8
    Start-Sleep -Milliseconds 500
    
    # Send tools/list request
    $listRequest | Out-File -FilePath "stdin.txt" -Encoding utf8 -Append
    Start-Sleep -Milliseconds 500
    
    # Read response
    $output = Get-Content "stdout.txt" -Raw -ErrorAction SilentlyContinue
    
    # Stop process
    Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
    
    # Clean up temp files
    Remove-Item "stdin.txt", "stdout.txt", "stderr.txt" -ErrorAction SilentlyContinue
    
    # Check for rad.* tools
    if ($output -match 'rad\.') {
        $radTools = @(
            'rad.plan_crawl',
            'rad.seed',
            'rad.crawl_now',
            'rad.ingest_repo',
            'rad.status',
            'rad.search',
            'rad.get_doc',
            'rad.get_doc_chunk',
            'rad.govern',
            'rad.index_stats',
            'rad.diagnose'
        )
        
        $foundTools = @()
        foreach ($tool in $radTools) {
            if ($output -match $tool) {
                $foundTools += $tool
            }
        }
        
        Write-Host "  ✅ Found $($foundTools.Count)/11 rad.* tools" -ForegroundColor Green
        foreach ($tool in $foundTools) {
            Write-Host "    - $tool" -ForegroundColor Gray
        }
        
        if ($foundTools.Count -lt 11) {
            Write-Host "  ⚠️  Missing tools:" -ForegroundColor Yellow
            $missingTools = $radTools | Where-Object { $_ -notin $foundTools }
            foreach ($tool in $missingTools) {
                Write-Host "    - $tool" -ForegroundColor Gray
            }
        }
    } else {
        Write-Host "  ❌ No rad.* tools found in tools/list response" -ForegroundColor Red
        Write-Host "  This might indicate the integration didn't work correctly" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ❌ Failed to list tools" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Summary
Write-Host ""
Write-Host "=== Test Summary ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. If robinsons-toolkit-mcp is not linked, run:" -ForegroundColor White
Write-Host "   cd packages/robinsons-toolkit-mcp && npm link" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Configure Augment MCP settings with:" -ForegroundColor White
Write-Host "   - Remove rad-crawler-mcp (if present)" -ForegroundColor Gray
Write-Host "   - Update robinsons-toolkit-mcp env with NEON_DATABASE_URL and OLLAMA_BASE_URL" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Restart Augment and test:" -ForegroundColor White
Write-Host "   - List all rad.* tools" -ForegroundColor Gray
Write-Host "   - Run rad.diagnose" -ForegroundColor Gray
Write-Host "   - Run rad.index_stats" -ForegroundColor Gray
Write-Host ""
Write-Host "See RAD_INTEGRATION_COMPLETE.md for full setup instructions" -ForegroundColor Cyan

