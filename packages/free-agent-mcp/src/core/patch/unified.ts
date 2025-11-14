import { createTwoFilesPatch } from "diff";
import { createHash } from "crypto";

/**
 * Generate a git-compatible unified diff patch
 * Adds proper git headers that the diff library doesn't include
 */
export function toUnified(relPath: string, before: string, after: string) {
  // Normalize line endings to LF
  const a = before.replace(/\r\n/g, "\n");
  const b = after.replace(/\r\n/g, "\n");

  // Generate the unified diff body (without git headers)
  const diffBody = createTwoFilesPatch(`a/${relPath}`, `b/${relPath}`, a, b, "", "");

  // Calculate git blob hashes (abbreviated to 7 chars like git does)
  const hashBefore = createHash("sha1").update(`blob ${a.length}\0${a}`).digest("hex").substring(0, 7);
  const hashAfter = createHash("sha1").update(`blob ${b.length}\0${b}`).digest("hex").substring(0, 7);

  // Build git-format patch with proper headers
  const gitHeaders = [
    `diff --git a/${relPath} b/${relPath}`,
    `index ${hashBefore}..${hashAfter} 100644`
  ].join("\n");

  // The diff library output starts with "===" separator, then "--- a/..." and "+++ b/..."
  // We need to strip the "===" line and prepend our git headers
  const lines = diffBody.split("\n");
  const diffStart = lines.findIndex(line => line.startsWith("---"));

  if (diffStart === -1) {
    // No changes, return empty
    return "";
  }

  const patchBody = lines.slice(diffStart).join("\n");
  return `${gitHeaders}\n${patchBody}`;
}

export function bundleUnified(changes: { path: string; before: string; after: string }[]) {
  return changes.map(c => toUnified(c.path, c.before, c.after)).join("\n");
}

