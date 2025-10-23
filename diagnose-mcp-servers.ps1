# MCP Servers Diagnostic Script
# Run this to check if all 5 MCP servers are properly installed and configured

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Robinson AI MCP Servers - System Diagnostic" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$allGood = $true

# Check 1: Ollama Running
Write-Host "[1/7] Checking Ollama..." -ForegroundColor Yellow
$ollamaProcess = Get-Process ollama -ErrorAction SilentlyContinue
if ($ollamaProcess) {
    Write-Host "  ✓ Ollama is running" -ForegroundColor Green
    
    # Check Ollama models
    try {
        $models = Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -Method Get -ErrorAction Stop
        $modelNames = $models.models | ForEach-Object { $_.name }
        Write-Host "  ✓ Ollama models available: $($modelNames.Count)" -ForegroundColor Green
        
        # Check required models
        $requiredModels = @("qwen2.5:3b", "deepseek-coder:33b", "qwen2.5-coder:32b", "bge-small", "qwen2.5-coder:1.5b")
        $missingModels = @()
        foreach ($model in $requiredModels) {
            if ($modelNames -notcontains $model) {
                $missingModels += $model
            }
        }
        
        if ($missingModels.Count -gt 0) {
            Write-Host "  ⚠ Missing models: $($missingModels -join ', ')" -ForegroundColor Yellow
            Write-Host "    Run: ollama pull <model-name>" -ForegroundColor Gray
        } else {
            Write-Host "  ✓ All required models installed" -ForegroundColor Green
        }
    } catch {
        Write-Host "  ✗ Cannot connect to Ollama API" -ForegroundColor Red
        $allGood = $false
    }
} else {
    Write-Host "  ✗ Ollama is NOT running" -ForegroundColor Red
    Write-Host "    Run: ollama serve" -ForegroundColor Gray
    $allGood = $false
}

# Check 2: NPM Global Packages
Write-Host "`n[2/7] Checking globally linked packages..." -ForegroundColor Yellow
$globalPackages = npm list -g --depth=0 2>&1 | Out-String
$servers = @(
    "@robinsonai/architect-mcp",
    "@robinsonai/autonomous-agent-mcp",
    "@robinsonai/credit-optimizer-mcp",
    "@robinsonai/robinsons-toolkit-mcp",
    "@robinsonai/rad-crawler-mcp"
)

foreach ($server in $servers) {
    if ($globalPackages -match $server) {
        Write-Host "  ✓ $server is linked" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $server is NOT linked" -ForegroundColor Red
        Write-Host "    Run: cd packages/$($server.Split('/')[-1]) && npm link" -ForegroundColor Gray
        $allGood = $false
    }
}

# Check 3: Commands Available
Write-Host "`n[3/7] Checking if commands are available..." -ForegroundColor Yellow
$commands = @(
    "architect-mcp",
    "autonomous-agent-mcp",
    "credit-optimizer-mcp",
    "robinsons-toolkit-mcp",
    "rad-crawler-mcp"
)

foreach ($cmd in $commands) {
    $cmdPath = Get-Command $cmd -ErrorAction SilentlyContinue
    if ($cmdPath) {
        Write-Host "  ✓ $cmd is available" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $cmd is NOT available" -ForegroundColor Red
        $allGood = $false
    }
}

# Check 4: Packages Built
Write-Host "`n[4/7] Checking if packages are built..." -ForegroundColor Yellow
$packageDirs = @(
    "packages/architect-mcp",
    "packages/autonomous-agent-mcp",
    "packages/credit-optimizer-mcp",
    "packages/robinsons-toolkit-mcp",
    "packages/rad-crawler-mcp"
)

foreach ($dir in $packageDirs) {
    $distPath = Join-Path $dir "dist/index.js"
    if (Test-Path $distPath) {
        Write-Host "  ✓ $dir is built" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $dir is NOT built" -ForegroundColor Red
        Write-Host "    Run: cd $dir && npm run build" -ForegroundColor Gray
        $allGood = $false
    }
}

# Check 5: RAD Crawler Specific
Write-Host "`n[5/7] Checking RAD Crawler setup..." -ForegroundColor Yellow
$radEnvPath = "packages/rad-crawler-mcp/.env"
if (Test-Path $radEnvPath) {
    $envContent = Get-Content $radEnvPath -Raw
    if ($envContent -match "NEON_DATABASE_URL=postgres://") {
        Write-Host "  ✓ RAD Crawler .env configured" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ RAD Crawler .env exists but NEON_DATABASE_URL may not be set" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ⚠ RAD Crawler .env not found (optional for other servers)" -ForegroundColor Yellow
    Write-Host "    Run: cd packages/rad-crawler-mcp && cp .env.example .env" -ForegroundColor Gray
}

# Check if worker is running
$workerProcess = Get-Process node -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*worker.js*" }
if ($workerProcess) {
    Write-Host "  ✓ RAD Crawler worker is running" -ForegroundColor Green
} else {
    Write-Host "  ⚠ RAD Crawler worker is NOT running (needed for crawl jobs)" -ForegroundColor Yellow
    Write-Host "    Run: cd packages/rad-crawler-mcp && npm run worker" -ForegroundColor Gray
}

# Check 6: Augment Config
Write-Host "`n[6/7] Checking Augment configuration..." -ForegroundColor Yellow
$augmentConfigPaths = @(
    "$env:APPDATA\Augment\mcp-config.json",
    "$env:LOCALAPPDATA\Augment\mcp-config.json",
    "$env:USERPROFILE\.augment\mcp-config.json"
)

$foundConfig = $false
foreach ($configPath in $augmentConfigPaths) {
    if (Test-Path $configPath) {
        Write-Host "  ✓ Found Augment config at: $configPath" -ForegroundColor Green
        $foundConfig = $true
        
        $config = Get-Content $configPath -Raw | ConvertFrom-Json
        $configuredServers = $config.mcpServers.PSObject.Properties.Name
        Write-Host "    Configured servers: $($configuredServers -join ', ')" -ForegroundColor Gray
        
        foreach ($server in @("architect-mcp", "autonomous-agent-mcp", "credit-optimizer-mcp", "robinsons-toolkit-mcp", "rad-crawler-mcp")) {
            if ($configuredServers -contains $server) {
                Write-Host "    ✓ $server configured" -ForegroundColor Green
            } else {
                Write-Host "    ✗ $server NOT configured" -ForegroundColor Red
                $allGood = $false
            }
        }
        break
    }
}

if (-not $foundConfig) {
    Write-Host "  ⚠ Augment config file not found" -ForegroundColor Yellow
    Write-Host "    You need to manually add MCP servers in Augment settings" -ForegroundColor Gray
    Write-Host "    See AUGMENT_SETUP_COMPLETE.md for instructions" -ForegroundColor Gray
}

# Check 7: Test Server Startup
Write-Host "`n[7/7] Testing server startup (quick test)..." -ForegroundColor Yellow
Write-Host "  Testing architect-mcp..." -ForegroundColor Gray

$testJob = Start-Job -ScriptBlock {
    $env:OLLAMA_BASE_URL = "http://localhost:11434"
    $env:ARCHITECT_FAST_MODEL = "qwen2.5:3b"
    & architect-mcp 2>&1 | Select-Object -First 5
}

$timeout = 10
$completed = Wait-Job $testJob -Timeout $timeout
if ($completed) {
    $output = Receive-Job $testJob
    if ($output -match "Architect|Warming|ready") {
        Write-Host "  ✓ architect-mcp starts successfully" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ architect-mcp output unexpected" -ForegroundColor Yellow
        Write-Host "    Output: $($output -join ' ')" -ForegroundColor Gray
    }
} else {
    Write-Host "  ⚠ architect-mcp startup timeout (may still work)" -ForegroundColor Yellow
}

Stop-Job $testJob -ErrorAction SilentlyContinue
Remove-Job $testJob -ErrorAction SilentlyContinue

# Summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Diagnostic Summary" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

if ($allGood) {
    Write-Host "✓ All critical checks passed!" -ForegroundColor Green
    Write-Host "`nNext steps:" -ForegroundColor Cyan
    Write-Host "1. Open Augment Code" -ForegroundColor White
    Write-Host "2. Go to Settings → MCP Servers" -ForegroundColor White
    Write-Host "3. Add each server configuration (see AUGMENT_SETUP_COMPLETE.md)" -ForegroundColor White
    Write-Host "4. Restart Augment" -ForegroundColor White
    Write-Host "5. Ask Augment: 'List all available MCP tools'" -ForegroundColor White
} else {
    Write-Host "✗ Some issues found. Please fix the errors above." -ForegroundColor Red
    Write-Host "`nCommon fixes:" -ForegroundColor Cyan
    Write-Host "- Start Ollama: ollama serve" -ForegroundColor White
    Write-Host "- Link packages: cd packages/<package> && npm link" -ForegroundColor White
    Write-Host "- Build packages: npm run build --workspaces" -ForegroundColor White
    Write-Host "- Pull models: ollama pull qwen2.5:3b" -ForegroundColor White
}

Write-Host "`nFor detailed setup instructions, see:" -ForegroundColor Cyan
Write-Host "  AUGMENT_SETUP_COMPLETE.md" -ForegroundColor White
Write-Host ""

