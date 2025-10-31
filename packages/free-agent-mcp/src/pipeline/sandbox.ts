/**
 * Sandbox execution pipeline
 * 
 * Runs code in a safe, isolated environment with hard quality gates:
 * 1. Format check (prettier)
 * 2. Lint (eslint)
 * 3. Type check (tsc)
 * 4. Unit tests (jest)
 * 5. Coverage check
 * 6. Security audit (npm audit, import allowlist)
 * 
 * No network, time/memory limits enforced.
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import type { ExecReport, PipelineConfig, GenResult } from './types.js';
import { DEFAULT_PIPELINE_CONFIG } from './types.js';
import { runRepoTools } from '../utils/repo-tools.js';
import { checkEditConstraints, enforceMinimalDiffs, inferAllowedPaths, getDefaultReadOnlyPaths } from '../utils/edit-constraints.js';
import { generateConventionTestFile } from '../utils/convention-tests.js';
import { makeProjectBrief } from '../utils/project-brief.js';
import { installAndCacheDependencies, hasCachedDependencies } from '../utils/dependency-cache.js';

/**
 * Run the full sandbox pipeline
 */
export async function runSandboxPipeline(
  genResult: GenResult,
  config: PipelineConfig = DEFAULT_PIPELINE_CONFIG
): Promise<ExecReport> {
  // Create temp sandbox directory
  const sandboxDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-sandbox-'));
  
  try {
    // Write all files
    await writeFiles(sandboxDir, genResult);

    // Generate and add convention tests
    const brief = await makeProjectBrief(process.cwd());
    const conventionTestContent = generateConventionTestFile(genResult.files, brief);
    const conventionTestPath = path.join(sandboxDir, 'src', '__tests__', 'conventions.test.ts');
    fs.mkdirSync(path.dirname(conventionTestPath), { recursive: true });
    fs.writeFileSync(conventionTestPath, conventionTestContent);

    // Initialize package.json if not present
    const packageJson = await initializeProject(sandboxDir);

    // Install dependencies (with caching for speed)
    installAndCacheDependencies(sandboxDir, packageJson);

    // Run pipeline stages
    const formatResult = await runFormatter(sandboxDir);
    const lintResult = await runLinter(sandboxDir);
    const typeResult = await runTypeChecker(sandboxDir);
    const testResult = await runTests(sandboxDir, config);
    const securityResult = await runSecurityChecks(sandboxDir, config);

    // Run repo tools (boundaries, custom rules)
    const filePaths = genResult.files.map(f => f.path);
    const repoToolsResult = await runRepoTools(sandboxDir, filePaths);

    // Check edit constraints
    const editViolations = await checkEditConstraints(sandboxDir, genResult.files, {
      allowedPaths: inferAllowedPaths(config.spec || '', sandboxDir),
      readOnlyPaths: getDefaultReadOnlyPaths(),
      allowPublicRenames: false,
    });

    // Check for minimal diffs
    const diffViolations = await enforceMinimalDiffs(sandboxDir, genResult.files);
    
    // Collect logs
    const logsTail = collectLogs(sandboxDir);
    
    return {
      compiled: typeResult.success,
      lintErrors: [...lintResult.errors, ...repoToolsResult.lintErrors],
      typeErrors: [...typeResult.errors, ...repoToolsResult.typeErrors],
      boundaryErrors: repoToolsResult.boundaryErrors,
      customRuleErrors: repoToolsResult.customRuleErrors,
      editViolations: [...editViolations.map(v => `${v.file}: ${v.violation}`), ...diffViolations.map(v => `${v.file}: ${v.violation}`)],
      test: {
        passed: testResult.passed,
        failed: testResult.failed,
        details: testResult.details,
        coveragePct: testResult.coverage,
      },
      security: {
        violations: securityResult.violations,
      },
      logsTail,
    };
  } finally {
    // Cleanup sandbox
    fs.rmSync(sandboxDir, { recursive: true, force: true });
  }
}

/**
 * Write generated files to sandbox
 */
async function writeFiles(sandboxDir: string, genResult: GenResult): Promise<void> {
  const allFiles = [...genResult.files, ...genResult.tests];
  
  for (const file of allFiles) {
    const filePath = path.join(sandboxDir, file.path);
    const dir = path.dirname(filePath);
    
    // Create directory if needed
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Write file
    fs.writeFileSync(filePath, file.content, 'utf-8');
  }
}

/**
 * Initialize project with package.json and tsconfig.json
 */
async function initializeProject(sandboxDir: string): Promise<any> {
  const packageJsonPath = path.join(sandboxDir, 'package.json');

  let packageJson: any;

  if (!fs.existsSync(packageJsonPath)) {
    packageJson = {
      name: 'agent-sandbox',
      version: '1.0.0',
      type: 'module',
      scripts: {
        test: 'jest --coverage --maxWorkers=1 --runInBand',
        lint: 'eslint .',
        format: 'prettier --check .',
        typecheck: 'tsc --noEmit',
      },
      devDependencies: {
        '@types/jest': '^29.5.0',
        '@types/node': '^20.0.0',
        '@typescript-eslint/eslint-plugin': '^6.0.0',
        '@typescript-eslint/parser': '^6.0.0',
        'eslint': '^8.0.0',
        'jest': '^29.0.0',
        'prettier': '^3.0.0',
        'ts-jest': '^29.0.0',
        'typescript': '^5.0.0',
      },
    };

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  } else {
    // Read existing package.json
    packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  }

  // Create tsconfig.json
  const tsconfigPath = path.join(sandboxDir, 'tsconfig.json');
  if (!fs.existsSync(tsconfigPath)) {
    const tsconfig = {
      compilerOptions: {
        target: 'ES2022',
        module: 'ESNext',
        moduleResolution: 'node',
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        resolveJsonModule: true,
        outDir: './dist',
      },
      include: ['**/*.ts'],
      exclude: ['node_modules', 'dist'],
    };
    
    fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2));
  }
  
  // Create jest.config.js
  const jestConfigPath = path.join(sandboxDir, 'jest.config.js');
  if (!fs.existsSync(jestConfigPath)) {
    const jestConfig = `export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\\\.{1,2}/.*)\\\\.js$': '$1',
  },
  transform: {
    '^.+\\\\.tsx?$': ['ts-jest', { useESM: true }],
  },
  collectCoverage: true,
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  testTimeout: 5000,
};`;

    fs.writeFileSync(jestConfigPath, jestConfig);
  }

  return packageJson;
}

/**
 * Run prettier format check
 */
async function runFormatter(sandboxDir: string): Promise<{ success: boolean; errors: string[] }> {
  try {
    execSync('npx prettier --check .', {
      cwd: sandboxDir,
      stdio: 'pipe',
      timeout: 10000,
    });
    return { success: true, errors: [] };
  } catch (error: any) {
    return {
      success: false,
      errors: [error.stdout?.toString() || error.message],
    };
  }
}

/**
 * Run eslint
 */
async function runLinter(sandboxDir: string): Promise<{ errors: string[] }> {
  try {
    const output = execSync('npx eslint . --format json', {
      cwd: sandboxDir,
      stdio: 'pipe',
      timeout: 15000,
    }).toString();
    
    const results = JSON.parse(output);
    const errors = results
      .flatMap((r: any) => r.messages)
      .map((m: any) => `${m.ruleId}: ${m.message} (${m.line}:${m.column})`);
    
    return { errors };
  } catch (error: any) {
    return { errors: [error.message] };
  }
}

/**
 * Run TypeScript type checker
 */
async function runTypeChecker(sandboxDir: string): Promise<{ success: boolean; errors: string[] }> {
  try {
    execSync('npx tsc --noEmit', {
      cwd: sandboxDir,
      stdio: 'pipe',
      timeout: 20000,
    });
    return { success: true, errors: [] };
  } catch (error: any) {
    const output = error.stdout?.toString() || error.stderr?.toString() || error.message;
    const errors = output.split('\n').filter((line: string) => line.includes('error TS'));
    return { success: false, errors };
  }
}

/**
 * Run jest tests with coverage
 */
async function runTests(
  sandboxDir: string,
  config: PipelineConfig
): Promise<{ passed: number; failed: number; details: string[]; coverage?: number }> {
  try {
    const output = execSync('npm test -- --json', {
      cwd: sandboxDir,
      stdio: 'pipe',
      timeout: config.globalTimeout || DEFAULT_PIPELINE_CONFIG.globalTimeout,
    }).toString();
    
    const results = JSON.parse(output);
    
    return {
      passed: results.numPassedTests || 0,
      failed: results.numFailedTests || 0,
      details: results.testResults?.map((t: any) => t.message) || [],
      coverage: results.coverageMap?.total?.lines?.pct,
    };
  } catch (error: any) {
    return {
      passed: 0,
      failed: 1,
      details: [error.message],
    };
  }
}

/**
 * Run security checks
 */
async function runSecurityChecks(
  sandboxDir: string,
  config: PipelineConfig
): Promise<{ violations: string[] }> {
  const violations: string[] = [];
  
  // Check npm audit
  try {
    execSync('npm audit --json', {
      cwd: sandboxDir,
      stdio: 'pipe',
      timeout: 10000,
    });
  } catch (error: any) {
    const output = error.stdout?.toString();
    if (output) {
      const audit = JSON.parse(output);
      if (audit.metadata?.vulnerabilities?.total > 0) {
        violations.push(`npm audit found ${audit.metadata.vulnerabilities.total} vulnerabilities`);
      }
    }
  }
  
  // Check import allowlist
  const allowedLibs = config.allowedLibraries || DEFAULT_PIPELINE_CONFIG.allowedLibraries;
  const files = fs.readdirSync(sandboxDir, { recursive: true }) as string[];
  
  for (const file of files) {
    if (!file.endsWith('.ts') && !file.endsWith('.js')) continue;
    
    const filePath = path.join(sandboxDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Check imports
    const importRegex = /import\s+.*\s+from\s+['"]([^'"]+)['"]/g;
    let match;
    
    while ((match = importRegex.exec(content)) !== null) {
      const importPath = match[1];
      
      // Skip relative imports
      if (importPath.startsWith('.')) continue;
      
      // Check if allowed
      const isAllowed = allowedLibs.some(lib => {
        if (lib.endsWith('/*')) {
          return importPath.startsWith(lib.slice(0, -2));
        }
        return importPath === lib || importPath.startsWith(`${lib}/`);
      });
      
      if (!isAllowed) {
        violations.push(`Disallowed import: ${importPath} in ${file}`);
      }
    }
  }
  
  return { violations };
}

/**
 * Collect last 50 lines of logs from test output and build logs
 */
function collectLogs(sandboxDir: string): string[] {
  const logs: string[] = [];

  // Collect from jest output if available
  const jestLogPath = path.join(sandboxDir, 'jest-output.log');
  if (fs.existsSync(jestLogPath)) {
    const jestLogs = fs.readFileSync(jestLogPath, 'utf-8').split('\n');
    logs.push(...jestLogs.slice(-25));
  }

  // Collect from tsc output if available
  const tscLogPath = path.join(sandboxDir, 'tsc-output.log');
  if (fs.existsSync(tscLogPath)) {
    const tscLogs = fs.readFileSync(tscLogPath, 'utf-8').split('\n');
    logs.push(...tscLogs.slice(-25));
  }

  // Return last 50 lines total
  return logs.slice(-50);
}

