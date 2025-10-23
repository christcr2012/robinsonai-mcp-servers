/**
 * Incremental Planning System
 *
 * Plans work in 5-second slices to avoid timeouts.
 * Returns plan_id immediately, continues planning in background.
 */

import { mkdirSync, existsSync } from 'fs';
import Database from 'better-sqlite3';
import { join } from 'path';
import { ollamaGenerate, pingOllama } from '@robinsonai/shared-llm';
import { getSpecById } from '../specs/store.js';
// Node 18+ has global fetch; AbortSignal.timeout is available in Node 18+

const DATA_DIR = join(process.cwd(), 'packages', 'architect-mcp', 'data');
mkdirSync(DATA_DIR, { recursive: true });
const DB_PATH = join(DATA_DIR, 'architect.db');

const db = new Database(DB_PATH);

// Create plans table
db.exec(`
  CREATE TABLE IF NOT EXISTS plans (
    plan_id INTEGER PRIMARY KEY AUTOINCREMENT,
    goal TEXT,
    spec_id INTEGER,
    mode TEXT DEFAULT 'skeleton',
    state TEXT DEFAULT 'planning',
    progress INTEGER DEFAULT 0,
    steps_json TEXT,
    summary TEXT,
    created_at INTEGER NOT NULL,
    started_at INTEGER,
    finished_at INTEGER,
    error TEXT,
    budgets_json TEXT
  )
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_plans_state 
  ON plans(state)
`);

const insertPlan = db.prepare(`
  INSERT INTO plans (goal, spec_id, mode, state, created_at, budgets_json)
  VALUES (?, ?, ?, 'planning', ?, ?)
`);

const updatePlanProgress = db.prepare(`
  UPDATE plans 
  SET progress = ?, steps_json = ?, summary = ?
  WHERE plan_id = ?
`);

const updatePlanState = db.prepare(`
  UPDATE plans 
  SET state = ?, finished_at = ?, error = ?
  WHERE plan_id = ?
`);

const getPlan = db.prepare(`
  SELECT * FROM plans WHERE plan_id = ?
`);

export interface PlanBudgets {
  max_steps?: number;
  time_ms?: number;
  max_files_changed?: number;
}

export interface Plan {
  plan_id: number;
  goal: string | null;
  spec_id: number | null;
  mode: string;
  state: 'planning' | 'done' | 'failed';
  progress: number;
  steps_json: string | null;
  summary: string | null;
  created_at: number;
  started_at: number | null;
  finished_at: number | null;
  error: string | null;
  budgets_json: string | null;
}

/**
 * Environment defaults
 */
const ENV_DEFAULTS = {
  ARCHITECT_PLANNER_TIME_MS: 90000,
  ARCHITECT_PLANNER_SLICE_MS: 5000,
  ARCHITECT_MAX_STEPS: 12,
  ARCHITECT_MAX_FILES_CHANGED: 40,
};

function now() { return Date.now(); }

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, rej) => setTimeout(() => rej(new Error(`timeout after ${ms}ms`)), ms))
  ]) as Promise<T>;
}

function getEnvNumber(key: string, defaultValue: number): number {
  const value = process.env[key];
  return value ? parseInt(value, 10) : defaultValue;
}

/**
 * Create a new plan (returns immediately with plan_id)
 */
export function createPlan(
  goal: string | null,
  specId: number | null,
  mode: 'skeleton' | 'refine' | string = 'skeleton',
  budgets?: PlanBudgets
): { plan_id: number; summary: string } {
  const defaultBudgets: PlanBudgets = {
    max_steps: getEnvNumber('ARCHITECT_MAX_STEPS', ENV_DEFAULTS.ARCHITECT_MAX_STEPS),
    time_ms: getEnvNumber('ARCHITECT_PLANNER_TIME_MS', ENV_DEFAULTS.ARCHITECT_PLANNER_TIME_MS),
    max_files_changed: getEnvNumber('ARCHITECT_MAX_FILES_CHANGED', ENV_DEFAULTS.ARCHITECT_MAX_FILES_CHANGED),
  };
  
  const finalBudgets = { ...defaultBudgets, ...budgets };
  
  const result = insertPlan.run(
    goal,
    specId,
    mode,
    Date.now(),
    JSON.stringify(finalBudgets)
  );
  
  const planId = result.lastInsertRowid as number;
  
  // Start background planning
  startBackgroundPlanning(planId, finalBudgets);
  
  return {
    plan_id: planId,
    summary: `Plan ${planId} created in ${mode} mode. Planning in background...`,
  };
}

/**
 * Get plan status
 */
export function getPlanStatus(planId: number): {
  plan_id: number;
  state: string;
  progress: number;
  summary: string | null;
  steps_count: number;
  error: string | null;
} {
  const plan = getPlan.get(planId) as Plan | undefined;
  
  if (!plan) {
    throw new Error(`Plan ${planId} not found`);
  }
  
  const steps = plan.steps_json ? JSON.parse(plan.steps_json) : [];
  
  return {
    plan_id: plan.plan_id,
    state: plan.state,
    progress: plan.progress,
    summary: plan.summary,
    steps_count: steps.length,
    error: plan.error,
  };
}

/**
 * Get plan chunk (paged retrieval)
 */
export function getPlanChunk(planId: number, from: number, size: number = 10): {
  plan_id: number;
  steps: any[];
  from: number;
  size: number;
  total: number;
  has_more: boolean;
} {
  const plan = getPlan.get(planId) as Plan | undefined;
  
  if (!plan) {
    throw new Error(`Plan ${planId} not found`);
  }
  
  const allSteps = plan.steps_json ? JSON.parse(plan.steps_json) : [];
  const chunk = allSteps.slice(from, from + size);
  
  return {
    plan_id: planId,
    steps: chunk,
    from,
    size: chunk.length,
    total: allSteps.length,
    has_more: (from + size) < allSteps.length,
  };
}

/**
 * Generate steps from spec using LLM or fallback
 */
async function generateStepsFromSpec(specText: string, maxSteps: number, sliceMs: number): Promise<any[]> {
  const reachable = await pingOllama(1000);

  if (reachable) {
    const model = process.env.ARCHITECT_STD_MODEL || 'deepseek-coder:33b';
    const prompt = [
      "You are a senior software architect. Given a requirement/spec, produce a small JSON array of",
      "concrete implementation steps that this system can execute using tools like:",
      "file.patch_edit, npm.install_package, playwright.create_test, github.open_pr_with_changes.",
      "Each item must be {title, tool, params}. Limit to " + maxSteps + " steps. Respond with JSON only.",
      "", "SPEC:", specText
    ].join("\n");

    try {
      // keep below the slice budget; never let this block the whole planner
      const budgetMs = Math.max(1500, Math.min(4000, sliceMs - 500));
      const out = await withTimeout(ollamaGenerate({ model, prompt }), budgetMs);
      const raw = typeof out === 'string' ? out : '';
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) return parsed.slice(0, maxSteps);
    } catch { /* fall through to deterministic fallback */ }
  }

  // Deterministic skeleton (no AI)
  return [
    { title: "Scaffold tests", tool: "npm.install_package", params: { package: "vitest", dev: true } },
    { title: "Implement feature", tool: "file.patch_edit", params: { path: "src/index.ts", patch: "// TODO: implement\n" } },
    { title: "Create browser test", tool: "playwright.create_test", params: { name: "basic.spec.ts", target: "src/index.ts" } },
    { title: "Run tests", tool: "npm.install_package", params: { package: "tsx", dev: true } },
    { title: "Open PR", tool: "github.open_pr_with_changes", params: { branch: "feat/auto-plan", title: "Auto Plan", body: "Generated by Architect MCP" } }
  ].slice(0, maxSteps);
}

/**
 * Background planning loop (5-second slices)
 */
async function startBackgroundPlanning(planId: number, budgets: PlanBudgets): Promise<void> {
  const sliceMs = getEnvNumber('ARCHITECT_PLANNER_SLICE_MS', ENV_DEFAULTS.ARCHITECT_PLANNER_SLICE_MS);
  const maxTimeMs = budgets.time_ms || ENV_DEFAULTS.ARCHITECT_PLANNER_TIME_MS;
  const maxSteps = budgets.max_steps || ENV_DEFAULTS.ARCHITECT_MAX_STEPS;

  const startTime = now();
  let steps: any[] = [];
  let progress = 0;

  try {
    // Get plan details
    const plan = getPlan.get(planId) as Plan;

    // Get spec if provided
    let specText = '';
    if (plan.spec_id) {
      const spec = getSpecById(plan.spec_id);
      if (spec) {
        specText = spec.text;
      }
    } else if (plan.goal) {
      specText = plan.goal;
    }

    if (!specText) {
      throw new Error('No specification or goal provided');
    }

    // Generate steps using LLM or fallback
    steps = await generateStepsFromSpec(specText, maxSteps, sliceMs);

    console.error(`[Architect] Generated ${steps.length} steps from spec`);

    progress = 100;

    // Update progress
    updatePlanProgress.run(
      progress,
      JSON.stringify(steps),
      `Generated ${steps.length} steps`,
      planId
    );

    // Mark as done
    updatePlanState.run('done', Date.now(), null, planId);

  } catch (error: any) {
    // Mark as failed
    updatePlanState.run('failed', Date.now(), error.message, planId);
  }
}

/**
 * Get full plan (for export)
 */
export function getFullPlan(planId: number): Plan {
  const plan = getPlan.get(planId) as Plan | undefined;
  
  if (!plan) {
    throw new Error(`Plan ${planId} not found`);
  }
  
  return plan;
}

