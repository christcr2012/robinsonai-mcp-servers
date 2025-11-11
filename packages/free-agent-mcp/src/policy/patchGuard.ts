import { countAnyTypes } from "../util/tsAst.js";

const FORBIDDEN_REGEX = [
  /Placeholder for real implementation/i,
  /path\/to\/gateway\/handlers\.ts/,
  /@src\/spec\/types/,
  /\bdefault_collection\b/,
];

/**
 * Validate unified diff patches before applying them
 * Rejects patches with:
 * - Placeholder text
 * - Fake paths/imports
 * - Hardcoded collections
 * - 'any' types in added lines
 */
export function validatePatchUnifiedDiff(diff: string): void {
  // 1) Basic textual checks for forbidden patterns
  for (const re of FORBIDDEN_REGEX) {
    if (re.test(diff)) {
      throw new Error(`[patch-guard] Patch rejected by policy: ${re}`);
    }
  }

  // 2) Per-file TypeScript 'any' budget (0 allowed in added lines)
  const files = diff.split(/^diff --git/m).slice(1);
  for (const chunk of files) {
    // Extract added lines (start with '+' but not '+++')
    const addedLines = chunk
      .split("\n")
      .filter((l) => l.startsWith("+") && !l.startsWith("+++"))
      .map((l) => l.slice(1))
      .join("\n");

    if (!addedLines.trim()) continue;

    // Count 'any' types in added code
    const anyCount = countAnyTypes(addedLines);
    if (anyCount > 0) {
      throw new Error(
        `[patch-guard] Patch rejected: added TypeScript 'any' (${anyCount} occurrences).`
      );
    }
  }
}

