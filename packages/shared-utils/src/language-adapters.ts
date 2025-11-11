/**
 * Language Adapters - Run tools for different languages
 * 
 * Thin shims that run formatters/linters/typecheckers/tests
 * and return results in a common ExecReport shape.
 */

import { execSync } from 'child_process';
import * as path from 'path';

export interface ExecReport {
  compiled: boolean;
  lintErrors: string[];
  typeErrors: string[];
  formatErrors: string[];
  test: {
    passed: number;
    failed: number;
    details: string[];
    coveragePct?: number;
  };
  boundaryErrors?: string[];
  schemaErrors?: string[];
}

export interface ToolAdapter {
  run(root: string): Promise<ExecReport>;
}

/**
 * TypeScript/JavaScript Adapter
 */
export class TypeScriptAdapter implements ToolAdapter {
  async run(root: string): Promise<ExecReport> {
    const report: ExecReport = {
      compiled: true,
      lintErrors: [],
      typeErrors: [],
      formatErrors: [],
      test: { passed: 0, failed: 0, details: [] },
    };
    
    // Run prettier
    try {
      execSync('npx prettier --check .', {
        cwd: root,
        stdio: 'pipe',
        timeout: 10000,
      });
    } catch (error: any) {
      report.formatErrors.push(error.stdout?.toString() || error.message);
    }
    
    // Run eslint
    try {
      const output = execSync('npx eslint . --format json', {
        cwd: root,
        stdio: 'pipe',
        timeout: 15000,
      }).toString();
      
      const results = JSON.parse(output);
      report.lintErrors = results
        .flatMap((r: any) => r.messages)
        .map((m: any) => `${m.ruleId}: ${m.message} (${m.line}:${m.column})`);
    } catch (error: any) {
      report.lintErrors.push(error.message);
    }
    
    // Run tsc
    try {
      execSync('npx tsc --noEmit', {
        cwd: root,
        stdio: 'pipe',
        timeout: 30000,
      });
    } catch (error: any) {
      report.compiled = false;
      const output = error.stdout?.toString() || error.stderr?.toString() || '';
      report.typeErrors = output.split('\n').filter((line: string) => line.trim().length > 0);
    }
    
    // Run jest
    try {
      const output = execSync('npx jest --json --coverage', {
        cwd: root,
        stdio: 'pipe',
        timeout: 60000,
      }).toString();
      
      const results = JSON.parse(output);
      report.test.passed = results.numPassedTests || 0;
      report.test.failed = results.numFailedTests || 0;
      report.test.coveragePct = results.coverageMap?.total?.lines?.pct;
    } catch (error: any) {
      report.test.failed = 1;
      report.test.details.push(error.message);
    }
    
    return report;
  }
}

/**
 * Python Adapter
 */
export class PythonAdapter implements ToolAdapter {
  async run(root: string): Promise<ExecReport> {
    const report: ExecReport = {
      compiled: true,
      lintErrors: [],
      typeErrors: [],
      formatErrors: [],
      test: { passed: 0, failed: 0, details: [] },
    };
    
    // Run black
    try {
      execSync('black --check .', {
        cwd: root,
        stdio: 'pipe',
        timeout: 10000,
      });
    } catch (error: any) {
      report.formatErrors.push(error.stdout?.toString() || error.message);
    }
    
    // Run ruff
    try {
      const output = execSync('ruff check . --format json', {
        cwd: root,
        stdio: 'pipe',
        timeout: 15000,
      }).toString();
      
      const results = JSON.parse(output);
      report.lintErrors = results.map((r: any) => `${r.code}: ${r.message} (${r.location.row}:${r.location.column})`);
    } catch (error: any) {
      report.lintErrors.push(error.message);
    }
    
    // Run mypy
    try {
      execSync('mypy .', {
        cwd: root,
        stdio: 'pipe',
        timeout: 30000,
      });
    } catch (error: any) {
      const output = error.stdout?.toString() || error.stderr?.toString() || '';
      report.typeErrors = output.split('\n').filter((line: string) => line.includes('error:'));
    }
    
    // Run pytest
    try {
      const output = execSync('pytest --json-report --json-report-file=report.json', {
        cwd: root,
        stdio: 'pipe',
        timeout: 60000,
      }).toString();
      
      const reportPath = path.join(root, 'report.json');
      const results = JSON.parse(require('fs').readFileSync(reportPath, 'utf-8'));
      report.test.passed = results.summary.passed || 0;
      report.test.failed = results.summary.failed || 0;
    } catch (error: any) {
      report.test.failed = 1;
      report.test.details.push(error.message);
    }
    
    return report;
  }
}

/**
 * Go Adapter
 */
export class GoAdapter implements ToolAdapter {
  async run(root: string): Promise<ExecReport> {
    const report: ExecReport = {
      compiled: true,
      lintErrors: [],
      typeErrors: [],
      formatErrors: [],
      test: { passed: 0, failed: 0, details: [] },
    };
    
    // Run gofmt
    try {
      const output = execSync('gofmt -l .', {
        cwd: root,
        stdio: 'pipe',
        timeout: 10000,
      }).toString();
      
      if (output.trim().length > 0) {
        report.formatErrors = output.split('\n').filter(line => line.trim().length > 0);
      }
    } catch (error: any) {
      report.formatErrors.push(error.message);
    }
    
    // Run go vet
    try {
      execSync('go vet ./...', {
        cwd: root,
        stdio: 'pipe',
        timeout: 15000,
      });
    } catch (error: any) {
      const output = error.stdout?.toString() || error.stderr?.toString() || '';
      report.lintErrors = output.split('\n').filter((line: string) => line.trim().length > 0);
    }
    
    // Run go build
    try {
      execSync('go build ./...', {
        cwd: root,
        stdio: 'pipe',
        timeout: 30000,
      });
    } catch (error: any) {
      report.compiled = false;
      const output = error.stdout?.toString() || error.stderr?.toString() || '';
      report.typeErrors = output.split('\n').filter((line: string) => line.trim().length > 0);
    }
    
    // Run go test
    try {
      const output = execSync('go test -json ./...', {
        cwd: root,
        stdio: 'pipe',
        timeout: 60000,
      }).toString();
      
      const lines = output.split('\n').filter(line => line.trim().length > 0);
      for (const line of lines) {
        const result = JSON.parse(line);
        if (result.Action === 'pass') report.test.passed++;
        if (result.Action === 'fail') report.test.failed++;
      }
    } catch (error: any) {
      report.test.failed = 1;
      report.test.details.push(error.message);
    }
    
    return report;
  }
}

/**
 * Rust Adapter
 */
export class RustAdapter implements ToolAdapter {
  async run(root: string): Promise<ExecReport> {
    const report: ExecReport = {
      compiled: true,
      lintErrors: [],
      typeErrors: [],
      formatErrors: [],
      test: { passed: 0, failed: 0, details: [] },
    };
    
    // Run rustfmt
    try {
      execSync('cargo fmt -- --check', {
        cwd: root,
        stdio: 'pipe',
        timeout: 10000,
      });
    } catch (error: any) {
      report.formatErrors.push(error.stdout?.toString() || error.message);
    }
    
    // Run clippy
    try {
      const output = execSync('cargo clippy --message-format json', {
        cwd: root,
        stdio: 'pipe',
        timeout: 30000,
      }).toString();
      
      const lines = output.split('\n').filter(line => line.trim().length > 0);
      for (const line of lines) {
        try {
          const result = JSON.parse(line);
          if (result.message) {
            report.lintErrors.push(`${result.message.code?.code}: ${result.message.message}`);
          }
        } catch {
          // Ignore parse errors
        }
      }
    } catch (error: any) {
      report.lintErrors.push(error.message);
    }
    
    // Run cargo check
    try {
      execSync('cargo check', {
        cwd: root,
        stdio: 'pipe',
        timeout: 30000,
      });
    } catch (error: any) {
      report.compiled = false;
      const output = error.stdout?.toString() || error.stderr?.toString() || '';
      report.typeErrors = output.split('\n').filter((line: string) => line.includes('error'));
    }
    
    // Run cargo test
    try {
      const output = execSync('cargo test -- --format json', {
        cwd: root,
        stdio: 'pipe',
        timeout: 60000,
      }).toString();
      
      // Parse test results (simplified)
      const passedMatch = output.match(/(\d+) passed/);
      const failedMatch = output.match(/(\d+) failed/);
      
      if (passedMatch) report.test.passed = parseInt(passedMatch[1]);
      if (failedMatch) report.test.failed = parseInt(failedMatch[1]);
    } catch (error: any) {
      report.test.failed = 1;
      report.test.details.push(error.message);
    }
    
    return report;
  }
}

/**
 * Get adapter for language
 */
export function getAdapterForLanguage(lang: string): ToolAdapter | null {
  switch (lang) {
    case 'typescript':
    case 'javascript':
      return new TypeScriptAdapter();
    case 'python':
      return new PythonAdapter();
    case 'go':
      return new GoAdapter();
    case 'rust':
      return new RustAdapter();
    default:
      return null;
  }
}

