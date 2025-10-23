/**
 * Systems Thinking Tool
 * Understand interconnections, feedback loops, and emergent behavior
 */

export interface SystemsThinkingInput {
  system: string;
  context?: string;
}

export interface SystemsThinkingOutput {
  components: Array<{ name: string; role: string; dependencies: string[] }>;
  feedbackLoops: Array<{ type: 'reinforcing' | 'balancing'; description: string; impact: string }>;
  leveragePoints: Array<{ point: string; impact: string; difficulty: string }>;
  emergentBehaviors: string[];
  systemArchetypes: Array<{ archetype: string; description: string; solution: string }>;
  confidence: number;
  reasoning: string;
}

export function systemsThinking(input: SystemsThinkingInput): SystemsThinkingOutput {
  const { system, context = '' } = input;
  const combined = `${system} ${context}`.toLowerCase();
  
  const components: Array<{ name: string; role: string; dependencies: string[] }> = [];
  const feedbackLoops: Array<{ type: 'reinforcing' | 'balancing'; description: string; impact: string }> = [];
  const leveragePoints: Array<{ point: string; impact: string; difficulty: string }> = [];
  const emergentBehaviors: string[] = [];
  const systemArchetypes: Array<{ archetype: string; description: string; solution: string }> = [];
  
  // Identify components
  if (combined.includes('api') || combined.includes('service')) {
    components.push({
      name: 'API Layer',
      role: 'Interface between clients and backend',
      dependencies: ['Database', 'Cache', 'Auth Service']
    });
  }
  
  if (combined.includes('database') || combined.includes('db')) {
    components.push({
      name: 'Database',
      role: 'Persistent data storage',
      dependencies: ['Disk I/O', 'Network']
    });
  }
  
  if (combined.includes('cache') || combined.includes('redis')) {
    components.push({
      name: 'Cache',
      role: 'Fast temporary data storage',
      dependencies: ['Memory', 'Database']
    });
  }
  
  if (combined.includes('queue') || combined.includes('job')) {
    components.push({
      name: 'Job Queue',
      role: 'Asynchronous task processing',
      dependencies: ['Workers', 'Database']
    });
  }
  
  if (combined.includes('user') || combined.includes('client')) {
    components.push({
      name: 'Users/Clients',
      role: 'Generate requests and consume responses',
      dependencies: ['API', 'Network']
    });
  }
  
  // Identify feedback loops
  if (combined.includes('cache')) {
    feedbackLoops.push({
      type: 'reinforcing',
      description: 'Cache Hit Spiral: More cache hits → faster responses → more users → more cache hits',
      impact: 'Positive: System gets faster as it\'s used more'
    });
    
    feedbackLoops.push({
      type: 'balancing',
      description: 'Cache Invalidation: More writes → more cache invalidations → more cache misses → slower responses → fewer writes',
      impact: 'Negative: Write-heavy workloads degrade cache effectiveness'
    });
  }
  
  if (combined.includes('scale') || combined.includes('load')) {
    feedbackLoops.push({
      type: 'reinforcing',
      description: 'Success Spiral: More users → more revenue → more resources → better service → more users',
      impact: 'Positive: Growth enables better service'
    });
    
    feedbackLoops.push({
      type: 'reinforcing',
      description: 'Death Spiral: Slow service → users leave → less revenue → fewer resources → slower service',
      impact: 'Negative: Performance issues can compound'
    });
  }
  
  if (combined.includes('error') || combined.includes('retry')) {
    feedbackLoops.push({
      type: 'reinforcing',
      description: 'Retry Storm: Service slow → clients retry → more load → service slower → more retries',
      impact: 'Negative: Retries can overwhelm struggling service'
    });
    
    feedbackLoops.push({
      type: 'balancing',
      description: 'Circuit Breaker: Too many errors → circuit opens → load drops → service recovers → circuit closes',
      impact: 'Positive: Prevents cascading failures'
    });
  }
  
  if (combined.includes('team') || combined.includes('developer')) {
    feedbackLoops.push({
      type: 'reinforcing',
      description: 'Technical Debt Spiral: Rushed code → more bugs → more time fixing → less time for quality → more rushed code',
      impact: 'Negative: Quality degrades over time'
    });
    
    feedbackLoops.push({
      type: 'balancing',
      description: 'Learning Loop: Complex code → developers learn → better understanding → simpler code',
      impact: 'Positive: Team capability improves over time'
    });
  }
  
  // Identify leverage points (places to intervene)
  leveragePoints.push({
    point: 'System Goals',
    impact: 'Highest - Changing what the system optimizes for changes everything',
    difficulty: 'Very Hard - Requires organizational buy-in'
  });
  
  leveragePoints.push({
    point: 'Feedback Loop Delays',
    impact: 'High - Reducing delays makes system more responsive',
    difficulty: 'Medium - Often requires architectural changes'
  });
  
  leveragePoints.push({
    point: 'Information Flow',
    impact: 'High - Better visibility enables better decisions',
    difficulty: 'Medium - Add monitoring, logging, tracing'
  });
  
  leveragePoints.push({
    point: 'System Structure',
    impact: 'Medium - Changing connections between components',
    difficulty: 'Hard - Requires refactoring'
  });
  
  leveragePoints.push({
    point: 'Buffer Sizes',
    impact: 'Low - Adjusting queue sizes, connection pools, etc.',
    difficulty: 'Easy - Configuration changes'
  });
  
  // Identify emergent behaviors
  emergentBehaviors.push('Traffic patterns emerge from individual user behaviors');
  emergentBehaviors.push('System bottlenecks shift as load increases');
  emergentBehaviors.push('Failure modes appear that weren\'t present in individual components');
  emergentBehaviors.push('Performance characteristics change non-linearly with scale');
  
  if (combined.includes('microservice') || combined.includes('distributed')) {
    emergentBehaviors.push('Cascading failures propagate through service dependencies');
    emergentBehaviors.push('Network partitions create split-brain scenarios');
    emergentBehaviors.push('Eventual consistency leads to temporary data inconsistencies');
  }
  
  if (combined.includes('cache')) {
    emergentBehaviors.push('Cache stampedes occur when popular items expire');
    emergentBehaviors.push('Hot keys create uneven load distribution');
  }
  
  // Identify system archetypes (common patterns)
  if (combined.includes('growth') || combined.includes('scale')) {
    systemArchetypes.push({
      archetype: 'Limits to Growth',
      description: 'Growth slows as system approaches capacity limits',
      solution: 'Identify and remove constraints, or accept natural limits'
    });
  }
  
  if (combined.includes('fix') || combined.includes('quick')) {
    systemArchetypes.push({
      archetype: 'Fixes That Fail',
      description: 'Quick fixes solve immediate problem but create worse long-term issues',
      solution: 'Address root causes, not symptoms'
    });
  }
  
  if (combined.includes('shift') || combined.includes('burden')) {
    systemArchetypes.push({
      archetype: 'Shifting the Burden',
      description: 'Symptomatic solution is easier than fundamental solution, so fundamental solution atrophies',
      solution: 'Invest in fundamental solutions even when symptomatic solutions are available'
    });
  }
  
  if (combined.includes('compete') || combined.includes('resource')) {
    systemArchetypes.push({
      archetype: 'Tragedy of the Commons',
      description: 'Individual actors deplete shared resource for personal gain',
      solution: 'Add feedback to make consequences visible, or regulate access'
    });
  }
  
  systemArchetypes.push({
    archetype: 'Success to the Successful',
    description: 'Winner gets more resources, making them more likely to win again',
    solution: 'Level the playing field or accept winner-take-all dynamics'
  });
  
  const confidence = 70;
  
  return {
    components,
    feedbackLoops,
    leveragePoints,
    emergentBehaviors,
    systemArchetypes,
    confidence,
    reasoning: `Analyzed system structure with ${components.length} components, ${feedbackLoops.length} feedback loops, ${leveragePoints.length} leverage points, ${emergentBehaviors.length} emergent behaviors, and ${systemArchetypes.length} system archetypes.`
  };
}

