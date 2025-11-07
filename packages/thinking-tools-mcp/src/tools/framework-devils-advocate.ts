/**
 * Devil's Advocate Framework
 * Stateful framework that guides the primary agent through challenging assumptions
 * Based on Sequential Thinking pattern
 */

import { CognitiveFramework, type FrameworkInit, type FrameworkStepInput } from '../lib/framework-base.js';
import type { ServerContext } from '../lib/context.js';

class DevilsAdvocateFramework extends CognitiveFramework {
  protected frameworkName = 'framework_devils_advocate';
  protected frameworkDescription = 'Challenge assumptions and find flaws in plans, ideas, or arguments';
  
  /**
   * Custom initialization for Devil's Advocate
   * Adds specific prompts for challenging assumptions
   */
  protected formatInitResponse(
    problem: string,
    context: string,
    totalSteps: number,
    evidence: any[]
  ): string {
    return `# Devil's Advocate Framework - Session Initialized

**Problem/Plan to Challenge:** ${problem}
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

Use this framework to systematically challenge the plan/idea through ${totalSteps} steps:

**Suggested Approach:**
1. **Identify Core Assumptions** - What assumptions is this plan based on?
2. **Challenge Each Assumption** - What could make each assumption wrong?
3. **Identify Hidden Risks** - What risks aren't being considered?
4. **Generate Counter-Arguments** - What are the strongest arguments against this?
5. **Recommend Mitigations** - How can identified risks be addressed?

For each step, provide:
- Step number
- Your challenge/analysis
- Whether another step is needed

The framework will track your progress and maintain context.
`;
  }
  
  /**
   * Custom step formatting for Devil's Advocate
   */
  protected formatStepResponse(
    step: any,
    history: any[],
    nextStepNeeded: boolean
  ): string {
    return `# Devil's Advocate - Step ${step.stepNumber}

**Challenge:** ${step.content}

## Progress

${history.map((s, i) => `### Step ${s.stepNumber}
${s.content}
`).join('\n')}

## Session Metadata

\`\`\`json
${JSON.stringify({
  stepNumber: step.stepNumber,
  totalSteps: history.length,
  nextStepNeeded,
  challengesIdentified: history.length,
  timestamp: step.timestamp,
}, null, 2)}
\`\`\`

${nextStepNeeded ? '\n**Ready for next challenge step.**' : '\n**✅ Devil\'s Advocate session complete.**'}
`;
  }
  
  /**
   * Custom logging for Devil's Advocate
   */
  protected logStep(step: any, nextStepNeeded: boolean): void {
    console.error(`\n🔴 [Devil's Advocate] Step ${step.stepNumber}`);
    console.error(`Challenge: ${step.content.slice(0, 100)}${step.content.length > 100 ? '...' : ''}`);
    console.error(`Next: ${nextStepNeeded ? 'Yes' : 'Complete'}`);
    console.error('---');
  }
}

// Create singleton instance
const framework = new DevilsAdvocateFramework();

// Export descriptor for registry
export const devilsAdvocateDescriptor = {
  name: 'framework_devils_advocate',
  description: 'Challenge assumptions and find flaws in plans. Stateful framework that guides you through systematic analysis.',
  inputSchema: {
    type: 'object' as const,
    additionalProperties: false,
    properties: {
      // Initialization parameters
      problem: {
        type: 'string' as const,
        description: 'The plan, idea, or argument to challenge'
      },
      context: {
        type: 'string' as const,
        description: 'Additional context about the problem'
      },
      totalSteps: {
        type: 'number' as const,
        description: 'Expected number of challenge steps (default: 5)'
      },
      
      // Step recording parameters
      stepNumber: {
        type: 'number' as const,
        description: 'Current step number (for recording steps)'
      },
      content: {
        type: 'string' as const,
        description: 'Your challenge/analysis for this step'
      },
      nextStepNeeded: {
        type: 'boolean' as const,
        description: 'Whether another step is needed'
      },
      metadata: {
        type: 'object' as const,
        description: 'Optional metadata for this step',
        additionalProperties: true
      }
    }
  }
};

// Export handler
export async function devilsAdvocateTool(args: any, ctx: ServerContext): Promise<any> {
  return framework.handle(args, ctx);
}

