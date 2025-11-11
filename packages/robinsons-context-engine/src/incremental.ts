/**
 * Incremental Indexing
 * 
 * Tracks file changes and only re-indexes modified files.
 * Dramatically faster than full re-indexing for large repositories.
 */

import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import type { RCEStore, StoredChunk, IndexMeta } from './store.js';
import type { Embedder } from './embeddings.js';
import { gitChangesSince, fsDiffFallback } from './git/changes.js';
import { extractSymbols } from './code/symbols.js';

export interface FileHash {
  path: string;
  hash: string;  // SHA1 of content
  mtime: number; // Modification time
  size: number;  // File size
}

export interface IncrementalIndexResult {
  added: number;
  updated: number;
  removed: number;
  unchanged: number;
  totalChunks: number;
  totalVectors: number;
}

/**
 * Compute file hashes for all files in directory
 */
export async function computeFileHashes(
  files: string[],
  root: string
): Promise<Map<string, FileHash>> {
  const hashes = new Map<string, FileHash>();

  for (const file of files) {
    try {
      const content = await fs.readFile(file, 'utf8');
      const stat = await fs.stat(file);
      const relPath = path.relative(root, file);
      
      const hash = crypto.createHash('sha1').update(content).digest('hex');
      
      hashes.set(relPath, {
        path: relPath,
        hash,
        mtime: stat.mtimeMs,
        size: stat.size,
      });
    } catch (error: any) {
      console.warn(`[Incremental] Failed to hash ${file}:`, error.message);
    }
  }

  return hashes;
}

/**
 * Detect file changes by comparing hashes
 */
export function detectChanges(
  currentHashes: Map<string, FileHash>,
  previousHashes: Map<string, FileHash>
): {
  added: string[];
  updated: string[];
  removed: string[];
  unchanged: string[];
} {
  const added: string[] = [];
  const updated: string[] = [];
  const removed: string[] = [];
  const unchanged: string[] = [];

  // Find added and updated files
  for (const [path, current] of currentHashes.entries()) {
    const previous = previousHashes.get(path);
    
    if (!previous) {
      added.push(path);
    } else if (previous.hash !== current.hash) {
      updated.push(path);
    } else {
      unchanged.push(path);
    }
  }

  // Find removed files
  for (const path of previousHashes.keys()) {
    if (!currentHashes.has(path)) {
      removed.push(path);
    }
  }

  return { added, updated, removed, unchanged };
}

/**
 * Perform incremental indexing with git change detection and TTL
 */
export async function incrementalIndex(
  root: string,
  files: string[],
  store: RCEStore,
  embedder: Embedder | null,
  chunkSize = 1200,
  ttlMinutes = 20
): Promise<IncrementalIndexResult> {
  console.log(`[Incremental] Starting incremental indexing...`);

  // Load previous metadata
  const meta = await store.readMeta();

  // TTL check: skip if recently indexed
  if (meta?.updatedAt) {
    const age = Date.now() - meta.updatedAt;
    if (age < ttlMinutes * 60 * 1000) {
      console.log(`[Incremental] Index is fresh (${Math.round(age/1000/60)}m old), skipping`);
      return {
        added: 0, updated: 0, removed: 0,
        unchanged: meta.sources || 0,
        totalChunks: meta.chunks || 0,
        totalVectors: meta.vectors || 0,
      };
    }
  }

  // Try git change detection first
  let changes: { added: string[]; modified: string[]; deleted: string[]; untracked?: string[] };
  try {
    const gitChanges = await gitChangesSince(root, meta?.head);
    changes = {
      added: [...gitChanges.added, ...(gitChanges.untracked || [])],
      modified: gitChanges.modified,
      deleted: gitChanges.deleted
    };
    console.log(`[Incremental] Git changes detected:`);
  } catch {
    // Fallback to mtime+size comparison
    const previousHashes = new Map<string, FileHash>(
      Object.entries(meta?.fileHashes || {}).map(([path, data]) => [path, { path, ...data }])
    );
    const currentHashes = await computeFileHashes(files, root);
    const fsChanges = detectChanges(currentHashes, previousHashes);
    changes = { added: fsChanges.added, modified: fsChanges.updated, deleted: fsChanges.removed };
    console.log(`[Incremental] Filesystem changes detected:`);
  }

  console.log(`  - Added: ${changes.added.length}`);
  console.log(`  - Modified: ${changes.modified.length}`);
  console.log(`  - Deleted: ${changes.deleted.length}`);

  // If no changes, return early
  if (changes.added.length === 0 && changes.modified.length === 0 && changes.deleted.length === 0) {
    console.log(`[Incremental] No changes detected, skipping indexing`);
    return {
      added: 0,
      updated: 0,
      removed: 0,
      unchanged: files.length,
      totalChunks: meta?.chunks || 0,
      totalVectors: meta?.vectors || 0,
    };
  }

  // Remove chunks for deleted and modified files
  const filesToRemove = [...changes.deleted, ...changes.modified];
  for (const f of filesToRemove) {
    await store.deleteChunksForFile(f);
  }
  if (filesToRemove.length > 0) {
    console.log(`[Incremental] Removed chunks for ${filesToRemove.length} files`);
  }

  // Index new and modified files
  const filesToIndex = [...changes.added, ...changes.modified];
  let newChunks = 0;
  let newVectors = 0;
  const fileMap = await store.loadFileMap();

  if (filesToIndex.length > 0) {
    const batch: StoredChunk[] = [];

    for (const relPath of filesToIndex) {
      try {
        const fullPath = path.join(root, relPath);
        const content = await fs.readFile(fullPath, 'utf8');
        const title = path.basename(relPath);
        const ext = path.extname(relPath);
        const stat = await fs.stat(fullPath);
        const contentSha = store.sha(content);

        // Extract symbols for code files
        const symbols = ['.ts','.tsx','.js','.jsx','.py','.go'].includes(ext)
          ? extractSymbols(ext, content)
          : [];

        // Chunk text
        const parts = chunkText(content, chunkSize);
        const chunkIds: string[] = [];

        // Generate embeddings with caching
        let vecs: number[][] = [];
        if (embedder) {
          try {
            const model = embedder.model || 'unknown';
            for (const p of parts) {
              const sha = store.sha(p);
              let vec = await store.getCachedVec(model, sha);
              if (!vec) {
                const [v] = await embedder.embed([p]);
                vec = v;
                await store.putCachedVec(model, sha, vec);
              }
              vecs.push(vec);
            }
          } catch (error: any) {
            console.error(`[Incremental] Embedding failed for ${relPath}:`, error.message);
          }
        }

        // Create chunks
        for (let i = 0; i < parts.length; i++) {
          const chunkId = crypto.createHash('sha1').update(relPath + '|' + i).digest('hex');
          chunkIds.push(chunkId);
          batch.push({
            id: chunkId,
            file: relPath,
            hash: store.sha(parts[i]),
            uri: relPath,
            title,
            text: parts[i],
            vec: vecs[i],
            metadata: {
              start: i * chunkSize,
              end: Math.min((i + 1) * chunkSize, content.length),
              symbols,
              lang: ext.slice(1),
              lines: content.split('\n').length,
            },
          });
          newChunks++;
          if (vecs[i]) newVectors++;

          // Write in batches
          if (batch.length >= 200) {
            await store.writeChunks(batch.splice(0, batch.length));
          }
        }

        // Update file map
        fileMap[relPath] = {
          mtimeMs: stat.mtimeMs,
          size: stat.size,
          contentSha,
          chunkIds
        };

      } catch (error: any) {
        console.error(`[Incremental] Error indexing ${relPath}:`, error.message);
      }
    }

    // Write remaining chunks
    if (batch.length > 0) {
      await store.writeChunks(batch);
    }

    await store.saveFileMap(fileMap);
    console.log(`[Incremental] Indexed ${filesToIndex.length} files: ${newChunks} chunks, ${newVectors} vectors`);
  }

  // Get current git head
  let head: string | undefined;
  try {
    const gitChanges = await gitChangesSince(root);
    head = gitChanges.head;
  } catch {}

  // Compute current hashes for metadata
  const currentHashes = await computeFileHashes(files, root);
  const fileHashesObj: { [path: string]: { hash: string; mtime: number; size: number } } = {};
  for (const [path, fileHash] of currentHashes.entries()) {
    fileHashesObj[path] = { hash: fileHash.hash, mtime: fileHash.mtime, size: fileHash.size };
  }

  const updatedMeta: IndexMeta = {
    head,
    provider: meta?.provider || 'none',
    sources: currentHashes.size,
    chunks: (meta?.chunks || 0) - (changes.deleted.length + changes.modified.length) * 10 + newChunks,
    vectors: (meta?.vectors || 0) - (changes.deleted.length + changes.modified.length) * 10 + newVectors,
    model: meta?.model,
    dimensions: meta?.dimensions,
    totalCost: meta?.totalCost,
    fileHashes: fileHashesObj,
    indexedAt: meta?.indexedAt || new Date().toISOString(),
    updatedAt: Date.now(),
  };

  await store.saveMeta(updatedMeta);

  return {
    added: changes.added.length,
    updated: changes.modified.length,
    removed: changes.deleted.length,
    unchanged: files.length - changes.added.length - changes.modified.length - changes.deleted.length,
    totalChunks: updatedMeta.chunks,
    totalVectors: updatedMeta.vectors,
  };
}

/**
 * Check if incremental indexing is needed
 */
export async function needsReindexing(
  files: string[],
  root: string,
  store: RCEStore
): Promise<boolean> {
  const meta = await store.readMeta();
  if (!meta || !meta.fileHashes) {
    return true; // No previous index
  }

  const previousHashes = new Map<string, FileHash>(
    Object.entries(meta.fileHashes).map(([path, data]) => [path, { path, ...data }])
  );

  const currentHashes = await computeFileHashes(files, root);
  const changes = detectChanges(currentHashes, previousHashes);

  return changes.added.length > 0 || changes.updated.length > 0 || changes.removed.length > 0;
}

/**
 * Helper: Chunk text into fixed-size pieces
 */
function chunkText(text: string, size: number): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += size) {
    chunks.push(text.slice(i, i + size));
  }
  return chunks;
}

