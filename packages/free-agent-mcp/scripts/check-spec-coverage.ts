/**
 * Spec coverage gate
 * Fails build if any required handler is missing from generated code
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const regPath = path.join(root, "spec/tools.registry.json");
const genPath = path.join(root, "src/handlers/handlers.generated.ts");

// Read registry and generated code
const reg = JSON.parse(fs.readFileSync(regPath, "utf8"));
const gen = fs.readFileSync(genPath, "utf8");

// Collect all required handler names
const required: string[] = [];
for (const [svc, s] of Object.entries<any>(reg.services)) {
  for (const key of Object.keys(s.endpoints)) {
    const handlerName = key.replace(/[^a-zA-Z0-9_]/g, "_") + "_handler";
    required.push(handlerName);
  }
}

// Check which handlers are missing
const missing = required.filter(
  (name) => !new RegExp(`export\\s+const\\s+${name}\\b`).test(gen)
);

if (missing.length > 0) {
  console.error("[spec-first] ❌ Missing generated handlers:");
  missing.forEach((name) => console.error(`  - ${name}`));
  process.exit(1);
}

console.log(`[spec-first] ✅ Spec coverage OK (${required.length} handlers)`);

