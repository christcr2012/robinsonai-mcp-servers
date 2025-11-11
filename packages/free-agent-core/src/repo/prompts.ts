import { readFileSync, existsSync } from "fs";
import { join } from "path";

export async function buildAdapterPrompt(
  repo: string,
  task: string,
  cfg: any
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

  const user = [
    "=== TASK ===",
    task,
    "=== CONTEXT ===",
    context.join("\n\n"),
    "=== OUTPUT ===",
    "Return ONLY a valid unified diff. No explanation.",
  ].join("\n\n");

  // TODO: Wire your LLM provider here (OpenAI, Anthropic, local, etc.)
  // For now, return a no-op diff
  console.log(
    "[Prompts] TODO: Wire LLM provider in buildAdapterPrompt()"
  );

  return `diff --git a/.free-agent/README.md b/.free-agent/README.md
new file mode 100644
index 0000000..1111111
--- /dev/null
+++ b/.free-agent/README.md
@@ -0,0 +1 @@
+# Free Agent generated this file
`;
}

