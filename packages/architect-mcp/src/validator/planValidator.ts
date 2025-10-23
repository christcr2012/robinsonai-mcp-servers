/**
 * Plan Validator
 * 
 * VALIDATION RULES (HARD REQUIREMENTS):
 * Every step in a WorkPlan must contain:
 * 1. repo + branch (e.g., "main", "feature/*")
 * 2. file target(s) or glob pattern (exact paths, no generics)
 * 3. specific tool binding (server.namespace.tool + all required params)
 * 4. diff policy ("patch-only" - no full file rewrites)
 * 5. tests to run and pass (successSignals - specific test commands/files)
 * 
 * If ANY step fails validation, export_workplan_to_optimizer MUST fail
 * with detailed errors. Caller must use revise_plan to fix, then re-export.
 */

export interface ValidationError {
  step_index: number;
  step_title: string;
  errors: string[];
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: string[];
}

export interface WorkStep {
  title: string;
  description?: string;
  repo?: string;
  branch?: string;
  files?: string[];
  glob?: string;
  tool?: string;
  params?: Record<string, any>;
  diff_policy?: string;
  tests?: string[];
  success_signals?: string[];
}

/**
 * Validate a single work step
 */
function validateStep(step: WorkStep, index: number): string[] {
  const errors: string[] = [];
  
  // 1. Check repo + branch
  if (!step.repo || step.repo.trim().length === 0) {
    errors.push('Missing required field: repo');
  }
  
  if (!step.branch || step.branch.trim().length === 0) {
    errors.push('Missing required field: branch');
  }
  
  // 2. Check file targets or glob
  const hasFiles = step.files && step.files.length > 0;
  const hasGlob = step.glob && step.glob.trim().length > 0;
  
  if (!hasFiles && !hasGlob) {
    errors.push('Missing file targets: must specify either "files" array or "glob" pattern');
  }
  
  // Check for generic/placeholder file paths
  if (hasFiles) {
    for (const file of step.files!) {
      if (file.includes('[') || file.includes('TODO') || file.includes('...')) {
        errors.push(`Generic/placeholder file path not allowed: "${file}"`);
      }
    }
  }
  
  if (hasGlob && (step.glob!.includes('[') || step.glob!.includes('TODO'))) {
    errors.push(`Generic/placeholder glob pattern not allowed: "${step.glob}"`);
  }
  
  // 3. Check tool binding
  if (!step.tool || step.tool.trim().length === 0) {
    errors.push('Missing required field: tool (must be specific MCP tool like "github.open_pr_with_changes")');
  } else {
    // Tool must be in format: server.tool or server.namespace.tool
    if (!step.tool.includes('.')) {
      errors.push(`Invalid tool format: "${step.tool}" (must be "server.tool" or "server.namespace.tool")`);
    }
  }
  
  // Check tool params
  if (!step.params || Object.keys(step.params).length === 0) {
    errors.push('Missing required field: params (tool parameters cannot be empty)');
  }
  
  // 4. Check diff policy
  if (!step.diff_policy || step.diff_policy !== 'patch-only') {
    errors.push('Missing or invalid diff_policy: must be "patch-only" (no full file rewrites)');
  }
  
  // 5. Check tests/success signals
  const hasTests = step.tests && step.tests.length > 0;
  const hasSignals = step.success_signals && step.success_signals.length > 0;
  
  if (!hasTests && !hasSignals) {
    errors.push('Missing success criteria: must specify either "tests" or "success_signals"');
  }
  
  // Check for generic test descriptions
  if (hasTests) {
    for (const test of step.tests!) {
      if (test.includes('TODO') || test.includes('...') || test.toLowerCase().includes('run tests')) {
        errors.push(`Generic test description not allowed: "${test}" (must be specific command or file)`);
      }
    }
  }
  
  return errors;
}

/**
 * Validate entire work plan
 */
export function validateWorkPlan(steps: WorkStep[]): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];
  
  if (!steps || steps.length === 0) {
    return {
      valid: false,
      errors: [{
        step_index: -1,
        step_title: 'N/A',
        errors: ['Work plan is empty - no steps to validate'],
      }],
      warnings: [],
    };
  }
  
  // Validate each step
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const stepErrors = validateStep(step, i);
    
    if (stepErrors.length > 0) {
      errors.push({
        step_index: i,
        step_title: step.title || `Step ${i + 1}`,
        errors: stepErrors,
      });
    }
  }
  
  // Check for warnings
  if (steps.length > 40) {
    warnings.push(`Plan has ${steps.length} steps (max recommended: 40). Consider breaking into smaller phases.`);
  }
  
  const totalFiles = steps.reduce((sum, step) => sum + (step.files?.length || 0), 0);
  if (totalFiles > 40) {
    warnings.push(`Plan modifies ${totalFiles} files (max recommended: 40). Consider breaking into smaller phases.`);
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Format validation errors for display
 */
export function formatValidationErrors(result: ValidationResult): string {
  if (result.valid) {
    return '✅ Plan validation passed';
  }
  
  let output = '❌ Plan validation failed:\n\n';
  
  for (const error of result.errors) {
    output += `Step ${error.step_index + 1}: ${error.step_title}\n`;
    for (const err of error.errors) {
      output += `  - ${err}\n`;
    }
    output += '\n';
  }
  
  if (result.warnings.length > 0) {
    output += '⚠️  Warnings:\n';
    for (const warning of result.warnings) {
      output += `  - ${warning}\n`;
    }
  }
  
  output += '\nFix these errors using revise_plan, then re-export.';
  
  return output;
}

