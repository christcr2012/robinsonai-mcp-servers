# MCP Server Diagnostic Script
# Bypasses WSL issues and provides comprehensive diagnosis

Write-Host "🔍 Robinson AI MCP Server Diagnostic Tool" -ForegroundColor Cyan
Write-Host "=" * 50

# 1. Check VS Code Settings
Write-Host "`n1. Checking VS Code MCP Configuration..." -ForegroundColor Yellow
$settingsPath = "$env:APPDATA\Code\User\settings.json"
if (Test-Path $settingsPath) {
    try {
        $settings = Get-Content $settingsPath -Raw | ConvertFrom-Json
        if ($settings.'augment.mcpServers') {
            Write-Host "✅ Found augment.mcpServers configuration" -ForegroundColor Green
            $mcpServers = $settings.'augment.mcpServers' | Get-Member -MemberType NoteProperty | Select-Object -ExpandProperty Name
            Write-Host "   Configured servers: $($mcpServers -join ', ')" -ForegroundColor White
        } else {
            Write-Host "❌ No augment.mcpServers found in settings.json" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ Error reading settings.json: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "❌ VS Code settings.json not found at $settingsPath" -ForegroundColor Red
}

# 2. Check Global NPM Packages
Write-Host "`n2. Checking Global NPM Package Installation..." -ForegroundColor Yellow
$packages = @(
    "@robinsonai/robinsons-toolkit-mcp",
    "@robinsonai/free-agent-mcp", 
    "@robinsonai/paid-agent-mcp",
    "@robinsonai/thinking-tools-mcp",
    "@robinsonai/credit-optimizer-mcp"
)

foreach ($package in $packages) {
    try {
        $result = npm list -g $package 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ $package is installed globally" -ForegroundColor Green
        } else {
            Write-Host "❌ $package is NOT installed globally" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ Error checking $package" -ForegroundColor Red
    }
}

# 3. Check Local Build Status
Write-Host "`n3. Checking Local Build Status..." -ForegroundColor Yellow
$distPaths = @(
    "packages\robinsons-toolkit-mcp\dist\index.js",
    "packages\free-agent-mcp\dist\index.js",
    "packages\paid-agent-mcp\dist\index.js"
)

foreach ($path in $distPaths) {
    if (Test-Path $path) {
        Write-Host "✅ Built: $path" -ForegroundColor Green
    } else {
        Write-Host "❌ Missing: $path" -ForegroundColor Red
    }
}

# 4. Test MCP Server Startup
Write-Host "`n4. Testing MCP Server Startup..." -ForegroundColor Yellow
if (Test-Path "packages\robinsons-toolkit-mcp\dist\index.js") {
    Write-Host "   Testing robinsons-toolkit-mcp startup..." -ForegroundColor White
    try {
        # Test with timeout
        $job = Start-Job -ScriptBlock {
            node "packages\robinsons-toolkit-mcp\dist\index.js" 2>&1
        }
        Wait-Job $job -Timeout 5 | Out-Null
        $output = Receive-Job $job
        Stop-Job $job -Force
        Remove-Job $job -Force
        
        if ($output -match "Robinson's Toolkit MCP server running") {
            Write-Host "✅ MCP server starts successfully" -ForegroundColor Green
        } else {
            Write-Host "❌ MCP server startup issues:" -ForegroundColor Red
            Write-Host "   $output" -ForegroundColor Gray
        }
    } catch {
        Write-Host "❌ Error testing server startup: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "❌ Cannot test - dist/index.js not found" -ForegroundColor Red
}

# 5. Environment Variables Check
Write-Host "`n5. Checking Environment Variables..." -ForegroundColor Yellow
$envVars = @("GITHUB_TOKEN", "VERCEL_TOKEN", "NEON_API_KEY", "OPENAI_API_KEY")
foreach ($var in $envVars) {
    $value = [Environment]::GetEnvironmentVariable($var)
    if ($value) {
        $masked = $value.Substring(0, [Math]::Min(8, $value.Length)) + "..."
        Write-Host "✅ $var = $masked" -ForegroundColor Green
    } else {
        Write-Host "⚠️  $var not set" -ForegroundColor Yellow
    }
}

Write-Host "`n🎯 Diagnosis Complete!" -ForegroundColor Cyan
Write-Host "Check the results above to identify issues." -ForegroundColor White
