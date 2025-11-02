# Test MCP Configuration Setup
# This script validates both VS Code and Auggie CLI MCP configurations

Write-Host "🧪 TESTING MCP CONFIGURATION SETUP" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""

$allTestsPassed = $true

# Test 1: Check VS Code Configuration
Write-Host "📋 Test 1: VS Code Augment Extension Configuration" -ForegroundColor Yellow

$vscodeSettingsPath = "$env:APPDATA\Code\User\settings.json"
if (Test-Path $vscodeSettingsPath) {
    try {
        $settings = Get-Content $vscodeSettingsPath -Raw | ConvertFrom-Json
        if ($settings.'augment.mcpServers') {
            $serverCount = $settings.'augment.mcpServers'.PSObject.Properties.Count
            Write-Host "  ✅ VS Code settings found with $serverCount MCP servers" -ForegroundColor Green
            
            # Check for required servers
            $requiredServers = @("free-agent-mcp", "paid-agent-mcp", "robinsons-toolkit-mcp", "thinking-tools-mcp", "credit-optimizer-mcp", "openai-mcp")
            $missingServers = @()
            
            foreach ($server in $requiredServers) {
                if ($settings.'augment.mcpServers'.$server) {
                    Write-Host "    ✓ $server configured" -ForegroundColor Green
                } else {
                    Write-Host "    ❌ $server missing" -ForegroundColor Red
                    $missingServers += $server
                    $allTestsPassed = $false
                }
            }
            
            if ($missingServers.Count -eq 0) {
                Write-Host "  ✅ All required servers configured" -ForegroundColor Green
            }
        } else {
            Write-Host "  ❌ No augment.mcpServers configuration found" -ForegroundColor Red
            $allTestsPassed = $false
        }
    } catch {
        Write-Host "  ❌ Error reading VS Code settings: $($_.Exception.Message)" -ForegroundColor Red
        $allTestsPassed = $false
    }
} else {
    Write-Host "  ⚠️ VS Code settings.json not found (VS Code not installed?)" -ForegroundColor Yellow
}

Write-Host ""

# Test 2: Check Auggie CLI Configuration
Write-Host "📋 Test 2: Auggie CLI Configuration" -ForegroundColor Yellow

$auggieConfigPath = "$env:USERPROFILE\.auggie\config.json"
if (Test-Path $auggieConfigPath) {
    try {
        $auggieConfig = Get-Content $auggieConfigPath -Raw | ConvertFrom-Json
        if ($auggieConfig.mcpServers) {
            $serverCount = $auggieConfig.mcpServers.PSObject.Properties.Count
            Write-Host "  ✅ Auggie CLI config found with $serverCount MCP servers" -ForegroundColor Green
            
            # List configured servers
            $auggieConfig.mcpServers.PSObject.Properties | ForEach-Object {
                Write-Host "    ✓ $($_.Name)" -ForegroundColor Green
            }
        } else {
            Write-Host "  ❌ No mcpServers configuration found in Auggie config" -ForegroundColor Red
            $allTestsPassed = $false
        }
    } catch {
        Write-Host "  ❌ Error reading Auggie config: $($_.Exception.Message)" -ForegroundColor Red
        $allTestsPassed = $false
    }
} else {
    Write-Host "  ❌ Auggie CLI config not found at: $auggieConfigPath" -ForegroundColor Red
    Write-Host "    Run: .\setup-auggie-mcp.ps1" -ForegroundColor Yellow
    $allTestsPassed = $false
}

Write-Host ""

# Test 3: Check Package Availability
Write-Host "📋 Test 3: MCP Package Availability" -ForegroundColor Yellow

$testPackages = @("@robinsonai/free-agent-mcp", "@robinsonai/robinsons-toolkit-mcp", "@robinsonai/thinking-tools-mcp")
foreach ($package in $testPackages) {
    try {
        $result = & npx $package --version 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✅ $package available" -ForegroundColor Green
        } else {
            Write-Host "  ❌ $package not available" -ForegroundColor Red
            $allTestsPassed = $false
        }
    } catch {
        Write-Host "  ❌ Error testing $package" -ForegroundColor Red
        $allTestsPassed = $false
    }
}

Write-Host ""

# Test Results
if ($allTestsPassed) {
    Write-Host "🎉 ALL TESTS PASSED!" -ForegroundColor Green
    Write-Host ""
    Write-Host "✅ Your MCP configuration is ready!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Restart VS Code completely" -ForegroundColor White
    Write-Host "2. Open Augment Agent panel and test MCP tools" -ForegroundColor White
    Write-Host "3. Test Auggie CLI with: auggie mcp list" -ForegroundColor White
} else {
    Write-Host "❌ SOME TESTS FAILED" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔧 To fix issues:" -ForegroundColor Yellow
    Write-Host "1. Run: .\COMPLETE_MCP_SETUP.ps1" -ForegroundColor White
    Write-Host "2. Check the MCP_CONFIGURATION_SOLUTION.md file" -ForegroundColor White
    Write-Host "3. Ensure all packages are installed" -ForegroundColor White
}
