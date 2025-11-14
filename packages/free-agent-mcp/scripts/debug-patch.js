#!/usr/bin/env node
/**
 * Debug harness for patch generation
 * Creates a minimal test case and compares agent-generated patch vs git diff
 *
 * Run with: node scripts/debug-patch.js (after building)
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Test repo location
const TEST_REPO = path.join(__dirname, ".debug-patch-test");

// Test file content
const ORIGINAL_CONTENT = `/**
 * Simple test file for patch generation
 */

export function greet(name: string): string {
  return \`Hello, \${name}!\`;
}

export function farewell(name: string): string {
  return \`Goodbye, \${name}!\`;
}
`;

const MODIFIED_CONTENT = `/**
 * Simple test file for patch generation
 */

export function greet(name: string): string {
  return \`Hello, \${name}!\`;
}

// Welcome function added here
export function welcome(name: string): string {
  return \`Welcome, \${name}!\`;
}

export function farewell(name: string): string {
  return \`Goodbye, \${name}!\`;
}
`;

async function main() {
  console.log("=== Patch Debug Harness ===\n");

  // 1. Create test repo
  console.log("1. Creating test repo...");
  if (fs.existsSync(TEST_REPO)) {
    fs.rmSync(TEST_REPO, { recursive: true, force: true });
  }
  fs.mkdirSync(TEST_REPO, { recursive: true });
  
  const testFile = path.join(TEST_REPO, "hello.ts");
  fs.writeFileSync(testFile, ORIGINAL_CONTENT, "utf-8");
  
  // Initialize git repo
  execSync("git init", { cwd: TEST_REPO, stdio: "pipe" });
  execSync("git add .", { cwd: TEST_REPO, stdio: "pipe" });
  execSync('git commit -m "Initial commit"', { cwd: TEST_REPO, stdio: "pipe" });
  
  console.log(`   ✓ Test repo created at: ${TEST_REPO}`);
  console.log(`   ✓ Test file: hello.ts\n`);

  // 2. Generate expected patch (git diff)
  console.log("2. Generating expected patch (git diff)...");
  fs.writeFileSync(testFile, MODIFIED_CONTENT, "utf-8");
  
  const expectedPatch = execSync("git diff hello.ts", { 
    cwd: TEST_REPO, 
    encoding: "utf-8" 
  });
  
  const expectedPatchFile = path.join(TEST_REPO, "expected.patch");
  fs.writeFileSync(expectedPatchFile, expectedPatch, "utf-8");
  
  console.log(`   ✓ Expected patch saved to: expected.patch`);
  console.log(`   ✓ Patch size: ${expectedPatch.length} bytes\n`);

  // Reset file for agent test
  execSync("git checkout hello.ts", { cwd: TEST_REPO, stdio: "pipe" });

  // 3. Generate agent patch
  console.log("3. Generating agent patch...");

  // Import the patch generation code from main index
  const { applyOpsInPlace, bundleUnified } = require("../dist/index.js");
  
  // Create a simple insert_after op
  const ops = [
    {
      op: "insert_after",
      path: "hello.ts",
      anchor: "return `Hello, ${name}!`;",
      code: `
// Welcome function added here
export function welcome(name: string): string {
  return \`Welcome, \${name}!\`;
}
`
    }
  ];
  
  // Apply ops and generate patch
  const changes = applyOpsInPlace(TEST_REPO, ops);
  const agentPatch = bundleUnified(changes);
  
  const agentPatchFile = path.join(TEST_REPO, "agent.patch");
  fs.writeFileSync(agentPatchFile, agentPatch, "utf-8");
  
  console.log(`   ✓ Agent patch saved to: agent.patch`);
  console.log(`   ✓ Patch size: ${agentPatch.length} bytes\n`);

  // Reset file again
  execSync("git checkout hello.ts", { cwd: TEST_REPO, stdio: "pipe" });

  // 4. Test both patches
  console.log("4. Testing patches with git apply --check...\n");
  
  console.log("   Expected patch:");
  try {
    execSync("git apply --check expected.patch", { 
      cwd: TEST_REPO, 
      stdio: "pipe" 
    });
    console.log("   ✓ PASS - git apply --check succeeded\n");
  } catch (error) {
    console.log("   ✗ FAIL - git apply --check failed:");
    console.log("   " + error.stderr.toString().trim().replace(/\n/g, "\n   "));
    console.log();
  }

  console.log("   Agent patch:");
  try {
    execSync("git apply --check agent.patch", {
      cwd: TEST_REPO,
      stdio: "pipe"
    });
    console.log("   ✓ PASS - git apply --check succeeded\n");
  } catch (error) {
    console.log("   ✗ FAIL - git apply --check failed:");
    console.log("   " + error.stderr.toString().trim().replace(/\n/g, "\n   "));
    console.log();
  }

  // 5. Show patch comparison
  console.log("5. Patch comparison:\n");
  console.log("=== EXPECTED PATCH (first 20 lines) ===");
  console.log(expectedPatch.split("\n").slice(0, 20).join("\n"));
  console.log("\n=== AGENT PATCH (first 20 lines) ===");
  console.log(agentPatch.split("\n").slice(0, 20).join("\n"));
  console.log("\n=== END ===\n");
  
  console.log(`Full patches saved to:`);
  console.log(`  - ${expectedPatchFile}`);
  console.log(`  - ${agentPatchFile}`);
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

