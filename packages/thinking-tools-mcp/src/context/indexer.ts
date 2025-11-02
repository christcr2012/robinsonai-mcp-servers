import fg from 'fast-glob';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { embedBatch } from './embedding.js';
import { ensureDirs, saveChunk, saveEmbedding, saveStats } from './store.js';
import { Chunk, IndexStats } from './types.js';

const MAXCH = parseInt(process.env.CTX_MAX_CHARS_PER_CHUNK || '1200', 10);
const rootRepo = process.cwd();

const INCLUDE = ['**/*.{ts,tsx,js,jsx,md,mdx,json,yml,yaml,sql,py,sh,ps1}'];
const EXCLUDE = [
  '**/node_modules/**',
  '**/.git/**',
  '**/dist/**',
  '**/build/**',
  '**/.next/**',
  '**/.turbo/**'
];

function sha(txt: string): string {
  return crypto.createHash('sha1').update(txt).digest('hex');
}

function chunkText(text: string): { start: number; end: number; text: string }[] {
  const lines = text.split(/\r?\n/);
  const out: { start: number; end: number; text: string }[] = [];
  let buf: string[] = [];
  let start = 1;
  
  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i];
    buf.push(ln);
    const cur = buf.join('\n');
    
    if (cur.length >= MAXCH || i === lines.length - 1) {
      out.push({ start, end: i + 1, text: cur });
      buf = [];
      start = i + 2;
    }
  }
  
  return out;
}

export async function indexRepo(repoRoot = rootRepo) {
  ensureDirs();
  
  const files = await fg(INCLUDE, {
    cwd: repoRoot,
    ignore: EXCLUDE,
    dot: true
  });
  
  let n = 0, e = 0;
  
  for (const rel of files) {
    const p = path.join(repoRoot, rel);
    const text = fs.readFileSync(p, 'utf8');
    const stat = fs.statSync(p);
    const sh = sha(rel + ':' + stat.mtimeMs + ':' + text.length);
    
    const chunks = chunkText(text).map((c) => ({
      id: sha(rel + ':' + c.start + ':' + c.end + ':' + sh),
      source: 'repo' as const,
      path: rel,
      sha: sh,
      start: c.start,
      end: c.end,
      text: c.text
    } as Chunk));
    
    const embs = await embedBatch(chunks.map(c => c.text));
    
    for (let i = 0; i < chunks.length; i++) {
      saveChunk(chunks[i]);
      saveEmbedding({ id: chunks[i].id, vec: embs[i] });
      n++;
      e++;
    }
  }
  
  const stats: IndexStats = {
    chunks: n,
    embeddings: e,
    sources: { repo: n },
    updatedAt: new Date().toISOString()
  };
  
  saveStats(stats);
}

// CLI support
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  indexRepo()
    .then(() => console.log('Indexed repo'))
    .catch(e => {
      console.error(e);
      process.exit(1);
    });
}

