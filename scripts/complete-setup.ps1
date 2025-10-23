# Complete Setup Script
# Run this after closing VS Code to ensure clean dependency installation

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "6-Server MCP System - Complete Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if VS Code is running
$vscode = Get-Process -Name "Code" -ErrorAction SilentlyContinue
if ($vscode) {
    Write-Host "⚠️  WARNING: VS Code is running!" -ForegroundColor Yellow
    Write-Host "Please close VS Code completely before running this script." -ForegroundColor Yellow
    Write-Host "This ensures no MCP servers are locking files." -ForegroundColor Yellow
    Write-Host ""
    $continue = Read-Host "Continue anyway? (y/N)"
    if ($continue -ne "y" -and $continue -ne "Y") {
        Write-Host "Exiting. Please close VS Code and run this script again." -ForegroundColor Red
        exit 1
    }
}

Write-Host "Step 1: Clean install dependencies..." -ForegroundColor Cyan
npm ci
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ npm ci failed. Trying npm install instead..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ npm install also failed. Please check errors above." -ForegroundColor Red
        exit 1
    }
}
Write-Host "✅ Dependencies installed" -ForegroundColor Green
Write-Host ""

Write-Host "Step 2: Build all workspace packages..." -ForegroundColor Cyan
npm run build --workspaces --if-present
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Build completed with errors (this is expected for redis-unified-mcp)" -ForegroundColor Yellow
} else {
    Write-Host "✅ All packages built successfully" -ForegroundColor Green
}
Write-Host ""

Write-Host "Step 3: Verify 6 core servers..." -ForegroundColor Cyan
$servers = @(
    "packages/architect-mcp/dist/index.js",
    "packages/autonomous-agent-mcp/dist/index.js",
    "packages/openai-worker-mcp/dist/index.js",
    "packages/thinking-tools-mcp/dist/index.js",
    "packages/credit-optimizer-mcp/dist/index.js",
    "packages/robinsons-toolkit-mcp/dist/index.js"
)

$allExist = $true
foreach ($server in $servers) {
    if (Test-Path $server) {
        Write-Host "  ✅ $server" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $server NOT FOUND" -ForegroundColor Red
        $allExist = $false
    }
}
Write-Host ""

if ($allExist) {
    Write-Host "✅ All 6 core servers built successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Some servers failed to build. Check errors above." -ForegroundColor Red
    exit 1
}
Write-Host ""

Write-Host "Step 4: Verify Ollama models..." -ForegroundColor Cyan
$models = @("qwen2.5:3b", "deepseek-coder:33b", "qwen2.5-coder:32b")
$ollamaRunning = $true

try {
    $ollamaList = ollama list 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️  Ollama is not running or not installed" -ForegroundColor Yellow
        $ollamaRunning = $false
    } else {
        foreach ($model in $models) {
            if ($ollamaList -match $model) {
                Write-Host "  ✅ $model" -ForegroundColor Green
            } else {
                Write-Host "  ❌ $model NOT FOUND" -ForegroundColor Red
                Write-Host "     Run: ollama pull $model" -ForegroundColor Yellow
            }
        }
    }
} catch {
    Write-Host "⚠️  Could not check Ollama models: $_" -ForegroundColor Yellow
    $ollamaRunning = $false
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Import AUGMENT_6_SERVER_CONFIG_HARDENED.json into Augment Code" -ForegroundColor White
Write-Host "2. Restart VS Code" -ForegroundColor White
Write-Host "3. Run smoke tests from scripts/smoke-test-6-servers.md" -ForegroundColor White
Write-Host ""

if (-not $ollamaRunning) {
    Write-Host "⚠️  Don't forget to start Ollama before using the MCP servers!" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "Documentation:" -ForegroundColor Cyan
Write-Host "  - Full setup guide: docs/6-SERVER-SETUP-GUIDE.md" -ForegroundColor White
Write-Host "  - Smoke tests: scripts/smoke-test-6-servers.md" -ForegroundColor White
Write-Host "  - Ollama auto-start: scripts/setup-ollama-autostart.ps1 (run as admin)" -ForegroundColor White
Write-Host ""

