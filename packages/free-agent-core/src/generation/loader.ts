import { DiffGenerator, GeneratorFactory } from "./types.js";
import { existsSync } from "fs";
import path from "path";
import { pathToFileURL } from "url";
import { resolveFromRepo, resolveRepoRoot, findWorkspaceRoot } from "../utils/paths.js";

/**
 * Check if a specifier is a bare module specifier (not a path)
 */
function isBare(spec: string): boolean {
  return !spec.startsWith(".") && !spec.startsWith("/") && !spec.startsWith("file:");
}

/**
 * Resolve a generator specifier to an importable path
 * @param raw - Generator specifier (bare module name or path)
 * @returns Resolved specifier (bare module or file URL)
 */
export async function resolveGeneratorSpecifier(raw?: string): Promise<string> {
  const input = raw || process.env.FREE_AGENT_GENERATOR || "";
  if (!input) {
    throw new Error(
      "No generator specified. Set config.spec.generatorModule or FREE_AGENT_GENERATOR."
    );
  }

  // If it's a bare specifier (package export), let Node resolve it
  if (isBare(input)) {
    return input;
  }

  // Otherwise, resolve as a file path
  const ws = process.env.WORKSPACE_ROOT || findWorkspaceRoot() || process.cwd();
  const abs = path.isAbsolute(input) ? input : path.resolve(ws, input);
  return pathToFileURL(abs).href; // file URL for dynamic import
}

/**
 * Load a generator factory from a module specifier
 * @param raw - Generator specifier (bare module name or path)
 * @returns GeneratorFactory function
 */
export async function loadGenerator(raw?: string): Promise<GeneratorFactory> {
  const spec = await resolveGeneratorSpecifier(raw);

  console.log(`[Generator] Loading generator from: ${spec}`);

  const mod = await import(spec);
  const factory = (mod.default || mod.createGenerator) as GeneratorFactory | undefined;

  if (!factory) {
    throw new Error(
      `Generator module "${spec}" missing default/createGenerator export.`
    );
  }

  console.log(`[Generator] Successfully loaded generator factory`);
  return factory;
}

/**
 * Legacy loader for backward compatibility
 * @deprecated Use loadGenerator instead
 */
export async function loadGeneratorLegacy(modulePath?: string, repoRoot?: string): Promise<DiffGenerator> {
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

