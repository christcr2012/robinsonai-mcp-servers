/**
 * Context7 Adapter Tool
 * Pull results from Context 7 (HTTP or file) and import them as evidence
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import type { ServerContext } from '../lib/context.js';
import { ctxImportEvidenceTool } from './ctx_import_evidence.js';

/**
 * Context7 adapter tool implementation
 */
export async function context7AdapterTool(
  args: { from?: 'http' | 'file'; url?: string; file?: string; group?: string },
  ctx: ServerContext
) {
  let payload: any;

  if (args.from === 'http') {
    const url = args.url ?? process.env.CONTEXT7_URL;
    if (!url) {
      return {
        content: [
          {
            type: 'text',
            text: 'Missing url for Context 7. Provide url argument or set CONTEXT7_URL environment variable.',
          },
        ],
      };
    }

    try {
      const res = await fetch(url);
      if (!res.ok) {
        const errorText = await res.text();
        return {
          content: [
            {
              type: 'text',
              text: `HTTP ${res.status}: ${errorText}`,
            },
          ],
        };
      }
      payload = await res.json();
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Failed to fetch from ${url}: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  } else {
    // Default to file
    const file =
      args.file ??
      process.env.CONTEXT7_FILE ??
      path.join(ctx.workspaceRoot, '.context7.json');

    try {
      const buf = await fs.readFile(file, 'utf8');
      payload = JSON.parse(buf);
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Failed to read file ${file}: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }

  // Normalize: expect array of items; try common shapes
  const items = Array.isArray(payload?.items)
    ? payload.items
    : Array.isArray(payload)
      ? payload
      : [];

  const normalized = items.map((x: any) => ({
    source: 'context7',
    title: x.title ?? x.name ?? '',
    snippet: x.snippet ?? x.summary ?? x.text ?? '',
    uri: x.uri ?? x.url ?? x.link ?? '',
    score: x.score ?? x.rank ?? undefined,
    tags: x.tags ?? [],
    raw: x,
  }));

  return await ctxImportEvidenceTool(
    { items: normalized, group: args.group ?? 'external/context7' },
    ctx
  );
}

/**
 * Tool descriptor for registration
 */
export const context7AdapterDescriptor = {
  name: 'context7_adapter',
  description:
    'Pull results from Context 7 (HTTP endpoint or JSON file) and import them as evidence. Automatically normalizes common Context 7 response formats.',
  inputSchema: {
    type: 'object',
    properties: {
      from: {
        type: 'string',
        enum: ['http', 'file'],
        description: 'Source type: http (fetch from URL) or file (read JSON file)',
        default: 'file',
      },
      url: {
        type: 'string',
        description:
          'HTTP URL to fetch from (or set CONTEXT7_URL environment variable)',
      },
      file: {
        type: 'string',
        description:
          'File path to read from (default: .context7.json in workspace root, or set CONTEXT7_FILE environment variable)',
      },
      group: {
        type: 'string',
        description: 'Evidence group name (default: "external/context7")',
      },
    },
  },
};

