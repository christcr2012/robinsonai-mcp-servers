# Robinson AI MCP Servers - Publishing Script
# This script publishes the 8 working MCP servers to npm

Write-Host "🚀 Robinson AI MCP Servers Publishing Script" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green

# Check npm login status
Write-Host "`n📋 Checking npm authentication..." -ForegroundColor Yellow
try {
    $whoami = npm whoami 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Logged in as: $whoami" -ForegroundColor Green
    } else {
        Write-Host "❌ Not logged in to npm. Please run 'npm login' first." -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Not logged in to npm. Please run 'npm login' first." -ForegroundColor Red
    exit 1
}

# Define the 8 working MCP servers
$servers = @(
    @{ name = "free-agent-mcp"; version = "0.1.1"; description = "FREE models (0 credits)" },
    @{ name = "paid-agent-mcp"; version = "0.2.0"; description = "PAID models for complex tasks" },
    @{ name = "thinking-tools-mcp"; version = "1.0.0"; description = "24 cognitive frameworks" },
    @{ name = "credit-optimizer-mcp"; version = "0.1.1"; description = "Tool discovery & templates" },
    @{ name = "github-mcp"; version = "2.0.0"; description = "GitHub integration (241 tools)" },
    @{ name = "vercel-mcp"; version = "1.0.0"; description = "Vercel deployment integration" },
    @{ name = "neon-mcp"; version = "2.0.0"; description = "Neon Postgres integration" },
    @{ name = "openai-mcp"; version = "1.0.0"; description = "Direct OpenAI API access" }
)

Write-Host "`n📦 Publishing 8 MCP servers..." -ForegroundColor Yellow

$published = 0
$failed = 0

foreach ($server in $servers) {
    $packageName = "@robinsonai/$($server.name)"
    $packageDir = "packages\$($server.name)"
    
    Write-Host "`n🔄 Publishing $packageName v$($server.version)..." -ForegroundColor Cyan
    Write-Host "   📝 $($server.description)" -ForegroundColor Gray
    
    # Check if package directory exists
    if (-not (Test-Path $packageDir)) {
        Write-Host "   ❌ Directory not found: $packageDir" -ForegroundColor Red
        $failed++
        continue
    }
    
    # Check if dist directory exists
    if (-not (Test-Path "$packageDir\dist")) {
        Write-Host "   ❌ Build artifacts not found: $packageDir\dist" -ForegroundColor Red
        $failed++
        continue
    }
    
    # Change to package directory and publish
    Push-Location $packageDir
    try {
        # Check current published version
        $currentVersion = npm view $packageName version 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   📋 Current published version: $currentVersion" -ForegroundColor Gray
            if ($currentVersion -eq $server.version) {
                Write-Host "   ⚠️  Version $($server.version) already published. Skipping." -ForegroundColor Yellow
                Pop-Location
                continue
            }
        } else {
            Write-Host "   📋 Package not yet published" -ForegroundColor Gray
        }
        
        # Publish the package
        Write-Host "   🚀 Publishing..." -ForegroundColor Yellow
        npm publish --access public
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   ✅ Successfully published $packageName v$($server.version)" -ForegroundColor Green
            $published++
        } else {
            Write-Host "   ❌ Failed to publish $packageName" -ForegroundColor Red
            $failed++
        }
    } catch {
        Write-Host "   ❌ Error publishing $packageName : $_" -ForegroundColor Red
        $failed++
    } finally {
        Pop-Location
    }
}

# Summary
Write-Host "`n📊 PUBLISHING SUMMARY" -ForegroundColor Green
Write-Host "===================" -ForegroundColor Green
Write-Host "✅ Successfully published: $published packages" -ForegroundColor Green
Write-Host "❌ Failed: $failed packages" -ForegroundColor Red
Write-Host "📦 Total: $($servers.Count) packages" -ForegroundColor Cyan

if ($published -gt 0) {
    Write-Host "`n🎉 SUCCESS! You can now install these MCP servers:" -ForegroundColor Green
    foreach ($server in $servers) {
        Write-Host "   npm install -g @robinsonai/$($server.name)" -ForegroundColor Cyan
    }
}

Write-Host "`n✨ Done!" -ForegroundColor Green
