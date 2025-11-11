/**
 * System Prompt Builder
 *
 * Constructs the system prompt with:
 * - Goals (what the agent should achieve)
 * - Role (who the agent is)
 * - Instructions (how to work)
 * - Constraints/Guardrails (what not to do)
 */

export type PromptConfig = {
  goals: string[];
  role: string;
  instructions: string[];
  constraints: string[];
};

/**
 * Build system prompt from configuration
 *
 * @param cfg - Prompt configuration with goals, role, instructions, constraints
 * @returns Formatted system prompt string
 *
 * @example
 * ```typescript
 * const prompt = buildSystemPrompt({
 *   goals: [
 *     "Ship production-grade features end-to-end",
 *     "Reuse existing symbols and utilities"
 *   ],
 *   role: "Senior Full-Stack Engineer agent",
 *   instructions: [
 *     "Read project brief before coding",
 *     "Run quality gates and auto-refine"
 *   ],
 *   constraints: [
 *     "Never invent APIs",
 *     "Prefer tool calls over shell scripts"
 *   ]
 * });
 * ```
 */
export function buildSystemPrompt(cfg: PromptConfig): string {
  const sections: string[] = [
    "You are the Free Agent for this repository.",
    "",
    "== GOALS ==",
    ...cfg.goals.map(g => `- ${g}`),
    "",
    "== ROLE ==",
    cfg.role,
    "",
    "== INSTRUCTIONS ==",
    ...cfg.instructions.map(i => `- ${i}`),
    "",
    "== CONSTRAINTS / GUARDRAILS ==",
    ...cfg.constraints.map(c => `- ${c}`)
  ];

  return sections.join("\n");
}

/**
 * Validate prompt configuration
 *
 * @param cfg - Configuration to validate
 * @returns Validation result with errors if any
 */
export function validatePromptConfig(cfg: Partial<PromptConfig>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!cfg.goals || cfg.goals.length === 0) {
    errors.push("At least one goal is required");
  }

  if (!cfg.role || cfg.role.trim().length === 0) {
    errors.push("Role is required and cannot be empty");
  }

  if (!cfg.instructions || cfg.instructions.length === 0) {
    errors.push("At least one instruction is required");
  }

  if (!cfg.constraints || cfg.constraints.length === 0) {
    errors.push("At least one constraint is required");
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Merge two prompt configurations
 *
 * @param base - Base configuration
 * @param override - Configuration to merge in
 * @returns Merged configuration
 */
export function mergePromptConfigs(
  base: PromptConfig,
  override: Partial<PromptConfig>
): PromptConfig {
  return {
    goals: override.goals ?? base.goals,
    role: override.role ?? base.role,
    instructions: override.instructions ?? base.instructions,
    constraints: override.constraints ?? base.constraints
  };
}

/**
 * Create a prompt configuration from a template
 *
 * @param template - Template name or custom config
 * @returns Prompt configuration
 */
export function createPromptConfig(
  template: "default" | "strict" | "creative" | PromptConfig
): PromptConfig {
  if (typeof template === "object") {
    return template;
  }

  const templates: Record<string, PromptConfig> = {
    default: {
      goals: [
        "Ship production-grade features end-to-end (API, UI, tests).",
        "Reuse existing symbols/utilities; keep the codebase idiomatic."
      ],
      role: "Senior Full-Stack Engineer agent for this monorepo.",
      instructions: [
        "Read project brief & glossary before coding.",
        "If external API needed, call docsSearch first.",
        "Run quality gates; auto-refine until clean."
      ],
      constraints: [
        "Never invent APIs; use existing repo utilities or official docs.",
        "Prefer tool calls (deployment, DB, Vercel, GitHub) over shell scripts.",
        "Produce complete, runnable code with correct imports and tests.",
        "If uncertain, ask for minimal missing fact via tool/doc lookup.",
        "Keep patches minimal and reversible; avoid project-wide churn unless asked."
      ]
    },
    strict: {
      goals: [
        "Produce only production-ready code.",
        "Zero tolerance for placeholders, TODOs, or incomplete implementations."
      ],
      role: "Strict code quality enforcer.",
      instructions: [
        "Validate all code against project conventions.",
        "Run all quality gates before returning.",
        "Provide detailed explanations for all decisions."
      ],
      constraints: [
        "No placeholders or TODOs allowed.",
        "All code must be fully tested.",
        "All imports must be verified.",
        "All types must be explicit.",
        "No shell scripts; use proper APIs only."
      ]
    },
    creative: {
      goals: [
        "Explore multiple solution approaches.",
        "Suggest improvements and optimizations.",
        "Balance innovation with maintainability."
      ],
      role: "Creative problem-solver and architect.",
      instructions: [
        "Consider multiple design patterns.",
        "Suggest performance optimizations.",
        "Propose architectural improvements."
      ],
      constraints: [
        "All suggestions must be production-ready.",
        "Maintain backward compatibility.",
        "Document all design decisions.",
        "Provide migration paths for breaking changes."
      ]
    }
  };

  return templates[template] || templates.default;
}

