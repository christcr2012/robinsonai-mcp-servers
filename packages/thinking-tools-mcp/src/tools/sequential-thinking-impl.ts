/**
 * Real Sequential Thinking Implementation
 * Stateful, supports branching, revisions, and history
 */

import { ServerContext } from '../lib/context.js';

export interface ThoughtStep {
  thoughtNumber: number;
  thought: string;
  nextThoughtNeeded: boolean;
  isRevision?: boolean;
  revisesThought?: number;
  branchId?: string;
  branchFromThought?: number;
  timestamp: number;
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
 * Sequential thinking tool - stateful implementation
 */
export async function sequentialThinkingTool(args: any, ctx: ServerContext): Promise<any> {
  // Get or initialize thought history
  const history = ctx.stateGet<ThoughtStep[]>('seqThinking_history') ?? [];
  
  const step: ThoughtStep = {
    thoughtNumber: args.thoughtNumber,
    thought: args.thought,
    nextThoughtNeeded: args.nextThoughtNeeded,
    isRevision: args.isRevision,
    revisesThought: args.revisesThought,
    branchId: args.branchId,
    branchFromThought: args.branchFromThought,
    timestamp: Date.now(),
  };

  // Handle revision
  if (args.isRevision && args.revisesThought) {
    const revisedIndex = history.findIndex((s) => s.thoughtNumber === args.revisesThought);
    if (revisedIndex >= 0) {
      // Mark as revised
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

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          thoughtNumber: args.thoughtNumber,
          totalThoughts: args.totalThoughts,
          nextThoughtNeeded: args.nextThoughtNeeded,
          branches: branches.map((b) => b.branchId),
          thoughtHistoryLength: history.length,
        }, null, 2),
      },
    ],
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

