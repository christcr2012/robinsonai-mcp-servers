import fg from 'fast-glob';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { embedBatch } from './embedding.js';
import { ensureDirs, saveChunk, saveEmbedding, saveStats } from './store.js';
import { Chunk, IndexStats } from './types.js';

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

        const chunks = chunkText(text).map((c) => ({
          id: sha(rel + ':' + c.start + ':' + c.end + ':' + sh),
          source: 'repo' as const,
          path: rel,
          sha: sh,
          start: c.start,
          end: c.end,
          text: c.text
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

    const stats: IndexStats = {
      chunks: n,
      embeddings: e,
      sources: { repo: n },
      updatedAt: new Date().toISOString()
    };

    saveStats(stats);
    console.log(`✅ Indexed ${n} chunks with ${e} embeddings (${errors} errors)`);

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

