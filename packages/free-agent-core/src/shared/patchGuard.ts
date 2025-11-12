import { PatternContract } from "../patterns/contract.js";
import { enforceContractOnDiff } from "../patterns/enforce.js";

/**
 * Patch Guard: Validate unified diffs before applying
 * Rejects patches with forbidden patterns, placeholders, or `any` types
 */

const FORBIDDEN_PATTERNS = [
  /Placeholder for real implementation/i,
  /\bany\b(?!\s*=>)/,
  /path\/to\/gateway\/handlers\.ts/,
  /\bdefault_collection\b/,
  /TODO.*implement/i,
  /FIXME.*implement/i,
];

export function validatePatchUnifiedDiff(diff: string, contract?: PatternContract): void {
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(diff)) {
      throw new Error(
        `[Patch Guard] Patch rejected: forbidden pattern detected: ${pattern}`
      );
    }
  }

  // Check for excessive `any` types in added lines
  const addedLines = diff
    .split("\n")
    .filter((line) => line.startsWith("+") && !line.startsWith("+++"))
    .map((line) => line.slice(1))
    .join("\n");

  const anyCount = (addedLines.match(/\bany\b/g) || []).length;
  if (anyCount > 0) {
    throw new Error(
      `[Patch Guard] Patch rejected: ${anyCount} 'any' types in added lines`
    );
  }

  // Guard: Reject new class files when container exists
  if (contract && (contract.containers || []).length > 0) {
    const creatingNewTs = /new file mode 100644\n\+\+\+ b\/.*\.ts/m.test(diff);
    const definesClass = /(^|\n)\+.*export\s+class\s+/m.test(diff);
    if (creatingNewTs && definesClass) {
      throw new Error(
        `[Patch Guard] Patch rejected: new class file created while container exists — add a method to the existing container.`
      );
    }
  }

  // If contract provided, enforce it
  if (contract) {
    enforceContractOnDiff(diff, contract);
  }
}

