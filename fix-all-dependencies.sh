#!/bin/bash
# Fix All Dependencies and Publish - Robinson AI MCP Servers
# This script fixes ALL dependency issues and publishes everything in the correct order

echo "🔧 Robinson AI MCP Servers - Complete Dependency Fix & Publish"
echo "================================================================"

# Step 1: Publish shared-llm first (dependency for free-agent-mcp)
echo ""
echo "📦 Step 1: Publishing shared-llm (dependency)..."
cd packages/shared-llm
npm publish --access public
if [ $? -eq 0 ]; then
    echo "✅ shared-llm published successfully"
else
    echo "❌ Failed to publish shared-llm"
fi
cd ../..

# Step 2: Publish sequential-thinking-mcp (was missed)
echo ""
echo "📦 Step 2: Publishing sequential-thinking-mcp..."
cd packages/sequential-thinking-mcp
npm publish --access public
if [ $? -eq 0 ]; then
    echo "✅ sequential-thinking-mcp published successfully"
else
    echo "❌ Failed to publish sequential-thinking-mcp"
fi
cd ../..

# Step 3: Republish free-agent-mcp with fixed dependency
echo ""
echo "📦 Step 3: Republishing free-agent-mcp with fixed dependency..."
cd packages/free-agent-mcp
npm version patch  # Bump to 0.1.2
npm publish --access public
if [ $? -eq 0 ]; then
    echo "✅ free-agent-mcp republished successfully"
else
    echo "❌ Failed to republish free-agent-mcp"
fi
cd ../..

# Step 4: Republish all other packages with patch versions
packages=("paid-agent-mcp" "thinking-tools-mcp" "credit-optimizer-mcp" "github-mcp" "vercel-mcp" "neon-mcp" "openai-mcp")

echo ""
echo "📦 Step 4: Republishing all other packages..."
for package in "${packages[@]}"; do
    echo ""
    echo "🔄 Republishing $package..."
    cd "packages/$package"
    npm version patch
    npm publish --access public
    if [ $? -eq 0 ]; then
        echo "✅ $package republished successfully"
    else
        echo "❌ Failed to republish $package"
    fi
    cd ../..
done

# Step 5: Test installation
echo ""
echo "🧪 Step 5: Testing installation..."
npm install -g @robinson_ai_systems/free-agent-mcp
if [ $? -eq 0 ]; then
    echo "✅ Installation test successful!"
else
    echo "❌ Installation test failed"
fi

echo ""
echo "🎉 COMPLETE! All packages published with fixed dependencies."
echo ""
echo "You can now install:"
echo "npm install -g @robinson_ai_systems/free-agent-mcp"
echo "npm install -g @robinson_ai_systems/paid-agent-mcp"
echo "npm install -g @robinson_ai_systems/thinking-tools-mcp"
echo "npm install -g @robinson_ai_systems/credit-optimizer-mcp"
echo "npm install -g @robinson_ai_systems/github-mcp"
echo "npm install -g @robinson_ai_systems/vercel-mcp"
echo "npm install -g @robinson_ai_systems/neon-mcp"
echo "npm install -g @robinson_ai_systems/openai-mcp"
echo "npm install -g @robinson_ai_systems/sequential-thinking-mcp"
echo "npm install -g @robinson_ai_systems/shared-llm"
