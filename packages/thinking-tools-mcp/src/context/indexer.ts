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
  contextRootPath,
  type StoredDoc
} from './store.js';
import { Chunk, IndexStats } from './types.js';
import { extractDocRecord } from './docs/extract.js';
import { extractSymbols } from './symbols.js';
import { gitChangesSince, fsDiffFallback } from './git/changes.js';
import { loadContextConfig } from './config.js';
import type { ContextConfig } from './config.js';

const MAXCH = parseInt(process.env.CTX_MAX_CHARS_PER_CHUNK || '1200', 10);

const CODE_ALIAS: Record<string, string> = {
  '.tsx': '.ts',
  '.jsx': '.js',
  '.mjs': '.js',
  '.cjs': '.js',
  '.cts': '.ts',
  '.mts': '.ts',
  '.hpp': '.cpp',
  '.hxx': '.cpp',
  '.hh': '.cpp',
  '.ipp': '.cpp',
  '.cc': '.cpp',
  '.cxx': '.cpp',
  '.hhp': '.cpp',
  '.h': '.c',
  '.mm': '.m',
};

const CODE_EXTENSIONS = new Set<string>([
  '.ts', '.js', '.py', '.go', '.java', '.kt', '.kts', '.rs', '.cpp', '.c', '.cs',
  '.rb', '.php', '.swift', '.scala', '.m', '.mm', '.hs', '.ps1', '.sh', '.vue', '.svelte'
]);

const BRACE_LANGS = new Set<string>([
  '.ts', '.js', '.go', '.java', '.kt', '.kts', '.rs', '.cpp', '.c', '.cs', '.php', '.swift', '.scala', '.m', '.mm', '.vue', '.svelte'
]);

const INDENT_LANGS = new Set<string>(['.py', '.rb', '.hs']);

type DeclarationMatcher = (line: string) => boolean;

const DECLARATION_MATCHERS: Record<string, DeclarationMatcher[]> = {
  '.ts': [
    line => /\bfunction\s+[A-Za-z_][A-Za-z0-9_]*/.test(line),
    line => /\bclass\s+[A-Za-z_][A-Za-z0-9_]*/.test(line),
    line => /\binterface\s+[A-Za-z_][A-Za-z0-9_]*/.test(line),
    line => /\btype\s+[A-Za-z_][A-Za-z0-9_]*/.test(line),
    line => /\b(enum|namespace)\s+[A-Za-z_][A-Za-z0-9_]*/.test(line),
    line => /(?:const|let)\s+[A-Za-z_][A-Za-z0-9_]*\s*=\s*(?:async\s*)?(?:\(|[A-Za-z_][A-Za-z0-9_]*\s*=>)/.test(line),
  ],
  '.js': [
    line => /\bfunction\s+[A-Za-z_][A-Za-z0-9_]*/.test(line),
    line => /\bclass\s+[A-Za-z_][A-Za-z0-9_]*/.test(line),
    line => /(?:const|let|var)\s+[A-Za-z_][A-Za-z0-9_]*\s*=\s*(?:async\s*)?(?:\(|[A-Za-z_][A-Za-z0-9_]*\s*=>)/.test(line),
    line => /module\.exports\s*=/.test(line),
  ],
  '.py': [
    line => /^\s*(?:async\s+)?def\s+[A-Za-z_][A-Za-z0-9_]*/.test(line),
    line => /^\s*class\s+[A-Za-z_][A-Za-z0-9_]*/.test(line),
  ],
  '.go': [
    line => /^\s*func\s+[A-Za-z_][A-Za-z0-9_]*/.test(line),
    line => /^\s*type\s+[A-Za-z_][A-Za-z0-9_]*/.test(line),
    line => /^\s*(?:var|const)\s+[A-Za-z_][A-Za-z0-9_]*/.test(line),
  ],
  '.java': [
    line => /\bclass\s+[A-Za-z_][A-Za-z0-9_]*/.test(line),
    line => /\binterface\s+[A-Za-z_][A-Za-z0-9_]*/.test(line),
    line => /\benum\s+[A-Za-z_][A-Za-z0-9_]*/.test(line),
    line => /\b(?:public|protected|private|static|final|abstract|synchronized)\b.*\b[A-Za-z_][A-Za-z0-9_]*\s*\(/.test(line),
  ],
  '.kt': [
    line => /\bclass\s+[A-Za-z_][A-Za-z0-9_]*/.test(line),
    line => /\bobject\s+[A-Za-z_][A-Za-z0-9_]*/.test(line),
    line => /\binterface\s+[A-Za-z_][A-Za-z0-9_]*/.test(line),
    line => /\bfun\s+[A-Za-z_][A-Za-z0-9_]*/.test(line),
  ],
  '.kts': [
    line => /\bfun\s+[A-Za-z_][A-Za-z0-9_]*/.test(line),
    line => /\btask\s+\w+\s*\{/.test(line),
  ],
  '.rs': [
    line => /\b(?:pub\s+)?fn\s+[A-Za-z_][A-Za-z0-9_]*/.test(line),
    line => /\b(?:pub\s+)?struct\s+[A-Za-z_][A-Za-z0-9_]*/.test(line),
    line => /\b(?:pub\s+)?enum\s+[A-Za-z_][A-Za-z0-9_]*/.test(line),
    line => /\b(?:pub\s+)?trait\s+[A-Za-z_][A-Za-z0-9_]*/.test(line),
    line => /\bmod\s+[A-Za-z_][A-Za-z0-9_]*/.test(line),
  ],
  '.cpp': [
    line => /\bclass\s+[A-Za-z_][A-Za-z0-9_]*/.test(line),
    line => /\bstruct\s+[A-Za-z_][A-Za-z0-9_]*/.test(line),
    line => /\btemplate\s*<[^>]+>/.test(line),
    line => /[A-Za-z_][\w:\*<>,\s]*\s+[A-Za-z_][A-Za-z0-9_]*\s*\(/.test(line),
  ],
  '.c': [
    line => /[A-Za-z_][\w\*\s]*\s+[A-Za-z_][A-Za-z0-9_]*\s*\(/.test(line),
    line => /^\s*typedef\b/.test(line),
    line => /^\s*struct\b/.test(line),
  ],
  '.cs': [
    line => /\bclass\s+[A-Za-z_][A-Za-z0-9_]*/.test(line),
    line => /\binterface\s+[A-Za-z_][A-Za-z0-9_]*/.test(line),
    line => /\benum\s+[A-Za-z_][A-Za-z0-9_]*/.test(line),
    line => /\b(?:public|private|protected|internal|static|async|sealed|abstract)\b.*\b[A-Za-z_][A-Za-z0-9_]*\s*\(/.test(line),
  ],
  '.rb': [
    line => /^\s*(?:class|module|def)\s+[A-Za-z_][A-Za-z0-9_!?]*/.test(line),
  ],
  '.php': [
    line => /\bclass\s+[A-Za-z_][A-Za-z0-9_]*/.test(line),
    line => /\b(?:public|protected|private|static)?\s*function\s+[A-Za-z_][A-Za-z0-9_]*/.test(line),
  ],
  '.swift': [
    line => /\b(?:class|struct|enum|protocol|extension|func)\s+[A-Za-z_][A-Za-z0-9_]*/.test(line),
  ],
  '.scala': [
    line => /\b(?:class|trait|object|case\s+class|def)\s+[A-Za-z_][A-Za-z0-9_]*/.test(line),
  ],
  '.m': [
    line => /@interface\s+[A-Za-z_][A-Za-z0-9_]*/.test(line),
    line => /@implementation\s+[A-Za-z_][A-Za-z0-9_]*/.test(line),
    line => /-\s*\([^)]+\)\s*[A-Za-z_][A-Za-z0-9_]*/.test(line),
    line => /\+\s*\([^)]+\)\s*[A-Za-z_][A-Za-z0-9_]*/.test(line),
  ],
  '.mm': [
    line => /@interface\s+[A-Za-z_][A-Za-z0-9_]*/.test(line),
    line => /@implementation\s+[A-Za-z_][A-Za-z0-9_]*/.test(line),
    line => /-\s*\([^)]+\)\s*[A-Za-z_][A-Za-z0-9_]*/.test(line),
    line => /\+\s*\([^)]+\)\s*[A-Za-z_][A-Za-z0-9_]*/.test(line),
  ],
  '.hs': [
    line => /^[A-Za-z_][A-Za-z0-9_']*\s*::/.test(line),
    line => /^\s*data\s+[A-Za-z_][A-Za-z0-9_']*/.test(line),
    line => /^\s*newtype\s+[A-Za-z_][A-Za-z0-9_']*/.test(line),
  ],
  '.vue': [
    line => /<script/.test(line),
    line => /export\s+default/.test(line),
  ],
  '.svelte': [
    line => /<script/.test(line),
    line => /export\s+let\s+[A-Za-z_][A-Za-z0-9_]*/.test(line),
  ],
};

const DOC_EXTENSIONS = new Set<string>(['.md', '.mdx', '.rst', '.txt', '.adoc']);

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

// Don't resolve at module load time - env vars might not be set yet!
// Resolve inside indexRepo() instead

const INCLUDE = ['**/*.{ts,tsx,cts,mts,js,jsx,mjs,cjs,md,mdx,json,yml,yaml,sql,py,sh,ps1,go,java,kt,kts,rs,cpp,cc,cxx,c,h,hpp,hxx,ipp,cs,rb,php,swift,scala,m,mm,hs,vue,svelte}'];
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
function normalizeExt(ext: string): string {
  const lower = ext.toLowerCase();
  return CODE_ALIAS[lower] ?? lower;
}

function isDeclarationLineNormalized(ext: string, line: string): boolean {
  const matchers = DECLARATION_MATCHERS[ext];
  if (!matchers) return false;
  return matchers.some(matcher => {
    try {
      return matcher(line);
    } catch {
      return false;
    }
  });
}

function estimateIndent(line: string): number {
  const match = line.match(/^(\s*)/);
  return match ? match[1].length : 0;
}

function chunkByHeuristics(filePath: string, text: string): { start: number; end: number; text: string }[] {
  const ext = path.extname(filePath).toLowerCase();
  const normalizedExt = normalizeExt(ext);
  const isCode = CODE_EXTENSIONS.has(normalizedExt);

  if (isCode) {
    const out: { start: number; end: number; text: string }[] = [];
    const lines = text.split(/\r?\n/);
    let buf: string[] = [];
    let bufStart = 1;
    let depth = 0;
    let hard = 0;
    const usesBraces = BRACE_LANGS.has(normalizedExt);
    const usesIndentation = INDENT_LANGS.has(normalizedExt);
    const softLimit = usesIndentation ? 100 : 140;
    const hardLimit = usesIndentation ? 200 : 220;

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
      const trimmed = ln.trim();

      if (buf.length === 0) bufStart = i + 1;

      buf.push(ln);
      hard++;

      if (usesBraces) {
        if (ln.includes('{')) depth++;
        if (ln.includes('}')) depth = Math.max(0, depth - 1);
      } else if (normalizedExt === '.rb') {
        if (/^\s*(class|module|def|begin|case)\b/.test(ln)) depth++;
        if (/^\s*end\b/.test(ln)) depth = Math.max(0, depth - 1);
      }

      const decl = isDeclarationLineNormalized(normalizedExt, ln);
      const indent = usesIndentation ? estimateIndent(ln) : 0;
      const blank = trimmed.length === 0;

      if (usesBraces) {
        if ((depth === 0 && decl && buf.length >= 20) || hard >= hardLimit || (depth === 0 && hard >= softLimit)) {
          flush();
        }
      } else if (usesIndentation) {
        if ((decl && buf.length >= 10) || (blank && buf.length >= 24) || hard >= hardLimit || indent === 0 && buf.length >= softLimit) {
          flush();
        }
      } else {
        if ((decl && buf.length >= 16) || (blank && buf.length >= 32) || hard >= hardLimit) {
          flush();
        }
      }
    }

    flush();
    return out.filter(s => s.text.trim().length > 0);
  }

  // docs: paragraph/windowed
  const paragraphs = text.split(/\n{2,}/);
  const out: { start: number; end: number; text: string }[] = [];
  let lineNum = 1;
  const chunkSize = Math.max(200, Math.min(MAXCH, 1600));

  for (const para of paragraphs) {
    const paraLines = para.split(/\r?\n/).length;
    if (para.length > chunkSize) {
      for (let offset = 0; offset < para.length; offset += chunkSize) {
        const win = para.slice(offset, offset + chunkSize);
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

function directorySize(p: string): number {
  try {
    const stat = fs.statSync(p);
    if (stat.isDirectory()) {
      return fs.readdirSync(p).reduce((total, entry) => total + directorySize(path.join(p, entry)), 0);
    }
    return stat.size;
  } catch {
    return 0;
  }
}

function enforceStorageBudget(root: string, storage: ContextConfig['storage']): number {
  const sizeBytes = directorySize(root);
  const sizeMb = sizeBytes / (1024 * 1024);

  if (storage.maxDiskUsageMb > 0 && sizeMb > storage.maxDiskUsageMb) {
    if (storage.autoCleanup) {
      const embedCache = path.join(root, 'embed-cache');
      console.warn(`⚠️ [indexRepo] Context store is ${sizeMb.toFixed(1)}MB (limit ${storage.maxDiskUsageMb}MB). Pruning embed cache...`);
      try {
        fs.rmSync(embedCache, { recursive: true, force: true });
        fs.mkdirSync(embedCache, { recursive: true });
      } catch (error: any) {
        console.warn(`⚠️ [indexRepo] Failed to prune embed cache: ${error?.message ?? error}`);
      }
      const postCleanup = directorySize(root) / (1024 * 1024);
      return postCleanup;
    }

    console.warn(`⚠️ [indexRepo] Context store is ${sizeMb.toFixed(1)}MB. Set RCE_STORAGE_AUTOCLEAN=1 or raise RCE_STORAGE_LIMIT_MB to suppress.`);
  }

  return sizeMb;
}

export async function indexRepo(
  repoRoot?: string,
  opts: { quick?: boolean; force?: boolean; include?: string[] } = {}
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
  storageMb?: number;
  pending?: string[];
  partial?: boolean;
}> {
  try {
    // Resolve workspace root NOW (not at module load time) so env vars are available
    if (!repoRoot) {
      repoRoot = resolveWorkspaceRoot();
    }

    const start = Date.now();
    const config = await loadContextConfig();
    const targets = opts.include?.map(rel => rel.trim()).filter(Boolean) ?? null;
    const quickMode = opts.quick !== false && !targets;
    const TTL_MIN = config.indexing.ttlMinutes;
    const maxChanged = config.indexing.maxChangedFiles;
    const embedModel = config.embedding.model;
    const embedProvider = config.embedding.provider;
    const compressChunks = config.storage.compressionEnabled;
    const quickBudget = config.indexing.quickFileLimit;

    console.log(`[indexRepo] Starting ${targets ? 'targeted' : quickMode ? 'incremental' : 'full'} indexing for: ${repoRoot}`);
    ensureDirs();

    // DEBUG: Write workspace root to file for inspection
    const debugDir = path.join(repoRoot, '.robinson', 'context');
    fs.mkdirSync(debugDir, { recursive: true });
    fs.writeFileSync(path.join(debugDir, 'debug-workspace-root.txt'),
      `repoRoot: ${repoRoot}\nprocess.cwd(): ${process.cwd()}\nWORKSPACE_ROOT: ${process.env.WORKSPACE_ROOT}\nAUGMENT_WORKSPACE_ROOT: ${process.env.AUGMENT_WORKSPACE_ROOT}\n`);

    const meta = getStats();
    const filesMap = loadFileMap();

    // TTL gate (skip if index is fresh and quick mode)
    if (!targets && quickMode && !opts.force && meta?.updatedAt && TTL_MIN > 0) {
      const age = Date.now() - new Date(meta.updatedAt).getTime();
      if (age < TTL_MIN * 60 * 1000) {
        console.log(`⏭️ Index is fresh (${Math.round(age / 1000)}s old), skipping`);
        return {
          ok: true,
          skipped: true,
          reason: 'ttl',
          chunks: meta.chunks || 0,
          embeddings: meta.embeddings || 0,
          files: Object.keys(filesMap).length,
          pending: [],
          partial: false
        };
      }
    }

    // List all candidate files
    let allFiles: string[] = [];
    if (!targets) {
      allFiles = await fg(INCLUDE, {
        cwd: repoRoot,
        ignore: EXCLUDE,
        dot: true
      });

      console.log(`📁 Found ${allFiles.length} total files`);

      // DEBUG: Write glob results to file
      fs.writeFileSync(path.join(repoRoot, '.robinson', 'context', 'debug-glob.txt'),
        `Found ${allFiles.length} files\nINCLUDE: ${JSON.stringify(INCLUDE)}\nEXCLUDE: ${JSON.stringify(EXCLUDE)}\ncwd: ${repoRoot}\nFirst 10 files:\n${allFiles.slice(0, 10).join('\n')}\n`);
    } else {
      console.log(`🎯 Targeted reindex for ${targets.length} files`);
    }

    // If force flag is set, process ALL files (full reindex)
    let changed: string[];
    let removed: string[];
    let added: string[];
    let modified: string[];
    let ch: any;

    if (targets && targets.length === 0) {
      return {
        ok: true,
        skipped: true,
        reason: 'no-files',
        chunks: meta?.chunks || 0,
        embeddings: meta?.embeddings || 0,
        files: Object.keys(filesMap).length,
        pending: [],
        partial: false
      };
    }

    if (targets) {
      const normalizedTargets = Array.from(new Set(targets.map(t => t.replace(/\\/g, '/'))));
      added = [];
      modified = [];
      removed = [];
      changed = [];

      for (const rel of normalizedTargets) {
        const abs = path.join(repoRoot, rel);
        if (fs.existsSync(abs)) {
          changed.push(rel);
          if (filesMap[rel]) {
            modified.push(rel);
          } else {
            added.push(rel);
          }
        } else {
          removed.push(rel);
        }
      }

      ch = await gitChangesSince(repoRoot, (meta as any)?.head);
    } else if (opts.force) {
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
      const combined = Array.from(new Set([...added, ...modified]));
      changed = maxChanged > 0 ? combined.slice(0, maxChanged) : combined;
      removed = deleted;
    }

    let deferred: string[] = [];
    if (!targets && quickMode && quickBudget > 0 && changed.length > quickBudget) {
      deferred = changed.slice(quickBudget);
      changed = changed.slice(0, quickBudget);
      const processedSet = new Set(changed);
      added = added.filter(f => processedSet.has(f));
      modified = modified.filter(f => processedSet.has(f));
      console.log(`⚡ Quick mode limited to ${changed.length} files (${deferred.length} deferred for background indexing)`);
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
        const normalizedExt = normalizeExt(ext);
        const isDoc = DOC_EXTENSIONS.has(ext);
        const isCode = CODE_EXTENSIONS.has(normalizedExt);

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
          let vec = getCachedVec(embedModel, contentSha);

          if (!vec) {
            // Need to embed this chunk
            try {
              const embs = await embedBatch([part.text]);
              if (embs && embs.length > 0) {
                vec = embs[0];
                // Cache for future use
                putCachedVec(embedModel, contentSha, vec);
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
            meta: isCode ? {
              symbols: extractSymbols(normalizedExt, part.text),
              lang: normalizedExt,
              lines: part.text.split(/\r?\n/).length
            } : undefined
          };

          saveChunk(chunk, { compress: compressChunks });
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
      mode: embedProvider,
      model: embedModel,
      dimensions: 768,
      totalCost: 0,
      indexedAt: meta?.indexedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Add git head to stats
    if (ch.head) {
      (stats as any).head = ch.head;
    }

    const storageMb = enforceStorageBudget(contextRootPath(), config.storage);
    (stats as any).storageMb = Number(storageMb.toFixed(2));
    (stats as any).compression = compressChunks ? 'gzip' : 'none';

    saveStats(stats);

    const tookMs = Date.now() - start;
    console.log(`✅ Incremental index complete: ${n} chunks, ${e} embeddings, ${docsBatch.length} docs (${changed.length} processed, ${removed.length} removed, ${errors} errors) in ${tookMs}ms`);

    return {
      ok: true,
      chunks: n,
      embeddings: e,
      files: Object.keys(filesMap).length,
      changed: changed.length,
      removed: removed.length,
      tookMs,
      storageMb: Number(storageMb.toFixed(2)),
      pending: deferred,
      partial: deferred.length > 0
    };
  } catch (error: any) {
    console.error(`❌ Fatal indexing error:`, error.message);
    console.error(error.stack);
    return { ok: false, chunks: 0, embeddings: 0, files: 0, error: error.message, pending: [], partial: false };
  }
}

// CLI support
if (process.argv[1] && import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  indexRepo()
    .then(() => console.log('Indexed repo'))
    .catch(e => {
      console.error(e);
      process.exit(1);
    });
}

