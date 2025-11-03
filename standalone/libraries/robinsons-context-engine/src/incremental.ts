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
 * Perform incremental indexing
 */
export async function incrementalIndex(
  root: string,
  files: string[],
  store: RCEStore,
  embedder: Embedder | null,
  chunkSize = 1200
): Promise<IncrementalIndexResult> {
  console.log(`[Incremental] Starting incremental indexing...`);

  // Load previous metadata
  const meta = await store.readMeta();
  const previousHashes = new Map<string, FileHash>(
    Object.entries(meta?.fileHashes || {}).map(([path, data]) => [path, { path, ...data }])
  );

  // Compute current hashes
  const currentHashes = await computeFileHashes(files, root);

  // Detect changes
  const changes = detectChanges(currentHashes, previousHashes);

  console.log(`[Incremental] Changes detected:`);
  console.log(`  - Added: ${changes.added.length}`);
  console.log(`  - Updated: ${changes.updated.length}`);
  console.log(`  - Removed: ${changes.removed.length}`);
  console.log(`  - Unchanged: ${changes.unchanged.length}`);

  // If no changes, return early
  if (changes.added.length === 0 && changes.updated.length === 0 && changes.removed.length === 0) {
    console.log(`[Incremental] No changes detected, skipping indexing`);
    return {
      added: 0,
      updated: 0,
      removed: 0,
      unchanged: changes.unchanged.length,
      totalChunks: meta?.chunks || 0,
      totalVectors: meta?.vectors || 0,
    };
  }

  // Remove chunks for deleted and updated files
  const filesToRemove = [...changes.removed, ...changes.updated];
  if (filesToRemove.length > 0) {
    await store.removeChunksForFiles(filesToRemove);
    console.log(`[Incremental] Removed chunks for ${filesToRemove.length} files`);
  }

  // Index new and updated files
  const filesToIndex = [...changes.added, ...changes.updated];
  let newChunks = 0;
  let newVectors = 0;

  if (filesToIndex.length > 0) {
    const batch: StoredChunk[] = [];

    for (const relPath of filesToIndex) {
      try {
        const fullPath = path.join(root, relPath);
        const content = await fs.readFile(fullPath, 'utf8');
        const title = path.basename(relPath);

        // Chunk text
        const parts = chunkText(content, chunkSize);
        const hashes = parts.map(p =>
          crypto.createHash('sha1').update(relPath + '|' + p).digest('hex')
        );

        // Generate embeddings
        let vecs: number[][] = [];
        if (embedder) {
          try {
            const batchSize = 64;
            for (let i = 0; i < parts.length; i += batchSize) {
              const seg = parts.slice(i, i + batchSize);
              const e = await embedder.embed(seg);
              vecs.push(...e);
            }
          } catch (error: any) {
            console.error(`[Incremental] Embedding failed for ${relPath}:`, error.message);
          }
        }

        // Create chunks
        for (let i = 0; i < parts.length; i++) {
          batch.push({
            hash: hashes[i],
            uri: relPath,
            title,
            text: parts[i],
            vec: vecs[i],
            metadata: {
              start: i * chunkSize,
              end: Math.min((i + 1) * chunkSize, content.length),
            },
          });
          newChunks++;
          if (vecs[i]) newVectors++;

          // Write in batches
          if (batch.length >= 200) {
            await store.writeChunks(batch.splice(0, batch.length));
          }
        }
      } catch (error: any) {
        console.error(`[Incremental] Error indexing ${relPath}:`, error.message);
      }
    }

    // Write remaining chunks
    if (batch.length > 0) {
      await store.writeChunks(batch);
    }

    console.log(`[Incremental] Indexed ${filesToIndex.length} files: ${newChunks} chunks, ${newVectors} vectors`);
  }

  // Update metadata with new file hashes
  const fileHashesObj: { [path: string]: { hash: string; mtime: number; size: number } } = {};
  for (const [path, fileHash] of currentHashes.entries()) {
    fileHashesObj[path] = { hash: fileHash.hash, mtime: fileHash.mtime, size: fileHash.size };
  }

  const updatedMeta: IndexMeta = {
    provider: meta?.provider || 'none',
    sources: currentHashes.size,
    chunks: (meta?.chunks || 0) - (changes.removed.length + changes.updated.length) * 10 + newChunks, // Rough estimate
    vectors: (meta?.vectors || 0) - (changes.removed.length + changes.updated.length) * 10 + newVectors,
    model: meta?.model,
    dimensions: meta?.dimensions,
    totalCost: meta?.totalCost,
    fileHashes: fileHashesObj,
    indexedAt: new Date().toISOString(),
  };

  await store.saveMeta(updatedMeta);

  return {
    added: changes.added.length,
    updated: changes.updated.length,
    removed: changes.removed.length,
    unchanged: changes.unchanged.length,
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

