import { createTwoFilesPatch } from "diff";

export function toUnified(relPath: string, before: string, after: string) {
  // produce Git-compatible headers; use LF endings
  const a = before.replace(/\r\n/g, "\n"); 
  const b = after.replace(/\r\n/g, "\n");
  return createTwoFilesPatch(`a/${relPath}`, `b/${relPath}`, a, b, "", "");
}

export function bundleUnified(changes: { path: string; before: string; after: string }[]) {
  return changes.map(c => toUnified(c.path, c.before, c.after)).join("\n");
}

