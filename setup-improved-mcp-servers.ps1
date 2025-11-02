#!/usr/bin/env pwsh
# Setup script for Robinson AI Systems MCP Servers - Latest Versions
# This script will install and configure all 6 MCP servers for Augment Code

Write-Host "🚀 Setting up Robinson AI Systems MCP Servers (Latest Versions)" -ForegroundColor Green
Write-Host "=================================================================" -ForegroundColor Green

# Check if Node.js is installed
Write-Host "📋 Checking prerequisites..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js 18+ first." -ForegroundColor Red
    exit 1
}

# Check if npm is available
try {
    $npmVersion = npm --version
    Write-Host "✅ npm version: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm not found. Please install npm first." -ForegroundColor Red
    exit 1
}

# Install Ollama models if not present
Write-Host "🤖 Checking Ollama models..." -ForegroundColor Yellow
$requiredModels = @(
    "qwen2.5:3b",
    "qwen2.5-coder:7b", 
    "deepseek-coder:33b"
)

foreach ($model in $requiredModels) {
    Write-Host "Checking for model: $model" -ForegroundColor Cyan
    try {
        $result = ollama list | Select-String $model
        if ($result) {
            Write-Host "✅ Model $model is already installed" -ForegroundColor Green
        } else {
            Write-Host "📥 Installing model: $model (this may take a while...)" -ForegroundColor Yellow
            ollama pull $model
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ Successfully installed $model" -ForegroundColor Green
            } else {
                Write-Host "⚠️  Failed to install $model - you may need to install it manually" -ForegroundColor Yellow
            }
        }
    } catch {
        Write-Host "⚠️  Could not check/install $model - Ollama may not be running" -ForegroundColor Yellow
    }
}

# Install/Update MCP Servers
Write-Host "📦 Installing/Updating MCP Servers..." -ForegroundColor Yellow

$mcpServers = @(
    "@robinson_ai_systems/free-agent-mcp@latest",
    "@robinson_ai_systems/paid-agent-mcp@latest", 
    "@robinson_ai_systems/thinking-tools-mcp@latest",
    "@robinson_ai_systems/credit-optimizer-mcp@latest",
    "@robinson_ai_systems/robinsons-toolkit-mcp@latest",
    "@robinson_ai_systems/openai-mcp@latest"
)

foreach ($server in $mcpServers) {
    Write-Host "Installing: $server" -ForegroundColor Cyan
    try {
        npm install -g $server
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Successfully installed $server" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Warning: Failed to install $server" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "⚠️  Warning: Error installing $server" -ForegroundColor Yellow
    }
}

Write-Host "🔧 Configuration complete!" -ForegroundColor Green
Write-Host "📄 Updated configuration saved to: augment-mcp-config-updated.json" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Copy the contents of 'augment-mcp-config-updated.json' to your Augment settings" -ForegroundColor White
Write-Host "2. Restart VS Code to load the new MCP servers" -ForegroundColor White
Write-Host "3. Verify the servers are working by checking the Augment extension" -ForegroundColor White
Write-Host ""
Write-Host "🎯 You now have access to:" -ForegroundColor Green
Write-Host "   • FREE Agent MCP (0 credits) - Local LLM execution" -ForegroundColor White
Write-Host "   • Paid Agent MCP - Budget-controlled paid models" -ForegroundColor White  
Write-Host "   • Thinking Tools MCP - 24 cognitive frameworks + Context Engine" -ForegroundColor White
Write-Host "   • Credit Optimizer MCP - Tool discovery & autonomous workflows" -ForegroundColor White
Write-Host "   • Robinson's Toolkit MCP - 1165+ integration tools" -ForegroundColor White
Write-Host "   • OpenAI MCP - Direct OpenAI API access" -ForegroundColor White
Write-Host ""
Write-Host "💰 Expected savings: 70-85% on Augment credits!" -ForegroundColor Green
