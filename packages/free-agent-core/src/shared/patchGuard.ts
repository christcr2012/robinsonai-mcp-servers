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

  // If contract provided, enforce it
  if (contract) {
    enforceContractOnDiff(diff, contract);
  }
}

