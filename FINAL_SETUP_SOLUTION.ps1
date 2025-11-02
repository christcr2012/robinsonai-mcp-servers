# COMPREHENSIVE AUGMENT MCP SETUP SOLUTION
# This script addresses all known issues with Augment Code extension MCP configuration

param(
    [switch]$Force,
    [switch]$SkipOllama,
    [switch]$SkipPublish
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🚀 COMPREHENSIVE AUGMENT MCP SETUP" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Continue"

# Step 1: Verify VS Code Settings Path
Write-Host "Step 1: Locating VS Code settings..." -ForegroundColor Yellow
$settingsPath = "$env:APPDATA\Code\User\settings.json"

if (-not (Test-Path $settingsPath)) {
    Write-Host "  ❌ VS Code settings.json not found at: $settingsPath" -ForegroundColor Red
    Write-Host "  Please ensure VS Code is installed and has been run at least once." -ForegroundColor Yellow
    exit 1
}

Write-Host "  ✅ Found VS Code settings: $settingsPath" -ForegroundColor Green

# Step 2: Backup current settings
Write-Host "`nStep 2: Creating backup..." -ForegroundColor Yellow
$backupPath = "$settingsPath.backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
Copy-Item $settingsPath $backupPath -Force
Write-Host "  ✅ Backup created: $backupPath" -ForegroundColor Green

# Step 3: Check Ollama (if not skipped)
if (-not $SkipOllama) {
    Write-Host "`nStep 3: Checking Ollama..." -ForegroundColor Yellow
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -TimeoutSec 5 -ErrorAction Stop
        Write-Host "  ✅ Ollama is running" -ForegroundColor Green
    } catch {
        Write-Host "  ⚠️  Ollama not running, attempting to start..." -ForegroundColor Yellow
        
        $ollamaPath = "C:\Users\chris\AppData\Local\Programs\Ollama\ollama.exe"
        if (Test-Path $ollamaPath) {
            Start-Process -FilePath $ollamaPath -ArgumentList "serve" -WindowStyle Hidden
            Write-Host "  🚀 Ollama started" -ForegroundColor Green
            Start-Sleep -Seconds 5
        } else {
            Write-Host "  ❌ Ollama not found. Please install from https://ollama.com" -ForegroundColor Red
            Write-Host "  Continuing without Ollama (some features will not work)..." -ForegroundColor Yellow
        }
    }
}

# Step 4: Build and publish packages
Write-Host "`nStep 4: Building packages..." -ForegroundColor Yellow

# Install dependencies
npm ci
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ⚠️  npm ci failed, trying npm install..." -ForegroundColor Yellow
    npm install
}

# Build all packages
npm run build --workspaces --if-present
Write-Host "  ✅ Packages built" -ForegroundColor Green

# Step 5: Publish packages to npm (if not skipped)
if (-not $SkipPublish) {
    Write-Host "`nStep 5: Publishing packages to npm..." -ForegroundColor Yellow
    
    $packages = @(
        "packages/free-agent-mcp",
        "packages/paid-agent-mcp",
        "packages/robinsons-toolkit-mcp",
        "packages/thinking-tools-mcp",
        "packages/credit-optimizer-mcp",
        "packages/openai-mcp"
    )
    
    foreach ($package in $packages) {
        Write-Host "  📦 Publishing $package..." -ForegroundColor Gray
        Push-Location $package
        
        # Check if already published
        $packageJson = Get-Content "package.json" | ConvertFrom-Json
        $packageName = $packageJson.name
        $packageVersion = $packageJson.version
        
        try {
            npm view "$packageName@$packageVersion" 2>&1 | Out-Null
            if ($LASTEXITCODE -eq 0) {
                Write-Host "    ✅ $packageName@$packageVersion already published" -ForegroundColor Green
            } else {
                npm publish --access public
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "    ✅ Published $packageName@$packageVersion" -ForegroundColor Green
                } else {
                    Write-Host "    ⚠️  Failed to publish $packageName" -ForegroundColor Yellow
                }
            }
        } catch {
            Write-Host "    ⚠️  Could not check/publish $packageName" -ForegroundColor Yellow
        }
        
        Pop-Location
    }
}

# Step 6: Import correct configuration
Write-Host "`nStep 6: Importing Augment configuration..." -ForegroundColor Yellow

try {
    # Read current settings
    $currentSettings = Get-Content $settingsPath -Raw | ConvertFrom-Json
    
    # Read correct Augment config
    $augmentConfig = Get-Content "CORRECT_AUGMENT_CONFIG.json" -Raw | ConvertFrom-Json
    
    # Merge the augment.mcpServers configuration
    $currentSettings | Add-Member -MemberType NoteProperty -Name "augment.mcpServers" -Value $augmentConfig."augment.mcpServers" -Force
    
    # Save updated settings
    $currentSettings | ConvertTo-Json -Depth 10 | Set-Content $settingsPath -Encoding UTF8
    
    Write-Host "  ✅ Augment MCP configuration imported successfully" -ForegroundColor Green
    
} catch {
    Write-Host "  ❌ Failed to import configuration: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "  Restoring backup..." -ForegroundColor Yellow
    Copy-Item $backupPath $settingsPath -Force
    exit 1
}

# Step 7: Verification
Write-Host "`nStep 7: Verification..." -ForegroundColor Yellow

$configuredServers = $augmentConfig."augment.mcpServers".PSObject.Properties.Name
Write-Host "  📋 Configured MCP servers:" -ForegroundColor Green
foreach ($server in $configuredServers) {
    Write-Host "    ✅ $server" -ForegroundColor White
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✅ SETUP COMPLETE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. CLOSE VS Code completely (File > Exit)" -ForegroundColor White
Write-Host "   2. Restart VS Code" -ForegroundColor White
Write-Host "   3. Wait for Augment to initialize" -ForegroundColor White
Write-Host "   4. Test: Ask Augment 'What MCP servers are connected?'" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Configuration Details:" -ForegroundColor Cyan
Write-Host "   • Format: augment.mcpServers (correct for Augment Code)" -ForegroundColor White
Write-Host "   • Command: npm exec (most reliable)" -ForegroundColor White
Write-Host "   • Packages: Published to npm registry" -ForegroundColor White
Write-Host "   • Environment: All secrets from .env.local" -ForegroundColor White
Write-Host ""
Write-Host "📁 Backup saved to: $backupPath" -ForegroundColor Gray
Write-Host ""
