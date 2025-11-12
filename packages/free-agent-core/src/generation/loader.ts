import { DiffGenerator } from "./types.js";
import { existsSync } from "fs";
import { resolveFromRepo, resolveRepoRoot } from "../utils/paths.js";

export async function loadGenerator(modulePath?: string, repoRoot?: string): Promise<DiffGenerator> {
  const fromEnv = process.env.FREE_AGENT_GENERATOR;
  const candidate = modulePath || fromEnv;

  if (!candidate) {
    throw new Error(
      "No generator configured. Set FREE_AGENT_GENERATOR env var or adapter.generatorModule config."
    );
  }

  // Resolve relative to workspace root if repoRoot provided, otherwise use current workspace
  const wsRoot = repoRoot ? resolveRepoRoot() : process.cwd();
  const abs = resolveFromRepo(wsRoot, candidate);

  if (!existsSync(abs)) {
    throw new Error(`Generator module not found: ${abs}`);
  }

  try {
    // Dynamic import with proper URL handling
    const mod = await import(abs);
    const gen: DiffGenerator =
      mod.default || mod.generator || mod.createGenerator?.() || mod;

    if (!gen || typeof gen.generate !== "function") {
      throw new Error(
        `Generator module must export { generate(input): Promise<string> } or default export`
      );
    }

    console.log(`[Generator] Loaded: ${gen.name || "unknown"}`);
    return gen;
  } catch (err: any) {
    throw new Error(`Failed to load generator: ${err.message}`);
  }
}

/**
 * Fallback generator that uses raw Ollama (for backward compatibility)
 * WARNING: This ignores PCE patterns and should only be used if no proper generator is configured
 */
export function createFallbackGenerator(): DiffGenerator {
  return {
    name: "fallback-ollama",
    async generate(input) {
      console.warn(
        "[Generator] WARNING: Using fallback Ollama generator (ignores PCE patterns)"
      );
      console.warn("[Generator] Configure FREE_AGENT_GENERATOR for better results");

      // Import buildAdapterPrompt from prompts.ts
      const { buildAdapterPrompt } = await import("../repo/prompts.js");
      const diff = await buildAdapterPrompt(
        input.repo,
        input.task,
        {},
        input.contract,
        input.examples
      );
      return diff;
    },
  };
}

