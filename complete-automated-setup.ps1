# Complete Automated Setup Script for Robinson AI MCP Servers
# This script handles everything automatically using your .env.local file

param(
    [switch]$SkipOllama,
    [switch]$SkipBuild,
    [switch]$Force
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Robinson AI MCP - Complete Automated Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Function to check if a process is running
function Test-ProcessRunning {
    param([string]$ProcessName)
    return (Get-Process -Name $ProcessName -ErrorAction SilentlyContinue) -ne $null
}

# Function to check if Ollama is accessible
function Test-OllamaRunning {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -TimeoutSec 5 -ErrorAction Stop
        return $true
    } catch {
        return $false
    }
}

# Step 1: Check and start Ollama
if (-not $SkipOllama) {
    Write-Host "Step 1: Checking Ollama..." -ForegroundColor Cyan
    
    if (Test-OllamaRunning) {
        Write-Host "  ✅ Ollama is running" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Ollama not running, attempting to start..." -ForegroundColor Yellow
        
        # Try to start Ollama
        if (Test-Path "C:\Users\chris\AppData\Local\Programs\Ollama\ollama.exe") {
            Start-Process -FilePath "C:\Users\chris\AppData\Local\Programs\Ollama\ollama.exe" -ArgumentList "serve" -WindowStyle Hidden
            Write-Host "  🚀 Starting Ollama..." -ForegroundColor Yellow
            
            # Wait for Ollama to start
            $attempts = 0
            while ($attempts -lt 30 -and -not (Test-OllamaRunning)) {
                Start-Sleep -Seconds 2
                $attempts++
                Write-Host "    Waiting for Ollama to start... ($attempts/30)" -ForegroundColor Gray
            }
            
            if (Test-OllamaRunning) {
                Write-Host "  ✅ Ollama started successfully" -ForegroundColor Green
            } else {
                Write-Host "  ❌ Failed to start Ollama automatically" -ForegroundColor Red
                Write-Host "  Please start Ollama manually: ollama serve" -ForegroundColor Yellow
                exit 1
            }
        } else {
            Write-Host "  ❌ Ollama not found. Please install from https://ollama.com" -ForegroundColor Red
            exit 1
        }
    }
    Write-Host ""
}

# Step 2: Build packages if needed
if (-not $SkipBuild) {
    Write-Host "Step 2: Building MCP packages..." -ForegroundColor Cyan
    
    # Check if packages are already built
    $corePackages = @(
        "packages/free-agent-mcp/dist/index.js",
        "packages/paid-agent-mcp/dist/index.js", 
        "packages/robinsons-toolkit-mcp/dist/index.js",
        "packages/thinking-tools-mcp/dist/index.js",
        "packages/credit-optimizer-mcp/dist/index.js",
        "packages/openai-mcp/dist/index.js"
    )
    
    $needsBuild = $false
    foreach ($package in $corePackages) {
        if (-not (Test-Path $package)) {
            $needsBuild = $true
            break
        }
    }
    
    if ($needsBuild -or $Force) {
        Write-Host "  🔨 Installing dependencies..." -ForegroundColor Yellow
        npm ci
        if ($LASTEXITCODE -ne 0) {
            Write-Host "  ⚠️  npm ci failed, trying npm install..." -ForegroundColor Yellow
            npm install
        }
        
        Write-Host "  🔨 Building all packages..." -ForegroundColor Yellow
        npm run build --workspaces --if-present
        Write-Host "  ✅ Build completed" -ForegroundColor Green
    } else {
        Write-Host "  ✅ Packages already built" -ForegroundColor Green
    }
    Write-Host ""
}

# Step 3: Install packages globally
Write-Host "Step 3: Installing MCP packages globally..." -ForegroundColor Cyan

$packages = @(
    "packages/free-agent-mcp",
    "packages/paid-agent-mcp",
    "packages/robinsons-toolkit-mcp", 
    "packages/thinking-tools-mcp",
    "packages/credit-optimizer-mcp",
    "packages/openai-mcp"
)

foreach ($package in $packages) {
    $packageName = Split-Path $package -Leaf
    Write-Host "  📦 Installing $packageName..." -ForegroundColor Yellow
    
    Push-Location $package
    npm link 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "    ✅ $packageName linked globally" -ForegroundColor Green
    } else {
        Write-Host "    ⚠️  $packageName link failed (may already be linked)" -ForegroundColor Yellow
    }
    Pop-Location
}
Write-Host ""

# Step 4: Generate MCP configuration
Write-Host "Step 4: Generating MCP configuration..." -ForegroundColor Cyan

Write-Host "  📄 Using .env.local for configuration..." -ForegroundColor Yellow
node import-mcp-config.mjs --env-file .env.local --output augment-mcp-config.json

if (Test-Path "augment-mcp-config.json") {
    Write-Host "  ✅ Configuration generated: augment-mcp-config.json" -ForegroundColor Green
} else {
    Write-Host "  ❌ Failed to generate configuration" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 5: Verify setup
Write-Host "Step 5: Verifying setup..." -ForegroundColor Cyan

# Check Ollama models
Write-Host "  🦙 Checking Ollama models..." -ForegroundColor Yellow
try {
    $models = ollama list 2>&1
    if ($models -match "qwen2.5") {
        Write-Host "    ✅ Required models available" -ForegroundColor Green
    } else {
        Write-Host "    ⚠️  Consider installing: ollama pull qwen2.5:3b" -ForegroundColor Yellow
    }
} catch {
    Write-Host "    ⚠️  Could not check models" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✅ SETUP COMPLETE!" -ForegroundColor Green  
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Import the configuration into Augment Code" -ForegroundColor White
Write-Host "   2. Restart VS Code completely (File > Exit)" -ForegroundColor White
Write-Host "   3. Test with MCP tools in Augment" -ForegroundColor White
Write-Host ""
Write-Host "📁 Configuration file: augment-mcp-config.json" -ForegroundColor Cyan
Write-Host "🔧 All environment variables loaded from .env.local" -ForegroundColor Cyan
Write-Host ""
