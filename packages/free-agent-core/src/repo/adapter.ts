import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { spawnSync } from "child_process";
import { Adapter } from "./types.js";
import { validatePatchUnifiedDiff } from "../shared/patchGuard.js";
import { applyUnifiedDiff } from "../shared/diff.js";
import { loadGenerator, createFallbackGenerator } from "../generation/loader.js";
import { DiffGenerator } from "../generation/types.js";

export async function loadAdapter(repo: string): Promise<Adapter> {
  const cfgPath = join(repo, ".free-agent", "config.json");

  if (existsSync(cfgPath)) {
    console.log(`[Adapter] Loading config from ${cfgPath}`);
    const cfg = JSON.parse(readFileSync(cfgPath, "utf8"));
    return makeAdapterFromConfig(cfg);
  }

  console.log(`[Adapter] No config found, using defaults`);
  return defaultAdapter();
}

function makeAdapterFromConfig(cfg: any): Adapter {
  let generator: DiffGenerator | null = null;

  return {
    name: cfg.name || "custom",
    cmd: cfg.cmd || {},
    specRegistry: cfg.specRegistry,
    codegenOutDir: cfg.codegenOutDir,

    async prepare(repo) {
      if (cfg.cmd?.install) {
        console.log(`[Adapter] Running install: ${cfg.cmd.install}`);
        spawn(repo, cfg.cmd.install);
      }

      // Load generator on first prepare
      if (!generator) {
        try {
          generator = await loadGenerator(cfg.generatorModule);
        } catch (err: any) {
          console.warn(`[Adapter] ${err.message}`);
          generator = createFallbackGenerator();
        }
      }
    },

    async run(repo, cmd) {
      return spawn(repo, cmd);
    },

    async synthesize({ repo, task, contract, exemplars, tier, quality }) {
      if (!generator) {
        try {
          generator = await loadGenerator(cfg.generatorModule);
        } catch (err: any) {
          console.warn(`[Adapter] ${err.message}`);
          generator = createFallbackGenerator();
        }
      }

      const diff = await generator.generate({
        repo,
        task,
        contract: contract!,
        examples: exemplars || [],
        tier,
        quality,
      });
      return { diff };
    },

    async refine({ repo, task, diagnostics, lastDiff, contract, exemplars, tier, quality }) {
      if (!generator) {
        try {
          generator = await loadGenerator(cfg.generatorModule);
        } catch (err: any) {
          console.warn(`[Adapter] ${err.message}`);
          generator = createFallbackGenerator();
        }
      }

      const diag = JSON.stringify(diagnostics, null, 2);
      const diff = await generator.generate({
        repo,
        task: task + "\n\nFix these issues:\n" + diag,
        contract: contract!,
        examples: exemplars || [],
        tier,
        quality,
      });
      return { diff };
    },

    async applyPatch(repo, diff, contract) {
      diff = validatePatchUnifiedDiff(diff, contract);
      await applyUnifiedDiff(repo, diff);
    },
  };
}

function defaultAdapter(): Adapter {
  let generator: DiffGenerator | null = null;

  return {
    name: "auto",
    cmd: {},

    async prepare(repo) {
      console.log(`[Adapter] Auto-installing dependencies`);
      spawn(repo, "pnpm i || npm i");

      // Load generator on first prepare
      if (!generator) {
        try {
          generator = await loadGenerator();
        } catch (err: any) {
          console.warn(`[Adapter] ${err.message}`);
          generator = createFallbackGenerator();
        }
      }
    },

    async run(repo, cmd) {
      return spawn(repo, cmd);
    },

    async synthesize({ repo, task, contract, exemplars, tier, quality }) {
      if (!generator) {
        try {
          generator = await loadGenerator();
        } catch (err: any) {
          console.warn(`[Adapter] ${err.message}`);
          generator = createFallbackGenerator();
        }
      }

      const diff = await generator.generate({
        repo,
        task,
        contract: contract!,
        examples: exemplars || [],
        tier,
        quality,
      });
      return { diff };
    },

    async refine({ repo, task, diagnostics, contract, exemplars, tier, quality }) {
      if (!generator) {
        try {
          generator = await loadGenerator();
        } catch (err: any) {
          console.warn(`[Adapter] ${err.message}`);
          generator = createFallbackGenerator();
        }
      }

      const diag = JSON.stringify(diagnostics, null, 2);
      const diff = await generator.generate({
        repo,
        task: task + "\n\nFix these issues:\n" + diag,
        contract: contract!,
        examples: exemplars || [],
        tier,
        quality,
      });
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

