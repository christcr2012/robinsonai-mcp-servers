// packages/thinking-tools-mcp/src/lib/framework-base.ts
import type { ServerContext } from './context.js';

/**
 * Base interface for all cognitive framework steps
 */
export interface FrameworkStep {
  stepNumber: number;
  content: string;
  timestamp: number;
  evidence?: any[];
  metadata?: Record<string, any>;
}

/**
 * Base interface for framework initialization
 */
export interface FrameworkInit {
  problem: string;
  context?: string;
  evidence?: any[];
  totalSteps?: number;
}

/**
 * Base interface for framework step input
 */
export interface FrameworkStepInput {
  stepNumber: number;
  content: string;
  nextStepNeeded: boolean;
  metadata?: Record<string, any>;
}

/**
 * Base class for all stateful cognitive frameworks
 * 
 * Pattern based on Sequential Thinking:
 * 1. Initialize session with evidence gathering
 * 2. Track state across calls
 * 3. Guide agent through framework steps
 * 4. Return metadata, not analysis
 * 5. Log formatted output to stderr
 */
export abstract class CognitiveFramework {
  protected abstract frameworkName: string;
  protected abstract frameworkDescription: string;
  
  /**
   * Initialize a new thinking session
   * Gathers evidence using blendedSearch and sets up state
   */
  async initialize(args: FrameworkInit, ctx: ServerContext): Promise<string> {
    const { problem, context = '', totalSteps = 5 } = args;
    
    // Gather evidence using blendedSearch (repo + imported context)
    let uniqueEvidence: any[] = [];
    if (args.evidence) {
      uniqueEvidence = args.evidence;
    } else {
      const query = `${problem} ${context}`.slice(0, 200);
      try {
        const results = await ctx.blendedSearch(query, 12);
        uniqueEvidence = results.map((r: any) => ({
          path: r.path || r.uri || 'unknown',
          snippet: r.snippet || r.text || '',
          score: r.score || 0,
        }));
      } catch (error) {
        console.error(`[${this.frameworkName}] Evidence gathering failed:`, error);
      }
    }
    
    // Initialize state
    ctx.stateSet(`${this.frameworkName}_problem`, problem);
    ctx.stateSet(`${this.frameworkName}_context`, context);
    ctx.stateSet(`${this.frameworkName}_totalSteps`, totalSteps);
    ctx.stateSet(`${this.frameworkName}_evidence`, uniqueEvidence);
    ctx.stateSet(`${this.frameworkName}_history`, []);
    
    // Return structured Markdown with evidence
    return this.formatInitResponse(problem, context, totalSteps, uniqueEvidence);
  }
  
  /**
   * Record a step in the thinking process
   */
  async recordStep(args: FrameworkStepInput, ctx: ServerContext): Promise<string> {
    const { stepNumber, content, nextStepNeeded, metadata = {} } = args;
    
    const history = ctx.stateGet<FrameworkStep[]>(`${this.frameworkName}_history`) ?? [];
    
    const step: FrameworkStep = {
      stepNumber,
      content,
      timestamp: Date.now(),
      metadata,
    };
    
    history.push(step);
    ctx.stateSet(`${this.frameworkName}_history`, history);
    
    // Add to evidence store for future reference
    await ctx.ctx.evidence.add(this.frameworkName, {
      type: 'framework_step',
      framework: this.frameworkName,
      stepNumber,
      content,
      timestamp: step.timestamp,
      metadata,
    });
    
    // Log formatted output to stderr
    this.logStep(step, nextStepNeeded);
    
    // Return structured Markdown with step history
    return this.formatStepResponse(step, history, nextStepNeeded);
  }
  
  /**
   * Get current session state
   */
  getState(ctx: ServerContext): {
    problem: string;
    context: string;
    totalSteps: number;
    evidence: any[];
    history: FrameworkStep[];
  } {
    return {
      problem: ctx.stateGet(`${this.frameworkName}_problem`) ?? '',
      context: ctx.stateGet(`${this.frameworkName}_context`) ?? '',
      totalSteps: ctx.stateGet(`${this.frameworkName}_totalSteps`) ?? 5,
      evidence: ctx.stateGet(`${this.frameworkName}_evidence`) ?? [],
      history: ctx.stateGet(`${this.frameworkName}_history`) ?? [],
    };
  }
  
  /**
   * Format initialization response (override for custom formatting)
   */
  protected formatInitResponse(
    problem: string,
    context: string,
    totalSteps: number,
    evidence: any[]
  ): string {
    return `# ${this.frameworkName} - Session Initialized

**Problem:** ${problem}
**Context:** ${context || 'None provided'}
**Total Steps:** ${totalSteps}
**Evidence Gathered:** ${evidence.length} items

## Evidence

${evidence.slice(0, 5).map((e, i) => `${i + 1}. **${e.path}** (score: ${e.score.toFixed(2)})
   ${e.snippet.slice(0, 150)}...`).join('\n\n')}

${evidence.length > 5 ? `\n*...and ${evidence.length - 5} more items*` : ''}

## Next Steps

Use this framework to guide your thinking through ${totalSteps} steps. For each step, provide:
- Step number
- Your analysis/thinking for this step
- Whether another step is needed

The framework will track your progress and provide structure.
`;
  }
  
  /**
   * Format step response (override for custom formatting)
   */
  protected formatStepResponse(
    step: FrameworkStep,
    history: FrameworkStep[],
    nextStepNeeded: boolean
  ): string {
    return `# ${this.frameworkName} - Step ${step.stepNumber}

**Content:** ${step.content}
**Next Step Needed:** ${nextStepNeeded ? 'Yes' : 'No'}

## Progress

${history.map((s, i) => `${i + 1}. Step ${s.stepNumber}: ${s.content.slice(0, 100)}${s.content.length > 100 ? '...' : ''}`).join('\n')}

## Metadata

\`\`\`json
${JSON.stringify({
  stepNumber: step.stepNumber,
  totalSteps: history.length,
  nextStepNeeded,
  timestamp: step.timestamp,
}, null, 2)}
\`\`\`
`;
  }
  
  /**
   * Log step to stderr (override for custom formatting)
   */
  protected logStep(step: FrameworkStep, nextStepNeeded: boolean): void {
    console.error(`\n[${this.frameworkName}] Step ${step.stepNumber}`);
    console.error(`Content: ${step.content}`);
    console.error(`Next: ${nextStepNeeded ? 'Yes' : 'No'}`);
    console.error('---');
  }
  
  /**
   * Main handler - routes to initialize or recordStep
   */
  async handle(args: any, ctx: ServerContext): Promise<any> {
    // CASE 1: Initialize new session
    if (args.problem && !args.stepNumber) {
      return this.initialize(args, ctx);
    }
    
    // CASE 2: Record a step
    if (args.stepNumber !== undefined && args.content) {
      return this.recordStep(args, ctx);
    }
    
    // Invalid input
    return {
      error: 'Invalid input. Provide either "problem" to initialize or "stepNumber" and "content" to record a step.',
    };
  }
}

