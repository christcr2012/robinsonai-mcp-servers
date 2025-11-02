#!/usr/bin/env node
/**
 * Index only documentation files for faster testing
 */

import fg from 'fast-glob';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { embedBatch } from './packages/thinking-tools-mcp/dist/context/embedding.js';
import { ensureDirs, saveChunk, saveEmbedding, saveStats } from './packages/thinking-tools-mcp/dist/context/store.js';

const MAXCH = 1200;

function sha(txt) {
  return crypto.createHash('sha1').update(txt).digest('hex');
}

function chunkText(text) {
  const lines = text.split(/\r?\n/);
  const out = [];
  let buf = [];
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

console.log('📚 Indexing documentation only...\n');

ensureDirs();

// Only index documentation and specs
const files = await fg([
  '**/*.md',
  '.robinson/**/*.{md,json}',
  'README.md',
  'ROADMAP.md'
], {
  ignore: ['**/node_modules/**', '**/.git/**', '**/dist/**'],
  dot: true
});

console.log(`📁 Found ${files.length} documentation files\n`);

let n = 0, e = 0;

for (let fileIdx = 0; fileIdx < files.length; fileIdx++) {
  const rel = files[fileIdx];
  const text = fs.readFileSync(rel, 'utf8');
  const stat = fs.statSync(rel);
  const sh = sha(rel + ':' + stat.mtimeMs + ':' + text.length);
  
  const chunks = chunkText(text).map((c) => ({
    id: sha(rel + ':' + c.start + ':' + c.end + ':' + sh),
    source: 'repo',
    path: rel,
    sha: sh,
    start: c.start,
    end: c.end,
    text: c.text
  }));
  
  console.log(`⚡ [${fileIdx + 1}/${files.length}] ${rel} (${chunks.length} chunks)...`);
  const embs = await embedBatch(chunks.map(c => c.text));
  
  for (let i = 0; i < chunks.length; i++) {
    saveChunk(chunks[i]);
    saveEmbedding({ id: chunks[i].id, vec: embs[i] });
    n++;
    e++;
  }
}

const stats = {
  chunks: n,
  embeddings: e,
  sources: { repo: n },
  updatedAt: new Date().toISOString()
};

saveStats(stats);
console.log(`\n✅ Indexed ${n} chunks with ${e} embeddings`);

