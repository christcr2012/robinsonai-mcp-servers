/**
 * Task Complexity Analyzer
 * 
 * Intelligently determines task complexity to select the right model tier:
 * - Haiku: Simple, routine tasks ($1/$5 per MTok)
 * - Sonnet: Most tasks, good balance ($3/$15 per MTok)
 * - Opus: Critical, complex tasks ($15/$75 per MTok)
 */

export type TaskComplexity = 'simple' | 'medium' | 'complex' | 'expert';
export type TaskRiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface ComplexityAnalysis {
  complexity: TaskComplexity;
  riskLevel: TaskRiskLevel;
  confidence: number; // 0-1
  reasoning: string;
  recommendedModel: {
    anthropic: string; // claude-3-5-haiku-20241022 | claude-3-5-sonnet-20241022 | claude-3-opus-20240229
    openai: string;    // gpt-4o-mini | gpt-4o | o1
    moonshot: string;  // moonshot-v1-8k | moonshot-v1-32k | moonshot-v1-128k
  };
  signals: {
    criticalKeywords: string[];
    domainIndicators: string[];
    scopeIndicators: string[];
  };
}

// Critical domains that require Opus-level reasoning
const CRITICAL_DOMAINS = [
  'payment', 'financial', 'transaction', 'billing', 'stripe', 'money',
  'security', 'authentication', 'authorization', 'encryption', 'crypto',
  'medical', 'healthcare', 'hipaa', 'patient',
  'legal', 'compliance', 'gdpr', 'regulation',
  'production', 'deployment', 'infrastructure', 'database migration',
];

// Complex tasks that benefit from Sonnet
const COMPLEX_INDICATORS = [
  'architecture', 'design pattern', 'system design', 'scalability',
  'performance optimization', 'race condition', 'concurrency',
  'distributed system', 'microservices', 'event-driven',
  'refactor', 'legacy code', 'technical debt',
  'api design', 'schema design', 'data modeling',
];

// Simple tasks suitable for Haiku
const SIMPLE_INDICATORS = [
  'boilerplate', 'crud', 'getter', 'setter', 'simple function',
  'format', 'lint', 'style', 'rename', 'move file',
  'add comment', 'update documentation', 'fix typo',
  'simple test', 'mock data', 'example',
];

/**
 * Analyze task complexity and recommend appropriate model tier
 */
export function analyzeTaskComplexity(task: string, context?: {
  fileCount?: number;
  linesOfCode?: number;
  dependencies?: string[];
  existingTests?: boolean;
}): ComplexityAnalysis {
  const lowerTask = task.toLowerCase();
  
  // Check for critical domain keywords
  const criticalMatches = CRITICAL_DOMAINS.filter(kw => lowerTask.includes(kw));
  const isCritical = criticalMatches.length > 0;
  
  // Check for complex indicators
  const complexMatches = COMPLEX_INDICATORS.filter(kw => lowerTask.includes(kw));
  const isComplex = complexMatches.length > 0;
  
  // Check for simple indicators
  const simpleMatches = SIMPLE_INDICATORS.filter(kw => lowerTask.includes(kw));
  const isSimple = simpleMatches.length > 0;
  
  // Analyze scope
  const hasLargeScope = 
    lowerTask.includes('entire') ||
    lowerTask.includes('all') ||
    lowerTask.includes('complete') ||
    (context?.fileCount && context.fileCount > 10) ||
    (context?.linesOfCode && context.linesOfCode > 1000);
  
  // Determine complexity
  let complexity: TaskComplexity;
  let riskLevel: TaskRiskLevel;
  let reasoning: string;
  
  if (isCritical) {
    complexity = 'expert';
    riskLevel = 'critical';
    reasoning = `Critical domain detected: ${criticalMatches.join(', ')}. Requires highest quality reasoning to avoid costly errors.`;
  } else if (isComplex || hasLargeScope) {
    complexity = 'complex';
    riskLevel = 'high';
    reasoning = `Complex task detected: ${complexMatches.join(', ')}. Benefits from advanced reasoning capabilities.`;
  } else if (isSimple) {
    complexity = 'simple';
    riskLevel = 'low';
    reasoning = `Simple task detected: ${simpleMatches.join(', ')}. Can be handled efficiently by faster models.`;
  } else {
    complexity = 'medium';
    riskLevel = 'medium';
    reasoning = 'Standard development task. Balanced model provides best value.';
  }
  
  // Calculate confidence based on keyword matches
  const totalMatches = criticalMatches.length + complexMatches.length + simpleMatches.length;
  const confidence = Math.min(0.95, 0.6 + (totalMatches * 0.1));
  
  // Recommend models
  const recommendedModel = {
    anthropic: complexity === 'expert' ? 'claude-3-opus-20240229' :
               complexity === 'simple' ? 'claude-3-5-haiku-20241022' :
               'claude-3-5-sonnet-20241022',
    openai: complexity === 'expert' ? 'o1' :
            complexity === 'simple' ? 'gpt-4o-mini' :
            'gpt-4o',
    moonshot: complexity === 'expert' ? 'moonshot-v1-128k' :
              complexity === 'simple' ? 'moonshot-v1-8k' :
              'moonshot-v1-32k',
  };
  
  return {
    complexity,
    riskLevel,
    confidence,
    reasoning,
    recommendedModel,
    signals: {
      criticalKeywords: criticalMatches,
      domainIndicators: complexMatches,
      scopeIndicators: hasLargeScope ? ['large scope'] : [],
    },
  };
}

/**
 * Get cost justification for using a higher-tier model
 */
export function getCostJustification(analysis: ComplexityAnalysis): string {
  if (analysis.complexity === 'expert') {
    return `Using Opus (5x cost) is justified: ${analysis.reasoning} The cost of a bug in ${analysis.signals.criticalKeywords.join('/')} far exceeds the model cost.`;
  }
  if (analysis.complexity === 'complex') {
    return `Using Sonnet (3x cost vs Haiku) is justified: ${analysis.reasoning} Better reasoning reduces iteration cycles.`;
  }
  return `Using Haiku is cost-effective: ${analysis.reasoning}`;
}

