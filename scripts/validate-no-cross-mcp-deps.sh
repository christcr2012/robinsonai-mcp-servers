#!/bin/bash
# Validate that MCP packages have no cross-MCP runtime dependencies
# This ensures each MCP package is truly self-contained

set -e

echo "🔍 Validating MCP packages for cross-MCP dependencies..."
echo ""

FAILED=0

# Check each MCP package
for mcp in free-agent-mcp paid-agent-mcp thinking-tools-mcp robinsons-toolkit-mcp; do
  echo "Checking $mcp..."
  
  # Check if dist exists
  if [ ! -d "packages/$mcp/dist" ]; then
    echo "  ⚠️  WARNING: dist/ not found for $mcp (not built yet?)"
    continue
  fi
  
  # Search for any @robinson_ai_systems/* imports in bundled code
  # Exclude comments, strings, and package.json lookups (which are OK for runtime integration)
  if grep -r "@robinson_ai_systems/" "packages/$mcp/dist" --include="*.js" 2>/dev/null | grep -v "^[[:space:]]*//\|^[[:space:]]*\*" | grep -v "console.log\|console.error\|console.warn" | grep -v "package.json"; then
    echo "  ❌ FAIL: $mcp has cross-MCP dependencies in dist/"
    FAILED=1
  else
    echo "  ✅ PASS: No cross-MCP dependencies found"
  fi
  
  echo ""
done

if [ $FAILED -eq 1 ]; then
  echo "❌ VALIDATION FAILED: Some MCP packages have cross-MCP dependencies"
  echo ""
  echo "Each MCP package must be self-contained at runtime."
  echo "Shared code should be bundled via tsup's noExternal config."
  exit 1
fi

echo "✅ VALIDATION PASSED: All MCP packages are self-contained"
exit 0

