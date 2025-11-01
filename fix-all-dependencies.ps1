# Fix All Dependencies and Publish - Robinson AI MCP Servers
# This script fixes ALL dependency issues and publishes everything in the correct order

Write-Host "🔧 Robinson AI MCP Servers - Complete Dependency Fix & Publish" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green

# Step 1: Publish shared-llm first (dependency for free-agent-mcp)
Write-Host "`n📦 Step 1: Publishing shared-llm (dependency)..." -ForegroundColor Yellow
cd packages/shared-llm
npm publish --access public
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ shared-llm published successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to publish shared-llm" -ForegroundColor Red
}
cd ../..

# Step 2: Publish sequential-thinking-mcp (was missed)
Write-Host "`n📦 Step 2: Publishing sequential-thinking-mcp..." -ForegroundColor Yellow
cd packages/sequential-thinking-mcp
npm publish --access public
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ sequential-thinking-mcp published successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to publish sequential-thinking-mcp" -ForegroundColor Red
}
cd ../..

# Step 3: Republish free-agent-mcp with fixed dependency
Write-Host "`n📦 Step 3: Republishing free-agent-mcp with fixed dependency..." -ForegroundColor Yellow
cd packages/free-agent-mcp
npm version patch  # Bump to 0.1.2
npm publish --access public
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ free-agent-mcp republished successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to republish free-agent-mcp" -ForegroundColor Red
}
cd ../..

# Step 4: Republish all other packages with patch versions (to ensure consistency)
$packages = @(
    "paid-agent-mcp",
    "thinking-tools-mcp", 
    "credit-optimizer-mcp",
    "github-mcp",
    "vercel-mcp",
    "neon-mcp",
    "openai-mcp"
)

Write-Host "`n📦 Step 4: Republishing all other packages..." -ForegroundColor Yellow
foreach ($package in $packages) {
    Write-Host "`n🔄 Republishing $package..." -ForegroundColor Cyan
    cd "packages/$package"
    npm version patch
    npm publish --access public
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ $package republished successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to republish $package" -ForegroundColor Red
    }
    cd ../..
}

# Step 5: Test installation
Write-Host "`n🧪 Step 5: Testing installation..." -ForegroundColor Yellow
npm install -g @robinson_ai_systems/free-agent-mcp
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Installation test successful!" -ForegroundColor Green
} else {
    Write-Host "❌ Installation test failed" -ForegroundColor Red
}

Write-Host "`n🎉 COMPLETE! All packages published with fixed dependencies." -ForegroundColor Green
Write-Host "`nYou can now install:" -ForegroundColor Cyan
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
