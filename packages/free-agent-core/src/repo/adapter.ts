import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { spawnSync } from "child_process";
import { Adapter } from "./types.js";
import { buildAdapterPrompt } from "./prompts.js";
import { validatePatchUnifiedDiff } from "../shared/patchGuard.js";
import { applyUnifiedDiff } from "../shared/diff.js";

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
    },

    async run(repo, cmd) {
      return spawn(repo, cmd);
    },

    async synthesize({ repo, task }) {
      const diff = await buildAdapterPrompt(repo, task, cfg);
      return { diff };
    },

    async refine({ repo, task, diagnostics, lastDiff }) {
      const diag = JSON.stringify(diagnostics, null, 2);
      const diff = await buildAdapterPrompt(
        repo,
        task + "\n\nDiagnostics:\n" + diag,
        cfg
      );
      return { diff };
    },

    async applyPatch(repo, diff) {
      validatePatchUnifiedDiff(diff);
      await applyUnifiedDiff(repo, diff);
    },
  };
}

function defaultAdapter(): Adapter {
  return {
    name: "auto",
    cmd: {},

    async prepare(repo) {
      console.log(`[Adapter] Auto-installing dependencies`);
      spawn(repo, "pnpm i || npm i");
    },

    async run(repo, cmd) {
      return spawn(repo, cmd);
    },

    async synthesize({ repo, task }) {
      const diff = await buildAdapterPrompt(repo, task, {});
      return { diff };
    },

    async refine({ repo, task, diagnostics }) {
      const diag = JSON.stringify(diagnostics, null, 2);
      const diff = await buildAdapterPrompt(
        repo,
        task + "\n\nDiagnostics:\n" + diag,
        {}
      );
      return { diff };
    },

    async applyPatch(repo, diff) {
      validatePatchUnifiedDiff(diff);
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

