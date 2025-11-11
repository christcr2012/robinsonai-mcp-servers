/**
 * Prompt Module
 *
 * Combines system prompt design with task-specific prompts.
 * Integrates goals, role, instructions, guardrails, and context.
 */

import { buildSystemPrompt, PromptConfig, validatePromptConfig, createPromptConfig } from "./system.js";
import { DEFAULT_GUARDS, getGuardrailsByCategory, mergeGuardrails, createCustomGuardrails } from "./guardrails.js";
import { makeHouseRules, buildPromptWithContext } from "../pipeline/prompt.js";

/**
 * Build complete system prompt with guardrails
 *
 * @param cfg - Prompt configuration (goals, role, instructions)
 * @param brief - Project brief for house rules
 * @param extraGuards - Additional guardrails to include
 * @returns Complete system prompt string
 */
export function makeSystem(
  cfg: Omit<PromptConfig, "constraints"> & { extraGuards?: string[] },
  brief: any
): string {
  // Validate configuration
  const validation = validatePromptConfig(cfg);
  if (!validation.valid) {
    console.warn("[Prompt] Configuration validation warnings:", validation.errors);
  }

  // Combine guardrails: defaults + house rules + extra
  const houseRules = makeHouseRules(brief);
  const houseRulesArray = typeof houseRules === 'string' ? [houseRules] : houseRules;
  const constraints = [
    ...DEFAULT_GUARDS,
    ...(cfg.extraGuards ?? []),
    ...houseRulesArray
  ];

  // Build and return system prompt
  return buildSystemPrompt({
    ...cfg,
    constraints
  });
}

/**
 * Build task-specific user prompt with context
 *
 * @param task - Task description
 * @param ctx - Context including brief, glossary, nearby files
 * @returns Task-specific user prompt string
 */
export function makeTaskUserPrompt(
  task: string,
  ctx: {
    brief: any;
    glossary: any[];
    nearby?: { path: string; content: string }[];
  }
): string {
  return buildPromptWithContext({
    task,
    brief: ctx.brief,
    glossary: ctx.glossary,
    nearby: ctx.nearby
  });
}

/**
 * Create a complete prompt pair (system + user)
 *
 * @param task - Task description
 * @param cfg - Prompt configuration
 * @param ctx - Context
 * @returns Object with system and user prompts
 */
export function makePromptPair(
  task: string,
  cfg: Omit<PromptConfig, "constraints"> & { extraGuards?: string[] },
  ctx: {
    brief: any;
    glossary: any[];
    nearby?: { path: string; content: string }[];
  }
): {
  system: string;
  user: string;
} {
  return {
    system: makeSystem(cfg, ctx.brief),
    user: makeTaskUserPrompt(task, ctx)
  };
}

/**
 * Create a prompt configuration from a template
 *
 * @param template - Template name ("default", "strict", "creative") or custom config
 * @returns Prompt configuration
 */
export function createPromptTemplate(
  template: "default" | "strict" | "creative" | PromptConfig
): PromptConfig {
  return createPromptConfig(template);
}

/**
 * Get guardrails by category
 *
 * @param category - Category of guardrails
 * @returns Array of guardrails
 */
export function getGuardrails(
  category: "default" | "security" | "performance" | "testing" | "quality" | "documentation" = "default"
): string[] {
  return getGuardrailsByCategory(category);
}

/**
 * Merge guardrails from multiple categories
 *
 * @param categories - Categories to merge
 * @returns Combined guardrails
 */
export function combineGuardrails(...categories: string[][]): string[] {
  return mergeGuardrails(...categories);
}

/**
 * Create custom guardrails
 *
 * @param base - Base guardrails
 * @param additions - Guardrails to add
 * @param removals - Guardrails to remove
 * @returns Custom guardrails
 */
export function customGuardrails(
  base?: string[],
  additions?: string[],
  removals?: string[]
): string[] {
  return createCustomGuardrails(base, additions, removals);
}

/**
 * Export all prompt utilities
 */
export * from "./system.js";
export * from "./guardrails.js";

