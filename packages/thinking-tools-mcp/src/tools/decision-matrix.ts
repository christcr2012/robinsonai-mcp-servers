/**
 * Decision Matrix Tool
 * Weighted decision-making framework for comparing options
 * Enhanced with context search to find relevant code/docs
 */

import { withContext } from '../lib/context-enhancer.js';

export interface DecisionMatrixInput {
  options: string[];
  criteria?: string[];
  weights?: number[];
  optionDetails?: Record<string, unknown>;
  context?: string;
  useContext?: boolean;
  contextQuery?: string;
}

export interface DecisionMatrixOutput {
  matrix: Array<{
    option: string;
    scores: Array<{ criterion: string; score: number; weight: number; weightedScore: number }>;
    totalScore: number;
    rank: number;
  }>;
  recommendation: string;
  tradeoffs: Array<{ option: string; strengths: string[]; weaknesses: string[] }>;
  confidence: number;
  reasoning: string;
}

type CanonicalCriterion =
  | 'cost'
  | 'performance'
  | 'maintainability'
  | 'scalability'
  | 'time'
  | 'expertise'
  | 'risk'
  | 'security'
  | 'compliance'
  | 'reliability'
  | 'support'
  | 'flexibility'
  | 'usability'
  | 'automation'
  | 'integration'
  | 'general';

const DEFAULT_CRITERIA = [
  'Cost',
  'Performance',
  'Maintainability',
  'Scalability',
  'Time to Implement',
  'Team Expertise',
  'Risk',
];

const PROFILE_WEIGHT_PRESETS: Record<string, Array<[CanonicalCriterion, number]>> = {
  startup: [
    ['cost', 0.24],
    ['time', 0.24],
    ['flexibility', 0.12],
    ['performance', 0.1],
    ['maintainability', 0.1],
    ['risk', 0.1],
    ['scalability', 0.1],
  ],
  enterprise: [
    ['reliability', 0.18],
    ['performance', 0.16],
    ['security', 0.14],
    ['compliance', 0.12],
    ['maintainability', 0.12],
    ['support', 0.1],
    ['cost', 0.08],
    ['time', 0.1],
  ],
  regulated: [
    ['compliance', 0.24],
    ['security', 0.2],
    ['risk', 0.16],
    ['reliability', 0.14],
    ['maintainability', 0.1],
    ['support', 0.08],
    ['cost', 0.08],
  ],
  operations: [
    ['reliability', 0.2],
    ['automation', 0.16],
    ['performance', 0.14],
    ['risk', 0.12],
    ['maintainability', 0.12],
    ['time', 0.1],
    ['cost', 0.08],
    ['integration', 0.08],
  ],
};

const CRITERIA_KEYWORDS: Record<CanonicalCriterion, { positive: string[]; negative: string[] }> = {
  cost: {
    positive: [
      'low cost',
      'lower cost',
      'reduces cost',
      'cost savings',
      'saves money',
      'affordable',
      'cheap',
      'free',
      'open source',
      'included',
      'shared infra',
      'no license',
      'no licensing',
      'no ai credits',
      'zero credits',
    ],
    negative: [
      'expensive',
      'higher cost',
      'cost increase',
      'premium',
      'license fee',
      'licensing',
      'over budget',
      'recurring fee',
      'per seat',
      'subscription',
      'usage fee',
    ],
  },
  performance: {
    positive: [
      'fast',
      'low latency',
      'optimized',
      'cache',
      'cached',
      'async',
      'parallel',
      'vectorized',
      'gpu',
      'efficient',
      'high throughput',
      'snappy',
    ],
    negative: [
      'slow',
      'blocking',
      'latency',
      'bottleneck',
      'performance issue',
      'heavy',
      'resource intensive',
      'sync only',
    ],
  },
  maintainability: {
    positive: [
      'simple',
      'clean',
      'documented',
      'readable',
      'modular',
      'standard',
      'convention',
      'well tested',
      'idiomatic',
      'scaffolded',
    ],
    negative: [
      'complex',
      'custom code',
      'legacy',
      'spaghetti',
      'unstructured',
      'manual maintenance',
      'brittle',
      'hard to maintain',
    ],
  },
  scalability: {
    positive: [
      'scales',
      'scalable',
      'autoscale',
      'cluster',
      'distributed',
      'sharded',
      'multi region',
      'horizontal',
      'elastic',
      'serverless',
    ],
    negative: [
      'single server',
      'monolith',
      'vertical scale',
      'limited scale',
      'no scaling',
      'single point of failure',
    ],
  },
  time: {
    positive: [
      'fast setup',
      'quick win',
      'ready-made',
      'turnkey',
      'out of box',
      'no code',
      'instant',
      'automated',
      'prebuilt',
      'hours',
      'days',
      'already built',
    ],
    negative: [
      'weeks',
      'months',
      'long setup',
      'custom build',
      'manual work',
      'slow rollout',
      'from scratch',
    ],
  },
  expertise: {
    positive: [
      'familiar',
      'known stack',
      'existing skills',
      'same stack',
      'common language',
      'no new tooling',
      'no training',
    ],
    negative: [
      'learning curve',
      'new stack',
      'requires specialist',
      'requires expertise',
      'rare expertise',
      'requires training',
    ],
  },
  risk: {
    positive: [
      'tested',
      'stable',
      'rollbacks',
      'monitoring',
      'alerts',
      'safety net',
      'proven',
      'mature',
      'backups',
      'fallback',
    ],
    negative: [
      'risky',
      'unknown',
      'experimental',
      'beta',
      'no tests',
      'manual fix',
      'no rollback',
      'unstable',
    ],
  },
  security: {
    positive: [
      'encrypted',
      'mfa',
      'sso',
      'least privilege',
      'compliant',
      'audit',
      'security review',
      'security hardening',
      'zero trust',
      'rbac',
    ],
    negative: [
      'no auth',
      'public access',
      'insecure',
      'breach',
      'weak security',
      'shared credentials',
      'no encryption',
    ],
  },
  compliance: {
    positive: [
      'gdpr',
      'hipaa',
      'pci',
      'sox',
      'fedramp',
      'audit trail',
      'policy',
      'compliant',
    ],
    negative: [
      'non compliant',
      'no compliance',
      'fails audit',
      'violates policy',
      'manual compliance',
    ],
  },
  reliability: {
    positive: [
      'reliable',
      'redundant',
      'ha',
      'failover',
      'uptime',
      'resilient',
      'self healing',
      'observability',
      'retry logic',
      'sla',
    ],
    negative: [
      'downtime',
      'outage',
      'single point',
      'fragile',
      'flaky',
      'no monitoring',
    ],
  },
  support: {
    positive: [
      'community',
      'docs',
      'maintained',
      'vendor support',
      'lts',
      'roadmap',
      'tutorials',
      'active contributors',
    ],
    negative: [
      'no support',
      'abandoned',
      'deprecated',
      'limited docs',
      'one maintainer',
      'unsupported',
    ],
  },
  flexibility: {
    positive: [
      'flexible',
      'configurable',
      'extensible',
      'customizable',
      'pluggable',
      'modular',
      'composable',
    ],
    negative: [
      'rigid',
      'fixed workflow',
      'locked in',
      'opinionated',
      'no customization',
    ],
  },
  usability: {
    positive: [
      'intuitive',
      'easy to use',
      'user-friendly',
      'clear ui',
      'simple workflow',
      'guided',
      'examples',
    ],
    negative: [
      'confusing',
      'steep learning curve',
      'manual steps',
      'complex interface',
      'clunky',
    ],
  },
  automation: {
    positive: [
      'automates',
      'workflow',
      'pipeline',
      'orchestrated',
      'hands-off',
      'self healing',
      'cron',
      'scheduled',
    ],
    negative: [
      'manual',
      'hand operated',
      'needs babysitting',
      'ad hoc',
      'manual trigger',
    ],
  },
  integration: {
    positive: [
      'integrates',
      'api',
      'webhook',
      'sdk',
      'plugin',
      'compatible',
      'adapter',
      'connector',
    ],
    negative: [
      'custom integration',
      'no api',
      'manual import',
      'no connector',
      'limited compatibility',
    ],
  },
  general: {
    positive: [
      'benefit',
      'improves',
      'strength',
      'advantage',
      'good fit',
      'wins',
      'recommended',
      'solid choice',
    ],
    negative: [
      'drawback',
      'concern',
      'weakness',
      'issue',
      'problem',
      'gap',
      'limitation',
    ],
  },
};

const CROSS_SIGNALS: Array<{
  pattern: RegExp;
  effects: Partial<Record<CanonicalCriterion, number>>;
}> = [
  {
    pattern: /serverless|managed service|hosted|saas|fully managed/i,
    effects: { maintainability: 10, time: 10, scalability: 8, cost: -6 },
  },
  {
    pattern: /self[- ]?hosted|on[- ]?prem|custom build|bespoke|roll your own/i,
    effects: { time: -10, maintainability: -8, cost: 6, flexibility: 6 },
  },
  {
    pattern: /open source|oss|apache|mit license/i,
    effects: { cost: 8, support: 4, flexibility: 4 },
  },
  {
    pattern: /vendor support|enterprise support|24\/7 support|sla/i,
    effects: { support: 10, risk: 4, cost: -6 },
  },
  {
    pattern: /cache|cdn|redis|queue|parallel|vector|gpu/i,
    effects: { performance: 8, scalability: 6 },
  },
  {
    pattern: /compliance|audit|regulat(ed|ion)|policy/i,
    effects: { compliance: 10, risk: 4 },
  },
  {
    pattern: /observability|monitoring|logging|tracing|metrics|telemetry/i,
    effects: { reliability: 8, risk: 6 },
  },
  {
    pattern: /automation|workflow|pipeline|orchestrat|scripting|auto[- ]?remediation/i,
    effects: { automation: 10, time: 6 },
  },
];

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function countKeywordHits(text: string, keywords: string[]): number {
  const haystack = text.toLowerCase();
  let count = 0;
  for (const keyword of keywords) {
    if (!keyword) continue;
    const pattern = new RegExp(`\\b${escapeRegExp(keyword.toLowerCase())}\\b`, 'g');
    const matches = haystack.match(pattern);
    if (matches) count += matches.length;
  }
  return count;
}

function canonicalCriterion(name: string): CanonicalCriterion {
  const n = name.toLowerCase();
  if (/cost|price|budget|expense|roi|credit/.test(n)) return 'cost';
  if (/performance|latency|speed|throughput|efficiency/.test(n)) return 'performance';
  if (/maintain|maintenance|supportability|operability|sustain/.test(n)) return 'maintainability';
  if (/scalab|scaling|capacity|load/.test(n)) return 'scalability';
  if (/time|velocity|delivery|implement|setup|lead time/.test(n)) return 'time';
  if (/expertise|skill|team|training|familiarity|learning/.test(n)) return 'expertise';
  if (/risk|uncertain|failure|stability|safety/.test(n)) return 'risk';
  if (/security|auth|encryption|privacy|secret|rbac/.test(n)) return 'security';
  if (/compliance|regulation|governance|gdpr|hipaa|pci|sox/.test(n)) return 'compliance';
  if (/reliab|uptime|availability|resilien|redundan|fault/.test(n)) return 'reliability';
  if (/support|community|docs|ecosystem|backing/.test(n)) return 'support';
  if (/flexib|custom|extensib|adapt|configur/.test(n)) return 'flexibility';
  if (/usab|ux|adoption|ease|friendly|learning/.test(n)) return 'usability';
  if (/automation|workflow|orchestrat|hands[- ]?off/.test(n)) return 'automation';
  if (/integration|compatible|api|ecosystem|connect/.test(n)) return 'integration';
  return 'general';
}

function flattenDetail(detail: unknown): string {
  if (!detail) return '';
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) return detail.map(flattenDetail).join(' ');
  if (typeof detail === 'object') {
    return Object.values(detail as Record<string, unknown>)
      .map(flattenDetail)
      .join(' ');
  }
  return '';
}

function deriveOptionContext(option: string, context: string | undefined, detail: unknown): string {
  const normalized = option.toLowerCase();
  const blocks = (context ?? '')
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean);

  const matchedBlocks = blocks.filter((block) => block.toLowerCase().includes(normalized));
  const inlineMatches = (context ?? '')
    .split('\n')
    .map((l) => l.trim())
    .filter((line) => line.toLowerCase().includes(normalized));

  const detailText = flattenDetail(detail);
  const combined = [...new Set([detailText, ...matchedBlocks, ...inlineMatches].filter(Boolean))].join(' ').trim();

  return combined || detailText || option;
}

function detectProfile(text: string): string {
  const lower = text.toLowerCase();
  if (/(startup|mvp|prototype|greenfield|bootstrapped)/.test(lower)) return 'startup';
  if (/(regulated|gdpr|hipaa|pci|sox|compliance|audit)/.test(lower)) return 'regulated';
  if (/(enterprise|mission critical|production|global|scale)/.test(lower)) return 'enterprise';
  if (/(incident|oncall|operations|slo|observability|automation)/.test(lower)) return 'operations';
  return 'balanced';
}

function findCriterion(criteria: string[], target: CanonicalCriterion): string | undefined {
  return criteria.find((criterion) => canonicalCriterion(criterion) === target);
}

function deriveWeights(criteria: string[], explicitWeights: number[] | undefined, contextText: string): Record<string, number> {
  const weights: Record<string, number> = {};

  if (explicitWeights && explicitWeights.length === criteria.length) {
    const absolute = explicitWeights.map((w) => Math.max(0, Math.abs(w)));
    const sum = absolute.reduce((acc, w) => acc + w, 0);
    if (sum > 0) {
      criteria.forEach((criterion, index) => {
        weights[criterion] = absolute[index] / sum;
      });
      return weights;
    }
  }

  const profile = detectProfile(contextText);
  const presets = PROFILE_WEIGHT_PRESETS[profile] ?? [];
  let assigned = 0;

  for (const [target, value] of presets) {
    const criterion = findCriterion(criteria, target);
    if (criterion && weights[criterion] === undefined) {
      weights[criterion] = value;
      assigned += value;
    }
  }

  const remaining = criteria.filter((criterion) => weights[criterion] === undefined);
  if (remaining.length > 0) {
    const remainingWeight = clamp(1 - assigned, 0, 1);
    const share = remaining.length ? remainingWeight / remaining.length : 0;
    for (const criterion of remaining) {
      weights[criterion] = share || 1 / criteria.length;
    }
  } else if (assigned !== 1) {
    const scale = assigned > 0 ? 1 / assigned : 1;
    for (const key of Object.keys(weights)) {
      weights[key] *= scale;
    }
  }

  return weights;
}

function applyCrossSignals(canonical: CanonicalCriterion, text: string): number {
  let delta = 0;
  for (const signal of CROSS_SIGNALS) {
    if (signal.pattern.test(text)) {
      delta += signal.effects[canonical] ?? 0;
    }
  }
  return delta;
}

function deterministicBias(option: string, criterion: string): number {
  const key = `${option}::${criterion}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return ((hash % 7) - 3) * 0.75; // -2.25 .. 3.0 roughly
}

function scoreCriterion(canonical: CanonicalCriterion, option: string, optionContext: string, criteriaCount: number): number {
  const heuristics = CRITERIA_KEYWORDS[canonical] ?? CRITERIA_KEYWORDS.general;
  const contextLower = optionContext.toLowerCase();

  const positiveHits = countKeywordHits(contextLower, heuristics.positive);
  const negativeHits = countKeywordHits(contextLower, heuristics.negative);

  let score = 50;
  score += Math.min(28, positiveHits * 9);
  score -= Math.min(32, negativeHits * 11);

  score += applyCrossSignals(canonical, contextLower);

  if (positiveHits === 0 && negativeHits === 0) {
    const generalPos = countKeywordHits(contextLower, CRITERIA_KEYWORDS.general.positive);
    const generalNeg = countKeywordHits(contextLower, CRITERIA_KEYWORDS.general.negative);
    score += Math.min(18, generalPos * 6);
    score -= Math.min(20, generalNeg * 7);
  }

  if (positiveHits === 0 && negativeHits === 0) {
    score += deterministicBias(option, canonical);
  }

  // Small adjustment based on how much narrative exists for the option.
  const words = optionContext.split(/\s+/).filter(Boolean).length;
  if (words > 0) {
    const adjustment = clamp((words - 40) / 4, -8, 8);
    score += adjustment / Math.max(1, criteriaCount / 2);
  }

  return clamp(score, 15, 95);
}

export function decisionMatrix(input: DecisionMatrixInput): DecisionMatrixOutput {
  const { options, context = '' } = input;
  if (!options || options.length === 0) {
    throw new Error('At least one option is required');
  }

  const criteriaList = input.criteria && input.criteria.length > 0 ? input.criteria : DEFAULT_CRITERIA;
  const weights = deriveWeights(criteriaList, input.weights, context);

  const optionContexts = new Map<string, string>();
  options.forEach((option) => {
    const detail = input.optionDetails ? input.optionDetails[option] : undefined;
    optionContexts.set(option, deriveOptionContext(option, context, detail));
  });

  const matrix: Array<{
    option: string;
    scores: Array<{ criterion: string; score: number; weight: number; weightedScore: number }>;
    totalScore: number;
    rank: number;
  }> = [];

  const tradeoffs: Array<{ option: string; strengths: string[]; weaknesses: string[] }> = [];

  options.forEach((option) => {
    const optionContext = optionContexts.get(option) ?? option;
    const scores: Array<{ criterion: string; score: number; weight: number; weightedScore: number }> = [];
    const strengths: string[] = [];
    const weaknesses: string[] = [];

    criteriaList.forEach((criterion) => {
      const canonical = canonicalCriterion(criterion);
      const weight = weights[criterion] ?? 1 / criteriaList.length;
      const score = scoreCriterion(canonical, option, optionContext, criteriaList.length);
      const weightedScore = score * weight;

      scores.push({
        criterion,
        score,
        weight,
        weightedScore,
      });

      if (score >= 78) {
        strengths.push(`${criterion}: ${score.toFixed(0)}/100`);
      } else if (score <= 42) {
        weaknesses.push(`${criterion}: ${score.toFixed(0)}/100`);
      }
    });

    const totalScore = scores.reduce((sum, s) => sum + s.weightedScore, 0);
    matrix.push({ option, scores, totalScore, rank: 0 });
    tradeoffs.push({ option, strengths, weaknesses });
  });

  matrix.sort((a, b) => b.totalScore - a.totalScore);
  matrix.forEach((item, index) => {
    item.rank = index + 1;
  });

  const winner = matrix[0];
  const runnerUp = matrix[1];

  const spread = runnerUp ? winner.totalScore - runnerUp.totalScore : 12;
  const profile = detectProfile(context);

  let recommendation = `Recommended: ${winner.option} (score: ${winner.totalScore.toFixed(1)})`;
  if (runnerUp && Math.abs(spread) < 4) {
    recommendation += ` – very close to ${runnerUp.option} (${runnerUp.totalScore.toFixed(1)}). Consider pilot tests for both.`;
  } else if (runnerUp) {
    recommendation += ` – clear lead over ${runnerUp.option} (${runnerUp.totalScore.toFixed(1)})`;
  }

  const confidenceBase = 58 + clamp(spread * 0.9, -12, 22);
  const coverageBonus = clamp(criteriaList.length * 2.5, 4, 18);
  const narrativeBonus = clamp((optionContexts.get(winner.option)?.split(/\s+/).length ?? 0) / 6, 0, 12);
  const confidence = clamp(confidenceBase + coverageBonus + narrativeBonus, 45, 95);

  const reasoningParts = [
    `Evaluated ${options.length} options across ${criteriaList.length} criteria with weighted scoring.`,
    profile !== 'balanced'
      ? `Weighting emphasised ${profile === 'regulated' ? 'compliance and security requirements' : profile} priorities based on the brief.`
      : 'Balanced weighting applied because no dominant constraints were detected.',
    `Top option scored ${winner.totalScore.toFixed(1)}/100${runnerUp ? ` vs ${runnerUp.option} (${runnerUp.totalScore.toFixed(1)})` : ''}.`,
  ];

  const reasoning = reasoningParts.join(' ');

  return {
    matrix,
    recommendation,
    tradeoffs,
    confidence,
    reasoning,
  };
}

/**
 * Enhanced version with context search
 */
export const decisionMatrixEnhanced = withContext(
  decisionMatrix,
  (input) => {
    const detailText = input.optionDetails
      ? Object.entries(input.optionDetails)
          .map(([name, detail]) => `${name}: ${flattenDetail(detail)}`)
          .join(' ')
      : '';

    return `${input.options.join(' ')} ${input.context || ''} ${detailText}`.slice(0, 400);
  }
);

