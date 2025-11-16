import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { spawnSync } from "child_process";
import { Adapter } from "./types.js";
import { validatePatchUnifiedDiff } from "../shared/patchGuard.js";
import { applyUnifiedDiff } from "../shared/diff.js";
import { loadGenerator, loadGeneratorLegacy, createFallbackGenerator } from "@fa/core/generation/loader.js";
import { DiffGenerator, Generator } from "../generation/types.js";
import { resolveFromRepo, debugPaths } from "../utils/paths.js";

export async function loadAdapter(repo: string): Promise<Adapter> {
  const cfgPath = join(repo, ".free-agent", "config.json");

  if (existsSync(cfgPath)) {
    console.log(`[Adapter] Loading config from ${cfgPath}`);
    const cfg = JSON.parse(readFileSync(cfgPath, "utf8"));
    return makeAdapterFromConfig(cfg, repo);
  }

  console.log(`[Adapter] No config found, using defaults`);
  return defaultAdapter();
}

function makeAdapterFromConfig(cfg: any, repoRoot: string): Adapter {
  let generator: Generator | DiffGenerator | null = null;

  // Resolve spec registry path relative to repo
  const specRegistry = cfg.specRegistry
    ? resolveFromRepo(repoRoot, cfg.specRegistry)
    : undefined;

  // Resolve codegen output dir relative to repo
  const codegenOutDir = cfg.codegenOutDir
    ? resolveFromRepo(repoRoot, cfg.codegenOutDir)
    : undefined;

  debugPaths("adapter", {
    repoRoot,
    specRegistry: specRegistry || "(none)",
    codegenOutDir: codegenOutDir || "(none)",
  });

  return {
    name: cfg.name || "custom",
    cmd: cfg.cmd || {},
    specRegistry,
    codegenOutDir,

    async prepare(repo) {
      if (cfg.cmd?.install) {
        console.log(`[Adapter] Running install: ${cfg.cmd.install}`);
        spawn(repo, cfg.cmd.install);
      }

      // Load generator on first prepare
      if (!generator) {
        try {
          // Try new factory pattern first
          const generatorModule = cfg.spec?.generatorModule || cfg.generatorModule;
          if (generatorModule) {
            const factory = await loadGenerator(generatorModule);
            generator = factory({ logger: console });
          } else {
            // Fall back to legacy loader
            generator = await loadGeneratorLegacy(cfg.generatorModule, repoRoot);
          }
        } catch (err: any) {
          console.error("[Adapter] Failed to load generator", err);
          if (process.env.FREE_AGENT_ALLOW_FALLBACK === "1") {
            console.warn("[Adapter] Using fallback generator (FREE_AGENT_ALLOW_FALLBACK=1)");
            generator = createFallbackGenerator();
          } else {
            throw err;
          }
        }
      }
    },

    async run(repo, cmd) {
      return spawn(repo, cmd);
    },

    async synthesize({ repo, task, contract, exemplars, tier, quality }) {
      if (!generator) {
        try {
          // Try new factory pattern first
          const generatorModule = cfg.spec?.generatorModule || cfg.generatorModule;
          if (generatorModule) {
            const factory = await loadGenerator(generatorModule);
            generator = factory({ logger: console });
          } else {
            // Fall back to legacy loader
            generator = await loadGeneratorLegacy(cfg.generatorModule, repoRoot);
          }
        } catch (err: any) {
          console.error("[Adapter] Failed to load generator", err);
          if (process.env.FREE_AGENT_ALLOW_FALLBACK === "1") {
            console.warn("[Adapter] Using fallback generator (FREE_AGENT_ALLOW_FALLBACK=1)");
            generator = createFallbackGenerator();
          } else {
            throw err;
          }
        }
      }

      const result = await generator.generate({
        repo,
        task,
        contract: contract!,
        examples: exemplars || [],
        tier,
        quality,
      });
      // Handle both old DiffGenerator (returns string) and new Generator (returns GenResult)
      const diff = typeof result === 'string' ? result : result.diff;
      return { diff };
    },

    async refine({ repo, task, diagnostics, lastDiff, contract, exemplars, tier, quality }) {
      if (!generator) {
        try {
          // Try new factory pattern first
          const generatorModule = cfg.spec?.generatorModule || cfg.generatorModule;
          if (generatorModule) {
            const factory = await loadGenerator(generatorModule);
            generator = factory({ logger: console });
          } else {
            // Fall back to legacy loader
            generator = await loadGeneratorLegacy(cfg.generatorModule, repoRoot);
          }
        } catch (err: any) {
          console.error("[Adapter] Failed to load generator", err);
          if (process.env.FREE_AGENT_ALLOW_FALLBACK === "1") {
            console.warn("[Adapter] Using fallback generator (FREE_AGENT_ALLOW_FALLBACK=1)");
            generator = createFallbackGenerator();
          } else {
            throw err;
          }
        }
      }

      const diag = JSON.stringify(diagnostics, null, 2);
      const result = await generator.generate({
        repo,
        task: task + "\n\nFix these issues:\n" + diag,
        contract: contract!,
        examples: exemplars || [],
        tier,
        quality,
      });
      // Handle both old DiffGenerator (returns string) and new Generator (returns GenResult)
      const diff = typeof result === 'string' ? result : result.diff;
      return { diff };
    },

    async applyPatch(repo, diff, contract) {
      diff = validatePatchUnifiedDiff(diff, contract);
      await applyUnifiedDiff(repo, diff);
    },
  };
}

function defaultAdapter(): Adapter {
  let generator: Generator | DiffGenerator | null = null;

  return {
    name: "auto",
    cmd: {},

    async prepare(repo) {
      console.log(`[Adapter] Auto-installing dependencies`);
      spawn(repo, "pnpm i || npm i");

      // Load generator on first prepare
      if (!generator) {
        try {
          const factory = await loadGenerator();
          generator = factory({ logger: console });
        } catch (err: any) {
          console.error("[Adapter] Failed to load generator", err);
          if (process.env.FREE_AGENT_ALLOW_FALLBACK === "1") {
            console.warn("[Adapter] Using fallback generator (FREE_AGENT_ALLOW_FALLBACK=1)");
            generator = createFallbackGenerator();
          } else {
            throw err;
          }
        }
      }
    },

    async run(repo, cmd) {
      return spawn(repo, cmd);
    },

    async synthesize({ repo, task, contract, exemplars, tier, quality }) {
      if (!generator) {
        try {
          const factory = await loadGenerator();
          generator = factory({ logger: console });
        } catch (err: any) {
          console.error("[Adapter] Failed to load generator", err);
          if (process.env.FREE_AGENT_ALLOW_FALLBACK === "1") {
            console.warn("[Adapter] Using fallback generator (FREE_AGENT_ALLOW_FALLBACK=1)");
            generator = createFallbackGenerator();
          } else {
            throw err;
          }
        }
      }

      const result = await generator.generate({
        repo,
        task,
        contract: contract!,
        examples: exemplars || [],
        tier,
        quality,
      });
      // Handle both old DiffGenerator (returns string) and new Generator (returns GenResult)
      const diff = typeof result === 'string' ? result : result.diff;
      return { diff };
    },

    async refine({ repo, task, diagnostics, contract, exemplars, tier, quality }) {
      if (!generator) {
        try {
          const factory = await loadGenerator();
          generator = factory({ logger: console });
        } catch (err: any) {
          console.error("[Adapter] Failed to load generator", err);
          if (process.env.FREE_AGENT_ALLOW_FALLBACK === "1") {
            console.warn("[Adapter] Using fallback generator (FREE_AGENT_ALLOW_FALLBACK=1)");
            generator = createFallbackGenerator();
          } else {
            throw err;
          }
        }
      }

      const diag = JSON.stringify(diagnostics, null, 2);
      const result = await generator.generate({
        repo,
        task: task + "\n\nFix these issues:\n" + diag,
        contract: contract!,
        examples: exemplars || [],
        tier,
        quality,
      });
      // Handle both old DiffGenerator (returns string) and new Generator (returns GenResult)
      const diff = typeof result === 'string' ? result : result.diff;
      return { diff };
    },

    async applyPatch(repo, diff, contract) {
      diff = validatePatchUnifiedDiff(diff, contract);
      await applyUnifiedDiff(repo, diff);
    },
  };
}

function spawn(cwd: string, sh: string): { code: number; out: string } {
  const p = spawnSync(sh, { cwd, shell: true, encoding: "utf8" });
  return {
    code: p.status ?? 1,
    out: (p.stdout || "") + (p.stderr || ""),
  };
}

