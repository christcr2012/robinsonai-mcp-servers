#!/bin/bash
# Publish packages individually without workspace build interference

echo "=== Publishing Individual Packages (No Workspace Build) ==="
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
    
    # Skip version bump if already bumped
    local current_version=$(node -p "require('./package.json').version")
    echo "Current version: $current_version"
    
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

# Publish in dependency order
echo "Step 1: Publishing shared-llm (dependency)..."
publish_package "shared-llm"

echo "Step 2: Publishing sequential-thinking-mcp..."
publish_package "sequential-thinking-mcp"

echo "Step 3: Publishing free-agent-mcp..."
publish_package "free-agent-mcp"

echo "Step 4: Publishing other packages..."
publish_package "paid-agent-mcp"
publish_package "thinking-tools-mcp"
publish_package "credit-optimizer-mcp"
publish_package "github-mcp"
publish_package "vercel-mcp"
publish_package "neon-mcp"
publish_package "openai-mcp"

echo "=== PUBLISHING COMPLETE ==="
echo ""
echo "Testing installation..."
npm install -g @robinson_ai_systems/free-agent-mcp
if [ $? -eq 0 ]; then
    echo "SUCCESS: Installation test passed!"
else
    echo "ERROR: Installation test failed"
fi
