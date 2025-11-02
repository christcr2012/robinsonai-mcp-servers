#!/usr/bin/env pwsh
# Setup Local MCP Servers - Build and Link for Development
# This script builds all MCP server packages and links them globally for use

param(
    [switch]$Clean,
    [switch]$SkipBuild,
    [switch]$Verbose
)

$ErrorActionPreference = "Stop"

# Color functions
function Write-Success { param($Message) Write-Host "✅ $Message" -ForegroundColor Green }
function Write-Info { param($Message) Write-Host "ℹ️  $Message" -ForegroundColor Cyan }
function Write-Warning { param($Message) Write-Host "⚠️  $Message" -ForegroundColor Yellow }
function Write-Error { param($Message) Write-Host "❌ $Message" -ForegroundColor Red }
function Write-Step { param($Message) Write-Host "`n🔧 $Message" -ForegroundColor Blue -BackgroundColor Black }

# Core MCP servers to build and link
$MCPServers = @(
    @{ Name = "@robinsonai/free-agent-mcp"; Path = "packages/free-agent-mcp"; Command = "free-agent-mcp" },
    @{ Name = "@robinsonai/paid-agent-mcp"; Path = "packages/paid-agent-mcp"; Command = "paid-agent-mcp" },
    @{ Name = "@robinsonai/robinsons-toolkit-mcp"; Path = "packages/robinsons-toolkit-mcp"; Command = "robinsons-toolkit-mcp" },
    @{ Name = "@robinsonai/thinking-tools-mcp"; Path = "packages/thinking-tools-mcp"; Command = "thinking-tools-mcp" },
    @{ Name = "@robinsonai/credit-optimizer-mcp"; Path = "packages/credit-optimizer-mcp"; Command = "credit-optimizer-mcp" },
    @{ Name = "@robinsonai/openai-mcp"; Path = "packages/openai-mcp"; Command = "openai-mcp" }
)

Write-Step "Setting up Robinson AI MCP Servers for Local Development"
Write-Info "Working directory: $(Get-Location)"

# Step 1: Clean if requested
if ($Clean) {
    Write-Step "Cleaning previous builds..."
    
    # Remove node_modules and dist folders
    Get-ChildItem -Path "packages" -Directory | ForEach-Object {
        $distPath = Join-Path $_.FullName "dist"
        $nodeModulesPath = Join-Path $_.FullName "node_modules"
        
        if (Test-Path $distPath) {
            Remove-Item $distPath -Recurse -Force
            Write-Info "Cleaned $($_.Name)/dist"
        }
        
        if (Test-Path $nodeModulesPath) {
            Remove-Item $nodeModulesPath -Recurse -Force
            Write-Info "Cleaned $($_.Name)/node_modules"
        }
    }
    
    # Clean root node_modules
    if (Test-Path "node_modules") {
        Remove-Item "node_modules" -Recurse -Force
        Write-Info "Cleaned root node_modules"
    }
    
    Write-Success "Clean completed"
}

# Step 2: Install dependencies
Write-Step "Installing dependencies..."
try {
    npm install
    Write-Success "Root dependencies installed"
} catch {
    Write-Error "Failed to install root dependencies: $_"
    exit 1
}

# Step 3: Build packages
if (-not $SkipBuild) {
    Write-Step "Building all packages..."
    try {
        npm run build
        Write-Success "All packages built successfully"
    } catch {
        Write-Error "Build failed: $_"
        exit 1
    }
} else {
    Write-Warning "Skipping build step"
}

# Step 4: Link packages globally
Write-Step "Linking MCP servers globally..."

foreach ($server in $MCPServers) {
    Write-Info "Processing $($server.Name)..."
    
    # Check if package exists
    if (-not (Test-Path $server.Path)) {
        Write-Warning "Package path not found: $($server.Path)"
        continue
    }
    
    # Check if dist folder exists
    $distPath = Join-Path $server.Path "dist"
    if (-not (Test-Path $distPath)) {
        Write-Warning "Dist folder not found for $($server.Name), skipping..."
        continue
    }
    
    # Navigate to package directory and link
    Push-Location $server.Path
    try {
        # Unlink first (ignore errors)
        npm unlink -g 2>$null
        
        # Link globally
        npm link
        Write-Success "Linked $($server.Name) globally"
        
        # Verify the command is available
        $commandPath = Get-Command $server.Command -ErrorAction SilentlyContinue
        if ($commandPath) {
            Write-Success "Command '$($server.Command)' is available at: $($commandPath.Source)"
        } else {
            Write-Warning "Command '$($server.Command)' not found in PATH"
        }
        
    } catch {
        Write-Error "Failed to link $($server.Name): $_"
    } finally {
        Pop-Location
    }
}

# Step 5: Verify installation
Write-Step "Verifying MCP server installations..."

$linkedServers = @()
foreach ($server in $MCPServers) {
    $commandPath = Get-Command $server.Command -ErrorAction SilentlyContinue
    if ($commandPath) {
        $linkedServers += $server
        Write-Success "$($server.Command) ✓"
    } else {
        Write-Warning "$($server.Command) ✗"
    }
}

# Step 6: Summary
Write-Step "Setup Summary"
Write-Info "Successfully linked $($linkedServers.Count) out of $($MCPServers.Count) MCP servers"

if ($linkedServers.Count -gt 0) {
    Write-Success "`nLinked servers:"
    foreach ($server in $linkedServers) {
        Write-Host "  • $($server.Name) → $($server.Command)" -ForegroundColor Green
    }
}

if ($linkedServers.Count -lt $MCPServers.Count) {
    Write-Warning "`nSome servers failed to link. Check the errors above."
    Write-Info "You can re-run this script with -Verbose for more details"
}

Write-Success "`n🎉 Local MCP server setup completed!"
Write-Info "You can now use these servers in your MCP configuration files."
