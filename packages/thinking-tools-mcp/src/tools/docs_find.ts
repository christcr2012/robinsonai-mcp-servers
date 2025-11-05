import type { ServerContext } from '../lib/context.js';
import { loadDocs } from '../context/store.js';

export const docsFindDescriptor = {
  name: 'docs_find',
  description: 'Find documentation by type/status (plan, design, decision, completion, etc.)',
  inputSchema: {
    type: 'object',
    properties: {
      type: { type:'string', description: 'Doc type: plan, design, rfc, decision, completion, postmortem, retro, changelog, spec, readme, status, other' },
      status: { type:'string', description: 'Status: draft, in-progress, approved, done, deprecated, unknown' },
      text: { type:'string', description: 'Search text in title/summary' },
      k: { type:'number', description: 'Max results (default: 25)' }
    }
  }
};

export async function docsFindTool(args:{type?:string; status?:string; text?:string; k?:number}, ctx: ServerContext){
  await ctx.ctx.waitForIndex();
  const docs = loadDocs();
  const want = (v?:string)=> (v||'').toLowerCase();
  const out = docs.filter(d =>
    (!args.type || want(d.type)===want(args.type)) &&
    (!args.status || want(d.status)===want(args.status)) &&
    (!args.text || (d.title?.toLowerCase().includes(want(args.text)) || d.summary?.toLowerCase().includes(want(args.text))))
  ).slice(0, args.k ?? 25);
  return { content: [{ type:'text', text: JSON.stringify(out, null, 2) }] };
}

