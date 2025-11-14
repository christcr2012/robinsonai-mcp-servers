#!/usr/bin/env node
/**
 * Test patch format generation
 * Tests the bundleUnified function directly
 */

const { createTwoFilesPatch } = require("diff");
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// Test data
const BEFORE = `/**
 * Simple test file for patch generation
 */

export function greet(name: string): string {
  return \`Hello, \${name}!\`;
}

export function farewell(name: string): string {
  return \`Goodbye, \${name}!\`;
}
`;

const AFTER = `/**
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

// Create test repo
const TEST_DIR = path.join(__dirname, ".format-test");
if (fs.existsSync(TEST_DIR)) {
  fs.rmSync(TEST_DIR, { recursive: true, force: true });
}
fs.mkdirSync(TEST_DIR, { recursive: true });

const testFile = path.join(TEST_DIR, "hello.ts");
fs.writeFileSync(testFile, BEFORE, "utf-8");

// Initialize git
execSync("git init", { cwd: TEST_DIR, stdio: "pipe" });
execSync("git add .", { cwd: TEST_DIR, stdio: "pipe" });
execSync('git commit -m "Initial"', { cwd: TEST_DIR, stdio: "pipe" });

console.log("=== Test 1: Git's patch format ===\n");

// Generate git's patch
fs.writeFileSync(testFile, AFTER, "utf-8");
const gitPatch = execSync("git diff hello.ts", { cwd: TEST_DIR, encoding: "utf-8" });

console.log("Git patch:");
console.log(gitPatch);
console.log("\n=== Test 2: Agent's patch format (using bundleUnified) ===\n");

// Reset file
execSync("git checkout hello.ts", { cwd: TEST_DIR, stdio: "pipe" });

// Load the actual bundleUnified function from the built code
// We'll simulate what it does by calling the functions directly
const crypto = require("crypto");

function toUnified(relPath, before, after) {
  const a = before.replace(/\r\n/g, "\n");
  const b = after.replace(/\r\n/g, "\n");

  const diffBody = createTwoFilesPatch(`a/${relPath}`, `b/${relPath}`, a, b, "", "");

  const hashBefore = crypto.createHash("sha1").update(`blob ${a.length}\0${a}`).digest("hex").substring(0, 7);
  const hashAfter = crypto.createHash("sha1").update(`blob ${b.length}\0${b}`).digest("hex").substring(0, 7);

  const gitHeaders = [
    `diff --git a/${relPath} b/${relPath}`,
    `index ${hashBefore}..${hashAfter} 100644`
  ].join("\n");

  const lines = diffBody.split("\n");
  const diffStart = lines.findIndex(line => line.startsWith("---"));

  if (diffStart === -1) return "";

  const patchBody = lines.slice(diffStart).join("\n");
  return `${gitHeaders}\n${patchBody}`;
}

const agentPatch = toUnified("hello.ts", BEFORE, AFTER);

console.log("Agent patch:");
console.log(agentPatch);

console.log("\n=== Test 3: Apply both patches ===\n");

// Test git patch
console.log("Testing git patch:");
try {
  execSync("git apply --check", {
    cwd: TEST_DIR,
    input: gitPatch,
    stdio: "pipe"
  });
  console.log("✓ PASS\n");
} catch (error) {
  console.log("✗ FAIL:");
  console.log(error.stderr.toString());
  console.log();
}

// Test agent patch
console.log("Testing agent patch:");
try {
  execSync("git apply --check", {
    cwd: TEST_DIR,
    input: agentPatch,
    stdio: "pipe"
  });
  console.log("✓ PASS\n");
} catch (error) {
  console.log("✗ FAIL:");
  console.log(error.stderr.toString());
  console.log();
}

console.log("=== Test 4: Character-by-character comparison ===\n");

const gitLines = gitPatch.split("\n");
const agentLines = agentPatch.split("\n");

console.log(`Git patch: ${gitLines.length} lines`);
console.log(`Agent patch: ${agentLines.length} lines\n`);

const maxLines = Math.max(gitLines.length, agentLines.length);
for (let i = 0; i < Math.min(10, maxLines); i++) {
  const gitLine = gitLines[i] || "(missing)";
  const agentLine = agentLines[i] || "(missing)";
  
  if (gitLine !== agentLine) {
    console.log(`Line ${i + 1} DIFFERS:`);
    console.log(`  Git:   "${gitLine}"`);
    console.log(`  Agent: "${agentLine}"`);
  } else {
    console.log(`Line ${i + 1} OK: "${gitLine.substring(0, 50)}..."`);
  }
}

// Cleanup
fs.rmSync(TEST_DIR, { recursive: true, force: true });

