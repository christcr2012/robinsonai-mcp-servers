/**
 * Sequential Thinking Tool
 * Break down complex problems into sequential thought steps
 * Supports revisions, branching, and dynamic thought adjustment
 */

interface ThoughtStep {
  thoughtNumber: number;
  thought: string;
  nextThoughtNeeded: boolean;
  isRevision?: boolean;
  revisesThought?: number;
  branchId?: string;
  branchFromThought?: number;
}

// Global state for thought history (persists across calls)
const thoughtHistory: ThoughtStep[] = [];
const branches: Map<string, ThoughtStep[]> = new Map();

export async function sequentialThinking(args: any): Promise<any> {
  const step: ThoughtStep = {
    thoughtNumber: args.thoughtNumber,
    thought: args.thought,
    nextThoughtNeeded: args.nextThoughtNeeded,
    isRevision: args.isRevision,
    revisesThought: args.revisesThought,
    branchId: args.branchId,
    branchFromThought: args.branchFromThought,
  };

  thoughtHistory.push(step);

  // If this is a branch, track it separately
  if (args.branchId) {
    if (!branches.has(args.branchId)) {
      branches.set(args.branchId, []);
    }
    branches.get(args.branchId)!.push(step);
  }

  const response = {
    thoughtNumber: step.thoughtNumber,
    totalThoughts: args.totalThoughts,
    nextThoughtNeeded: step.nextThoughtNeeded,
    thoughtHistoryLength: thoughtHistory.length,
    branches: Array.from(branches.keys()),
    isRevision: step.isRevision,
    revisesThought: step.revisesThought,
    summary: `Thought ${step.thoughtNumber}/${args.totalThoughts} recorded. ${step.nextThoughtNeeded ? 'Continue thinking.' : 'Thinking complete.'}`,
  };

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(response, null, 2),
      },
    ],
  };
}

