import { AnchorHints } from "./types.js";

function norm(s: string) {
  return s.replace(/\s+/g, " ").replace(/[;{]+$/,"").trim().toLowerCase();
}

function similarity(a: string, b: string) {
  const A = new Set(norm(a).split(" "));
  const B = new Set(norm(b).split(" "));
  const inter = [...A].filter(x => B.has(x)).length;
  const uni = new Set([...A, ...B]).size;
  return uni ? inter / uni : 0;
}

export function nearestAllowed(file: string, want: string, hints: AnchorHints, min = 0.45) {
  const allowed = hints.byFile[file]?.allowed ?? [];
  if (!allowed.length) return null;

  // exact or whitespace-insensitive match first
  const exact = allowed.find(a => a === want) || allowed.find(a => norm(a) === norm(want));
  if (exact) return exact;

  // otherwise pick most similar
  let best = { a: "", s: 0 };
  for (const a of allowed) {
    const s = similarity(a, want);
    if (s > best.s) best = { a, s };
  }
  return best.s >= min ? best.a : null;
}

