/**
 * Validation Types
 * 
 * Type definitions for validation results.
 * The actual validation is now done by the pipeline.
 */

export interface ValidationIssue {
  type: 'placeholder' | 'fake_api' | 'syntax' | 'incomplete' | 'empty';
  severity: 'error' | 'warning';
  line?: number;
  description: string;
  suggestion: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
  score: number; // 0-100, quality score
}

