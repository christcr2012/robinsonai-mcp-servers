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
import { buildAnchorHints } from "../anchors/indexer.js";
import { nearestAllowed } from "../anchors/suggest.js";
import { AnchorHints } from "../anchors/types.js";

export class OpsGenerator implements DiffGenerator {
  name = "ops-generator";
  private llmClient: any; // Will be injected

  constructor(llmClient: any) {
    this.llmClient = llmClient;
  }

  async generate(input: GenInput): Promise<string> {
    const { repo, task, contract, examples, tier, quality } = input;

    console.log(`[OpsGenerator] Generating ops for task: ${task.slice(0, 60)}...`);

    // 1) Build anchor hints from target files and exemplars
    const targetPaths = this.extractTargetPaths(task, contract);
    const exemplarPaths = (examples || []).map((ex: any) => {
      if (typeof ex === 'string') {
        // Extract path from code fence if present
        const match = ex.match(/^```(?:\w+)?\s*\n\/\/\s*(.+?)\n/);
        return match ? match[1] : null;
      }
      return ex.path || null;
    }).filter(Boolean);

    const hints = await buildAnchorHints(repo, targetPaths, exemplarPaths);

    // Log anchor counts
    for (const [file, data] of Object.entries(hints.byFile)) {
      console.log(`[Anchors] ${file}: ${data.allowed.length} allowed`);
    }

    // 2) Build prompt that requests PatchOps JSON (with anchor hints)
    const prompt = this.buildOpsPrompt(input, hints);

    // 3) Get ops from LLM (with quality escalation on failure)
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

    // 4) Validate and normalize anchors
    ops = this.validateAnchors(ops, hints);
    console.log(`[Ops] ${ops.ops.length} ops returned; anchors normalized to allowed set`);

    // 5) Apply ops in place (modifies files on disk)
    const changes = applyOpsInPlace(repo, ops.ops);
    console.log(`[OpsGenerator] Applied ops to ${changes.length} files`);

    // 6) Build valid unified diff from before/after
    let unified = bundleUnified(changes);

    // 7) Apply guardrails (MIGRATE mode: rewrite TODO/new any)
    unified = validatePatchUnifiedDiff(unified, contract);

    // 8) Validate patch is syntactically correct
    gitApplyCheck(unified, repo);
    console.log(`[OpsGenerator] git apply --check OK`);

    return unified;
  }

  private extractTargetPaths(task: string, contract: any): string[] {
    // Extract file paths from task and contract
    const paths: string[] = [];

    // From contract containers
    if (contract?.containers) {
      paths.push(...contract.containers);
    }

    // Try to extract from task (look for file paths)
    const fileMatches = task.match(/[\w\-./]+\.(?:ts|js|tsx|jsx|json)/g);
    if (fileMatches) {
      paths.push(...fileMatches);
    }

    return [...new Set(paths)]; // dedupe
  }

  private validateAnchors(ops: PatchOps, hints: AnchorHints): PatchOps {
    for (const op of ops.ops) {
      // Validate anchor field (insert_after, insert_before)
      if ("anchor" in op && typeof (op as any).anchor === "string") {
        const a = (op as any).anchor as string;
        const fixed = nearestAllowed(op.path, a, hints);
        if (!fixed) {
          const examples = (hints.byFile[op.path]?.allowed ?? []).slice(0, 5).join(" | ");
          throw new Error(`Invalid anchor for ${op.path}: "${a}". Allowed examples: ${examples}`);
        }
        (op as any).anchor = fixed; // normalize to the allowed literal
      }

      // Validate start/end anchors (replace_between)
      if ((op as any).start && typeof (op as any).start === "string") {
        const fixedStart = nearestAllowed(op.path, (op as any).start, hints);
        if (fixedStart) (op as any).start = fixedStart;
      }
      if ((op as any).end && typeof (op as any).end === "string") {
        const fixedEnd = nearestAllowed(op.path, (op as any).end, hints);
        if (fixedEnd) (op as any).end = fixedEnd;
      }
    }
    return ops;
  }

  private buildOpsPrompt(input: GenInput, hints: AnchorHints): string {
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

    // Anchor hints
    if (Object.keys(hints.byFile).length > 0) {
      parts.push(`# ANCHOR HINTS`);
      parts.push(`For each file, you MUST choose anchors from the allowed list below:`);
      parts.push("");
      for (const [file, data] of Object.entries(hints.byFile)) {
        parts.push(`## ${file}`);
        parts.push(`Allowed anchors (choose from these):`);
        data.allowed.slice(0, 20).forEach(a => parts.push(`- ${a}`));
        if (data.allowed.length > 20) {
          parts.push(`... and ${data.allowed.length - 20} more`);
        }
        parts.push("");
      }
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
- For any op with an "anchor" field, the value MUST be exactly one string from that file's allowed anchor list (see ANCHOR HINTS above).
- If anchors are provided for a file, you MUST choose from them; do not invent new anchors.
- Prefer the most semantically close anchor (e.g., switch case label for that endpoint, or the containing class/method signature).
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

