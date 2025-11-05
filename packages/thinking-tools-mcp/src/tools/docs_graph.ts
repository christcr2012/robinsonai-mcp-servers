import type { ServerContext } from '../lib/context.js';
import { loadDocs } from '../context/store.js';

export const docsGraphDescriptor = {
  name: 'docs_graph',
  description: 'Generate timeline graph of documentation (nodes=docs by date, edges=links). Returns Mermaid diagram.',
  inputSchema: {
    type: 'object',
    properties: {
      type: { type: 'string', description: 'Filter by doc type (optional)' },
      format: { type: 'string', enum: ['mermaid', 'json'], description: 'Output format (default: mermaid)' }
    }
  }
};

export async function docsGraphTool(
  args: { type?: string; format?: 'mermaid' | 'json' },
  ctx: ServerContext
) {
  await ctx.ctx.waitForIndex();
  const docs = loadDocs();

  // Filter by type if specified
  const filtered = args.type
    ? docs.filter(d => d.type === args.type)
    : docs;

  // Sort by date
  const sorted = filtered.sort((a, b) => {
    const dateA = a.date ? Date.parse(a.date) : 0;
    const dateB = b.date ? Date.parse(b.date) : 0;
    return dateA - dateB;
  });

  // Build graph
  const nodes = sorted.map((d, i) => ({
    id: `doc${i}`,
    uri: d.uri,
    title: d.title,
    type: d.type,
    status: d.status,
    date: d.date
  }));

  const edges: Array<{ from: string; to: string; kind: string }> = [];

  // Extract links between docs
  for (let i = 0; i < sorted.length; i++) {
    const doc = sorted[i];
    for (const link of doc.links ?? []) {
      // Find target doc
      const targetIdx = sorted.findIndex(d => d.uri === link.ref || d.uri.endsWith(link.ref));
      if (targetIdx >= 0) {
        edges.push({
          from: `doc${i}`,
          to: `doc${targetIdx}`,
          kind: link.kind
        });
      }
    }
  }

  if (args.format === 'json') {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ nodes, edges }, null, 2)
      }]
    };
  }

  // Generate Mermaid diagram
  const mermaid = generateMermaidTimeline(nodes, edges);

  return {
    content: [{
      type: 'text',
      text: `# Documentation Timeline Graph\n\n\`\`\`mermaid\n${mermaid}\n\`\`\``
    }]
  };
}

function generateMermaidTimeline(
  nodes: Array<{ id: string; title: string; type: string; status?: string; date?: string }>,
  edges: Array<{ from: string; to: string; kind: string }>
): string {
  const lines: string[] = ['graph TD'];

  // Add nodes with styling
  for (const n of nodes) {
    const label = `${n.type.toUpperCase()}: ${n.title}`;
    const statusIcon = n.status === 'done' ? '✓' : n.status === 'deprecated' ? '✗' : '○';
    const dateStr = n.date ? ` (${n.date})` : '';
    lines.push(`  ${n.id}["${statusIcon} ${label}${dateStr}"]`);

    // Style by status
    if (n.status === 'done') {
      lines.push(`  style ${n.id} fill:#90EE90`);
    } else if (n.status === 'deprecated') {
      lines.push(`  style ${n.id} fill:#FFB6C1`);
    } else if (n.status === 'in-progress') {
      lines.push(`  style ${n.id} fill:#FFD700`);
    }
  }

  // Add edges
  for (const e of edges) {
    const arrow = e.kind === 'code' ? '-.->|code|' : '-->|link|';
    lines.push(`  ${e.from} ${arrow} ${e.to}`);
  }

  return lines.join('\n');
}

