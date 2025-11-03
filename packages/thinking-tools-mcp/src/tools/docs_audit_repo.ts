import type { ServerContext } from '../lib/context.js';
import { loadDocs } from '../context/store.js';

export const docsAuditDescriptor = {
  name: 'docs_audit_repo',
  description: 'Cross-reference planning/completion docs vs code. Outputs done/missing/stale with links.',
  inputSchema: {
    type: 'object',
    properties: {
      planTypes: { type:'array', items:{type:'string'}, description: 'Plan doc types (default: plan, design, rfc, decision)' },
      completionTypes: { type:'array', items:{type:'string'}, description: 'Completion doc types (default: completion, postmortem, status)' },
      k: { type:'number', description: 'Evidence hits per task (default: 4)' }
    }
  }
};

export async function docsAuditTool(args:{planTypes?:string[]; completionTypes?:string[]; k?:number}, ctx: ServerContext){
  await ctx.ctx.ensureIndexed();
  const docs = loadDocs();
  const plans = docs.filter(d => (args.planTypes ?? ['plan','design','rfc','decision']).includes(d.type));
  const finals = docs.filter(d => (args.completionTypes ?? ['completion','postmortem','status']).includes(d.type));

  const results: any = { plans:[], finals:[], missing:[], stale:[], conflicts:[] };

  // 1) For each plan task, try to confirm in code
  for (const d of plans) {
    for (const t of (d.tasks ?? [])) {
      const q = `${t.text} ${d.title}`.slice(0, 128);
      const hits = await ctx.blendedSearch(q, args.k ?? 4);
      const found = hits.some(h => String(h.uri||'').match(/\.(ts|tsx|js|jsx|py|go|java|rs)$/i));
      const entry = { doc:d.uri, title:d.title, task:t.text, confirmed:found, evidence:hits.slice(0,3) };
      if (found) results.plans.push(entry); else results.missing.push(entry);
    }
  }

  // 2) Finals that may be stale (done/approved but no matching code)
  for (const d of finals) {
    const q = `${d.title} ${d.summary ?? ''}`.slice(0,160);
    const hits = await ctx.blendedSearch(q, args.k ?? 4);
    const anyCode = hits.some(h => String(h.uri||'').match(/\.(ts|tsx|js|jsx|py|go|java|rs)$/i));
    if (!anyCode) results.stale.push({ doc:d.uri, title:d.title, evidence:hits.slice(0,3) });
    else results.finals.push({ doc:d.uri, title:d.title, evidence:hits.slice(0,3) });
  }

  // 3) Conflicts (two plans with similar titles)
  const byTitle = new Map<string, any[]>();
  for (const d of plans) byTitle.set(d.title.toLowerCase(), [...(byTitle.get(d.title.toLowerCase())||[]), d.uri]);
  for (const [t,uris] of byTitle) if (uris.length>1) results.conflicts.push({ title:t, docs:uris });

  return { content: [{ type:'text', text: JSON.stringify(results, null, 2) }] };
}

