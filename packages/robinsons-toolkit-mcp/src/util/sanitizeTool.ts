export type ToolDef = {
  name: string;
  description?: string;
  inputSchema?: Record<string, any> | null;
  [k: string]: any;
};

const NAME_RE = /^[A-Za-z0-9:_-]{1,64}$/;

export function validateTools(tools: any[]): ToolDef[] {
  if (!Array.isArray(tools)) return [];
  const seen = new Set<string>();
  const ok: ToolDef[] = [];
  for (const t of tools) {
    if (!t || typeof t !== "object") continue;
    const name = String((t as any).name || "").trim();
    if (!NAME_RE.test(name)) continue;
    // normalize empty/null schemas to {}
    let inputSchema = (t as any).inputSchema ?? {};
    if (inputSchema === null || typeof inputSchema !== "object") inputSchema = {};
    // de-dupe by name
    if (seen.has(name)) continue;
    seen.add(name);
    ok.push({ ...(t as any), name, inputSchema });
  }
  // keep stable for deterministic diffs
  ok.sort((a, b) => a.name.localeCompare(b.name));
  return ok;
}
