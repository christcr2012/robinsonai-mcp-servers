/**
 * Scenario Planning Tool
 * Explore multiple possible futures and prepare for uncertainty
 */

export interface ScenarioPlanningInput {
  situation: string;
  timeframe?: string;
  context?: string;
}

export interface ScenarioPlanningOutput {
  scenarios: Array<{
    name: string;
    description: string;
    probability: number;
    impact: number;
    indicators: string[];
    preparations: string[];
  }>;
  criticalUncertainties: string[];
  commonPreparations: string[];
  confidence: number;
  reasoning: string;
}

export function scenarioPlanning(input: ScenarioPlanningInput): ScenarioPlanningOutput {
  const { situation, timeframe = '1 year', context = '' } = input;
  const combined = `${situation} ${context}`.toLowerCase();
  
  const scenarios: Array<{
    name: string;
    description: string;
    probability: number;
    impact: number;
    indicators: string[];
    preparations: string[];
  }> = [];
  
  const criticalUncertainties: string[] = [];
  const commonPreparations: string[] = [];
  
  // Identify critical uncertainties
  if (combined.includes('growth') || combined.includes('scale')) {
    criticalUncertainties.push('Rate of user growth (slow, moderate, explosive)');
    criticalUncertainties.push('Market competition (monopoly, competitive, saturated)');
  }
  
  if (combined.includes('technical') || combined.includes('architecture')) {
    criticalUncertainties.push('Technology maturity (stable, evolving, disruptive)');
    criticalUncertainties.push('Team capability (learning curve, expertise level)');
  }
  
  if (combined.includes('business') || combined.includes('product')) {
    criticalUncertainties.push('Market demand (strong, moderate, weak)');
    criticalUncertainties.push('Regulatory environment (favorable, neutral, restrictive)');
  }
  
  criticalUncertainties.push('Economic conditions (boom, stable, recession)');
  criticalUncertainties.push('Resource availability (abundant, constrained, scarce)');
  
  // Generate scenarios (2x2 matrix of key uncertainties)
  
  // Scenario 1: Best Case
  scenarios.push({
    name: 'Smooth Sailing',
    description: 'Everything goes according to plan. Growth is steady, team executes well, no major obstacles.',
    probability: 20,
    impact: 80,
    indicators: [
      'Metrics trending as projected',
      'No major incidents or outages',
      'Team velocity stable or increasing',
      'Positive user feedback'
    ],
    preparations: [
      'Document what\'s working for future reference',
      'Build buffer capacity for unexpected growth',
      'Invest in team development and retention',
      'Prepare for next phase of growth'
    ]
  });
  
  // Scenario 2: Explosive Growth
  scenarios.push({
    name: 'Viral Success',
    description: 'Product goes viral, growth far exceeds projections. Infrastructure and team struggle to keep up.',
    probability: 10,
    impact: 95,
    indicators: [
      'Traffic growing >50% week-over-week',
      'Performance degradation under load',
      'Support tickets overwhelming team',
      'Media attention and press coverage'
    ],
    preparations: [
      'Have auto-scaling configured and tested',
      'Prepare incident response playbooks',
      'Line up additional resources (budget, hiring pipeline)',
      'Simplify features to focus on core value',
      'Set up rate limiting and abuse prevention'
    ]
  });
  
  // Scenario 3: Slow Growth
  scenarios.push({
    name: 'Slow Burn',
    description: 'Growth is slower than expected. Need to optimize costs and find product-market fit.',
    probability: 40,
    impact: 60,
    indicators: [
      'User acquisition below targets',
      'High churn rate',
      'Low engagement metrics',
      'Runway concerns'
    ],
    preparations: [
      'Optimize infrastructure costs aggressively',
      'Focus on retention over acquisition',
      'Conduct user research to understand friction',
      'Pivot features based on user feedback',
      'Extend runway through cost reduction'
    ]
  });
  
  // Scenario 4: Technical Crisis
  scenarios.push({
    name: 'Technical Debt Reckoning',
    description: 'Accumulated technical debt causes major outages, security issues, or performance problems.',
    probability: 25,
    impact: 85,
    indicators: [
      'Increasing frequency of incidents',
      'Deployment failures',
      'Developer velocity slowing',
      'Security vulnerabilities discovered'
    ],
    preparations: [
      'Allocate time for technical debt reduction',
      'Implement comprehensive monitoring and alerting',
      'Build automated testing and CI/CD',
      'Document critical systems and dependencies',
      'Create disaster recovery procedures'
    ]
  });
  
  // Scenario 5: Market Disruption
  scenarios.push({
    name: 'Competitive Threat',
    description: 'Major competitor enters market or technology shift makes current approach obsolete.',
    probability: 30,
    impact: 75,
    indicators: [
      'Competitor announcements',
      'User migration to alternatives',
      'Technology trends shifting',
      'Industry consolidation'
    ],
    preparations: [
      'Build unique defensible features',
      'Focus on customer relationships and lock-in',
      'Stay flexible and ready to pivot',
      'Monitor competitive landscape',
      'Invest in innovation and R&D'
    ]
  });
  
  // Scenario 6: Team Crisis
  scenarios.push({
    name: 'Talent Exodus',
    description: 'Key team members leave, knowledge is lost, velocity drops significantly.',
    probability: 20,
    impact: 70,
    indicators: [
      'Increased turnover',
      'Low morale or engagement',
      'Compensation below market',
      'Burnout symptoms'
    ],
    preparations: [
      'Document tribal knowledge',
      'Cross-train team members',
      'Improve compensation and benefits',
      'Build positive team culture',
      'Have succession plans for key roles'
    ]
  });
  
  // Scenario 7: Resource Constraints
  scenarios.push({
    name: 'Budget Crunch',
    description: 'Funding dries up, need to do more with less, or shut down non-essential services.',
    probability: 25,
    impact: 65,
    indicators: [
      'Funding rounds delayed or failed',
      'Revenue below projections',
      'Burn rate unsustainable',
      'Investor pressure'
    ],
    preparations: [
      'Identify and protect core features',
      'Optimize cloud costs aggressively',
      'Reduce dependencies on expensive services',
      'Build lean processes',
      'Have shutdown procedures for non-critical systems'
    ]
  });
  
  // Common preparations (robust across scenarios)
  commonPreparations.push('Build comprehensive monitoring and observability');
  commonPreparations.push('Document critical systems and processes');
  commonPreparations.push('Implement automated testing and CI/CD');
  commonPreparations.push('Create incident response playbooks');
  commonPreparations.push('Maintain financial buffer (3-6 months runway)');
  commonPreparations.push('Foster team resilience and adaptability');
  commonPreparations.push('Stay close to users and gather feedback');
  commonPreparations.push('Keep architecture flexible and modular');
  commonPreparations.push('Build strong relationships with stakeholders');
  commonPreparations.push('Regularly review and update plans');
  
  const confidence = 65;
  
  return {
    scenarios,
    criticalUncertainties,
    commonPreparations,
    confidence,
    reasoning: `Generated ${scenarios.length} distinct scenarios across ${criticalUncertainties.length} critical uncertainties. Identified ${commonPreparations.length} robust preparations that work across multiple scenarios.`
  };
}

