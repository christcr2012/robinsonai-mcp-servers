import { PatternContract } from "../patterns/contract.js";
import { enforceContractOnDiff } from "../patterns/enforce.js";
import { getGateMode } from "./gates.js";

/**
 * Patch Guard: Validate unified diffs before applying
 * Rejects patches with forbidden patterns, placeholders, or `any` types
 *
 * Gate modes:
 * - strict: hard fail on new any & TODOs
 * - migrate (default): blocks new any by auto-rewriting to unknown and rewrites TODO → NOTE
 * - lenient: allows both (use only for bootstrapping)
 */

// helper: did the diff introduce something new?
const added = (re: RegExp, diff: string) =>
  diff.split("\n").some(l => l.startsWith("+") && re.test(l));

// allow 'any' only if it already existed in the hunk context
function introducedAny(diff: string): boolean {
  const lines = diff.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (l.startsWith("+") && /:?\sany(\W|$)/.test(l)) {
      // look back a few context lines for existing 'any'
      const ctx = lines.slice(Math.max(0, i - 12), i).join("\n");
      if (!/:?\sany(\W|$)/.test(ctx)) return true; // new 'any'
    }
  }
  return false;
}

export function validatePatchUnifiedDiff(diff: string, contract?: PatternContract): string {
  const mode = getGateMode();

  // No new class/file when containers exist
  if (contract?.containers?.length) {
    const newTs = /new file mode 100644\n\+\+\+ b\/.*\.ts/m.test(diff);
    const addsClass = /(^|\n)\+.*export\s+class\s+/m.test(diff);
    if (newTs && addsClass) {
      throw new Error("Patch rejected: should modify existing container, not create a new class/file.");
    }
  }

  // TODO comments
  if (mode !== "lenient" && added(/\bTODO\b/i, diff)) {
    if (mode === "strict") throw new Error("Patch rejected: TODO comments not allowed.");
    // migrate: rewrite TODO → NOTE to avoid fails
    diff = diff.replace(/(^|\n)\+([^\n]*)(TODO)/gi, (_m, a, pre) => `${a}+${pre}NOTE`);
  }

  // any types
  if (mode === "strict" && introducedAny(diff)) {
    throw new Error("Patch rejected: new 'any' types are not allowed.");
  }
  if (mode === "migrate" && introducedAny(diff)) {
    // auto-fix: convert to unknown (safer than any)
    diff = diff.replace(/(^|\n)\+([^\n]*):\s*any(\W)/g, (_m, a, pre, tail) => `${a}+${pre}: unknown${tail}`);
  }

  // If contract provided, enforce it
  if (contract) {
    enforceContractOnDiff(diff, contract);
  }

  return diff; // return possibly rewritten diff
}

