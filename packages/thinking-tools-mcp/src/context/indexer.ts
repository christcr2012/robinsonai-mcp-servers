import fg from 'fast-glob';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execSync } from 'child_process';
import { embedBatch } from './embedding.js';
import { ensureDirs, saveChunk, saveEmbedding, saveStats, saveDocs, type StoredDoc } from './store.js';
import { Chunk, IndexStats } from './types.js';
import { extractDocRecord } from './docs/extract.js';
import { extractSymbols } from './symbols.js';

const MAXCH = parseInt(process.env.CTX_MAX_CHARS_PER_CHUNK || '1200', 10);

/**
 * Resolve workspace root (MCP-aware)
 * In MCP environment, process.cwd() returns VS Code install dir, not workspace!
 */
function resolveWorkspaceRoot(): string {
  // Try environment variables first (set by MCP config)
  const envRoot = process.env.WORKSPACE_ROOT ||
                  process.env.AUGMENT_WORKSPACE_ROOT ||
                  process.env.VSCODE_WORKSPACE ||
                  process.env.INIT_CWD;

  if (envRoot && fs.existsSync(envRoot)) {
    console.log(`[indexer] Using workspace root from env: ${envRoot}`);
    return envRoot;
  }

  // Fallback to process.cwd() (works in CLI, breaks in MCP)
  const cwd = process.cwd();
  console.log(`[indexer] Using process.cwd(): ${cwd}`);
  return cwd;
}

const rootRepo = resolveWorkspaceRoot();

const INCLUDE = ['**/*.{ts,tsx,js,jsx,md,mdx,json,yml,yaml,sql,py,sh,ps1}'];
const EXCLUDE = [
  '**/node_modules/**',
  '**/.git/**',
  '**/dist/**',
  '**/build/**',
  '**/.next/**',
  '**/.turbo/**',
  '**/.venv*/**',
  '**/venv/**',
  '**/__pycache__/**',
  '**/.pytest_cache/**',
  '**/site-packages/**',
  '**/.augment/**',
  '**/.robinson/**',
  '**/.backups/**',
  '**/.training/**',
  '**/sandbox/**',
  '**/*.db',
  '**/*.db-shm',
  '**/*.db-wal'
];

function sha(txt: string): string {
  return crypto.createHash('sha1').update(txt).digest('hex');
}

/**
 * Code-aware chunking that keeps method/function bodies intact
 * "Stickier" version - tries harder to keep implementations together
 */
function chunkByHeuristics(filePath: string, text: string): { start: number; end: number; text: string }[] {
  const ext = path.extname(filePath).toLowerCase();
  const isCode = ['.ts', '.tsx', '.js', '.jsx', '.py', '.go', '.java', '.rs'].includes(ext);

  if (isCode) {
    const out: { start: number; end: number; text: string }[] = [];
    const lines = text.split(/\r?\n/);
    let buf: string[] = [];
    let bufStart = 1;
    let depth = 0, hard = 0;

    const flush = () => {
      if (buf.length) {
        out.push({
          start: bufStart,
          end: bufStart + buf.length - 1,
          text: buf.join('\n')
        });
        buf = [];
        hard = 0;
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const ln = lines[i];

      if (buf.length === 0) bufStart = i + 1;

      buf.push(ln);
      if (/{/.test(ln)) depth++;
      if (/}/.test(ln)) depth = Math.max(0, depth - 1);
      hard++;

      const decl = /^\s*(export\s+)?(async\s+)?(function|class|const|let)\b/.test(ln);
      const softLimit = 140, hardLimit = 220;

      // try to end at decl boundaries; otherwise hard cap
      if ((depth === 0 && decl && buf.length >= 24) || hard >= hardLimit || (depth === 0 && hard >= softLimit)) {
        flush();
      }
    }
    flush();
    return out.filter(s => s.text.trim().length > 0);
  }

  // docs: paragraph/windowed
  const paragraphs = text.split(/\n{2,}/);
  const out: { start: number; end: number; text: string }[] = [];
  let lineNum = 1;

  for (const para of paragraphs) {
    const paraLines = para.split(/\r?\n/).length;
    if (para.length > 1400) {
      const windows = para.match(/[\s\S]{1,1200}/g) || [];
      for (const win of windows) {
        const winLines = win.split(/\r?\n/).length;
        out.push({ start: lineNum, end: lineNum + winLines - 1, text: win });
        lineNum += winLines;
      }
    } else if (para.trim().length > 0) {
      out.push({ start: lineNum, end: lineNum + paraLines - 1, text: para });
      lineNum += paraLines;
    }
    lineNum += 2;
  }
  return out.filter(chunk => chunk.text.trim().length > 0);
}

export async function indexRepo(repoRoot = rootRepo): Promise<{ ok: boolean; chunks: number; embeddings: number; files: number; error?: string }> {
  try {
    console.log(`[indexRepo] Starting indexing for: ${repoRoot}`);
    ensureDirs();

    const files = await fg(INCLUDE, {
      cwd: repoRoot,
      ignore: EXCLUDE,
      dot: true
    });

    console.log(`📁 Found ${files.length} files to index`);

    if (files.length === 0) {
      console.warn(`⚠️ No files found to index in ${repoRoot}`);
      return { ok: false, chunks: 0, embeddings: 0, files: 0, error: 'No files found' };
    }

    let n = 0, e = 0;
    let errors = 0;
    const docsBatch: StoredDoc[] = [];

    for (let fileIdx = 0; fileIdx < files.length; fileIdx++) {
      try {
        const rel = files[fileIdx];
        const p = path.join(repoRoot, rel);

        if (!fs.existsSync(p)) {
          console.warn(`⚠️ File not found: ${p}`);
          continue;
        }

        const text = fs.readFileSync(p, 'utf8');
        const stat = fs.statSync(p);
        const sh = sha(rel + ':' + stat.mtimeMs + ':' + text.length);

        // Extract documentation records for .md/.mdx/.rst/.txt files
        const ext = path.extname(rel).toLowerCase();
        const isDoc = ['.md', '.mdx', '.rst', '.txt'].includes(ext);
        if (isDoc) {
          const docRec = extractDocRecord(rel, text);
          docsBatch.push(docRec);
          // Continue to chunk docs for searchability
        }

        const chunks = chunkByHeuristics(rel, text).map((c) => ({
          id: sha(rel + ':' + c.start + ':' + c.end + ':' + sh),
          source: 'repo' as const,
          path: rel,
          uri: rel,  // Alias for path
          title: rel,  // Use path as title
          sha: sh,
          start: c.start,
          end: c.end,
          text: c.text,
          meta: {
            symbols: extractSymbols(ext, c.text),
            lang: ext,
            lines: c.text.split(/\r?\n/).length
          }
        } as Chunk));

        if (chunks.length === 0) {
          console.warn(`⚠️ No chunks created for ${rel}`);
          continue;
        }

        console.log(`⚡ [${fileIdx + 1}/${files.length}] Embedding ${rel} (${chunks.length} chunks)...`);

        try {
          const embs = await embedBatch(chunks.map(c => c.text));

          if (!embs || embs.length !== chunks.length) {
            console.error(`❌ Embedding mismatch for ${rel}: expected ${chunks.length}, got ${embs?.length || 0}`);
            errors++;
            continue;
          }

          for (let i = 0; i < chunks.length; i++) {
            saveChunk(chunks[i]);
            saveEmbedding({ id: chunks[i].id, vec: embs[i] });
            n++;
            e++;
          }
        } catch (embedError: any) {
          console.error(`❌ Embedding failed for ${rel}:`, embedError.message);
          errors++;
          continue;
        }
      } catch (fileError: any) {
        console.error(`❌ Error processing file ${files[fileIdx]}:`, fileError.message);
        errors++;
        continue;
      }
    }

    // Save docs batch
    if (docsBatch.length > 0) {
      saveDocs(docsBatch);
      console.log(`📄 Extracted ${docsBatch.length} documentation records`);
    }

    // Fail hard if we found files but created 0 chunks
    if (files.length > 0 && n === 0) {
      const errorMsg = `Indexing created 0 chunks from ${files.length} files. Check filters, read permissions, or binary files incorrectly included.`;
      console.error(`❌ ${errorMsg}`);
      throw new Error(errorMsg);
    }

    const stats: IndexStats = {
      chunks: n,
      embeddings: e,
      vectors: e,  // Same as embeddings
      sources: { repo: n },
      mode: process.env.EMBED_PROVIDER || 'ollama',
      model: process.env.EMBED_MODEL || 'nomic-embed-text',
      dimensions: 768,  // Default for nomic-embed-text
      totalCost: 0,  // Free with Ollama
      indexedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    saveStats(stats);
    console.log(`✅ Indexed ${n} chunks with ${e} embeddings, ${docsBatch.length} docs (${errors} errors)`);

    return { ok: true, chunks: n, embeddings: e, files: files.length };
  } catch (error: any) {
    console.error(`❌ Fatal indexing error:`, error.message);
    console.error(error.stack);
    return { ok: false, chunks: 0, embeddings: 0, files: 0, error: error.message };
  }
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

