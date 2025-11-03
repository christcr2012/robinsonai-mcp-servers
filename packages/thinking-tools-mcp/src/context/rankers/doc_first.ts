import type { StoredDoc } from '../store.js';

export function docHints(q: string){
  const s = q.toLowerCase();
  const wantsDocs = /\b(doc|docs|documentation|plan|design|rfc|decision|postmortem|retro|status|report|summary|completion|spec|roadmap|okrs?)\b/.test(s)
    || /analy[sz]e|audit|cross[-\s]?reference|compare/.test(s);
  const preferRecent = /\b(recent|latest|current|now|as of|today)\b/.test(s);
  return { wantsDocs, preferRecent };
}

export function scoreDoc(q: string, d: StoredDoc) {
  const s = q.toLowerCase();
  let score = 0;

  // term matches (title then summary)
  const hit = (t:string) => (t.toLowerCase().includes(s) ? 1 : 0);
  score += 2.5 * hit(d.title ?? '');
  score += 1.0 * hit(d.summary ?? '');

  // type priors
  const typeW: Record<string, number> = {
    plan: 1.0, design: 1.0, rfc: 0.9, decision: 1.1, completion: 1.2, postmortem: 0.8,
    retro: 0.6, changelog: 0.7, spec: 0.9, readme: 0.6, status: 0.8, other: 0.4
  };
  score += (typeW[d.type] ?? 0.5);

  // status priors
  const statusW: Record<string, number> = { approved: 0.8, done: 1.0, 'in-progress': 0.4, draft: 0.2, deprecated: -0.8, unknown: 0 };
  score += (statusW[d.status ?? 'unknown'] ?? 0);

  // recency
  const date = d.date ? Date.parse(d.date) : NaN;
  if (!isNaN(date)) {
    const months = Math.max(0, (Date.now() - date) / (1000*60*60*24*30));
    const recency = Math.max(0, 1.0 - Math.min(months/18, 1.0)); // fade after ~18 months
    score += 0.8 * recency;
  }

  // tasks/links richness
  score += Math.min(0.6, (d.tasks?.length ?? 0) * 0.05);
  score += Math.min(0.4, (d.links?.length ?? 0) * 0.03);

  return score;
}

export function rerankDocs(q: string, docs: StoredDoc[], k = 24){
  const scored = docs.map(d => ({ d, s: scoreDoc(q, d) }))
    .sort((a,b)=>b.s-a.s)
    .slice(0, k);
  return scored.map(x => x.d);
}

