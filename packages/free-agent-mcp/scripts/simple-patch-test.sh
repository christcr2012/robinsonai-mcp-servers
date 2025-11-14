#!/bin/bash
# Simple patch comparison test

set -e

TEST_DIR=".patch-test"
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

# Make the change
cat > hello.ts << 'EOF'
/**
 * Simple test file for patch generation
 */

export function greet(name: string): string {
  return `Hello, ${name}!`;
}

// Welcome function added here
export function welcome(name: string): string {
  return `Welcome, ${name}!`;
}

export function farewell(name: string): string {
  return `Goodbye, ${name}!`;
}
EOF

# Generate expected patch
git diff > expected.patch

echo "=== EXPECTED PATCH (git diff) ==="
cat expected.patch
echo ""
echo "=== Testing git apply --check ==="
git checkout hello.ts
git apply --check expected.patch && echo "✓ PASS" || echo "✗ FAIL"

cd ..

