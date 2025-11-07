/**
 * Mind Mapping Framework
 * Stateful framework that guides the primary agent through visual organization of ideas and concepts
 * Based on Sequential Thinking pattern
 */

import { CognitiveFramework, type FrameworkInit, type FrameworkStepInput } from '../lib/framework-base.js';
import type { ServerContext } from '../lib/context.js';

class MindMappingFramework extends CognitiveFramework {
  protected frameworkName = 'framework_mind_mapping';
  protected frameworkDescription = 'Visual organization of ideas and concepts';
  
  protected formatInitResponse(
    problem: string,
    context: string,
    totalSteps: number,
    evidence: any[]
  ): string {
    return `# Mind Mapping Framework - Session Initialized

**Problem:** ${problem}
**Context:** ${context || 'None provided'}
**Total Steps:** ${totalSteps}
**Evidence Gathered:** ${evidence.length} items

## Evidence from Codebase

${evidence.slice(0, 5).map((e, i) => `${i + 1}. **${e.path}** (relevance: ${e.score.toFixed(2)})
   \`\`\`
   ${e.snippet.slice(0, 200)}...
   \`\`\``).join('\n\n')}

${evidence.length > 5 ? `\n*...and ${evidence.length - 5} more items*` : ''}

## Framework Guide

Use this framework to systematically analyze through ${totalSteps} steps:

**Suggested Approach:**
1. **Central Concept** - What is the main idea?
2. **Main Branches** - What are the key themes?
3. **Sub-Branches** - What details support each theme?
4. **Connections** - How do ideas relate across branches?

For each step, provide:
- Step number
- Your analysis for this step
- Whether another step is needed

The framework will track your progress and maintain context.
`;
  }
}

const framework = new MindMappingFramework();

// Use camelCase for exports to match import convention
const camelName = 'mind_mapping'.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());

export const mindMappingDescriptor = {
  name: 'framework_mind_mapping',
  description: 'Visual organization of ideas and concepts. Stateful framework that guides you through systematic analysis.',
  inputSchema: {
    type: 'object' as const,
    additionalProperties: false,
    properties: {
      problem: { type: 'string' as const, description: 'The problem or question to analyze' },
      context: { type: 'string' as const, description: 'Additional context' },
      totalSteps: { type: 'number' as const, description: 'Expected number of steps (default: 4)' },
      stepNumber: { type: 'number' as const, description: 'Current step number (for recording steps)' },
      content: { type: 'string' as const, description: 'Your analysis for this step' },
      nextStepNeeded: { type: 'boolean' as const, description: 'Whether another step is needed' },
      metadata: { type: 'object' as const, description: 'Optional metadata', additionalProperties: true }
    }
  }
};

export async function mindMappingTool(args: any, ctx: ServerContext): Promise<any> {
  return framework.handle(args, ctx);
}
