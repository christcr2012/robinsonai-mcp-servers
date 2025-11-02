# Verify Ollama Models Installation
# Checks if required models for Robinson AI MCP system are installed

Write-Host "`n=== Ollama Model Verification ===" -ForegroundColor Cyan
Write-Host "Checking required models for 5-server MCP system...`n" -ForegroundColor Gray

# Required models for the system
$requiredModels = @(
    @{
        Name = "qwen2.5:3b"
        Purpose = "Fast model (simple tasks, quick responses)"
        UsedBy = "FREE Agent MCP (FAST_MODEL)"
    },
    @{
        Name = "deepseek-coder:33b"
        Purpose = "Complex model (expert-level tasks)"
        UsedBy = "FREE Agent MCP (COMPLEX_MODEL)"
    },
    @{
        Name = "qwen2.5-coder:7b"
        Purpose = "Medium model (standard tasks, balanced)"
        UsedBy = "FREE Agent MCP (MEDIUM_MODEL, DEFAULT_OLLAMA_MODEL)"
    }
)

# Check if Ollama is installed
try {
    $ollamaVersion = ollama --version 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Ollama not found"
    }
    Write-Host "✅ Ollama installed: $ollamaVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Ollama is not installed or not in PATH" -ForegroundColor Red
    Write-Host "`nInstall Ollama from: https://ollama.ai/download" -ForegroundColor Yellow
    exit 1
}

# Check if Ollama is running
try {
    $response = Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -Method GET -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✅ Ollama service is running" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Ollama service is not running" -ForegroundColor Yellow
    Write-Host "   Start it with: ollama serve" -ForegroundColor Gray
    Write-Host "   Or run: Start-Process 'ollama' -ArgumentList 'serve' -WindowStyle Hidden`n" -ForegroundColor Gray
}

# Get list of installed models
Write-Host "`nChecking installed models..." -ForegroundColor Cyan
try {
    $installedOutput = ollama list 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to list models"
    }
    
    # Parse installed models (format: "name:tag    id    size    modified")
    $installedModels = @()
    $installedOutput | Select-Object -Skip 1 | ForEach-Object {
        if ($_ -match '^(\S+)\s+') {
            $installedModels += $matches[1]
        }
    }
    
    Write-Host "Found $($installedModels.Count) installed models`n" -ForegroundColor Gray
} catch {
    Write-Host "❌ Failed to list installed models" -ForegroundColor Red
    exit 1
}

# Check each required model
$allInstalled = $true
$missingModels = @()

foreach ($model in $requiredModels) {
    $modelName = $model.Name
    $isInstalled = $installedModels -contains $modelName
    
    if ($isInstalled) {
        Write-Host "✅ $modelName" -ForegroundColor Green
        Write-Host "   Purpose: $($model.Purpose)" -ForegroundColor Gray
        Write-Host "   Used by: $($model.UsedBy)`n" -ForegroundColor Gray
    } else {
        Write-Host "❌ $modelName - NOT INSTALLED" -ForegroundColor Red
        Write-Host "   Purpose: $($model.Purpose)" -ForegroundColor Gray
        Write-Host "   Used by: $($model.UsedBy)" -ForegroundColor Gray
        Write-Host "   Install: ollama pull $modelName`n" -ForegroundColor Yellow
        $allInstalled = $false
        $missingModels += $modelName
    }
}

# Summary
Write-Host "`n=== Summary ===" -ForegroundColor Cyan
if ($allInstalled) {
    Write-Host "✅ All required models are installed!" -ForegroundColor Green
    Write-Host "`nYour system is ready to use the FREE Agent MCP server." -ForegroundColor Green
} else {
    Write-Host "❌ Missing $($missingModels.Count) model(s)" -ForegroundColor Red
    Write-Host "`nTo install missing models, run:" -ForegroundColor Yellow
    foreach ($model in $missingModels) {
        Write-Host "  ollama pull $model" -ForegroundColor White
    }
    Write-Host "`nOr install all at once:" -ForegroundColor Yellow
    Write-Host "  ollama pull qwen2.5:3b && ollama pull deepseek-coder:33b && ollama pull qwen2.5-coder:7b" -ForegroundColor White
}

# Additional recommendations
Write-Host "`n=== Recommendations ===" -ForegroundColor Cyan
Write-Host "• Keep Ollama running in the background for best performance" -ForegroundColor Gray
Write-Host "• Models are cached after first use (faster subsequent runs)" -ForegroundColor Gray
Write-Host "• Total disk space needed: ~25GB for all 3 models" -ForegroundColor Gray
Write-Host "• RAM usage: ~4GB (qwen2.5:3b), ~8GB (qwen2.5-coder:7b), ~20GB (deepseek-coder:33b)" -ForegroundColor Gray

Write-Host "`n=== Next Steps ===" -ForegroundColor Cyan
if ($allInstalled) {
    Write-Host "1. Ensure Ollama is running: ollama serve" -ForegroundColor White
    Write-Host "2. Configure Augment MCP servers (see augment-mcp-config.TEMPLATE.json)" -ForegroundColor White
    Write-Host "3. Run validation tests: see validate-5-servers.md" -ForegroundColor White
} else {
    Write-Host "1. Install missing models (see commands above)" -ForegroundColor White
    Write-Host "2. Ensure Ollama is running: ollama serve" -ForegroundColor White
    Write-Host "3. Re-run this script to verify" -ForegroundColor White
}

Write-Host ""

