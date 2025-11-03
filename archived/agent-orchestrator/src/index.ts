import { config } from "dotenv";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

// Load .env.local from repo root BEFORE importing orchestrator
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = join(__dirname, "..", "..", "..");
const envPath = join(REPO_ROOT, ".env.local");
const result = config({ path: envPath });

if (result.error) {
  console.error("Failed to load .env.local:", result.error);
} else {
  console.error("Loaded .env.local from:", envPath);
  console.error("OPENAI_API_KEY loaded:", !!process.env.OPENAI_API_KEY);
  console.error("ANTHROPIC_API_KEY loaded:", !!process.env.ANTHROPIC_API_KEY);
}

// Now import orchestrator (after env vars are loaded)
import { runUserTask } from "./orchestrator.js";

const userPrompt = process.argv.slice(2).join(" ").trim() || "Refactor utils/fs.ts to add atomic write + tests";

console.log("=".repeat(80));
console.log("Robinson AI Agent Orchestrator");
console.log("=".repeat(80));
console.log(`Task: ${userPrompt}`);
console.log("=".repeat(80));

runUserTask(userPrompt).then(out=>{
  console.log("=".repeat(80));
  console.log("TASK COMPLETE");
  console.log(JSON.stringify(out, null, 2));
  console.log("=".repeat(80));
  process.exit(0);
}).catch(err=>{
  console.error("=".repeat(80));
  console.error("TASK FAILED:", err);
  console.error("=".repeat(80));
  process.exit(1);
});

