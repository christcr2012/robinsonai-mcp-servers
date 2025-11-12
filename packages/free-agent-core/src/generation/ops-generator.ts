/**
 * Ops-based Generator - LLM outputs structured EditOps, we build valid diffs
 * 
 * This replaces "LLM writes diffs" with "LLM writes ops → deterministic DiffBuilder → git apply"
 * Eliminates corrupt patch errors from malformed unified diffs
 */

import { DiffGenerator, GenInput } from "./types.js";
import { isPatchOps, PatchOps } from "../patch/ops.js";
import { applyOpsInPlace } from "../patch/applyOps.js";
import { bundleUnified } from "../patch/unified.js";
import { gitApplyCheck } from "../patch/validate.js";
import { validatePatchUnifiedDiff } from "../shared/patchGuard.js";

export class OpsGenerator implements DiffGenerator {
  name = "ops-generator";
  private llmClient: any; // Will be injected

  constructor(llmClient: any) {
    this.llmClient = llmClient;
  }

  async generate(input: GenInput): Promise<string> {
    const { repo, task, contract, examples, tier, quality } = input;

    console.log(`[OpsGenerator] Generating ops for task: ${task.slice(0, 60)}...`);

    // 1) Build prompt that requests PatchOps JSON
    const prompt = this.buildOpsPrompt(input);

    // 2) Get ops from LLM (with quality escalation on failure)
    let ops: PatchOps;
    try {
      ops = await this.llmSynthesizeOps(prompt, quality || "auto", tier || "free");
    } catch (e) {
      console.warn(`[OpsGenerator] Initial synthesis failed, escalating quality...`);
      // Escalate: fast → safe → best
      const nextQuality = quality === "fast" ? "safe" : quality === "safe" ? "best" : "best";
      ops = await this.llmSynthesizeOps(prompt, nextQuality, tier || "free");
    }

    console.log(`[OpsGenerator] Synthesized ${ops.ops.length} ops`);

    // 3) Apply ops in place (modifies files on disk)
    const changes = applyOpsInPlace(repo, ops.ops);
    console.log(`[OpsGenerator] Applied ops to ${changes.length} files`);

    // 4) Build valid unified diff from before/after
    let unified = bundleUnified(changes);

    // 5) Apply guardrails (MIGRATE mode: rewrite TODO/new any)
    unified = validatePatchUnifiedDiff(unified, contract);

    // 6) Validate patch is syntactically correct
    gitApplyCheck(unified, repo);
    console.log(`[OpsGenerator] git apply --check OK`);

    return unified;
  }

  private buildOpsPrompt(input: GenInput): string {
    const { task, contract, examples } = input;

    const parts: string[] = [];

    // Task
    parts.push(`# TASK`);
    parts.push(task);
    parts.push("");

    // Pattern Contract (containers, wrappers, etc.)
    if (contract) {
      parts.push(`# REPO PATTERNS (MUST FOLLOW)`);
      if (contract.containers?.length) {
        parts.push(`## Containers (modify these, don't create new files):`);
        contract.containers.forEach(c => parts.push(`- ${c}`));
      }
      if (contract.wrappers?.length) {
        parts.push(`## Wrappers (use these patterns):`);
        contract.wrappers.forEach(w => parts.push(`- ${w}`));
      }
      parts.push("");
    }

    // Examples
    if (examples?.length) {
      parts.push(`# EXAMPLES FROM THIS REPO (Mirror These Patterns)`);
      examples.forEach((ex, i) => {
        parts.push(`## Example ${i + 1}:`);
        parts.push("```");
        parts.push(ex);
        parts.push("```");
      });
      parts.push("");
    }

    // Ops-only instruction (from step 6 of the plan)
    parts.push(this.getOpsOnlyFragment());

    return parts.join("\n");
  }

  private getOpsOnlyFragment(): string {
    return `
# OUTPUT FORMAT (STRICT JSON ONLY)

You must output STRICT JSON that conforms to this TypeScript type:

type EditOp =
 | { type: "insert_after",  path: string, anchor: string, code: string, occur?: number }
 | { type: "insert_before", path: string, anchor: string, code: string, occur?: number }
 | { type: "replace_between", path: string, start: string, end: string, code: string }
 | { type: "append_if_missing", path: string, code: string, mustContain: string }
 | { type: "upsert_import", path: string, spec: string, from: string };

Return: { "ops": EditOp[] }

Rules:
- Use existing repo patterns and containers learned from exemplars.
- Prefer modifying the existing container file; do NOT create new files or classes if a container exists.
- Fill in exact anchors from the current file content. Keep anchors short but unique.
- "code" must be complete, compile-ready TypeScript (no placeholders, no TODO).
- No prose. No markdown. JSON ONLY.
`.trim();
  }

  private async llmSynthesizeOps(prompt: string, quality: string, tier: string): Promise<PatchOps> {
    // Call LLM with JSON format enforced
    const model = this.selectModel(quality, tier);
    console.log(`[OpsGenerator] Calling ${model} for ops synthesis...`);

    const raw = await this.llmClient.generate({
      model,
      prompt,
      format: "json",
      timeoutMs: 300000, // 5 min for Ollama cold start
    });

    // Parse and validate
    let parsed: any;
    try {
      parsed = JSON.parse(raw.text || raw);
    } catch (e) {
      throw new Error(`LLM returned invalid JSON: ${raw.text?.slice(0, 200)}`);
    }

    if (!isPatchOps(parsed)) {
      throw new Error(`LLM returned invalid PatchOps schema: ${JSON.stringify(parsed).slice(0, 200)}`);
    }

    return parsed;
  }

  private selectModel(quality: string, tier: string): string {
    // Auto-select model based on quality/tier
    if (tier === "paid") {
      return quality === "best" ? "gpt-4o" : "gpt-4o-mini";
    }
    // Free tier: Ollama
    return quality === "best" ? "qwen2.5-coder:7b" : "qwen2.5-coder:7b";
  }
}

