// packages/thinking-tools-mcp/src/tools/docs_audit_repo.ts
import path from "node:path";
import type { ServerContext } from "../lib/context.js";

export const docsAuditDescriptor = {
  name: "docs_audit_repo",
  description: "Cross-reference planning/completion docs against code; outputs done/missing/stale/conflicts.",
  inputSchema: {
    type: "object",
    properties: {
      repoPath: { type: "string", description: "Root of repo; defaults to workspaceRoot" },
      planTypes: { type: "array", items: { type: "string" }, default: ["plan","design","rfc","decision","spec"] },
      completionTypes: { type: "array", items: { type: "string" }, default: ["completion","postmortem","status","changelog"] },
      k: { type: "number", default: 4 }
    }
  }
};

export async function docsAuditTool(
  args: { repoPath?: string; planTypes?: string[]; completionTypes?: string[]; k?: number },
  ctx: ServerContext
) {
  const repoPath = typeof args.repoPath === "string" && args.repoPath.trim().length
    ? args.repoPath
    : ctx.workspaceRoot;
  const planTypes = (args.planTypes ?? ["plan","design","rfc","decision","spec"]).map(s=>String(s).toLowerCase());
  const completionTypes = (args.completionTypes ?? ["completion","postmortem","status","changelog"]).map(s=>String(s).toLowerCase());
  const K = Math.max(1, Math.min(12, Number(args.k ?? 4)));

  try {
    await ctx.ctx.ensureIndexed();
    const store = (ctx.ctx as any).store;
    const docs = await store.loadAllDocs();

    const isType = (d:any, set:string[]) => set.includes(String(d.type||"other").toLowerCase());

    const plans = docs.filter((d:any) => isType(d, planTypes));
    const finals = docs.filter((d:any) => isType(d, completionTypes));

    const results:any = { repoRoot: path.resolve(repoPath), plans:[], finals:[], missing:[], stale:[], conflicts:[] };

    // plans: confirm via blended search
    for (const d of plans) {
      for (const t of (d.tasks ?? [])) {
        const q = `${t.text} ${d.title}`.slice(0, 160);
        const hits = await ctx.blendedSearch(q, K);
        const found = hits.some(h => /\.(ts|tsx|js|jsx|py|go|java|rs)$/i.test(String(h.uri||"")));
        const item = { doc: d.uri, title: d.title, task: t.text, confirmed: found, evidence: hits.slice(0, K) };
        (found ? results.plans : results.missing).push(item);
      }
    }

    // completions that may be stale (no code references)
    for (const d of finals) {
      const q = `${d.title} ${d.summary ?? ""}`.slice(0, 200);
      const hits = await ctx.blendedSearch(q, K);
      const anyCode = hits.some(h => /\.(ts|tsx|js|jsx|py|go|java|rs)$/i.test(String(h.uri||"")));
      (anyCode ? results.finals : results.stale).push({ doc: d.uri, title: d.title, evidence: hits.slice(0, K) });
    }

    // conflicts by title
    const byTitle = new Map<string, any[]>();
    for (const d of plans) {
      const key = String(d.title || d.uri).toLowerCase().trim();
      byTitle.set(key, [...(byTitle.get(key)||[]), d.uri]);
    }
    for (const [t, uris] of byTitle) if (uris.length > 1) results.conflicts.push({ title: t, docs: uris });

    return { content: [{ type: "text", text: JSON.stringify(results, null, 2) }] };
  } catch (err:any) {
    return { content: [{ type: "text", text: `docs_audit_repo error: ${err?.message || String(err)}` }] };
  }
}

