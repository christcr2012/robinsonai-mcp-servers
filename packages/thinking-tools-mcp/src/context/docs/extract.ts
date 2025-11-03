import crypto from 'node:crypto';
import path from 'node:path';
import { DocRecord, DocType } from './types.js';

const TYPE_PATTERNS: Array<[DocType, RegExp]> = [
  ['plan', /(plan|planning|roadmap|proposal)/i],
  ['design', /(design|architecture|adr)/i],
  ['rfc', /\brfc\b/i],
  ['decision', /(decision\s*record|adr)/i],
  ['completion', /(completion|final\s*report|wrap[-\s]*up|deliverables)/i],
  ['postmortem', /(post[-\s]*mortem|incident|lesson[s]? learned|root cause)/i],
  ['retro', /(retrospective|retro)/i],
  ['changelog', /(changelog|release\s*notes)/i],
  ['spec', /\b(spec|specification|contract|api)\b/i],
  ['readme', /\breadme\b/i],
  ['status', /(status\s*report|progress|weekly|daily)/i]
];

function frontmatter(text: string) {
  const m = text.match(/^---\s*[\r\n]+([\s\S]*?)[\r\n]+---/);
  if (!m) return {};
  const obj: Record<string,string> = {};
  for (const line of m[1].split(/\r?\n/)) {
    const mm = line.match(/^\s*([A-Za-z0-9_-]+)\s*:\s*(.+?)\s*$/);
    if (mm) obj[mm[1].toLowerCase()] = mm[2];
  }
  return obj;
}

function firstHeading(text: string) {
  const m = text.match(/^\s*#\s+(.+)$/m);
  return m ? m[1].trim() : '';
}

function firstParagraph(text: string) {
  const noFM = text.replace(/^---[\s\S]*?---/, '');
  const m = noFM.trim().split(/\n{2,}/).find(x => x.trim().length > 40);
  return m ? m.trim().slice(0, 800) : '';
}

function fileTypeHint(file: string): DocType | undefined {
  const base = path.basename(file).toLowerCase();
  for (const [t, re] of TYPE_PATTERNS) {
    if (re.test(base)) return t;
  }
  return undefined;
}

function label(text: string): DocType {
  for (const [t, re] of TYPE_PATTERNS) {
    if (re.test(text)) return t;
  }
  return 'other';
}

function detectStatus(text: string) {
  const m = text.match(/status\s*[:\-]\s*(draft|approved|in[-\s]?progress|done|deprecated)/i);
  if (!m) return 'unknown';
  const norm = m[1].toLowerCase().replace(/\s+/g, '-');
  if (norm.startsWith('in-')) return 'in-progress';
  return (['draft','approved','done','deprecated'].includes(norm) ? norm : 'unknown') as any;
}

function detectVersion(text: string) {
  const m = text.match(/\b(v(?:ersion)?\s*[:\-]?\s*)(\d+\.\d+(?:\.\d+)?)/i);
  return m ? m[2] : undefined;
}

function detectDate(text: string) {
  const m = text.match(/\b(20\d{2}[-\/.](?:0?[1-9]|1[0-2])[-\/.](?:0?[1-9]|[12]\d|3[01]))\b/);
  return m ? m[1].replace(/[\/.]/g,'-') : undefined;
}

function extractTasks(text: string) {
  const tasks: Array<{text:string;done?:boolean}> = [];
  const re = /^[ \t]*[-*]\s+\[( |x)\]\s+(.+)$/gmi;
  let mm; while ((mm = re.exec(text))) tasks.push({ text: mm[2].trim(), done: mm[1].toLowerCase()==='x' });
  return tasks;
}

function extractLinks(file: string, text: string) {
  const links: Array<{kind:'code'|'issue'|'url';ref:string}> = [];
  // code paths in backticks or plain
  const code = /`([^`]+?\.(?:ts|tsx|js|jsx|py|go|java|rs))`|((?:^|[\s(])[^`'"]+?\.(?:ts|tsx|js|jsx|py|go|java|rs))/gmi;
  let m; while((m = code.exec(text))) {
    const ref = (m[1] || m[2] || '').trim();
    if (ref) links.push({ kind:'code', ref });
  }
  // issues (#123 or GH urls)
  const issue = /#\d{2,6}\b|https?:\/\/github\.com\/[^/\s]+\/[^/\s]+\/issues\/\d+/gmi;
  while((m = issue.exec(text))) links.push({ kind:'issue', ref: m[0] });
  // bare urls for context
  const url = /https?:\/\/[^\s)]+/gmi;
  while((m = url.exec(text))) links.push({ kind:'url', ref: m[0] });
  return links;
}

export function extractDocRecord(file: string, text: string): DocRecord {
  const fm = frontmatter(text);
  const t0 = fileTypeHint(file);
  const title = fm.title || firstHeading(text) || path.basename(file);
  const summary = fm.summary || firstParagraph(text);
  const type = (fm.type as DocType) || t0 || label(title + '\n' + summary);
  const status = (fm.status as any) || detectStatus(text);
  const version = fm.version || detectVersion(text);
  const date = fm.date || detectDate(text);
  const tasks = extractTasks(text);
  const links = extractLinks(file, text);
  const id = crypto.createHash('sha1').update(file + ':' + title).digest('hex');
  const tags = (fm.tags || '').split(',').map((x:string)=>x.trim()).filter(Boolean);
  return { id, uri:file, title, type, status, version, date, summary, tags, tasks, links };
}

