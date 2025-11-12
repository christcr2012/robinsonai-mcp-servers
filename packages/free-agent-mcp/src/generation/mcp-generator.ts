/**
 * MCP Generator - Pluggable generator for Free Agent Core
 *
 * This generator uses the CodeGenerator with quality gates pipeline
 * to produce code that follows PCE patterns.
 *
 * Threads tier + quality explicitly to ensure sandbox/gates are used.
 */

import {
  DiffGenerator,
  GenInput,
} from "@fa/core/generation/types.js";
import { CodeGenerator } from "../agents/code-generator.js";
import { OllamaClient } from "../ollama-client.js";

export class MCPGenerator implements DiffGenerator {
  name = "mcp-generator";
  private codeGen: CodeGenerator;

  constructor() {
    const ollama = new OllamaClient();
    this.codeGen = new CodeGenerator(ollama);
  }

  async generate(input: GenInput): Promise<string> {
    // ✅ Precedence: explicit arg → env → default
    const quality = input.tier === "paid" ? "best" : "best"; // Always use best for PCE
    const tier = input.tier || (process.env.FREE_AGENT_TIER as any) || "free";
    const sandbox = true; // Always use sandbox for PCE enforcement

    console.log(
      `[MCPGenerator] Generating with quality=${quality} tier=${tier} sandbox=${sandbox}`
    );

    // Build context from PCE contract and exemplars
    const context = this.buildContext(input);

    // Use CodeGenerator with quality gates - thread tier/quality/sandbox explicitly
    const result = await this.codeGen.generate({
      task: input.task,
      context,
      quality: quality as any,
      complexity: "complex",
      tier: tier as any,
      sandbox, // Force sandbox explicitly
    });

    // Extract diff from result
    const diff = result.diff || result.code;
    if (!diff) {
      throw new Error("CodeGenerator produced no diff");
    }

    return diff;
  }

  private buildContext(input: GenInput): string {
    const parts: string[] = [];

    // Add pattern contract
    if (input.contract) {
      parts.push("=== PATTERN CONTRACT ===");
      parts.push(`Language: ${input.contract.language}`);
      parts.push(`Base Directory: ${input.contract.layout.baseDir}`);

      parts.push(`\nContainers (where code goes):`);
      input.contract.containers.forEach((c) => {
        parts.push(`  - ${c.name} (${c.kind}) in ${c.file}`);
        parts.push(`    Method style: ${c.methodStyle}`);
      });

      parts.push(`\nWrappers (helper functions to use):`);
      input.contract.wrappers.forEach((w) => {
        parts.push(
          `  - ${w.name}() from ${w.importFrom}${w.mustUse ? " [REQUIRED]" : ""}`
        );
      });

      parts.push(`\nNaming conventions:`);
      parts.push(`  - Methods: ${input.contract.naming.methodCase}`);
      parts.push(`  - Files: ${input.contract.naming.fileCase}`);

      parts.push(`\nForbidden patterns: ${input.contract.forbid.join(", ")}`);
    }

    // Add exemplars
    if (input.examples && input.examples.length > 0) {
      parts.push("\n=== CODE EXEMPLARS (follow this style) ===");
      input.examples.forEach((ex, i) => {
        parts.push(`\n--- Example ${i + 1}: ${ex.path} ---`);
        parts.push(ex.content.slice(0, 1500));
      });
    }

    // Add target file info
    if (input.targets && input.targets.length > 0) {
      parts.push("\n=== TARGET FILES ===");
      input.targets.forEach((t) => {
        parts.push(`File: ${t.path}`);
        if (t.container) {
          parts.push(
            `  Container: ${t.container.name} (${t.container.kind})`
          );
        }
      });
    }

    // Add explicit instructions
    parts.push("\n=== INSTRUCTIONS ===");
    parts.push("1. ONLY modify existing files, NEVER create new files");
    parts.push("2. Add methods to existing classes, NEVER create new classes");
    parts.push("3. Use the exact wrapper functions shown in the pattern contract");
    parts.push("4. Follow the exact return type format shown in exemplars");
    parts.push("5. Output ONLY a valid unified diff. No explanation.");

    return parts.join("\n");
  }
}

// Export as default for loader
const generator = new MCPGenerator();
export default generator;
export { generator };

