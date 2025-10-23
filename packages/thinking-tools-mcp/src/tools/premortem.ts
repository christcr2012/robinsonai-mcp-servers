/**
 * Premortem Analysis Tool
 * Imagines project has failed and works backward to identify risks
 */

export interface PremortemInput {
  project: string;
  timeline?: string;
  stakeholders?: string[];
}

export interface PremortemOutput {
  failureScenarios: Array<{ scenario: string; likelihood: string; impact: string }>;
  earlyWarningSignals: string[];
  mitigationStrategies: string[];
  contingencyPlans: string[];
  confidence: number;
  reasoning: string;
}

export function premortemAnalysis(input: PremortemInput): PremortemOutput {
  const { project, timeline = 'unknown', stakeholders = [] } = input;
  
  const failureScenarios: Array<{ scenario: string; likelihood: string; impact: string }> = [];
  const earlyWarningSignals: string[] = [];
  const mitigationStrategies: string[] = [];
  const contingencyPlans: string[] = [];
  
  const lowerProject = project.toLowerCase();
  
  // Technical failure scenarios
  if (lowerProject.includes('migrate') || lowerProject.includes('rewrite')) {
    failureScenarios.push({
      scenario: 'Migration took 3x longer than estimated, business lost patience',
      likelihood: 'HIGH',
      impact: 'CRITICAL'
    });
    failureScenarios.push({
      scenario: 'Data corruption during migration caused data loss',
      likelihood: 'MEDIUM',
      impact: 'CRITICAL'
    });
    failureScenarios.push({
      scenario: 'New system performance worse than old system',
      likelihood: 'MEDIUM',
      impact: 'HIGH'
    });
    
    earlyWarningSignals.push('Migration scripts failing in testing');
    earlyWarningSignals.push('Performance benchmarks not meeting targets');
    earlyWarningSignals.push('Team velocity slowing down');
    
    mitigationStrategies.push('Run migration in parallel with old system');
    mitigationStrategies.push('Implement comprehensive data validation');
    mitigationStrategies.push('Set up performance monitoring from day 1');
    mitigationStrategies.push('Create detailed rollback plan');
    
    contingencyPlans.push('Keep old system running as fallback');
    contingencyPlans.push('Have data backup and restore procedures');
    contingencyPlans.push('Plan for gradual migration, not big bang');
  }
  
  if (lowerProject.includes('launch') || lowerProject.includes('release')) {
    failureScenarios.push({
      scenario: 'Launch day: servers crashed under load',
      likelihood: 'MEDIUM',
      impact: 'CRITICAL'
    });
    failureScenarios.push({
      scenario: 'Critical bug discovered in production',
      likelihood: 'HIGH',
      impact: 'HIGH'
    });
    failureScenarios.push({
      scenario: 'Users found product confusing, high churn rate',
      likelihood: 'MEDIUM',
      impact: 'HIGH'
    });
    
    earlyWarningSignals.push('Load testing showing performance issues');
    earlyWarningSignals.push('Beta users reporting confusion');
    earlyWarningSignals.push('High error rates in staging');
    
    mitigationStrategies.push('Conduct load testing before launch');
    mitigationStrategies.push('Run beta program with real users');
    mitigationStrategies.push('Implement feature flags for gradual rollout');
    mitigationStrategies.push('Have customer support ready');
    
    contingencyPlans.push('Ability to roll back deployment quickly');
    contingencyPlans.push('Scale infrastructure automatically');
    contingencyPlans.push('Have hotfix process ready');
  }
  
  if (lowerProject.includes('api') || lowerProject.includes('integration')) {
    failureScenarios.push({
      scenario: 'Third-party API changed without notice, breaking integration',
      likelihood: 'MEDIUM',
      impact: 'HIGH'
    });
    failureScenarios.push({
      scenario: 'API rate limits hit, causing service degradation',
      likelihood: 'HIGH',
      impact: 'MEDIUM'
    });
    failureScenarios.push({
      scenario: 'Authentication tokens leaked, security breach',
      likelihood: 'LOW',
      impact: 'CRITICAL'
    });
    
    earlyWarningSignals.push('Increasing API error rates');
    earlyWarningSignals.push('Approaching rate limits');
    earlyWarningSignals.push('Third-party API deprecation notices');
    
    mitigationStrategies.push('Implement retry logic with exponential backoff');
    mitigationStrategies.push('Monitor API usage and set alerts');
    mitigationStrategies.push('Use API versioning');
    mitigationStrategies.push('Rotate credentials regularly');
    
    contingencyPlans.push('Have fallback to alternative API provider');
    contingencyPlans.push('Cache API responses when possible');
    contingencyPlans.push('Implement circuit breaker pattern');
  }
  
  if (lowerProject.includes('scale') || lowerProject.includes('growth')) {
    failureScenarios.push({
      scenario: 'Database became bottleneck, site went down',
      likelihood: 'HIGH',
      impact: 'CRITICAL'
    });
    failureScenarios.push({
      scenario: 'Costs spiraled out of control with growth',
      likelihood: 'MEDIUM',
      impact: 'HIGH'
    });
    failureScenarios.push({
      scenario: 'Team couldn\'t keep up with support requests',
      likelihood: 'HIGH',
      impact: 'MEDIUM'
    });
    
    earlyWarningSignals.push('Database query times increasing');
    earlyWarningSignals.push('Infrastructure costs growing faster than revenue');
    earlyWarningSignals.push('Support ticket backlog growing');
    
    mitigationStrategies.push('Implement database read replicas');
    mitigationStrategies.push('Set up cost monitoring and alerts');
    mitigationStrategies.push('Build self-service support tools');
    mitigationStrategies.push('Plan capacity ahead of growth');
    
    contingencyPlans.push('Have database scaling plan ready');
    contingencyPlans.push('Implement rate limiting');
    contingencyPlans.push('Hire support team proactively');
  }
  
  if (lowerProject.includes('security') || lowerProject.includes('auth')) {
    failureScenarios.push({
      scenario: 'Security breach exposed user data',
      likelihood: 'MEDIUM',
      impact: 'CRITICAL'
    });
    failureScenarios.push({
      scenario: 'Compliance audit failed, fines imposed',
      likelihood: 'LOW',
      impact: 'CRITICAL'
    });
    
    earlyWarningSignals.push('Security scan findings not addressed');
    earlyWarningSignals.push('Unusual login patterns');
    earlyWarningSignals.push('Compliance requirements not documented');
    
    mitigationStrategies.push('Conduct security audit before launch');
    mitigationStrategies.push('Implement security monitoring');
    mitigationStrategies.push('Follow OWASP guidelines');
    mitigationStrategies.push('Encrypt sensitive data');
    
    contingencyPlans.push('Have incident response plan');
    contingencyPlans.push('Maintain audit logs');
    contingencyPlans.push('Have legal counsel on retainer');
  }
  
  // Team/Process failure scenarios
  failureScenarios.push({
    scenario: 'Key team member left mid-project',
    likelihood: 'MEDIUM',
    impact: 'HIGH'
  });
  failureScenarios.push({
    scenario: 'Scope creep doubled timeline',
    likelihood: 'HIGH',
    impact: 'MEDIUM'
  });
  failureScenarios.push({
    scenario: 'Stakeholder changed requirements late',
    likelihood: 'HIGH',
    impact: 'MEDIUM'
  });
  
  earlyWarningSignals.push('Team morale declining');
  earlyWarningSignals.push('Frequent requirement changes');
  earlyWarningSignals.push('Missed milestones');
  
  mitigationStrategies.push('Document knowledge, avoid silos');
  mitigationStrategies.push('Define clear scope and change process');
  mitigationStrategies.push('Regular stakeholder check-ins');
  mitigationStrategies.push('Buffer time in estimates');
  
  contingencyPlans.push('Cross-train team members');
  contingencyPlans.push('Have scope prioritization framework');
  contingencyPlans.push('Maintain project documentation');
  
  // Generic failures
  if (failureScenarios.length < 3) {
    failureScenarios.push({
      scenario: 'Project ran out of budget before completion',
      likelihood: 'MEDIUM',
      impact: 'HIGH'
    });
    failureScenarios.push({
      scenario: 'Technical debt made changes too slow',
      likelihood: 'HIGH',
      impact: 'MEDIUM'
    });
    
    earlyWarningSignals.push('Burn rate exceeding plan');
    earlyWarningSignals.push('Code quality metrics declining');
    
    mitigationStrategies.push('Track budget weekly');
    mitigationStrategies.push('Allocate time for refactoring');
    
    contingencyPlans.push('Have funding contingency');
    contingencyPlans.push('Plan technical debt paydown sprints');
  }
  
  const confidence = failureScenarios.length >= 5 ? 0.85 : 0.7;
  
  const reasoning = `Imagined project failure and identified ${failureScenarios.length} failure scenarios, ${earlyWarningSignals.length} early warning signals, ${mitigationStrategies.length} mitigation strategies, and ${contingencyPlans.length} contingency plans.`;
  
  return {
    failureScenarios,
    earlyWarningSignals,
    mitigationStrategies,
    contingencyPlans,
    confidence,
    reasoning
  };
}

