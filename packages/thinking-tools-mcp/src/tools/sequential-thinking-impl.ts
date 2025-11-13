/**
 * Enhanced Sequential Thinking Implementation
 * COMBINES: Stateful thinking + Evidence-driven analysis
 * Features:
 * - Maintains thought history across calls (stateful)
 * - Gathers evidence from repo + web (evidence-driven)
 * - Supports branching, revisions, and reflections
 * - Returns structured Markdown reports
 */

import { ServerContext } from '../lib/context.js';
import { webSearchAll } from '../lib/websearch.js';

export interface ThoughtStep {
  thoughtNumber: number;
  thought: string;
  nextThoughtNeeded: boolean;
  isRevision?: boolean;
  revisesThought?: number;
  branchId?: string;
  branchFromThought?: number;
  timestamp: number;
  evidence?: any[]; // Evidence gathered for this thought
}

export interface ParallelBranch {
  branchId: string;
  description: string;
  thoughts: ThoughtStep[];
  conclusion?: string;
}

export interface ReflectionPoint {
  thoughtNumber: number;
  reflection: string;
  improvements: string[];
  confidence: number;
}

/**
 * Sequential thinking tool - ENHANCED with evidence gathering
 *
 * Usage:
 * 1. First call with 'problem' - gathers evidence and initializes session
 * 2. Subsequent calls with 'thought' + 'thoughtNumber' - records thinking steps
 * 3. Returns structured Markdown with thought history + evidence
 */
export async function sequentialThinkingTool(args: any, ctx: ServerContext): Promise<any> {
  // CASE 1: Initialize new thinking session with evidence gathering
  if (args.problem && !args.thought) {
    const problem = args.problem;
    const steps = args.steps || 5;
    const useWeb = args.useWeb ?? false;
    // PERFORMANCE FIX: Limit k to max 4 to reduce evidence gathering
    const k = Math.max(1, Math.min(4, args.k ?? 2));

    // PERFORMANCE FIX: Limit variants to reduce hybrid queries
    // Only use the original problem, not all variants
    const variants = [problem]; // Reduced from 6 variants to 1

    const hits: any[] = [];
    for (const v of variants) {
      try {
        // PERFORMANCE FIX: Use smaller k per variant
        const results = await ctx.blendedSearch(v, k);
        hits.push(...results);
      } catch (e) {
        // Continue if search fails
      }
    }

    // Optional web evidence
    if (useWeb) {
      try {
        const webResults = await webSearchAll(problem);
        hits.push(...webResults.slice(0, Math.ceil(k / 2)).map(r => ({
          source: "web",
          title: r.title,
          uri: r.url, // WebHit uses 'url' not 'uri'
          snippet: r.snippet || "",
          score: r.score,
          tags: ["web"]
        })));
      } catch (e) {
        // Continue if web search fails
      }
    }

    // Deduplicate evidence
    const uniqueEvidence = Array.from(
      new Map(hits.map(h => [String(h.uri || h.path || h.file || h.id || Math.random()), h])).values()
    ).slice(0, k);

    // Initialize state
    ctx.stateSet('seqThinking_problem', problem);
    ctx.stateSet('seqThinking_steps', steps);
    ctx.stateSet('seqThinking_evidence', uniqueEvidence);
    ctx.stateSet('seqThinking_history', []);

    // Categorize evidence
    const code = uniqueEvidence.filter(h => /\.(ts|tsx|js|jsx|py|go|java|rs)$/i.test(String(h.uri || h.file || "")));
    const docs = uniqueEvidence.filter(h => !/\.(ts|tsx|js|jsx|py|go|java|rs)$/i.test(String(h.uri || h.file || "")));

    const md = [
      `# Sequential Thinking: ${problem}`,
      "",
      `## Evidence Gathered`,
      `- **Total items:** ${uniqueEvidence.length}`,
      `- **Code files:** ${code.length}`,
      `- **Documentation:** ${docs.length}`,
      `- **Web sources:** ${uniqueEvidence.filter(e => e.source === 'web').length}`,
      "",
      `## Evidence Details`,
      ...uniqueEvidence.map(e => `- **${e.title || e.file || e.path || 'Evidence'}** ${e.uri ? `(${e.uri})` : ''}`),
      "",
      `## Next Steps`,
      `Continue the analysis by providing your thoughts step-by-step:`,
      `- Use 'thought', 'thoughtNumber', 'totalThoughts', and 'nextThoughtNeeded' parameters`,
      `- The evidence above will be available for all subsequent thoughts`,
      `- You can revise previous thoughts using 'isRevision' and 'revisesThought'`,
      `- You can create branches using 'branchId' and 'branchFromThought'`,
      "",
      `## Thought History`,
      `(No thoughts yet - start by providing your first thought)`
    ].join("\n");

    return {
      content: [{ type: 'text', text: md }]
    };
  }

  // CASE 2: Record a thought step
  if (args.thought && args.thoughtNumber !== undefined) {
    const history = ctx.stateGet<ThoughtStep[]>('seqThinking_history') ?? [];
    const evidence = ctx.stateGet<any[]>('seqThinking_evidence') ?? [];
    const problem = ctx.stateGet<string>('seqThinking_problem') || 'Analysis';

    const step: ThoughtStep = {
      thoughtNumber: args.thoughtNumber,
      thought: args.thought,
      nextThoughtNeeded: args.nextThoughtNeeded ?? true,
      isRevision: args.isRevision,
      revisesThought: args.revisesThought,
      branchId: args.branchId,
      branchFromThought: args.branchFromThought,
      timestamp: Date.now(),
      evidence: evidence.slice(0, 5) // Store reference to top evidence
    };

    // Handle revision
    if (args.isRevision && args.revisesThought) {
      const revisedIndex = history.findIndex((s) => s.thoughtNumber === args.revisesThought);
      if (revisedIndex >= 0) {
        history[revisedIndex] = { ...history[revisedIndex], isRevision: true };
      }
    }

    // Add to history
    history.push(step);
    ctx.stateSet('seqThinking_history', history);

    // Add to evidence store
    await ctx.ctx.evidence.add('sequential_thinking', {
      step: args.thought,
      thoughtNumber: args.thoughtNumber,
      meta: {
        nextNeeded: args.nextThoughtNeeded,
        isRevision: args.isRevision,
        branchId: args.branchId,
      },
    });

    // Get branches if any
    const branches = ctx.stateGet<ParallelBranch[]>('seqThinking_branches') ?? [];

    // Build structured Markdown response
    const md = [
      `# Sequential Thinking: ${problem}`,
      "",
      `## Thought History (${history.length} thoughts)`,
      ...history.map(h => {
        const prefix = h.isRevision ? `🔄 Revision of #${h.revisesThought}` :
          h.branchId ? `🌿 Branch ${h.branchId}` :
            `💭 Thought ${h.thoughtNumber}`;
        return `### ${prefix}\n${h.thought}\n`;
      }),
      "",
      `## Status`,
      `- **Current thought:** ${args.thoughtNumber}/${args.totalThoughts || '?'}`,
      `- **Next thought needed:** ${args.nextThoughtNeeded ? 'Yes' : 'No'}`,
      `- **Branches:** ${new Set(history.filter(h => h.branchId).map(h => h.branchId)).size}`,
      `- **Revisions:** ${history.filter(h => h.isRevision).length}`,
      "",
      `## Evidence (${evidence.length} items)`,
      ...evidence.slice(0, 10).map(e => `- **${e.title || e.file || e.path || 'Evidence'}** ${e.uri ? `(${e.uri})` : ''}`),
      evidence.length > 10 ? `\n_...and ${evidence.length - 10} more items_` : ''
    ].join("\n");

    return {
      content: [{ type: 'text', text: md }]
    };
  }

  // CASE 3: Error - invalid arguments
  return {
    content: [{
      type: 'text',
      text: "Error: Please provide either 'problem' (to start new analysis) or 'thought' + 'thoughtNumber' (to continue existing analysis)"
    }]
  };
}

/**
 * Parallel thinking tool - explore multiple solution paths
 */
export async function parallelThinkingTool(args: any, ctx: ServerContext): Promise<any> {
  const branches = ctx.stateUpdate<ParallelBranch[]>('seqThinking_branches', (current) => {
    const existing = current ?? [];
    const branchIndex = existing.findIndex((b) => b.branchId === args.branchId);

    const thought: ThoughtStep = {
      thoughtNumber: args.thoughtNumber,
      thought: args.thought,
      nextThoughtNeeded: args.nextThoughtNeeded,
      timestamp: Date.now(),
    };

    if (branchIndex >= 0) {
      // Update existing branch
      existing[branchIndex].thoughts.push(thought);
      if (args.conclusion) {
        existing[branchIndex].conclusion = args.conclusion;
      }
    } else {
      // Create new branch
      existing.push({
        branchId: args.branchId,
        description: args.description,
        thoughts: [thought],
        conclusion: args.conclusion,
      });
    }

    return existing;
  });

  // Add to evidence
  await ctx.ctx.evidence.add('parallel_thinking', {
    branchId: args.branchId,
    thought: args.thought,
    thoughtNumber: args.thoughtNumber,
  });

  const currentBranch = branches.find((b) => b.branchId === args.branchId);

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          branchId: args.branchId,
          thoughtNumber: args.thoughtNumber,
          nextThoughtNeeded: args.nextThoughtNeeded,
          totalBranches: branches.length,
          branchThoughts: currentBranch?.thoughts.length ?? 0,
          conclusion: currentBranch?.conclusion,
        }, null, 2),
      },
    ],
  };
}

/**
 * Reflective thinking tool - review and critique previous thoughts
 */
export async function reflectiveThinkingTool(args: any, ctx: ServerContext): Promise<any> {
  const reflections = ctx.stateUpdate<ReflectionPoint[]>('seqThinking_reflections', (current) => {
    const existing = current ?? [];
    existing.push({
      thoughtNumber: args.thoughtNumber,
      reflection: args.reflection,
      improvements: args.improvements,
      confidence: args.confidence,
    });
    return existing;
  });

  // Add to evidence
  await ctx.ctx.evidence.add('reflective_thinking', {
    thoughtNumber: args.thoughtNumber,
    reflection: args.reflection,
    improvements: args.improvements,
    confidence: args.confidence,
  });

  // Get the thought being reflected on
  const history = ctx.stateGet<ThoughtStep[]>('seqThinking_history') ?? [];
  const targetThought = history.find((s) => s.thoughtNumber === args.thoughtNumber);

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          thoughtNumber: args.thoughtNumber,
          reflection: args.reflection,
          improvements: args.improvements,
          confidence: args.confidence,
          totalReflections: reflections.length,
          originalThought: targetThought?.thought,
        }, null, 2),
      },
    ],
  };
}

