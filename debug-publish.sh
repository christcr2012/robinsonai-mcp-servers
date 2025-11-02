#!/bin/bash
# Debug publishing issues

echo "=== DEBUG: Publishing Issues ==="
echo ""

# Check npm login status
echo "1. Checking npm login status..."
npm whoami
if [ $? -ne 0 ]; then
    echo "ERROR: Not logged in to npm. Run 'npm login' first."
    exit 1
fi

# Check if we can access the organization
echo ""
echo "2. Checking organization access..."
npm access list packages @robinson_ai_systems 2>/dev/null
if [ $? -ne 0 ]; then
    echo "WARNING: Cannot list packages for @robinson_ai_systems organization"
    echo "This might be normal if no packages are published yet"
fi

# Test publishing one package with verbose output
echo ""
echo "3. Testing publish of shared-llm with verbose output..."
cd packages/shared-llm
echo "Current directory: $(pwd)"
echo "Package.json name:"
grep '"name"' package.json
echo ""
echo "Attempting to publish..."
npm publish --access public --verbose
echo "Exit code: $?"
cd ../..

echo ""
echo "=== DEBUG COMPLETE ==="
