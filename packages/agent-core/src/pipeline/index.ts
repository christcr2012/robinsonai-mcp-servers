import { Adapter } from "../repo/types.js";
import { refineOnce, runQualityGates, judge } from "./quality.js";
import { PatternContract } from "../patterns/contract.js";
import { Example } from "../patterns/examples.js";

export function buildPipeline(ctx: {
  adapter: Adapter;
  repo: string;
  contract?: PatternContract;
  exemplars?: Example[];
}) {
  return {
    async run(
      kind: string,
      task: string,
      opts?: { tier?: "free" | "paid"; quality?: "fast" | "balanced" | "best" }
    ) {
      console.log(`[Pipeline] Starting quality gates loop...`);

      // Prepare repo (install deps, bootstrap)
      await ctx.adapter.prepare(ctx.repo);

      // Synthesize initial code
      console.log(`[Pipeline] Synthesizing code...`);
      const synth = await ctx.adapter.synthesize({
        repo: ctx.repo,
        task,
        kind,
        contract: ctx.contract,
        exemplars: ctx.exemplars,
        tier: opts?.tier,
        quality: opts?.quality,
      });

      // Apply initial patch
      console.log(`[Pipeline] Applying initial patch...`);
      await ctx.adapter.applyPatch(ctx.repo, synth.diff, ctx.contract);

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
            contract: ctx.contract,
            exemplars: ctx.exemplars,
            tier: opts?.tier,
            quality: opts?.quality,
          });

          await ctx.adapter.applyPatch(ctx.repo, diff, ctx.contract);
        }

        attempts++;
      }

      throw new Error(
        `[Pipeline] Quality gates not satisfied after ${maxAttempts} attempts`
      );
    },
  };
}

