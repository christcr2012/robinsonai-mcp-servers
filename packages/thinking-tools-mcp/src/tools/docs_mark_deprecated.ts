import fs from 'node:fs';
import path from 'node:path';
import type { ServerContext } from '../lib/context.js';
import { resolveWorkspaceRoot } from '../lib/workspace.js';

export const docsMarkDeprecatedDescriptor = {
  name: 'docs_mark_deprecated',
  description: 'Mark documentation files as deprecated by adding/updating YAML front-matter',
  inputSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      files: { type: 'array', items: { type: 'string' }, description: 'File paths to mark as deprecated' },
      reason: { type: 'string', description: 'Deprecation reason (optional)' },
      replacedBy: { type: 'string', description: 'Path to replacement doc (optional)' }
    },
    required: ['files']
  }
};

function updateFrontmatter(content: string, updates: Record<string, string>): string {
  const hasFrontmatter = content.startsWith('---\n');

  if (hasFrontmatter) {
    // Update existing frontmatter
    const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!match) return content;

    const [, fm, body] = match;
    const lines = fm.split('\n');
    const updated = new Map<string, string>();

    // Parse existing
    for (const line of lines) {
      const m = line.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
      if (m) updated.set(m[1], m[2]);
    }

    // Apply updates
    for (const [k, v] of Object.entries(updates)) {
      updated.set(k, v);
    }

    // Rebuild
    const newFm = Array.from(updated.entries())
      .map(([k, v]) => `${k}: ${v}`)
      .join('\n');

    return `---\n${newFm}\n---\n${body}`;
  } else {
    // Add new frontmatter
    const fm = Object.entries(updates)
      .map(([k, v]) => `${k}: ${v}`)
      .join('\n');

    return `---\n${fm}\n---\n\n${content}`;
  }
}

export async function docsMarkDeprecatedTool(
  args: { files: string[]; reason?: string; replacedBy?: string },
  ctx: ServerContext
) {
  const root = resolveWorkspaceRoot();
  const results: any[] = [];

  for (const file of args.files) {
    try {
      const fullPath = path.isAbsolute(file) ? file : path.join(root, file);

      if (!fs.existsSync(fullPath)) {
        results.push({ file, ok: false, error: 'File not found' });
        continue;
      }

      const content = fs.readFileSync(fullPath, 'utf8');
      const updates: Record<string, string> = {
        status: 'deprecated',
        deprecated_date: new Date().toISOString().split('T')[0]
      };

      if (args.reason) updates.deprecated_reason = args.reason;
      if (args.replacedBy) updates.replaced_by = args.replacedBy;

      const updated = updateFrontmatter(content, updates);
      fs.writeFileSync(fullPath, updated, 'utf8');

      results.push({ file, ok: true, updates });
    } catch (error: any) {
      results.push({ file, ok: false, error: error.message });
    }
  }

  return { content: [{ type: 'text', text: JSON.stringify(results, null, 2) }] };
}

