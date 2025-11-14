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
    context.push(`Language: ${contract.language}`);
    context.push(`Base Directory: ${contract.layout.baseDir}`);
    context.push(`Containers (where code goes):`);
    contract.containers.forEach(c => {
      context.push(`  - ${c.name} (${c.kind}) in ${c.file}`);
      context.push(`    Method style: ${c.methodStyle}`);
    });
    context.push(`Wrappers (helper functions to use):`);
    contract.wrappers.forEach(w => {
      context.push(`  - ${w.name}() from ${w.importFrom}${w.mustUse ? ' [REQUIRED]' : ''}`);
    });
    context.push(`Naming conventions:`);
    context.push(`  - Methods: ${contract.naming.methodCase}`);
    context.push(`  - Files: ${contract.naming.fileCase}`);
    context.push(`Forbidden patterns: ${contract.forbid.join(", ")}`);
  }

  // Add exemplars if available
  if (exemplars && exemplars.length > 0) {
    context.push("=== CODE EXEMPLARS (follow this style) ===");
    exemplars.forEach((ex, i) => {
      context.push(`\n--- Example ${i + 1}: ${ex.path} ---`);
      context.push(ex.content.slice(0, 1000));
    });
  }

  // Add actual file content if we can find the target file
  const fileContext: string[] = [];
  if (contract && contract.containers.length > 0) {
    const mainContainer = contract.containers[0];
    const filePath = join(repo, mainContainer.file);
    if (existsSync(filePath)) {
      fileContext.push(`=== TARGET FILE: ${mainContainer.file} ===`);
      fileContext.push(`Class: ${mainContainer.name}`);
      fileContext.push(`Current content (first 2000 chars):`);
      fileContext.push(readFileSync(filePath, "utf8").slice(0, 2000));
      fileContext.push(`...[file continues]`);
    }
  }

  const user = [
    "=== TASK ===",
    task,
    "=== CONTEXT ===",
    context.join("\n\n"),
    fileContext.length > 0 ? fileContext.join("\n\n") : "",
    "=== INSTRUCTIONS ===",
    "1. ONLY modify existing files, NEVER create new files",
    "2. Add methods to existing classes, NEVER create new classes",
    "3. Use the exact wrapper functions shown in the pattern contract",
    "4. Follow the exact return type format shown in exemplars",
    "5. Output ONLY a valid unified diff. No explanation.",
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

