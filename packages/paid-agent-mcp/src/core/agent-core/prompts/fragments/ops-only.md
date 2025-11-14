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
- Fill in exact anchors from the current file content. Keep anchors short but unique.
- "code" must be complete, compile-ready TypeScript (no placeholders, no TODO).
- No prose. No markdown. JSON ONLY.

