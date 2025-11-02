# Complete MCP Issues Fix Script
# Addresses WSL, package installation, and configuration issues

param(
    [switch]$FixWSL,
    [switch]$InstallPackages,
    [switch]$BuildLocal,
    [switch]$UpdateConfig,
    [switch]$All
)

if ($All) {
    $FixWSL = $true
    $InstallPackages = $true
    $BuildLocal = $true
    $UpdateConfig = $true
}

Write-Host "🔧 Robinson AI MCP Complete Fix Tool" -ForegroundColor Cyan
Write-Host "=" * 50

# 1. Fix WSL Issue
if ($FixWSL) {
    Write-Host "`n1. Fixing WSL Configuration..." -ForegroundColor Yellow
    
    # Check if running as admin
    $isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")
    
    if (-not $isAdmin) {
        Write-Host "⚠️  WSL fix requires Administrator privileges" -ForegroundColor Yellow
        Write-Host "   Please run this script as Administrator or manually fix WSL" -ForegroundColor Gray
    } else {
        try {
            # Option 1: Try to fix WSL
            Write-Host "   Attempting to reinstall WSL Ubuntu..." -ForegroundColor White
            wsl --unregister Ubuntu 2>$null
            wsl --install -d Ubuntu --no-launch
            Write-Host "✅ WSL Ubuntu reinstalled" -ForegroundColor Green
        } catch {
            Write-Host "❌ WSL fix failed: $($_.Exception.Message)" -ForegroundColor Red
            Write-Host "   Manual fix required - see fix-mcp-connection-issues.md" -ForegroundColor Gray
        }
    }
}

# 2. Install Global Packages
if ($InstallPackages) {
    Write-Host "`n2. Installing Global MCP Packages..." -ForegroundColor Yellow
    
    $packages = @(
        "@robinsonai/robinsons-toolkit-mcp",
        "@robinsonai/free-agent-mcp", 
        "@robinsonai/paid-agent-mcp",
        "@robinsonai/thinking-tools-mcp",
        "@robinsonai/credit-optimizer-mcp"
    )
    
    foreach ($package in $packages) {
        Write-Host "   Installing $package..." -ForegroundColor White
        try {
            $result = npm install -g $package 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ $package installed successfully" -ForegroundColor Green
            } else {
                Write-Host "❌ Failed to install $package" -ForegroundColor Red
                Write-Host "   Error: $result" -ForegroundColor Gray
            }
        } catch {
            Write-Host "❌ Error installing $package: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

# 3. Build Local Packages
if ($BuildLocal) {
    Write-Host "`n3. Building Local Packages..." -ForegroundColor Yellow
    
    $packages = @(
        "packages\robinsons-toolkit-mcp",
        "packages\free-agent-mcp",
        "packages\paid-agent-mcp",
        "packages\thinking-tools-mcp",
        "packages\credit-optimizer-mcp"
    )
    
    foreach ($package in $packages) {
        if (Test-Path "$package\package.json") {
            Write-Host "   Building $package..." -ForegroundColor White
            try {
                Push-Location $package
                npm run build 2>&1 | Out-Null
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "✅ $package built successfully" -ForegroundColor Green
                } else {
                    Write-Host "❌ Failed to build $package" -ForegroundColor Red
                }
                Pop-Location
            } catch {
                Write-Host "❌ Error building $package: $($_.Exception.Message)" -ForegroundColor Red
                Pop-Location
            }
        } else {
            Write-Host "⚠️  $package not found" -ForegroundColor Yellow
        }
    }
}

# 4. Update Augment Configuration
if ($UpdateConfig) {
    Write-Host "`n4. Updating Augment Configuration..." -ForegroundColor Yellow
    
    $settingsPath = "$env:APPDATA\Code\User\settings.json"
    if (Test-Path $settingsPath) {
        try {
            # Backup current settings
            Copy-Item $settingsPath "$settingsPath.backup.$(Get-Date -Format 'yyyyMMdd-HHmmss')"
            
            # Read and update settings
            $settings = Get-Content $settingsPath -Raw | ConvertFrom-Json
            
            # Use the correct configuration from FIXED_MCP_CONFIG.json
            if (Test-Path "FIXED_MCP_CONFIG.json") {
                $mcpConfig = Get-Content "FIXED_MCP_CONFIG.json" -Raw | ConvertFrom-Json
                $settings | Add-Member -MemberType NoteProperty -Name "augment.mcpServers" -Value $mcpConfig.mcpServers -Force
                
                # Write back to settings
                $settings | ConvertTo-Json -Depth 10 | Set-Content $settingsPath
                Write-Host "✅ Augment configuration updated" -ForegroundColor Green
                Write-Host "   Backup created: $settingsPath.backup.*" -ForegroundColor Gray
            } else {
                Write-Host "❌ FIXED_MCP_CONFIG.json not found" -ForegroundColor Red
            }
        } catch {
            Write-Host "❌ Error updating configuration: $($_.Exception.Message)" -ForegroundColor Red
        }
    } else {
        Write-Host "❌ VS Code settings.json not found" -ForegroundColor Red
    }
}

Write-Host "`n🎯 Fix Process Complete!" -ForegroundColor Cyan
Write-Host "Next steps:" -ForegroundColor White
Write-Host "1. Restart VS Code completely (File > Exit, then reopen)" -ForegroundColor Gray
Write-Host "2. Test MCP connection in Augment" -ForegroundColor Gray
Write-Host "3. If issues persist, check fix-mcp-connection-issues.md" -ForegroundColor Gray
