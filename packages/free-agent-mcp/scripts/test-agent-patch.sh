#!/bin/bash
# Test agent patch generation

set -e

TEST_DIR=".agent-patch-test"
rm -rf "$TEST_DIR"
mkdir -p "$TEST_DIR"
cd "$TEST_DIR"

# Create test file
cat > hello.ts << 'EOF'
/**
 * Simple test file for patch generation
 */

export function greet(name: string): string {
  return `Hello, ${name}!`;
}

export function farewell(name: string): string {
  return `Goodbye, ${name}!`;
}
EOF

# Initialize git
git init
git add .
git commit -m "Initial commit"

echo "=== Running Free Agent to generate patch ==="
cd ..
CODEGEN_VERBOSE=1 FREE_AGENT_TIER=free FREE_AGENT_QUALITY=best \
  node dist/cli.js run \
  --repo .agent-patch-test \
  --task "Add a welcome function between greet and farewell" \
  --kind feature \
  2>&1 | tee agent-output.log

echo ""
echo "=== Checking if patch was applied ==="
cd .agent-patch-test
git diff

cd ..

