/**
 * Repo Probe - Auto-discover repo capabilities
 * 
 * Detects languages, formatters, linters, typecheckers, tests, schemas
 * by probing for sentinel files. No hardcoded assumptions.
 */

import * as fs from 'fs';
import * as path from 'path';

export interface Capabilities {
  langs: string[];
  formatters: string[];
  linters: string[];
  typecheckers: string[];
  tests: string[];
  schemas: string[];
  packageManagers: string[];
}

/**
 * Sentinel files that indicate language presence
 */
const LANGUAGE_SENTINELS: Record<string, string[]> = {
  'typescript': ['tsconfig.json', 'package.json'],
  'javascript': ['package.json', '.eslintrc.js', '.eslintrc.cjs'],
  'python': ['pyproject.toml', 'setup.py', 'requirements.txt', 'Pipfile'],
  'go': ['go.mod', 'go.sum'],
  'rust': ['Cargo.toml', 'Cargo.lock'],
  'java': ['pom.xml', 'build.gradle', 'build.gradle.kts'],
  'kotlin': ['build.gradle.kts', 'settings.gradle.kts'],
  'csharp': ['*.csproj', '*.sln'],
  'ruby': ['Gemfile', 'Rakefile'],
  'php': ['composer.json'],
};

/**
 * Sentinel files for formatters
 */
const FORMATTER_SENTINELS: Record<string, string[]> = {
  'prettier': ['.prettierrc', '.prettierrc.json', '.prettierrc.js', 'prettier.config.js'],
  'black': ['pyproject.toml', '.black'],
  'gofmt': ['go.mod'],
  'rustfmt': ['rustfmt.toml', '.rustfmt.toml'],
  'ktlint': ['build.gradle.kts'],
  'spotless': ['build.gradle'],
  'editorconfig': ['.editorconfig'],
};

/**
 * Sentinel files for linters
 */
const LINTER_SENTINELS: Record<string, string[]> = {
  'eslint': ['.eslintrc', '.eslintrc.json', '.eslintrc.js', '.eslintrc.cjs', 'eslint.config.js'],
  'ruff': ['pyproject.toml', 'ruff.toml'],
  'flake8': ['.flake8', 'setup.cfg'],
  'pylint': ['.pylintrc', 'pylintrc'],
  'golangci-lint': ['.golangci.yml', '.golangci.yaml'],
  'clippy': ['Cargo.toml'],
  'ktlint': ['build.gradle.kts'],
  'checkstyle': ['checkstyle.xml'],
};

/**
 * Sentinel files for typecheckers
 */
const TYPECHECKER_SENTINELS: Record<string, string[]> = {
  'tsc': ['tsconfig.json'],
  'pyright': ['pyrightconfig.json'],
  'mypy': ['mypy.ini', 'setup.cfg', 'pyproject.toml'],
  'go-vet': ['go.mod'],
  'cargo-check': ['Cargo.toml'],
};

/**
 * Sentinel files for test frameworks
 */
const TEST_SENTINELS: Record<string, string[]> = {
  'jest': ['jest.config.js', 'jest.config.ts', 'jest.config.json'],
  'vitest': ['vitest.config.js', 'vitest.config.ts'],
  'mocha': ['.mocharc.json', '.mocharc.js'],
  'pytest': ['pytest.ini', 'pyproject.toml', 'setup.cfg'],
  'go-test': ['go.mod'],
  'cargo-test': ['Cargo.toml'],
  'junit': ['pom.xml', 'build.gradle'],
};

/**
 * Sentinel files for schemas
 */
const SCHEMA_SENTINELS: Record<string, string[]> = {
  'openapi': ['openapi.json', 'openapi.yaml', 'swagger.json', 'swagger.yaml'],
  'graphql': ['schema.graphql', 'schema.gql', '*.graphql'],
  'prisma': ['prisma/schema.prisma'],
  'protobuf': ['*.proto'],
  'sql-migrations': ['migrations/', 'db/migrations/', 'alembic/'],
};

/**
 * Sentinel files for package managers
 */
const PACKAGE_MANAGER_SENTINELS: Record<string, string[]> = {
  'npm': ['package-lock.json'],
  'yarn': ['yarn.lock'],
  'pnpm': ['pnpm-lock.yaml'],
  'pip': ['requirements.txt'],
  'poetry': ['poetry.lock'],
  'cargo': ['Cargo.lock'],
  'go-mod': ['go.sum'],
  'maven': ['pom.xml'],
  'gradle': ['build.gradle', 'build.gradle.kts'],
};

/**
 * Probe repo for capabilities
 */
export async function detectCapabilities(root: string): Promise<Capabilities> {
  const capabilities: Capabilities = {
    langs: [],
    formatters: [],
    linters: [],
    typecheckers: [],
    tests: [],
    schemas: [],
    packageManagers: [],
  };
  
  // Detect languages
  for (const [lang, sentinels] of Object.entries(LANGUAGE_SENTINELS)) {
    if (await hasSentinel(root, sentinels)) {
      capabilities.langs.push(lang);
    }
  }
  
  // Detect formatters
  for (const [formatter, sentinels] of Object.entries(FORMATTER_SENTINELS)) {
    if (await hasSentinel(root, sentinels)) {
      capabilities.formatters.push(formatter);
    }
  }
  
  // Detect linters
  for (const [linter, sentinels] of Object.entries(LINTER_SENTINELS)) {
    if (await hasSentinel(root, sentinels)) {
      capabilities.linters.push(linter);
    }
  }
  
  // Detect typecheckers
  for (const [typechecker, sentinels] of Object.entries(TYPECHECKER_SENTINELS)) {
    if (await hasSentinel(root, sentinels)) {
      capabilities.typecheckers.push(typechecker);
    }
  }
  
  // Detect test frameworks
  for (const [test, sentinels] of Object.entries(TEST_SENTINELS)) {
    if (await hasSentinel(root, sentinels)) {
      capabilities.tests.push(test);
    }
  }
  
  // Detect schemas
  for (const [schema, sentinels] of Object.entries(SCHEMA_SENTINELS)) {
    if (await hasSentinel(root, sentinels)) {
      capabilities.schemas.push(schema);
    }
  }
  
  // Detect package managers
  for (const [pm, sentinels] of Object.entries(PACKAGE_MANAGER_SENTINELS)) {
    if (await hasSentinel(root, sentinels)) {
      capabilities.packageManagers.push(pm);
    }
  }
  
  return capabilities;
}

/**
 * Check if any sentinel file exists
 */
async function hasSentinel(root: string, sentinels: string[]): Promise<boolean> {
  for (const sentinel of sentinels) {
    // Handle glob patterns
    if (sentinel.includes('*')) {
      const pattern = sentinel.replace('*', '');
      const files = await findFiles(root, pattern);
      if (files.length > 0) {
        return true;
      }
    } else {
      const fullPath = path.join(root, sentinel);
      if (fs.existsSync(fullPath)) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Find files matching pattern
 */
async function findFiles(root: string, pattern: string, maxDepth: number = 3): Promise<string[]> {
  const results: string[] = [];
  
  function search(dir: string, depth: number): void {
    if (depth > maxDepth) return;
    
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          // Skip node_modules, .git, etc.
          if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
            search(fullPath, depth + 1);
          }
        } else if (entry.isFile()) {
          if (entry.name.includes(pattern)) {
            results.push(fullPath);
          }
        }
      }
    } catch (error) {
      // Ignore permission errors
    }
  }
  
  search(root, 0);
  return results;
}

/**
 * Get capability summary as string
 */
export function formatCapabilities(caps: Capabilities): string {
  const sections: string[] = [];
  
  if (caps.langs.length > 0) {
    sections.push(`Languages: ${caps.langs.join(', ')}`);
  }
  
  if (caps.formatters.length > 0) {
    sections.push(`Formatters: ${caps.formatters.join(', ')}`);
  }
  
  if (caps.linters.length > 0) {
    sections.push(`Linters: ${caps.linters.join(', ')}`);
  }
  
  if (caps.typecheckers.length > 0) {
    sections.push(`Typecheckers: ${caps.typecheckers.join(', ')}`);
  }
  
  if (caps.tests.length > 0) {
    sections.push(`Tests: ${caps.tests.join(', ')}`);
  }
  
  if (caps.schemas.length > 0) {
    sections.push(`Schemas: ${caps.schemas.join(', ')}`);
  }
  
  if (caps.packageManagers.length > 0) {
    sections.push(`Package Managers: ${caps.packageManagers.join(', ')}`);
  }
  
  return sections.join('\n');
}

