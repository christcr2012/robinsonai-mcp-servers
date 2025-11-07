/**
 * Context Import Evidence Tool
 * Import external search/graph results (e.g., Context 7) into the unified evidence store
 */

import crypto from 'node:crypto';
import type { ServerContext } from '../lib/context.js';

export type EvidenceItem = {
  source?: string;
  title?: string;
  snippet?: string;
  uri?: string;
  score?: number;
  tags?: string[];
  raw?: any;
};

/**
 * Generate stable ID from evidence item
 */
function stableId(x: unknown): string {
  const obj = x as any;
  const keys = Object.keys(obj).sort();
  const sorted: any = {};
  for (const k of keys) {
    sorted[k] = obj[k];
  }
  const json = JSON.stringify(sorted);
  return crypto.createHash('sha1').update(json).digest('hex');
}

/**
 * Import evidence tool implementation
 */
export async function ctxImportEvidenceTool(
  args: { items?: EvidenceItem[]; group?: string; upsert?: boolean },
  ctx: ServerContext
) {
  const items = args.items ?? [];
  const group = args.group ?? 'external';
  const upsert = args.upsert ?? true;

  if (!items.length) {
    return { content: [{ type: 'text', text: 'No items provided.' }] };
  }

  let imported = 0;
  for (const it of items) {
    const rec = {
      id: stableId({
        source: it.source ?? 'external',
        uri: it.uri,
        title: it.title,
        snippet: it.snippet,
        raw: it.raw,
      }),
      source: it.source ?? 'external',
      title: it.title ?? '',
      snippet: it.snippet ?? '',
      uri: it.uri ?? '',
      score: it.score ?? undefined,
      tags: it.tags ?? [],
      group,
      raw: it.raw ?? null,
      timestamp: Date.now(),
      data: {
        title: it.title,
        snippet: it.snippet,
        uri: it.uri,
        score: it.score,
      },
    };

    if (upsert) {
      await ctx.evidence.upsert(rec.id, rec);
    } else {
      await ctx.evidence.add(rec.source, rec.data, {
        title: rec.title,
        snippet: rec.snippet,
        uri: rec.uri,
        score: rec.score,
        tags: rec.tags,
        group: rec.group,
        raw: rec.raw,
      });
    }
    imported++;
  }

  return {
    content: [
      {
        type: 'text',
        text: `Imported ${imported} item(s) into evidence group "${group}".`,
      },
    ],
  };
}

/**
 * Tool descriptor for registration
 */
export const ctxImportEvidenceDescriptor = {
  name: 'ctx_import_evidence',
  description:
    'Import external search/graph results (e.g., Context 7) into the unified evidence store for downstream thinking tools.',
  inputSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      items: {
        type: 'array',
        description: 'Array of evidence items to import',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            source: {
              type: 'string',
              description: 'Source identifier (e.g., "context7")',
            },
            title: { type: 'string', description: 'Item title' },
            snippet: { type: 'string', description: 'Content snippet' },
            uri: { type: 'string', description: 'URI or file path' },
            score: { type: 'number', description: 'Relevance score' },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Tags for categorization',
            },
            raw: {
              oneOf: [
                { type: 'object' },
                { type: 'array' },
                { type: 'string' },
                { type: 'number' },
                { type: 'boolean' },
                { type: 'null' }
              ],
              description: 'Original object',
            },
          },
        },
      },
      group: {
        type: 'string',
        description: 'Logical bucket name (default: "external")',
      },
      upsert: {
        type: 'boolean',
        description: 'Avoid duplicates by id-hash (default: true)',
      },
    },
  }
};

