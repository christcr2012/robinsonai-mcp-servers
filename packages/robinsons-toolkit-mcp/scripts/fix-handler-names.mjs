#!/usr/bin/env node
/**
 * Fix handler function names to match broker expectations
 * Uses registry.json as source of truth for tool names
 * Uses placeholder-audit.json to find actual handler names
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.join(__dirname, "..");

console.log("🔧 Fixing handler names to match broker expectations...\n");

// --- 1. Load registry (source of truth for tool names) ---
const registryPath = path.join(root, "dist", "registry.json");
const registryJson = JSON.parse(fs.readFileSync(registryPath, "utf8"));

// Registry structure: { tools: [...] }
const registryTools = registryJson.tools || registryJson;

// Build map: "category:toolId" -> expected handler name (from broker's getHandlerFunctionName)
const expected = new Map();

for (const entry of registryTools) {
  const category = entry.category;
  const toolId = entry.name; // tool ID in snake_case (e.g., "github_list_repos")
  
  if (!category || !toolId) continue;

  // Convert tool_name to camelCase (broker's logic)
  // e.g., "github_list_repos" -> "githubListRepos"
  const parts = toolId.split('_');
  const expectedName = parts.map((p, i) =>
    i === 0 ? p : p.charAt(0).toUpperCase() + p.slice(1)
  ).join('');

  const key = `${category}:${toolId}`;
  expected.set(key, { category, toolId, expectedName });
}

console.log(`📊 Loaded ${expected.size} tools from registry\n`);

// --- 2. Load audit with actual function names ---
const auditPath = path.join(root, "dist", "placeholder-audit.json");
const auditJson = JSON.parse(fs.readFileSync(auditPath, "utf8"));

// Audit structure: array of entries
const auditEntries = Array.isArray(auditJson) ? auditJson : [];

// Build map: "category:toolId" -> actual handler name
const actual = new Map();

for (const entry of auditEntries) {
  const category = entry.categoryId;
  const toolId = entry.toolId;
  const handlerName = entry.actualFunctionName;

  if (!category || !toolId || !handlerName) continue;

  const key = `${category}:${toolId}`;
  actual.set(key, handlerName);
}

console.log(`📊 Loaded ${actual.size} handler names from audit\n`);

// --- 3. For each tool, patch the corresponding handler file ---
const touched = new Set();
let fixCount = 0;
let skipCount = 0;

for (const [key, { category, toolId, expectedName }] of expected.entries()) {
  const currentName = actual.get(key);

  if (!currentName) {
    console.warn(`⚠️  No audit entry for ${key}, skipping`);
    skipCount++;
    continue;
  }

  if (currentName === expectedName) {
    // Already correct
    continue;
  }

  const handlerFile = path.join(root, "src", "categories", category, "handlers.ts");

  if (!fs.existsSync(handlerFile)) {
    console.warn(`⚠️  No handlers.ts for category ${category}, skipping`);
    skipCount++;
    continue;
  }

  let source = fs.readFileSync(handlerFile, "utf8");
  let replaced = false;

  // Pattern: export async function currentName(
  const pattern = new RegExp(
    `export\\s+async\\s+function\\s+${currentName}\\s*\\(`,
    "g"
  );

  if (pattern.test(source)) {
    source = source.replace(pattern, `export async function ${expectedName}(`);
    fs.writeFileSync(handlerFile, source, "utf8");
    touched.add(handlerFile);
    replaced = true;
    fixCount++;
    console.log(`  ✓ ${category}/${toolId}: ${currentName} → ${expectedName}`);
  } else {
    console.warn(`  ⚠️  Could not find "${currentName}" in ${handlerFile}`);
    skipCount++;
  }
}

console.log(`\n✅ Fixed ${fixCount} handlers across ${touched.size} files`);
if (skipCount > 0) {
  console.log(`⚠️  Skipped ${skipCount} entries (already correct or not found)`);
}
console.log(`\n🔨 Run "npm run build" to rebuild with fixed handlers`);

