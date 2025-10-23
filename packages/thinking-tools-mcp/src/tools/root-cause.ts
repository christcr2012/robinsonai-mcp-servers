/**
 * Root Cause Analysis Tool
 * Uses 5 Whys technique to find underlying causes of problems
 */

export interface RootCauseInput {
  problem: string;
  context?: string;
  depth?: number;
}

export interface RootCauseOutput {
  whyChain: Array<{ why: string; because: string }>;
  rootCauses: string[];
  contributingFactors: string[];
  solutions: string[];
  confidence: number;
  reasoning: string;
}

export function rootCauseAnalysis(input: RootCauseInput): RootCauseOutput {
  const { problem, context = '', depth = 5 } = input;
  
  const whyChain: Array<{ why: string; because: string }> = [];
  const rootCauses: string[] = [];
  const contributingFactors: string[] = [];
  const solutions: string[] = [];
  
  const lowerProblem = problem.toLowerCase();
  const lowerContext = context.toLowerCase();
  
  // Build the "5 Whys" chain
  let currentWhy = problem;
  
  for (let i = 0; i < depth; i++) {
    let because = '';
    
    if (i === 0) {
      // First why - immediate cause
      if (lowerProblem.includes('slow') || lowerProblem.includes('performance')) {
        because = 'System is making too many database queries';
      } else if (lowerProblem.includes('error') || lowerProblem.includes('fail')) {
        because = 'Code is not handling edge cases properly';
      } else if (lowerProblem.includes('bug')) {
        because = 'Logic error in implementation';
      } else if (lowerProblem.includes('timeout')) {
        because = 'Operation takes longer than allowed time limit';
      } else if (lowerProblem.includes('crash')) {
        because = 'Unhandled exception or null reference';
      } else {
        because = 'Immediate symptom observed in system';
      }
    } else if (i === 1) {
      // Second why - technical cause
      if (lowerProblem.includes('slow') || lowerProblem.includes('performance')) {
        because = 'No caching layer implemented';
      } else if (lowerProblem.includes('error') || lowerProblem.includes('fail')) {
        because = 'Insufficient input validation';
      } else if (lowerProblem.includes('bug')) {
        because = 'Lack of test coverage for this scenario';
      } else if (lowerProblem.includes('timeout')) {
        because = 'Inefficient algorithm or blocking operations';
      } else if (lowerProblem.includes('crash')) {
        because = 'Missing error handling';
      } else {
        because = 'Technical implementation issue';
      }
    } else if (i === 2) {
      // Third why - design/architecture cause
      if (lowerProblem.includes('slow') || lowerProblem.includes('performance')) {
        because = 'Architecture not designed for scale';
      } else if (lowerProblem.includes('error') || lowerProblem.includes('fail')) {
        because = 'API contract not clearly defined';
      } else if (lowerProblem.includes('bug')) {
        because = 'Requirements were ambiguous';
      } else if (lowerProblem.includes('timeout')) {
        because = 'Synchronous design where async needed';
      } else if (lowerProblem.includes('crash')) {
        because = 'No defensive programming practices';
      } else {
        because = 'Architectural decision or design flaw';
      }
    } else if (i === 3) {
      // Fourth why - process cause
      because = 'Insufficient code review process';
      contributingFactors.push('Time pressure to ship features');
      contributingFactors.push('Lack of performance testing in CI/CD');
    } else {
      // Fifth why - root organizational cause
      because = 'Team lacks training or resources';
      contributingFactors.push('Technical debt not prioritized');
      contributingFactors.push('No dedicated time for quality improvements');
    }
    
    whyChain.push({ why: currentWhy, because });
    currentWhy = because;
  }
  
  // Identify root causes
  if (whyChain.length > 0) {
    rootCauses.push(whyChain[whyChain.length - 1].because);
  }
  
  // Add domain-specific root causes
  if (lowerProblem.includes('slow') || lowerProblem.includes('performance')) {
    rootCauses.push('Lack of performance requirements in planning');
    rootCauses.push('No performance monitoring in production');
    solutions.push('Implement caching strategy');
    solutions.push('Add database indexes');
    solutions.push('Use connection pooling');
    solutions.push('Implement query optimization');
    solutions.push('Add performance budgets to CI/CD');
  }
  
  if (lowerProblem.includes('error') || lowerProblem.includes('fail')) {
    rootCauses.push('Insufficient error handling strategy');
    rootCauses.push('Lack of input validation standards');
    solutions.push('Implement comprehensive input validation');
    solutions.push('Add error boundaries');
    solutions.push('Use type safety (TypeScript)');
    solutions.push('Add integration tests for error cases');
  }
  
  if (lowerProblem.includes('bug')) {
    rootCauses.push('Inadequate testing strategy');
    rootCauses.push('Unclear requirements');
    solutions.push('Increase test coverage');
    solutions.push('Add property-based testing');
    solutions.push('Implement TDD for critical paths');
    solutions.push('Clarify requirements before coding');
  }
  
  if (lowerProblem.includes('security') || lowerProblem.includes('breach')) {
    rootCauses.push('Security not considered in design phase');
    rootCauses.push('Lack of security training');
    solutions.push('Implement security code review');
    solutions.push('Use security scanning tools');
    solutions.push('Follow OWASP guidelines');
    solutions.push('Conduct regular security audits');
  }
  
  if (lowerProblem.includes('deploy') || lowerProblem.includes('production')) {
    rootCauses.push('Insufficient deployment testing');
    rootCauses.push('Lack of staging environment');
    solutions.push('Implement blue-green deployments');
    solutions.push('Add smoke tests after deployment');
    solutions.push('Use feature flags for gradual rollout');
    solutions.push('Improve rollback procedures');
  }
  
  // Generic solutions
  if (solutions.length === 0) {
    solutions.push('Address root cause, not symptoms');
    solutions.push('Implement preventive measures');
    solutions.push('Add monitoring and alerts');
    solutions.push('Document lessons learned');
  }
  
  // Add process improvements
  solutions.push('Add this scenario to test suite');
  solutions.push('Update documentation');
  solutions.push('Share findings with team');
  
  const confidence = whyChain.length >= 3 ? 0.8 : 0.6;
  
  const reasoning = `Applied 5 Whys technique with ${whyChain.length} iterations. Identified ${rootCauses.length} root causes and ${contributingFactors.length} contributing factors. Proposed ${solutions.length} solutions.`;
  
  return {
    whyChain,
    rootCauses,
    contributingFactors,
    solutions,
    confidence,
    reasoning
  };
}

