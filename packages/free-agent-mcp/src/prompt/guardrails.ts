/**
 * Guardrails for Free Agent
 *
 * Minimal guardrails merged into every prompt to ensure:
 * - No API hallucination
 * - Proper tool usage
 * - Complete, runnable code
 * - Minimal, reversible patches
 */

/**
 * Default guardrails applied to all prompts
 */
export const DEFAULT_GUARDS = [
  "Never invent APIs; use existing repo utilities or official docs.",
  "Prefer tool calls (deployment, DB, Vercel, GitHub) over shell scripts.",
  "Produce complete, runnable code with correct imports and tests.",
  "If you are uncertain, ask for the minimal missing fact via a tool/doc lookup.",
  "Keep patches minimal and reversible; avoid project-wide churn unless asked."
];

/**
 * Security guardrails
 */
export const SECURITY_GUARDS = [
  "Never expose secrets or credentials in code.",
  "Always use environment variables for sensitive data.",
  "Validate all user inputs before processing.",
  "Use parameterized queries for database operations.",
  "Sanitize all external data before use."
];

/**
 * Performance guardrails
 */
export const PERFORMANCE_GUARDS = [
  "Avoid N+1 queries; use batch operations.",
  "Cache frequently accessed data.",
  "Use lazy loading for large datasets.",
  "Optimize database indexes for common queries.",
  "Profile code before optimizing."
];

/**
 * Testing guardrails
 */
export const TESTING_GUARDS = [
  "Write tests for all public APIs.",
  "Aim for >= 80% code coverage.",
  "Test both happy path and error cases.",
  "Use meaningful test names and descriptions.",
  "Mock external dependencies in tests."
];

/**
 * Code quality guardrails
 */
export const QUALITY_GUARDS = [
  "Follow project naming conventions.",
  "Keep functions small and focused.",
  "Use meaningful variable names.",
  "Add JSDoc comments for public APIs.",
  "Avoid deeply nested code (max 3 levels)."
];

/**
 * Documentation guardrails
 */
export const DOCUMENTATION_GUARDS = [
  "Document all public APIs with JSDoc.",
  "Include usage examples in comments.",
  "Update README if adding new features.",
  "Document breaking changes clearly.",
  "Keep documentation in sync with code."
];

/**
 * Get guardrails by category
 *
 * @param category - Category of guardrails to retrieve
 * @returns Array of guardrails for the category
 */
export function getGuardrailsByCategory(
  category: "default" | "security" | "performance" | "testing" | "quality" | "documentation"
): string[] {
  const categories: Record<string, string[]> = {
    default: DEFAULT_GUARDS,
    security: SECURITY_GUARDS,
    performance: PERFORMANCE_GUARDS,
    testing: TESTING_GUARDS,
    quality: QUALITY_GUARDS,
    documentation: DOCUMENTATION_GUARDS
  };

  return categories[category] || DEFAULT_GUARDS;
}

/**
 * Merge multiple guardrail categories
 *
 * @param categories - Categories to merge
 * @returns Combined guardrails with duplicates removed
 */
export function mergeGuardrails(...categories: string[][]): string[] {
  const merged = new Set<string>();
  categories.forEach(cat => cat.forEach(g => merged.add(g)));
  return Array.from(merged);
}

/**
 * Create custom guardrails set
 *
 * @param base - Base guardrails to start with
 * @param additions - Additional guardrails to add
 * @param removals - Guardrails to remove
 * @returns Custom guardrails set
 */
export function createCustomGuardrails(
  base: string[] = DEFAULT_GUARDS,
  additions: string[] = [],
  removals: string[] = []
): string[] {
  const removalSet = new Set(removals);
  const filtered = base.filter(g => !removalSet.has(g));
  return [...filtered, ...additions];
}

/**
 * Format guardrails for display
 *
 * @param guardrails - Guardrails to format
 * @returns Formatted string for display
 */
export function formatGuardrails(guardrails: string[]): string {
  return guardrails.map((g, i) => `${i + 1}. ${g}`).join("\n");
}

/**
 * Validate code against guardrails
 *
 * @param code - Code to validate
 * @param guardrails - Guardrails to check against
 * @returns Validation result with violations if any
 */
export function validateAgainstGuardrails(
  code: string,
  guardrails: string[] = DEFAULT_GUARDS
): {
  valid: boolean;
  violations: string[];
} {
  const violations: string[] = [];

  // Check for common violations
  if (code.includes("TODO") || code.includes("FIXME")) {
    violations.push("Code contains TODO or FIXME comments (violates: complete code requirement)");
  }

  if (code.includes("console.log") && !code.includes("logger")) {
    violations.push("Code uses console.log instead of proper logging (violates: production-ready code)");
  }

  if (code.includes("any") && code.includes("as any")) {
    violations.push("Code uses 'as any' type assertion (violates: type safety requirement)");
  }

  if (code.includes("eval(") || code.includes("Function(")) {
    violations.push("Code uses eval or Function constructor (violates: security guardrail)");
  }

  if (code.includes("password") && !code.includes("process.env")) {
    violations.push("Code may contain hardcoded credentials (violates: security guardrail)");
  }

  return {
    valid: violations.length === 0,
    violations
  };
}

