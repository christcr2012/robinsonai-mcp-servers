import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';
import { request } from 'undici';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { embedBatch } from './embedding.js';
import { saveChunk, saveEmbedding, saveStats } from './store.js';

const root = process.env.CTX_ROOT || '.robinson/context';

function sha(s: string): string {
  return crypto.createHash('sha1').update(s).digest('hex');
}

async function fetchHTML(url: string): Promise<string> {
  const ua = process.env.CTX_WEB_USER_AGENT || 'RobinsonContext/1.0';
  const r = await request(url, {
    headers: { 'user-agent': ua }
  });
  
  if (r.statusCode >= 400) throw new Error('HTTP ' + r.statusCode);
  return await r.body.text();
}

export async function ingestUrls(urls: string[], tags: string[] = []): Promise<{ ingested: number }> {
  const MAXCH = parseInt(process.env.CTX_MAX_CHARS_PER_CHUNK || '1200', 10);
  let n = 0;
  
  for (const u of urls) {
    const html = await fetchHTML(u);
    const dom = new JSDOM(html, { url: u });
    const reader = new Readability(dom.window.document);
    const art = reader.parse();
    const text = (art?.textContent || '').trim();
    
    if (!text) continue;
    
    const idbase = sha(u + ':' + (art?.title || ''));
    const words = text.split(/\s+/);
    
    // chunk by chars
    const chunks: { text: string; start: number; end: number }[] = [];
    let buf: string[] = [];
    let idx = 0;
    
    for (const w of words) {
      buf.push(w);
      if (buf.join(' ').length >= MAXCH) {
        chunks.push({
          text: buf.join(' '),
          start: idx,
          end: idx + buf.length
        });
        idx += buf.length;
        buf = [];
      }
    }
    
    if (buf.length) {
      chunks.push({
        text: buf.join(' '),
        start: idx,
        end: idx + buf.length
      });
    }
    
    const embs = await embedBatch(chunks.map(c => c.text));
    
    for (let i = 0; i < chunks.length; i++) {
      const id = sha(idbase + ':' + i);
      const file = path.join(root, 'web', id + '.json');
      
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, JSON.stringify({
        url: u,
        title: art?.title || '',
        text: chunks[i].text
      }));
      
      saveChunk({
        id,
        source: 'web',
        path: u,
        sha: idbase,
        start: chunks[i].start,
        end: chunks[i].end,
        text: chunks[i].text,
        tags
      });
      
      saveEmbedding({ id, vec: embs[i] });
      n++;
    }
  }
  
  // stats refresh cheap; indexer will overwrite
  saveStats({
    chunks: 0,
    embeddings: 0,
    sources: {},
    updatedAt: new Date().toISOString()
  });
  
  return { ingested: n };
}

export async function ddg(q: string, k = 5): Promise<string[]> {
  const url = `https://duckduckgo.com/html/?q=${encodeURIComponent(q)}`;
  const r = await request(url, {
    headers: { 'user-agent': 'RobinsonContext/1.0' }
  });
  
  const html = await r.body.text();
  const matches = [...html.matchAll(/<a rel="nofollow" class="result__a" href="([^"#]+)"/g)];
  const urls = matches.slice(0, k).map(x => decodeURIComponent(x[1]));
  
  return urls;
}

