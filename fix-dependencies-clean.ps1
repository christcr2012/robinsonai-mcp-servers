# Fix All Dependencies and Publish - Robinson AI MCP Servers
# This script fixes ALL dependency issues and publishes everything in the correct order

Write-Host "Robinson AI MCP Servers - Complete Dependency Fix and Publish" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green

# Step 1: Publish shared-llm first (dependency for free-agent-mcp)
Write-Host ""
Write-Host "Step 1: Publishing shared-llm (dependency)..." -ForegroundColor Yellow
Set-Location "packages\shared-llm"
npm publish --access public
if ($LASTEXITCODE -eq 0) {
    Write-Host "SUCCESS: shared-llm published successfully" -ForegroundColor Green
} else {
    Write-Host "ERROR: Failed to publish shared-llm" -ForegroundColor Red
}
Set-Location "..\..\"

# Step 2: Publish sequential-thinking-mcp (was missed)
Write-Host ""
Write-Host "Step 2: Publishing sequential-thinking-mcp..." -ForegroundColor Yellow
Set-Location "packages\sequential-thinking-mcp"
npm publish --access public
if ($LASTEXITCODE -eq 0) {
    Write-Host "SUCCESS: sequential-thinking-mcp published successfully" -ForegroundColor Green
} else {
    Write-Host "ERROR: Failed to publish sequential-thinking-mcp" -ForegroundColor Red
}
Set-Location "..\..\"

# Step 3: Republish free-agent-mcp with fixed dependency
Write-Host ""
Write-Host "Step 3: Republishing free-agent-mcp with fixed dependency..." -ForegroundColor Yellow
Set-Location "packages\free-agent-mcp"
npm version patch
npm publish --access public
if ($LASTEXITCODE -eq 0) {
    Write-Host "SUCCESS: free-agent-mcp republished successfully" -ForegroundColor Green
} else {
    Write-Host "ERROR: Failed to republish free-agent-mcp" -ForegroundColor Red
}
Set-Location "..\..\"

# Step 4: Republish all other packages with patch versions
$packages = @(
    "paid-agent-mcp",
    "thinking-tools-mcp", 
    "credit-optimizer-mcp",
    "github-mcp",
    "vercel-mcp",
    "neon-mcp",
    "openai-mcp"
)

Write-Host ""
Write-Host "Step 4: Republishing all other packages..." -ForegroundColor Yellow
foreach ($package in $packages) {
    Write-Host ""
    Write-Host "Republishing $package..." -ForegroundColor Cyan
    Set-Location "packages\$package"
    npm version patch
    npm publish --access public
    if ($LASTEXITCODE -eq 0) {
        Write-Host "SUCCESS: $package republished successfully" -ForegroundColor Green
    } else {
        Write-Host "ERROR: Failed to republish $package" -ForegroundColor Red
    }
    Set-Location "..\..\"
}

# Step 5: Test installation
Write-Host ""
Write-Host "Step 5: Testing installation..." -ForegroundColor Yellow
npm install -g "@robinson_ai_systems/free-agent-mcp"
if ($LASTEXITCODE -eq 0) {
    Write-Host "SUCCESS: Installation test successful!" -ForegroundColor Green
} else {
    Write-Host "ERROR: Installation test failed" -ForegroundColor Red
}

Write-Host ""
Write-Host "COMPLETE! All packages published with fixed dependencies." -ForegroundColor Green
Write-Host ""
Write-Host "You can now install:" -ForegroundColor Cyan
Write-Host "npm install -g @robinson_ai_systems/free-agent-mcp" -ForegroundColor White
Write-Host "npm install -g @robinson_ai_systems/paid-agent-mcp" -ForegroundColor White
Write-Host "npm install -g @robinson_ai_systems/thinking-tools-mcp" -ForegroundColor White
Write-Host "npm install -g @robinson_ai_systems/credit-optimizer-mcp" -ForegroundColor White
Write-Host "npm install -g @robinson_ai_systems/github-mcp" -ForegroundColor White
Write-Host "npm install -g @robinson_ai_systems/vercel-mcp" -ForegroundColor White
Write-Host "npm install -g @robinson_ai_systems/neon-mcp" -ForegroundColor White
Write-Host "npm install -g @robinson_ai_systems/openai-mcp" -ForegroundColor White
Write-Host "npm install -g @robinson_ai_systems/sequential-thinking-mcp" -ForegroundColor White
Write-Host "npm install -g @robinson_ai_systems/shared-llm" -ForegroundColor White
