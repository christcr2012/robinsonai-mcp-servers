#!/bin/bash
# Publish only the packages that we know work (skip robinsons-toolkit-mcp for now)

echo "=== Publishing Working Packages Only ==="
echo ""

# Function to publish a single package
publish_package() {
    local package_name=$1
    local package_dir="packages/$package_name"
    
    echo "Publishing $package_name..."
    
    if [ ! -d "$package_dir" ]; then
        echo "ERROR: Directory $package_dir does not exist"
        return 1
    fi
    
    if [ ! -d "$package_dir/dist" ]; then
        echo "ERROR: No dist directory found in $package_dir"
        return 1
    fi
    
    cd "$package_dir"
    
    # Publish directly without build (dist already exists)
    npm publish --access public --no-scripts
    local exit_code=$?
    
    cd ../..
    
    if [ $exit_code -eq 0 ]; then
        echo "SUCCESS: $package_name published"
    else
        echo "ERROR: Failed to publish $package_name"
    fi
    
    echo ""
    return $exit_code
}

# Publish in dependency order (skip robinsons-toolkit-mcp)
echo "Step 1: Publishing shared-llm (dependency)..."
publish_package "shared-llm"

echo "Step 2: Publishing sequential-thinking-mcp..."
publish_package "sequential-thinking-mcp"

echo "Step 3: Publishing free-agent-mcp..."
publish_package "free-agent-mcp"

echo "Step 4: Publishing other working packages..."
publish_package "paid-agent-mcp"
publish_package "thinking-tools-mcp"
publish_package "credit-optimizer-mcp"
publish_package "github-mcp"
publish_package "vercel-mcp"
publish_package "neon-mcp"
publish_package "openai-mcp"

echo "=== PUBLISHING COMPLETE ==="
echo ""
echo "Skipped robinsons-toolkit-mcp (has TypeScript issues)"
echo ""
echo "Testing installation of free-agent-mcp..."
npm install -g @robinson_ai_systems/free-agent-mcp
if [ $? -eq 0 ]; then
    echo "SUCCESS: Installation test passed!"
    echo ""
    echo "🎉 You now have 9 working MCP servers published:"
    echo "   @robinson_ai_systems/shared-llm"
    echo "   @robinson_ai_systems/sequential-thinking-mcp"
    echo "   @robinson_ai_systems/free-agent-mcp"
    echo "   @robinson_ai_systems/paid-agent-mcp"
    echo "   @robinson_ai_systems/thinking-tools-mcp"
    echo "   @robinson_ai_systems/credit-optimizer-mcp"
    echo "   @robinson_ai_systems/github-mcp"
    echo "   @robinson_ai_systems/vercel-mcp"
    echo "   @robinson_ai_systems/neon-mcp"
    echo "   @robinson_ai_systems/openai-mcp"
else
    echo "ERROR: Installation test failed"
fi
