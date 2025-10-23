/**
 * Devil's Advocate Tool
 * Challenges assumptions and finds flaws in plans, ideas, or arguments
 */

export interface DevilsAdvocateInput {
  context: string;
  goal?: string;
  depth?: 'quick' | 'deep';
}

export interface DevilsAdvocateOutput {
  challenges: string[];
  risks: string[];
  counterarguments: string[];
  recommendations: string[];
  confidence: number;
  reasoning: string;
}

export function devilsAdvocate(input: DevilsAdvocateInput): DevilsAdvocateOutput {
  const { context, goal, depth = 'quick' } = input;
  
  const challenges: string[] = [];
  const risks: string[] = [];
  const counterarguments: string[] = [];
  const recommendations: string[] = [];
  
  // Analyze context for common pitfalls
  const lowerContext = context.toLowerCase();
  
  // Technology/Architecture challenges
  if (lowerContext.includes('migrate') || lowerContext.includes('rewrite')) {
    challenges.push('Migration projects often take 2-3x longer than estimated');
    challenges.push('Team may lack experience with new technology');
    challenges.push('Existing system works - why fix what isn\'t broken?');
    risks.push('Business disruption during migration');
    risks.push('Data loss or corruption during transition');
    counterarguments.push('Incremental refactoring may be safer than full rewrite');
    recommendations.push('Start with proof-of-concept before full migration');
    recommendations.push('Maintain parallel systems during transition');
  }
  
  if (lowerContext.includes('microservice')) {
    challenges.push('Microservices add operational complexity');
    challenges.push('Network latency between services can hurt performance');
    challenges.push('Distributed debugging is much harder');
    risks.push('Service orchestration failures');
    risks.push('Data consistency issues across services');
    counterarguments.push('Monolith may be simpler and faster for your scale');
    recommendations.push('Evaluate if you actually need microservices');
    recommendations.push('Consider modular monolith first');
  }
  
  if (lowerContext.includes('graphql')) {
    challenges.push('GraphQL has steep learning curve');
    challenges.push('N+1 query problems can kill performance');
    challenges.push('Caching is more complex than REST');
    risks.push('Over-fetching or under-fetching data');
    risks.push('Security issues with unrestricted queries');
    counterarguments.push('REST is simpler and well-understood');
    recommendations.push('Use GraphQL only if you need flexible queries');
    recommendations.push('Implement query complexity limits');
  }
  
  if (lowerContext.includes('serverless') || lowerContext.includes('lambda')) {
    challenges.push('Cold starts can add 1-5 second latency');
    challenges.push('Vendor lock-in with cloud provider');
    challenges.push('Debugging serverless is harder');
    risks.push('Unpredictable costs at scale');
    risks.push('Timeout limits may not fit all workloads');
    counterarguments.push('Traditional servers may be more cost-effective');
    recommendations.push('Benchmark cold start times for your use case');
    recommendations.push('Have exit strategy to avoid vendor lock-in');
  }
  
  // Process/Methodology challenges
  if (lowerContext.includes('agile') || lowerContext.includes('scrum')) {
    challenges.push('Agile requires discipline - many teams do "agile theater"');
    challenges.push('Daily standups can become time-wasters');
    challenges.push('Sprint planning overhead may not be worth it');
    counterarguments.push('Kanban may be simpler and more flexible');
    recommendations.push('Focus on principles, not ceremonies');
  }
  
  if (lowerContext.includes('test') && lowerContext.includes('driven')) {
    challenges.push('TDD can slow down initial development');
    challenges.push('Tests can become brittle and hard to maintain');
    challenges.push('Not all code benefits from TDD');
    counterarguments.push('Write tests after code for faster iteration');
    recommendations.push('Use TDD selectively for critical logic');
  }
  
  // Business/Product challenges
  if (lowerContext.includes('mvp') || lowerContext.includes('minimum viable')) {
    challenges.push('MVPs often become technical debt');
    challenges.push('Users may judge product by MVP quality');
    challenges.push('Cutting corners now means paying later');
    risks.push('MVP code may need complete rewrite');
    recommendations.push('Define clear criteria for what comes after MVP');
    recommendations.push('Don\'t skip security or data integrity');
  }
  
  if (lowerContext.includes('scale') || lowerContext.includes('growth')) {
    challenges.push('Premature optimization wastes time');
    challenges.push('You may never reach the scale you\'re planning for');
    challenges.push('Scaling problems are good problems to have');
    counterarguments.push('Build for current needs, refactor when needed');
    recommendations.push('Measure actual bottlenecks before optimizing');
  }
  
  // Security challenges
  if (lowerContext.includes('auth') || lowerContext.includes('security')) {
    challenges.push('Rolling your own auth is risky');
    challenges.push('Security is hard to get right');
    risks.push('Data breaches can destroy company');
    risks.push('Compliance violations (GDPR, HIPAA, etc.)');
    recommendations.push('Use proven auth libraries/services');
    recommendations.push('Get security audit before launch');
  }
  
  // Cost challenges
  if (lowerContext.includes('cloud') || lowerContext.includes('aws') || lowerContext.includes('azure')) {
    challenges.push('Cloud costs can spiral out of control');
    challenges.push('Vendor lock-in makes switching expensive');
    risks.push('Unexpected bills from misconfiguration');
    recommendations.push('Set up billing alerts immediately');
    recommendations.push('Review costs monthly');
  }
  
  // Team/People challenges
  if (lowerContext.includes('hire') || lowerContext.includes('team')) {
    challenges.push('Hiring takes longer than expected');
    challenges.push('New hires need 3-6 months to be productive');
    challenges.push('Team growth adds communication overhead');
    risks.push('Bad hires can damage team culture');
    recommendations.push('Hire slowly, fire quickly');
    recommendations.push('Invest in onboarding process');
  }
  
  // Generic challenges if nothing specific found
  if (challenges.length === 0) {
    challenges.push('Assumptions may not hold in practice');
    challenges.push('Hidden complexity often emerges during implementation');
    challenges.push('Stakeholder alignment may be harder than expected');
    risks.push('Timeline may be too optimistic');
    risks.push('Budget may be insufficient');
    counterarguments.push('Simpler alternatives may exist');
    recommendations.push('Validate assumptions with data');
    recommendations.push('Build in buffer time for unknowns');
  }
  
  // Add depth-specific challenges
  if (depth === 'deep') {
    challenges.push('Second-order effects may create new problems');
    challenges.push('Opportunity cost - what else could you build instead?');
    risks.push('Market may change before completion');
    risks.push('Technology may become obsolete');
    recommendations.push('Define success metrics upfront');
    recommendations.push('Plan for iteration and pivots');
  }
  
  const confidence = challenges.length > 3 ? 0.85 : 0.65;
  
  const reasoning = `Analyzed context for common pitfalls in: ${
    lowerContext.includes('migrate') ? 'migrations, ' : ''
  }${
    lowerContext.includes('microservice') ? 'microservices, ' : ''
  }${
    lowerContext.includes('scale') ? 'scaling, ' : ''
  }${
    lowerContext.includes('auth') ? 'security, ' : ''
  }technology decisions, and team dynamics. Found ${challenges.length} challenges, ${risks.length} risks.`;
  
  return {
    challenges,
    risks,
    counterarguments,
    recommendations,
    confidence,
    reasoning
  };
}

