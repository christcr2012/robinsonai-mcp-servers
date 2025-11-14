export type EditOp =
  | { type: "insert_after";  path: string; anchor: string; code: string; occur?: number }
  | { type: "insert_before"; path: string; anchor: string; code: string; occur?: number }
  | { type: "replace_between"; path: string; start: string; end: string; code: string }
  | { type: "append_if_missing"; path: string; code: string; mustContain: string }
  | { type: "upsert_import"; path: string; spec: string; from: string }; // e.g. spec:"{ fetchX }"

export type PatchOps = { ops: EditOp[] };

export function isPatchOps(x: any): x is PatchOps {
  return !!x && Array.isArray(x.ops) && x.ops.every((o) => typeof o.type === "string" && typeof o.path === "string");
}

