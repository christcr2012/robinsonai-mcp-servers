/**
 * Vector Memory
 *
 * Lightweight code and documentation embedding store.
 * Wires to symbol index for retrieval; shaped for future real embeddings.
 */

export type VecDoc = {
  id: string;
  text: string;
  meta?: Record<string, any>;
};

let docs: VecDoc[] = [];

/**
 * Upsert a document into vector memory
 *
 * @param d - Document with id, text, and optional metadata
 *
 * @example
 * ```typescript
 * upsertVec({
 *   id: "auth-service",
 *   text: "export class AuthService { login() { ... } }",
 *   meta: { file: "src/services/auth.ts", type: "class" }
 * });
 * ```
 */
export function upsertVec(d: VecDoc): void {
  const i = docs.findIndex(x => x.id === d.id);
  if (i >= 0) {
    docs[i] = d;
  } else {
    docs.push(d);
  }
}

/**
 * Search vector memory by text
 *
 * @param q - Search query
 * @param topK - Number of results to return
 * @returns Matching documents
 */
export function searchVec(q: string, topK: number = 8): VecDoc[] {
  const lowerQ = q.toLowerCase();
  return docs
    .filter(d => d.text.toLowerCase().includes(lowerQ))
    .slice(0, topK);
}

/**
 * Get a document by ID
 *
 * @param id - Document ID
 * @returns Document or undefined
 */
export function getVecDoc(id: string): VecDoc | undefined {
  return docs.find(d => d.id === id);
}

/**
 * Delete a document from vector memory
 *
 * @param id - Document ID
 */
export function deleteVecDoc(id: string): void {
  const i = docs.findIndex(d => d.id === id);
  if (i >= 0) {
    docs.splice(i, 1);
  }
}

/**
 * Get all documents
 *
 * @returns All documents in vector memory
 */
export function getAllVecDocs(): VecDoc[] {
  return [...docs];
}

/**
 * Clear all documents
 */
export function clearVecDocs(): void {
  docs = [];
}

/**
 * Get document count
 *
 * @returns Number of documents
 */
export function getVecDocCount(): number {
  return docs.length;
}

/**
 * Search by metadata
 *
 * @param metaKey - Metadata key to search
 * @param metaValue - Metadata value to match
 * @returns Matching documents
 */
export function searchVecByMeta(metaKey: string, metaValue: any): VecDoc[] {
  return docs.filter(d => d.meta?.[metaKey] === metaValue);
}

/**
 * Search by text and metadata
 *
 * @param q - Text query
 * @param metaFilter - Metadata filter
 * @param topK - Number of results
 * @returns Matching documents
 */
export function searchVecAdvanced(
  q: string,
  metaFilter?: Record<string, any>,
  topK: number = 8
): VecDoc[] {
  let results = docs;

  // Filter by text
  if (q) {
    const lowerQ = q.toLowerCase();
    results = results.filter(d => d.text.toLowerCase().includes(lowerQ));
  }

  // Filter by metadata
  if (metaFilter) {
    for (const [key, value] of Object.entries(metaFilter)) {
      results = results.filter(d => d.meta?.[key] === value);
    }
  }

  return results.slice(0, topK);
}

/**
 * Batch upsert documents
 *
 * @param docs - Documents to upsert
 */
export function batchUpsertVec(docs: VecDoc[]): void {
  docs.forEach(d => upsertVec(d));
}

/**
 * Export vector memory as JSON
 *
 * @returns JSON string
 */
export function exportVecDocs(): string {
  return JSON.stringify(docs, null, 2);
}

/**
 * Import vector memory from JSON
 *
 * @param json - JSON string
 */
export function importVecDocs(json: string): void {
  try {
    const imported = JSON.parse(json) as VecDoc[];
    if (Array.isArray(imported)) {
      docs = imported;
    }
  } catch (err) {
    console.error("[Vector] Failed to import documents:", err);
  }
}

/**
 * Get vector memory info
 *
 * @returns Info about vector memory
 */
export function getVecMemoryInfo(): {
  docCount: number;
  totalSize: number;
  avgDocSize: number;
} {
  const totalSize = JSON.stringify(docs).length;
  const avgDocSize = docs.length > 0 ? totalSize / docs.length : 0;

  return {
    docCount: docs.length,
    totalSize,
    avgDocSize
  };
}

/**
 * Deduplicate documents by ID
 *
 * @returns Number of duplicates removed
 */
export function deduplicateVecDocs(): number {
  const seen = new Set<string>();
  const before = docs.length;

  docs = docs.filter(d => {
    if (seen.has(d.id)) {
      return false;
    }
    seen.add(d.id);
    return true;
  });

  return before - docs.length;
}

