import fs from "fs";
import path from "path";
import { EditOp } from "./ops.js";

function read(p: string) { return fs.readFileSync(p, "utf8"); }
function write(p: string, s: string) { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, s); }

function nthIndexOf(hay: string, needle: string, occur = 1) {
  let idx = -1, from = 0;
  for (let i=0; i<occur; i++) { idx = hay.indexOf(needle, from); if (idx < 0) return -1; from = idx + needle.length; }
  return idx;
}

function norm(s: string) {
  return s.replace(/\s+/g, " ").trim();
}

function findAnchor(content: string, anchor: string, occur = 1) {
  // exact first
  let idx = nthIndexOf(content, anchor, occur);
  if (idx >= 0) return idx;

  // whitespace-insensitive
  const N = norm(content);
  const A = norm(anchor);
  idx = nthIndexOf(N, A, occur);
  if (idx >= 0) {
    // approximate mapping back is tricky; fallback to first exact occurrence of the first 12 chars
    const head = anchor.slice(0, Math.min(12, anchor.length));
    const rough = content.indexOf(head);
    return rough >= 0 ? rough : -1;
  }
  return -1;
}

function upsertImport(content: string, spec: string, from: string) {
  const importRe = new RegExp(`^import\\s+[^;]*\\s+from\\s+['"]${escapeReg(from)}['"];?\\s*$`, "m");
  if (importRe.test(content)) {
    // naive merge: don't duplicate
    return content;
  }
  const firstNonComment = content.search(/^(?!\s*\/\/|\s*\/\*|\s*\*|\s*$)/m);
  const headerEnd = firstNonComment > -1 ? firstNonComment : 0;
  const importLine = `import ${spec} from '${from}';\n`;
  return importLine + content.slice(headerEnd);
}

function escapeReg(s: string){ return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

export function applyOpsToContent(filePath: string, content: string, ops: EditOp[]): string {
  let s = content;
  for (const op of ops) {
    switch (op.type) {
      case "insert_after": {
        const idx = findAnchor(s, op.anchor, op.occur ?? 1);
        if (idx < 0) throw new Error(`anchor not found (after): ${op.anchor}`);
        const insertAt = idx + op.anchor.length;
        s = s.slice(0, insertAt) + op.code + s.slice(insertAt);
        break;
      }
      case "insert_before": {
        const idx = findAnchor(s, op.anchor, op.occur ?? 1);
        if (idx < 0) throw new Error(`anchor not found (before): ${op.anchor}`);
        s = s.slice(0, idx) + op.code + s.slice(idx);
        break;
      }
      case "replace_between": {
        const a = s.indexOf(op.start);
        if (a < 0) throw new Error(`start anchor not found: ${op.start}`);
        const b = s.indexOf(op.end, a + op.start.length);
        if (b < 0) throw new Error(`end anchor not found: ${op.end}`);
        s = s.slice(0, a + op.start.length) + op.code + s.slice(b);
        break;
      }
      case "append_if_missing": {
        if (!s.includes(op.mustContain)) s = s.trimEnd() + "\n" + op.code + (op.code.endsWith("\n") ? "" : "\n");
        break;
      }
      case "upsert_import": {
        s = upsertImport(s, op.spec, op.from);
        break;
      }
      default:
        throw new Error(`Unknown op: ${(op as any).type}`);
    }
  }
  return s;
}

export function applyOpsInPlace(repoRoot: string, allOps: EditOp[]) {
  const perFile = new Map<string, EditOp[]>();
  for (const op of allOps) perFile.set(op.path, [...(perFile.get(op.path) ?? []), op]);
  const changed: { path: string; before: string; after: string }[] = [];
  for (const [rel, ops] of perFile) {
    const abs = path.join(repoRoot, rel);
    const before = fs.existsSync(abs) ? read(abs) : "";
    const after = applyOpsToContent(abs, before, ops);
    if (after !== before) { write(abs, after); changed.push({ path: rel, before, after }); }
  }
  return changed;
}

