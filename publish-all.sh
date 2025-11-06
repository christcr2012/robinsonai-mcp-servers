#!/bin/bash
# Publish all MCP servers with version bumps

echo "=== Publishing All MCP Servers ==="
echo ""

# Array of packages to publish
packages=(
  "free-agent-mcp"
  "paid-agent-mcp"
  "thinking-tools-mcp"
  "credit-optimizer-mcp"
  "robinsons-toolkit-mcp"
)

# Update shared-llm dependency to 0.1.8 in free-agent and paid-agent
echo "Updating shared-llm dependency to 0.1.8..."
cd packages/free-agent-mcp
npm install @robinson_ai_systems/shared-llm@^0.1.8
cd ../..

cd packages/paid-agent-mcp
npm install @robinson_ai_systems/shared-llm@^0.1.8
cd ../..

echo ""
echo "=== Version Bumping and Publishing ==="
echo ""

# Publish each package
for pkg in "${packages[@]}"; do
  echo "----------------------------------------"
  echo "Publishing: $pkg"
  echo "----------------------------------------"
  
  cd "packages/$pkg"
  
  # Version bump (patch)
  npm version patch
  
  # Publish
  npm publish --access public
  
  if [ $? -eq 0 ]; then
    echo "✅ $pkg published successfully"
  else
    echo "❌ $pkg failed to publish"
    exit 1
  fi
  
  cd ../..
  echo ""
done

echo "=== All packages published! ==="
echo ""
echo "Next steps:"
echo "1. Commit version bumps: git add . && git commit -m 'chore: Version bump all packages for GPT-5 compatibility'"
echo "2. Push to GitHub: git push origin main"
echo "3. Update augment-mcp-config.json with new versions"
echo "4. Reload Augment and test with GPT-5"

