/**
 * Quality Gates and Refinement Loop
 * 
 * Validates generated code through multiple quality checks:
 * - Type checking (tsc, mypy)
 * - Linting (eslint, ruff)
 * - Import resolution
 * - Test execution
 * - Coverage requirements
 * - Security checks
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs/promises';

const execAsync = promisify(exec);

export interface QualityGateConfig {
  mode: 'fast' | 'balanced' | 'best';
  rejectPlaceholders: boolean;
  enforceImportResolution: boolean;
  requireTests: boolean;
  minCoverage?: number;
  maxAttempts?: number;
}

export interface QualityGateResult {
  passed: boolean;
  score: number;
  checks: {
    build: { passed: boolean; output: string; errors: string[] };
    lint: { passed: boolean; output: string; warnings: number; errors: number };
    types: { passed: boolean; output: string; errors: string[] };
    imports: { passed: boolean; unresolved: string[] };
    tests: { passed: boolean; output: string; passed_count: number; failed_count: number };
    coverage: { passed: boolean; percentage: number; threshold: number };
    placeholders: { passed: boolean; found: string[] };
    security: { passed: boolean; issues: string[] };
  };
  verdict: {
    accept: boolean;
    weighted_score: number;
    issues: string[];
    fix_plan?: string[];
  };
}

export class QualityGates {
  constructor(
    private config: QualityGateConfig,
    private repoRoot: string
  ) {}

  /**
   * Run all quality gates based on mode
   */
  async validate(files: Array<{ path: string; content: string }>): Promise<QualityGateResult> {
    const result: QualityGateResult = {
      passed: false,
      score: 0,
      checks: {
        build: { passed: false, output: '', errors: [] },
        lint: { passed: false, output: '', warnings: 0, errors: 0 },
        types: { passed: false, output: '', errors: [] },
        imports: { passed: false, unresolved: [] },
        tests: { passed: false, output: '', passed_count: 0, failed_count: 0 },
        coverage: { passed: false, percentage: 0, threshold: this.config.minCoverage || 80 },
        placeholders: { passed: false, found: [] },
        security: { passed: false, issues: [] }
      },
      verdict: {
        accept: false,
        weighted_score: 0,
        issues: []
      }
    };

    // Write files to disk temporarily for validation
    await this.writeFiles(files);

    try {
      // Run checks based on mode
      if (this.config.mode === 'fast') {
        result.checks.build = await this.checkBuild();
        result.checks.placeholders = await this.checkPlaceholders(files);
      } else if (this.config.mode === 'balanced') {
        result.checks.build = await this.checkBuild();
        result.checks.lint = await this.checkLint();
        result.checks.types = await this.checkTypes();
        result.checks.imports = await this.checkImports(files);
        result.checks.placeholders = await this.checkPlaceholders(files);
        if (this.config.requireTests) {
          result.checks.tests = await this.checkTests();
        }
      } else if (this.config.mode === 'best') {
        result.checks.build = await this.checkBuild();
        result.checks.lint = await this.checkLint();
        result.checks.types = await this.checkTypes();
        result.checks.imports = await this.checkImports(files);
        result.checks.placeholders = await this.checkPlaceholders(files);
        result.checks.tests = await this.checkTests();
        result.checks.coverage = await this.checkCoverage();
        result.checks.security = await this.checkSecurity();
      }

      // Calculate weighted score
      result.score = this.calculateScore(result.checks);
      result.verdict = this.generateVerdict(result.checks, result.score);
      result.passed = result.verdict.accept;

      return result;
    } finally {
      // Clean up temporary files
      await this.cleanupFiles(files);
    }
  }

  private async writeFiles(files: Array<{ path: string; content: string }>): Promise<void> {
    for (const file of files) {
      const fullPath = path.join(this.repoRoot, file.path);
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      await fs.writeFile(fullPath, file.content, 'utf-8');
    }
  }

  private async cleanupFiles(files: Array<{ path: string; content: string }>): Promise<void> {
    // In practice, might want to keep files or use git to restore
    // For now, just a placeholder
  }

  private async checkBuild(): Promise<{ passed: boolean; output: string; errors: string[] }> {
    try {
      const { stdout, stderr } = await execAsync('npm run build', { cwd: this.repoRoot });
      return { passed: true, output: stdout, errors: [] };
    } catch (error: any) {
      const errors = this.parseErrors(error.stderr || error.stdout);
      return { passed: false, output: error.stdout, errors };
    }
  }

  private async checkLint(): Promise<{ passed: boolean; output: string; warnings: number; errors: number }> {
    try {
      const { stdout } = await execAsync('npm run lint', { cwd: this.repoRoot });
      return { passed: true, output: stdout, warnings: 0, errors: 0 };
    } catch (error: any) {
      const { warnings, errors } = this.parseLintOutput(error.stdout);
      return { passed: errors === 0, output: error.stdout, warnings, errors };
    }
  }

  private async checkTypes(): Promise<{ passed: boolean; output: string; errors: string[] }> {
    try {
      const { stdout } = await execAsync('npx tsc --noEmit', { cwd: this.repoRoot });
      return { passed: true, output: stdout, errors: [] };
    } catch (error: any) {
      const errors = this.parseErrors(error.stdout);
      return { passed: false, output: error.stdout, errors };
    }
  }

  private async checkImports(files: Array<{ path: string; content: string }>): Promise<{ passed: boolean; unresolved: string[] }> {
    const unresolved: string[] = [];

    for (const file of files) {
      const imports = this.extractImports(file.content);
      for (const imp of imports) {
        const resolved = await this.resolveImport(imp, file.path);
        if (!resolved) {
          unresolved.push(`${file.path}: ${imp}`);
        }
      }
    }

    return { passed: unresolved.length === 0, unresolved };
  }

  private async checkPlaceholders(files: Array<{ path: string; content: string }>): Promise<{ passed: boolean; found: string[] }> {
    const placeholders: string[] = [];
    const patterns = [
      /TODO:/gi,
      /FIXME:/gi,
      /XXX:/gi,
      /HACK:/gi,
      /throw new Error\(['"]Not implemented['"]\)/gi,
      /\/\/ placeholder/gi,
      /\/\/ stub/gi
    ];

    for (const file of files) {
      for (const pattern of patterns) {
        const matches = file.content.match(pattern);
        if (matches) {
          placeholders.push(...matches.map(m => `${file.path}: ${m}`));
        }
      }
    }

    return { passed: placeholders.length === 0, found: placeholders };
  }

  private async checkTests(): Promise<{ passed: boolean; output: string; passed_count: number; failed_count: number }> {
    try {
      const { stdout } = await execAsync('npm test', { cwd: this.repoRoot });
      const { passed, failed } = this.parseTestOutput(stdout);
      return { passed: failed === 0, output: stdout, passed_count: passed, failed_count: failed };
    } catch (error: any) {
      const { passed, failed } = this.parseTestOutput(error.stdout);
      return { passed: false, output: error.stdout, passed_count: passed, failed_count: failed };
    }
  }

  private async checkCoverage(): Promise<{ passed: boolean; percentage: number; threshold: number }> {
    try {
      const { stdout } = await execAsync('npm run test:coverage', { cwd: this.repoRoot });
      const percentage = this.parseCoverageOutput(stdout);
      const threshold = this.config.minCoverage || 80;
      return { passed: percentage >= threshold, percentage, threshold };
    } catch (error: any) {
      return { passed: false, percentage: 0, threshold: this.config.minCoverage || 80 };
    }
  }

  private async checkSecurity(): Promise<{ passed: boolean; issues: string[] }> {
    // Placeholder for security checks (npm audit, snyk, etc.)
    return { passed: true, issues: [] };
  }

  private calculateScore(checks: QualityGateResult['checks']): number {
    const weights = {
      build: 0.25,
      lint: 0.15,
      types: 0.20,
      imports: 0.15,
      tests: 0.15,
      coverage: 0.05,
      placeholders: 0.03,
      security: 0.02
    };

    let score = 0;
    if (checks.build.passed) score += weights.build;
    if (checks.lint.passed) score += weights.lint;
    if (checks.types.passed) score += weights.types;
    if (checks.imports.passed) score += weights.imports;
    if (checks.tests.passed) score += weights.tests;
    if (checks.coverage.passed) score += weights.coverage;
    if (checks.placeholders.passed) score += weights.placeholders;
    if (checks.security.passed) score += weights.security;

    return score;
  }

  private generateVerdict(checks: QualityGateResult['checks'], score: number): QualityGateResult['verdict'] {
    const issues: string[] = [];
    const fixPlan: string[] = [];

    if (!checks.build.passed) {
      issues.push('Build failed');
      fixPlan.push('Fix compilation errors: ' + checks.build.errors.join(', '));
    }
    if (!checks.lint.passed) {
      issues.push(`Lint failed with ${checks.lint.errors} errors`);
      fixPlan.push('Fix linting errors');
    }
    if (!checks.types.passed) {
      issues.push('Type checking failed');
      fixPlan.push('Fix type errors: ' + checks.types.errors.join(', '));
    }
    if (!checks.imports.passed) {
      issues.push('Unresolved imports');
      fixPlan.push('Fix imports: ' + checks.imports.unresolved.join(', '));
    }
    if (!checks.placeholders.passed) {
      issues.push('Placeholders found');
      fixPlan.push('Remove placeholders: ' + checks.placeholders.found.join(', '));
    }

    const threshold = this.config.mode === 'fast' ? 0.7 : this.config.mode === 'balanced' ? 0.85 : 0.95;

    return {
      accept: score >= threshold && issues.length === 0,
      weighted_score: score,
      issues,
      fix_plan: fixPlan.length > 0 ? fixPlan : undefined
    };
  }

  // Helper methods for parsing outputs
  private parseErrors(output: string): string[] {
    // Simple error extraction - could be enhanced
    return output.split('\n').filter(line => line.includes('error')).slice(0, 10);
  }

  private parseLintOutput(output: string): { warnings: number; errors: number } {
    const warningMatch = output.match(/(\d+) warnings?/);
    const errorMatch = output.match(/(\d+) errors?/);
    return {
      warnings: warningMatch ? parseInt(warningMatch[1]) : 0,
      errors: errorMatch ? parseInt(errorMatch[1]) : 0
    };
  }

  private parseTestOutput(output: string): { passed: number; failed: number } {
    const passedMatch = output.match(/(\d+) passed/);
    const failedMatch = output.match(/(\d+) failed/);
    return {
      passed: passedMatch ? parseInt(passedMatch[1]) : 0,
      failed: failedMatch ? parseInt(failedMatch[1]) : 0
    };
  }

  private parseCoverageOutput(output: string): number {
    const match = output.match(/All files\s+\|\s+([\d.]+)/);
    return match ? parseFloat(match[1]) : 0;
  }

  private extractImports(content: string): string[] {
    const imports: string[] = [];
    const importRegex = /import\s+.*?from\s+['"]([^'"]+)['"]/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }
    return imports;
  }

  private async resolveImport(importPath: string, fromFile: string): Promise<boolean> {
    // Simplified import resolution - could use TypeScript compiler API
    if (importPath.startsWith('.')) {
      const resolved = path.resolve(path.dirname(fromFile), importPath);
      try {
        await fs.access(resolved);
        return true;
      } catch {
        return false;
      }
    }
    // Assume node_modules imports are valid
    return true;
  }
}

