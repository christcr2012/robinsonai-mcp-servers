/**
 * Scenario Planning Framework
 * Stateful framework that guides the primary agent through explore multiple possible futures
 * Based on Sequential Thinking pattern
 */

import { CognitiveFramework, type FrameworkInit, type FrameworkStepInput } from '../lib/framework-base.js';
import type { ServerContext } from '../lib/context.js';

class ScenarioPlanningFramework extends CognitiveFramework {
  protected frameworkName = 'framework_scenario_planning';
  protected frameworkDescription = 'Explore multiple possible futures';
  
  protected formatInitResponse(
    problem: string,
    context: string,
    totalSteps: number,
    evidence: any[]
  ): string {
    return `# Scenario Planning Framework - Session Initialized

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
1. **Identify Uncertainties** - What key factors are uncertain?
2. **Create Scenarios** - What are plausible future states?
3. **Analyze Implications** - What happens in each scenario?
4. **Plan Responses** - How will you adapt to each scenario?

For each step, provide:
- Step number
- Your analysis for this step
- Whether another step is needed

The framework will track your progress and maintain context.
`;
  }
}

const framework = new ScenarioPlanningFramework();

// Use camelCase for exports to match import convention
const camelName = 'scenario_planning'.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());

export const scenarioPlanningDescriptor = {
  name: 'framework_scenario_planning',
  description: 'Explore multiple possible futures. Stateful framework that guides you through systematic analysis.',
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

export async function scenarioPlanningTool(args: any, ctx: ServerContext): Promise<any> {
  return framework.handle(args, ctx);
}
