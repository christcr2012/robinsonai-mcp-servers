import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { PatternContract } from "../patterns/contract.js";
import { Example } from "../patterns/examples.js";

export async function buildAdapterPrompt(
  repo: string,
  task: string,
  cfg: any,
  contract?: PatternContract,
  exemplars?: Example[]
) {
  const system = [
    "You are a code generator that must output a unified diff ONLY.",
    "NEVER output placeholders. NO `any` types. Use existing files & style.",
    "If external calls are required, use handlers from FREE_AGENT_GENERATED_HANDLERS.",
    "Output ONLY the unified diff, nothing else.",
  ].join("\n");

  const context: string[] = [];

  // Gather context files
  const pkg = join(repo, "package.json");
  if (existsSync(pkg)) {
    context.push("package.json:\n" + readFileSync(pkg, "utf8"));
  }

  const tsconfig = join(repo, "tsconfig.json");
  if (existsSync(tsconfig)) {
    context.push("tsconfig.json:\n" + readFileSync(tsconfig, "utf8"));
  }

  // Add pattern contract if available
  if (contract) {
    context.push("=== PATTERN CONTRACT ===");
    context.push(`Containers: ${contract.containers.map(c => `${c.name} (${c.file})`).join(", ")}`);
    context.push(`Wrappers: ${contract.wrappers.map(w => `${w.name} from ${w.importFrom}`).join(", ")}`);
    context.push(`Forbidden: ${contract.forbid.join(", ")}`);
  }

  // Add exemplars if available
  if (exemplars && exemplars.length > 0) {
    context.push("=== CODE EXEMPLARS ===");
    exemplars.forEach(ex => {
      context.push(`File: ${ex.path}\n${ex.content.slice(0, 500)}...`);
    });
  }

  const user = [
    "=== TASK ===",
    task,
    "=== CONTEXT ===",
    context.join("\n\n"),
    "=== OUTPUT ===",
    "Return ONLY a valid unified diff. No explanation.",
  ].join("\n\n");

  // Wire to Ollama via dynamic import to avoid circular deps
  try {
    const { Ollama } = await import("ollama");
    const ollama = new Ollama({ host: process.env.OLLAMA_HOST || "http://localhost:11434" });
    const response = await ollama.generate({
      model: "mistral:7b",
      prompt: system + "\n\n" + user,
      stream: false,
    });
    return response.response || "";
  } catch (err) {
    console.error("[Prompts] Failed to call Ollama:", err);
    // Fallback: return no-op diff
    return `diff --git a/.free-agent/README.md b/.free-agent/README.md
new file mode 100644
index 0000000..1111111
--- /dev/null
+++ b/.free-agent/README.md
@@ -0,0 +1 @@
+# Free Agent generated this file
`;
  }
}

