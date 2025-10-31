# Comprehensive Refactoring Execution Script
# Automates the renaming and restructuring of MCP servers

Write-Host "🔄 Starting Comprehensive Refactoring..." -ForegroundColor Cyan
Write-Host ""

# Phase 1: Rename autonomous-agent-mcp → free-agent-mcp
Write-Host "📦 Phase 1.1: Renaming autonomous-agent-mcp → free-agent-mcp" -ForegroundColor Yellow

if (Test-Path "packages/autonomous-agent-mcp") {
    Write-Host "  → Renaming folder..." -ForegroundColor Gray
    Rename-Item -Path "packages/autonomous-agent-mcp" -NewName "free-agent-mcp"
    Write-Host "  ✓ Folder renamed" -ForegroundColor Green
} else {
    Write-Host "  ⚠ autonomous-agent-mcp folder not found (may already be renamed)" -ForegroundColor Yellow
}

# Phase 1.2: Rename openai-worker-mcp → paid-agent-mcp
Write-Host ""
Write-Host "📦 Phase 1.2: Renaming openai-worker-mcp → paid-agent-mcp" -ForegroundColor Yellow

if (Test-Path "packages/openai-worker-mcp") {
    Write-Host "  → Renaming folder..." -ForegroundColor Gray
    Rename-Item -Path "packages/openai-worker-mcp" -NewName "paid-agent-mcp"
    Write-Host "  ✓ Folder renamed" -ForegroundColor Green
} else {
    Write-Host "  ⚠ openai-worker-mcp folder not found (may already be renamed)" -ForegroundColor Yellow
}

# Phase 2: Update package.json files
Write-Host ""
Write-Host "📝 Phase 2: Updating package.json files" -ForegroundColor Yellow

# Update free-agent-mcp package.json
if (Test-Path "packages/free-agent-mcp/package.json") {
    Write-Host "  → Updating free-agent-mcp/package.json..." -ForegroundColor Gray
    $pkg = Get-Content "packages/free-agent-mcp/package.json" -Raw | ConvertFrom-Json
    $pkg.name = "@robinsonai/free-agent-mcp"
    $pkg.description = "Free Agent MCP - Execute tasks using FREE models (Ollama, etc.)"
    $pkg.bin = @{ "free-agent-mcp" = "./dist/index.js" }
    $pkg | ConvertTo-Json -Depth 10 | Set-Content "packages/free-agent-mcp/package.json"
    Write-Host "  ✓ free-agent-mcp/package.json updated" -ForegroundColor Green
}

# Update paid-agent-mcp package.json
if (Test-Path "packages/paid-agent-mcp/package.json") {
    Write-Host "  → Updating paid-agent-mcp/package.json..." -ForegroundColor Gray
    $pkg = Get-Content "packages/paid-agent-mcp/package.json" -Raw | ConvertFrom-Json
    $pkg.name = "@robinsonai/paid-agent-mcp"
    $pkg.description = "Paid Agent MCP - Execute tasks using PAID models (OpenAI, Claude, etc.)"
    $pkg.bin = @{ "paid-agent-mcp" = "./dist/index.js" }
    $pkg | ConvertTo-Json -Depth 10 | Set-Content "packages/paid-agent-mcp/package.json"
    Write-Host "  ✓ paid-agent-mcp/package.json updated" -ForegroundColor Green
}

# Phase 3: Update configuration files
Write-Host ""
Write-Host "⚙️ Phase 3: Updating configuration files" -ForegroundColor Yellow

# Update READY_TO_PASTE_CONFIG.json
if (Test-Path "READY_TO_PASTE_CONFIG.json") {
    Write-Host "  → Updating READY_TO_PASTE_CONFIG.json..." -ForegroundColor Gray
    $config = Get-Content "READY_TO_PASTE_CONFIG.json" -Raw | ConvertFrom-Json
    
    # Rename autonomous-agent-mcp → free-agent-mcp
    if ($config.mcpServers."autonomous-agent-mcp") {
        $config.mcpServers | Add-Member -MemberType NoteProperty -Name "free-agent-mcp" -Value $config.mcpServers."autonomous-agent-mcp" -Force
        $config.mcpServers."free-agent-mcp".args = @("free-agent-mcp")
        $config.mcpServers.PSObject.Properties.Remove("autonomous-agent-mcp")
    }
    
    # Rename openai-worker-mcp → paid-agent-mcp
    if ($config.mcpServers."openai-worker-mcp") {
        $config.mcpServers | Add-Member -MemberType NoteProperty -Name "paid-agent-mcp" -Value $config.mcpServers."openai-worker-mcp" -Force
        $config.mcpServers."paid-agent-mcp".args = @("paid-agent-mcp")
        $config.mcpServers.PSObject.Properties.Remove("openai-worker-mcp")
    }
    
    $config | ConvertTo-Json -Depth 10 | Set-Content "READY_TO_PASTE_CONFIG.json"
    Write-Host "  ✓ READY_TO_PASTE_CONFIG.json updated" -ForegroundColor Green
}

# Phase 4: Rebuild packages
Write-Host ""
Write-Host "🔨 Phase 4: Rebuilding packages" -ForegroundColor Yellow

if (Test-Path "packages/free-agent-mcp") {
    Write-Host "  → Building free-agent-mcp..." -ForegroundColor Gray
    Push-Location "packages/free-agent-mcp"
    npm run build 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ free-agent-mcp built successfully" -ForegroundColor Green
    } else {
        Write-Host "  ✗ free-agent-mcp build failed" -ForegroundColor Red
    }
    Pop-Location
}

if (Test-Path "packages/paid-agent-mcp") {
    Write-Host "  → Building paid-agent-mcp..." -ForegroundColor Gray
    Push-Location "packages/paid-agent-mcp"
    npm run build 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ paid-agent-mcp built successfully" -ForegroundColor Green
    } else {
        Write-Host "  ✗ paid-agent-mcp build failed" -ForegroundColor Red
    }
    Pop-Location
}

# Phase 5: Summary
Write-Host ""
Write-Host "✅ Refactoring Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Summary:" -ForegroundColor Cyan
Write-Host "  • autonomous-agent-mcp → free-agent-mcp" -ForegroundColor White
Write-Host "  • openai-worker-mcp → paid-agent-mcp" -ForegroundColor White
Write-Host "  • package.json files updated" -ForegroundColor White
Write-Host "  • Configuration files updated" -ForegroundColor White
Write-Host "  • Packages rebuilt" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Update tool names in source code (execute_versatile_task_*)" -ForegroundColor White
Write-Host "  2. Update imports in credit-optimizer-mcp" -ForegroundColor White
Write-Host "  3. Update imports in architect-mcp" -ForegroundColor White
Write-Host "  4. Run: npm install (to update package-lock.json)" -ForegroundColor White
Write-Host "  5. Restart Augment to pick up changes" -ForegroundColor White
Write-Host ""

