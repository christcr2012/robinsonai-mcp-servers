import { Adapter } from "../repo/types.js";
import { refineOnce, runQualityGates, judge } from "./quality.js";

export function buildPipeline(ctx: { adapter: Adapter; repo: string }) {
  return {
    async run(kind: string, task: string) {
      console.log(`[Pipeline] Starting quality gates loop...`);

      // Prepare repo (install deps, bootstrap)
      await ctx.adapter.prepare(ctx.repo);

      // Synthesize initial code
      console.log(`[Pipeline] Synthesizing code...`);
      const synth = await ctx.adapter.synthesize({
        repo: ctx.repo,
        task,
        kind,
      });

      // Apply initial patch
      console.log(`[Pipeline] Applying initial patch...`);
      await ctx.adapter.applyPatch(ctx.repo, synth.diff);

      // Quality gates loop
      let attempts = 0;
      const maxAttempts = 3;

      while (attempts < maxAttempts) {
        console.log(`[Pipeline] Quality gates attempt ${attempts + 1}/${maxAttempts}`);

        const gates = await runQualityGates(ctx.adapter, ctx.repo);
        const verdict = await judge(gates);

        if (gates.ok && verdict.accept) {
          console.log(`[Pipeline] ✅ All quality gates passed!`);
          return;
        }

        if (attempts < maxAttempts - 1) {
          console.log(`[Pipeline] Quality gates failed, refining...`);
          const diff = await refineOnce({
            repo: ctx.repo,
            task,
            gates,
            lastDiff: synth.diff,
            adapter: ctx.adapter,
          });

          await ctx.adapter.applyPatch(ctx.repo, diff);
        }

        attempts++;
      }

      throw new Error(
        `[Pipeline] Quality gates not satisfied after ${maxAttempts} attempts`
      );
    },
  };
}

