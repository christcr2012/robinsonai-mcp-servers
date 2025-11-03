import fg from 'fast-glob';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execSync } from 'child_process';
import { embedBatch } from './embedding.js';
import {
  ensureDirs, saveChunk, saveEmbedding, saveStats, saveDocs,
  loadFileMap, saveFileMap, deleteChunksForFile,
  getCachedVec, putCachedVec, sha, getStats,
  type StoredDoc
} from './store.js';
import { Chunk, IndexStats } from './types.js';
import { extractDocRecord } from './docs/extract.js';
import { extractSymbols } from './symbols.js';
import { gitChangesSince, fsDiffFallback } from './git/changes.js';

const MAXCH = parseInt(process.env.CTX_MAX_CHARS_PER_CHUNK || '1200', 10);

// Incremental indexing configuration
const TTL_MIN = Number(process.env.RCE_INDEX_TTL_MINUTES ?? 20);
const MAX_CHANGED = Number(process.env.RCE_MAX_CHANGED_PER_RUN ?? 800);
const EMBED_MODEL = process.env.RCE_EMBED_MODEL || process.env.EMBED_MODEL || 'nomic-embed-text';

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
const EXCLUDE = process.env.RCE_IGNORE
  ? process.env.RCE_IGNORE.split(',').map(s => s.trim())
  : [
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
      '**/*.db-wal',
      '**/.rce_index/**'
    ];

// sha() is now imported from store.js

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

export async function indexRepo(
  repoRoot = rootRepo,
  opts: { quick?: boolean; force?: boolean } = {}
): Promise<{
  ok: boolean;
  skipped?: boolean;
  reason?: string;
  chunks: number;
  embeddings: number;
  files: number;
  changed?: number;
  removed?: number;
  tookMs?: number;
  error?: string;
}> {
  try {
    const start = Date.now();
    console.log(`[indexRepo] Starting ${opts.quick ? 'incremental' : 'full'} indexing for: ${repoRoot}`);
    ensureDirs();

    // DEBUG: Write workspace root to file for inspection
    fs.writeFileSync(path.join(repoRoot, '.robinson', 'context', 'debug-workspace-root.txt'),
      `repoRoot: ${repoRoot}\nprocess.cwd(): ${process.cwd()}\nWORKSPACE_ROOT: ${process.env.WORKSPACE_ROOT}\nAUGMENT_WORKSPACE_ROOT: ${process.env.AUGMENT_WORKSPACE_ROOT}\n`);

    const meta = getStats();
    const filesMap = loadFileMap();

    // TTL gate (skip if index is fresh and quick mode)
    if (opts.quick && !opts.force && meta?.updatedAt) {
      const age = Date.now() - new Date(meta.updatedAt).getTime();
      if (age < TTL_MIN * 60 * 1000) {
        console.log(`⏭️ Index is fresh (${Math.round(age / 1000)}s old), skipping`);
        return {
          ok: true,
          skipped: true,
          reason: 'ttl',
          chunks: meta.chunks || 0,
          embeddings: meta.embeddings || 0,
          files: Object.keys(filesMap).length
        };
      }
    }

    // List all candidate files
    const allFiles = await fg(INCLUDE, {
      cwd: repoRoot,
      ignore: EXCLUDE,
      dot: true
    });

    console.log(`📁 Found ${allFiles.length} total files`);

    // If force flag is set, process ALL files (full reindex)
    let changed: string[];
    let removed: string[];
    let added: string[];
    let modified: string[];
    let ch: any;

    if (opts.force) {
      console.log(`🔄 Force flag set - processing ALL ${allFiles.length} files`);
      changed = allFiles;
      removed = [];
      added = [];
      modified = allFiles; // Treat all as modified for force reindex
      ch = { head: null };
    } else {
      // Detect changes via git
      ch = await gitChangesSince(repoRoot, (meta as any)?.head);
      added = ch.added.concat(ch.untracked);
      modified = ch.modified;
      let deleted = ch.deleted;

      // Fallback to mtime if git didn't detect changes
      if (!ch.head || (!added.length && !modified.length && !deleted.length)) {
        console.log(`📊 Using mtime fallback for change detection`);
        const diff = await fsDiffFallback(repoRoot, allFiles, filesMap);
        added = diff.added;
        modified = diff.modified;
        deleted = diff.deleted;
      }

      // Cap changed files to keep responses snappy
      changed = Array.from(new Set([...added, ...modified])).slice(0, MAX_CHANGED);
      removed = deleted;
    }

    console.log(`🔄 Changes: +${added.length} ~${modified.length} -${removed.length} (processing ${changed.length})`);

    // Apply deletions
    for (const f of removed) {
      delete filesMap[f];
      deleteChunksForFile(f);
    }

    let n = 0, e = 0;
    let errors = 0;
    const docsBatch: StoredDoc[] = [];

    // Process changed files only
    for (let fileIdx = 0; fileIdx < changed.length; fileIdx++) {
      try {
        const rel = changed[fileIdx];
        const p = path.join(repoRoot, rel);

        if (!fs.existsSync(p)) {
          console.warn(`⚠️ File not found: ${p}`);
          continue;
        }

        const text = fs.readFileSync(p, 'utf8');
        const stat = fs.statSync(p);
        const ext = path.extname(rel).toLowerCase();
        const isDoc = ['.md', '.mdx', '.rst', '.txt'].includes(ext);

        // Delete old chunks for this file (if modified)
        if (modified.includes(rel)) {
          deleteChunksForFile(rel);
        }

        // Extract documentation records
        if (isDoc) {
          const docRec = extractDocRecord(rel, text);
          docsBatch.push(docRec);
        }

        // Chunk the file
        const parts = chunkByHeuristics(rel, text);
        const chunkIds: string[] = [];

        console.log(`⚡ [${fileIdx + 1}/${changed.length}] Processing ${rel} (${parts.length} chunks)...`);

        for (const part of parts) {
          const contentSha = sha(part.text);

          // Try to reuse cached embedding
          let vec = getCachedVec(EMBED_MODEL, contentSha);

          if (!vec) {
            // Need to embed this chunk
            try {
              const embs = await embedBatch([part.text]);
              if (embs && embs.length > 0) {
                vec = embs[0];
                // Cache for future use
                putCachedVec(EMBED_MODEL, contentSha, vec);
                e++;
              }
            } catch (embedError: any) {
              console.error(`❌ Embedding failed for ${rel}:`, embedError.message);
              errors++;
            }
          } else {
            // Reused cached embedding
            e++;
          }

          const chunk: Chunk = {
            id: `${contentSha}:${parts.indexOf(part)}`,
            source: 'repo' as const,
            path: rel,
            uri: rel,
            title: path.basename(rel),
            sha: contentSha,
            start: part.start,
            end: part.end,
            text: part.text,
            vec,
            meta: isDoc ? undefined : {
              symbols: extractSymbols(ext, part.text),
              lang: ext,
              lines: part.text.split(/\r?\n/).length
            }
          };

          saveChunk(chunk);
          if (vec) {
            saveEmbedding({ id: chunk.id, vec });
          }
          chunkIds.push(chunk.id);
          n++;
        }

        // Update file map
        filesMap[rel] = {
          mtimeMs: stat.mtimeMs,
          size: stat.size,
          contentSha: sha(text),
          chunkIds
        };

      } catch (fileError: any) {
        console.error(`❌ Error processing file ${changed[fileIdx]}:`, fileError.message);
        errors++;
        continue;
      }
    }

    // Save docs batch
    if (docsBatch.length > 0) {
      saveDocs(docsBatch);
      console.log(`📄 Extracted ${docsBatch.length} documentation records`);
    }

    // Save updated file map
    saveFileMap(filesMap);

    // Update stats
    const stats: IndexStats = {
      chunks: n,
      embeddings: e,
      vectors: e,
      sources: { repo: Object.keys(filesMap).length },
      mode: process.env.EMBED_PROVIDER || 'ollama',
      model: EMBED_MODEL,
      dimensions: 768,
      totalCost: 0,
      indexedAt: meta?.indexedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Add git head to stats
    if (ch.head) {
      (stats as any).head = ch.head;
    }

    saveStats(stats);

    const tookMs = Date.now() - start;
    console.log(`✅ Incremental index complete: ${n} chunks, ${e} embeddings, ${docsBatch.length} docs (${changed.length} changed, ${removed.length} removed, ${errors} errors) in ${tookMs}ms`);

    return {
      ok: true,
      chunks: n,
      embeddings: e,
      files: Object.keys(filesMap).length,
      changed: changed.length,
      removed: removed.length,
      tookMs
    };
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

