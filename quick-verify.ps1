# Quick MCP Servers Verification Script
Write-Host "🔍 Quick MCP Servers Verification..." -ForegroundColor Cyan
Write-Host ""

$packages = @(
    "packages/free-agent-mcp",
    "packages/paid-agent-mcp", 
    "packages/robinsons-toolkit-mcp",
    "packages/thinking-tools-mcp",
    "packages/credit-optimizer-mcp",
    "packages/openai-mcp"
)

$configFiles = @(
    "FIXED_MCP_CONFIG.json",
    "test-mcp-servers.mjs",
    "MCP_SERVERS_SETUP_GUIDE.md"
)

$allGood = $true

# Check packages are built
Write-Host "📦 Checking packages..." -ForegroundColor Yellow
foreach ($pkg in $packages) {
    $distPath = Join-Path $pkg "dist/index.js"
    $pkgName = Split-Path $pkg -Leaf
    
    if (Test-Path $distPath) {
        Write-Host "   ✅ $pkgName - Built" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $pkgName - Not built" -ForegroundColor Red
        $allGood = $false
    }
}

# Check config files
Write-Host ""
Write-Host "📄 Checking config files..." -ForegroundColor Yellow
foreach ($file in $configFiles) {
    if (Test-Path $file) {
        Write-Host "   ✅ $file - Ready" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $file - Missing" -ForegroundColor Red
        $allGood = $false
    }
}

# Check Ollama
Write-Host ""
Write-Host "🦙 Checking Ollama..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://127.0.0.1:11434/api/tags" -Method Get -TimeoutSec 5
    $modelCount = $response.models.Count
    Write-Host "   ✅ Ollama running with $modelCount models" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Ollama not running - start with: ollama serve" -ForegroundColor Red
    Write-Host "      (This will affect free-agent-mcp)" -ForegroundColor Gray
}

# Summary
Write-Host ""
Write-Host ("=" * 50) -ForegroundColor Cyan
if ($allGood) {
    Write-Host "🎉 Setup looks good!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Run: node test-mcp-servers.mjs" -ForegroundColor White
    Write-Host "2. Import FIXED_MCP_CONFIG.json into Augment" -ForegroundColor White
    Write-Host "3. Restart Augment Code" -ForegroundColor White
} else {
    Write-Host "🔧 Some issues found. Please fix the errors above." -ForegroundColor Red
    Write-Host ""
    Write-Host "Common fixes:" -ForegroundColor Cyan
    Write-Host "- Build packages: npm run build" -ForegroundColor White
    Write-Host "- Start Ollama: ollama serve" -ForegroundColor White
}

Write-Host ""
Write-Host "For detailed instructions: MCP_SERVERS_SETUP_GUIDE.md" -ForegroundColor Cyan
