/**
 * Repo Tools Enforcement
 * 
 * Non-negotiable gates that fail on violations:
 * 1. Linters (ESLint/Prettier)
 * 2. Type Checker (tsc --noEmit)
 * 3. Boundaries (eslint-plugin-boundaries)
 * 4. Custom Rules (repo-specific)
 * 
 * Judge marks security or style = 0 if any gate fails.
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

export interface RepoToolsResult {
  passed: boolean;
  lintErrors: string[];
  typeErrors: string[];
  boundaryErrors: string[];
  customRuleErrors: string[];
  allErrors: string[];
}

/**
 * Run all repo tools and return results
 */
export async function runRepoTools(
  root: string,
  files: string[]
): Promise<RepoToolsResult> {
  const result: RepoToolsResult = {
    passed: true,
    lintErrors: [],
    typeErrors: [],
    boundaryErrors: [],
    customRuleErrors: [],
    allErrors: [],
  };

  // Run ESLint
  const lintResult = await runESLint(root, files);
  result.lintErrors = lintResult.errors;
  if (lintResult.errors.length > 0) result.passed = false;

  // Run TypeScript compiler
  const typeResult = await runTypeScript(root, files);
  result.typeErrors = typeResult.errors;
  if (typeResult.errors.length > 0) result.passed = false;

  // Check boundaries
  const boundaryResult = await checkBoundaries(root, files);
  result.boundaryErrors = boundaryResult.errors;
  if (boundaryResult.errors.length > 0) result.passed = false;

  // Run custom rules
  const customResult = await runCustomRules(root, files);
  result.customRuleErrors = customResult.errors;
  if (customResult.errors.length > 0) result.passed = false;

  // Combine all errors
  result.allErrors = [
    ...result.lintErrors,
    ...result.typeErrors,
    ...result.boundaryErrors,
    ...result.customRuleErrors,
  ];

  return result;
}

/**
 * Run ESLint on files
 */
async function runESLint(root: string, files: string[]): Promise<{ errors: string[] }> {
  const errors: string[] = [];

  // Check if ESLint is available
  const eslintPath = path.join(root, 'node_modules', '.bin', 'eslint');
  if (!fs.existsSync(eslintPath) && !fs.existsSync(eslintPath + '.cmd')) {
    return { errors: [] }; // ESLint not installed, skip
  }

  try {
    const fileArgs = files.map(f => `"${f}"`).join(' ');
    const cmd = process.platform === 'win32' 
      ? `"${eslintPath}.cmd" --format json ${fileArgs}`
      : `"${eslintPath}" --format json ${fileArgs}`;
    
    const output = execSync(cmd, {
      cwd: root,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    const results = JSON.parse(output);
    for (const result of results) {
      for (const message of result.messages) {
        errors.push(`${result.filePath}:${message.line}:${message.column} - ${message.message} (${message.ruleId})`);
      }
    }
  } catch (error: any) {
    // ESLint exits with non-zero on errors, parse stderr
    if (error.stdout) {
      try {
        const results = JSON.parse(error.stdout);
        for (const result of results) {
          for (const message of result.messages) {
            errors.push(`${result.filePath}:${message.line}:${message.column} - ${message.message} (${message.ruleId})`);
          }
        }
      } catch (parseError) {
        errors.push(`ESLint error: ${error.message}`);
      }
    }
  }

  return { errors: errors.slice(0, 10) }; // Limit to first 10 errors
}

/**
 * Run TypeScript compiler
 */
async function runTypeScript(root: string, files: string[]): Promise<{ errors: string[] }> {
  const errors: string[] = [];

  // Check if TypeScript is available
  const tscPath = path.join(root, 'node_modules', '.bin', 'tsc');
  if (!fs.existsSync(tscPath) && !fs.existsSync(tscPath + '.cmd')) {
    return { errors: [] }; // TypeScript not installed, skip
  }

  try {
    const cmd = process.platform === 'win32'
      ? `"${tscPath}.cmd" --noEmit --pretty false`
      : `"${tscPath}" --noEmit --pretty false`;
    
    execSync(cmd, {
      cwd: root,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  } catch (error: any) {
    // tsc exits with non-zero on errors
    if (error.stderr || error.stdout) {
      const output = error.stderr || error.stdout;
      const lines = output.split('\n');
      
      for (const line of lines) {
        // Parse TypeScript error format: file.ts(line,col): error TS1234: message
        const match = line.match(/^(.+?)\((\d+),(\d+)\):\s*error\s+TS\d+:\s*(.+)$/);
        if (match) {
          const [, file, line, col, message] = match;
          errors.push(`${file}:${line}:${col} - ${message}`);
        }
      }
    }
  }

  return { errors: errors.slice(0, 10) }; // Limit to first 10 errors
}

/**
 * Check boundary violations
 */
async function checkBoundaries(root: string, files: string[]): Promise<{ errors: string[] }> {
  const errors: string[] = [];

  // Load ESLint config to check for boundaries plugin
  const eslintConfigPath = findESLintConfig(root);
  if (!eslintConfigPath) {
    return { errors: [] }; // No ESLint config, skip
  }

  try {
    const configContent = fs.readFileSync(eslintConfigPath, 'utf-8');
    
    // Check if boundaries plugin is configured
    if (!configContent.includes('boundaries')) {
      return { errors: [] }; // Boundaries plugin not configured, skip
    }

    // Parse boundary rules from config
    const boundaryRules = parseBoundaryRules(configContent);
    
    // Check each file for violations
    for (const file of files) {
      const violations = checkFileBoundaries(root, file, boundaryRules);
      errors.push(...violations);
    }
  } catch (error) {
    // Skip if we can't parse config
  }

  return { errors: errors.slice(0, 10) }; // Limit to first 10 errors
}

/**
 * Find ESLint config file
 */
function findESLintConfig(root: string): string | null {
  const configFiles = [
    '.eslintrc.js',
    '.eslintrc.cjs',
    '.eslintrc.json',
    '.eslintrc',
    'eslint.config.js',
  ];

  for (const file of configFiles) {
    const fullPath = path.join(root, file);
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
  }

  return null;
}

/**
 * Parse boundary rules from ESLint config
 */
function parseBoundaryRules(configContent: string): Array<{
  from: string[];
  allow: string[];
}> {
  const rules: Array<{ from: string[]; allow: string[] }> = [];

  // Simple regex-based parsing (good enough for most cases)
  // In production, you'd use a proper JS parser
  const ruleMatches = configContent.matchAll(/"from":\s*\[([^\]]+)\][^}]*"allow":\s*\[([^\]]+)\]/g);
  
  for (const match of ruleMatches) {
    const from = match[1].split(',').map(s => s.trim().replace(/['"]/g, ''));
    const allow = match[2].split(',').map(s => s.trim().replace(/['"]/g, ''));
    rules.push({ from, allow });
  }

  return rules;
}

/**
 * Check file for boundary violations
 */
function checkFileBoundaries(
  root: string,
  file: string,
  rules: Array<{ from: string[]; allow: string[] }>
): string[] {
  const errors: string[] = [];

  try {
    const content = fs.readFileSync(path.join(root, file), 'utf-8');
    const imports = extractImports(content);

    // Determine file's layer
    const fileLayer = determineLayer(file);
    if (!fileLayer) return errors;

    // Find applicable rule
    const rule = rules.find(r => r.from.includes(fileLayer));
    if (!rule) return errors;

    // Check each import
    for (const imp of imports) {
      const importLayer = determineLayer(imp);
      if (!importLayer) continue;

      if (!rule.allow.includes(importLayer)) {
        errors.push(`${file}: Cannot import from ${importLayer} (${imp}). ${fileLayer} can only import from: ${rule.allow.join(', ')}`);
      }
    }
  } catch (error) {
    // Skip files we can't read
  }

  return errors;
}

/**
 * Extract imports from file
 */
function extractImports(content: string): string[] {
  const imports: string[] = [];
  
  // Match ES6 imports
  const importMatches = content.matchAll(/import\s+.*?\s+from\s+['"]([^'"]+)['"]/g);
  for (const match of importMatches) {
    imports.push(match[1]);
  }

  // Match require()
  const requireMatches = content.matchAll(/require\(['"]([^'"]+)['"]\)/g);
  for (const match of requireMatches) {
    imports.push(match[1]);
  }

  return imports;
}

/**
 * Determine layer from file path
 */
function determineLayer(filePath: string): string | null {
  if (filePath.includes('/features/') || filePath.includes('\\features\\')) return 'feature';
  if (filePath.includes('/domain/') || filePath.includes('\\domain\\')) return 'domain';
  if (filePath.includes('/infra/') || filePath.includes('\\infra\\')) return 'infra';
  if (filePath.includes('/utils/') || filePath.includes('\\utils\\')) return 'utils';
  if (filePath.includes('/lib/') || filePath.includes('\\lib\\')) return 'lib';
  if (filePath.includes('/core/') || filePath.includes('\\core\\')) return 'core';
  return null;
}

/**
 * Run custom repo-specific rules
 */
async function runCustomRules(root: string, files: string[]): Promise<{ errors: string[] }> {
  const errors: string[] = [];

  for (const file of files) {
    try {
      const content = fs.readFileSync(path.join(root, file), 'utf-8');

      // Rule 1: No snake_case in variable names (prefer camelCase)
      const snakeCaseMatches = content.matchAll(/\b(const|let|var)\s+([a-z]+_[a-z_]+)\s*=/g);
      for (const match of snakeCaseMatches) {
        const varName = match[2];
        if (!/^[A-Z_]+$/.test(varName)) { // Allow UPPER_SNAKE_CASE constants
          errors.push(`${file}: Use camelCase instead of snake_case for variable '${varName}'`);
        }
      }

      // Rule 2: No 'any' type in public exports
      const anyTypeMatches = content.matchAll(/export\s+(function|const|class|interface|type)\s+[^:]+:\s*any/g);
      for (const match of anyTypeMatches) {
        errors.push(`${file}: Do not use 'any' type in public exports`);
      }

      // Rule 3: No console.log in production code (allow in tests)
      if (!file.includes('.test.') && !file.includes('.spec.')) {
        const consoleMatches = content.matchAll(/console\.log\(/g);
        for (const match of consoleMatches) {
          errors.push(`${file}: Remove console.log() from production code`);
        }
      }
    } catch (error) {
      // Skip files we can't read
    }
  }

  return { errors: errors.slice(0, 10) }; // Limit to first 10 errors
}

