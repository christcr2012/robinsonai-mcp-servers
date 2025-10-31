/**
 * Policy configuration for OpenAI Worker
 */

export interface PolicyConfig {
  MONTHLY_BUDGET: number;
  MAX_CONCURRENCY: number;
  PER_JOB_TOKEN_LIMIT: number;
}

const DEFAULT_POLICY: PolicyConfig = {
  MONTHLY_BUDGET: parseFloat(process.env.MONTHLY_BUDGET || '25'),
  MAX_CONCURRENCY: Math.min(parseInt(process.env.MAX_OPENAI_CONCURRENCY || '10', 10), 15),
  PER_JOB_TOKEN_LIMIT: parseInt(process.env.PER_JOB_TOKEN_LIMIT || '8192', 10),
};

let currentPolicy: PolicyConfig = { ...DEFAULT_POLICY };

export function getPolicy(): PolicyConfig {
  return currentPolicy;
}

export function updatePolicy(updates: Partial<PolicyConfig>): void {
  currentPolicy = { ...currentPolicy, ...updates };
}

