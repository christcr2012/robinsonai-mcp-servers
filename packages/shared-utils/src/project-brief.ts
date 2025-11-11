/**
 * Project Brief Generator
 * 
 * Automatically generates a "Project Brief" from the repo's DNA:
 * - Languages & versions
 * - Style & lint rules
 * - Folder boundaries & layering
 * - Type/Schema sources
 * - Domain glossary
 * - APIs & entry points
 * - Testing patterns
 * - Naming examples
 * 
 * This brief is passed to the coder/judge to ensure repo-native code.
 */

import * as fs from 'fs';
import * as path from 'path';
import { buildSymbolIndex, topFrequencyIdentifiers, publicExports, collectNamingExamples, inferNamingConvention } from './symbol-indexer.js';
import { detectSchemas, type SchemaInfo } from './schema-codegen.js';

export interface ProjectBrief {
  language: string;
  versions: {
    node?: string;
    typescript?: string;
    python?: string;
    go?: string;
  };
  style: {
    eslint?: Record<string, any>;
    prettier?: Record<string, any>;
    editorconfig?: string;
    tsconfig?: Record<string, any>;
  };
  layering: {
    type: 'monorepo' | 'single' | 'unknown';
    packages?: string[];
    layers?: Array<{ name: string; pattern: string; canImport: string[] }>;
    boundaries?: string;
  };
  testing: {
    framework: string;
    testPattern: string;
    exampleTest?: string;
    helpers?: string[];
  };
  schema: {
    sources: Array<{ type: string; path: string; entities?: string[] }>;
    generatedTypes?: string[];
  };
  glossary: {
    entities: string[];
    enums: string[];
    constants: string[];
    commonAbbreviations: Record<string, string>;
  };
  naming: {
    variables: string; // camelCase, snake_case, etc.
    types: string; // PascalCase, etc.
    constants: string; // UPPER_SNAKE_CASE, etc.
    files: string; // kebab-case, camelCase, etc.
    examples: string[];
  };
  apis: {
    publicExports: string[];
    routes?: string[];
    events?: string[];
  };
  doNotTouch: string[];
}

/**
 * Generate a project brief from a repository root
 */
export async function makeProjectBrief(root: string): Promise<ProjectBrief> {
  const brief: ProjectBrief = {
    language: 'unknown',
    versions: {},
    style: {},
    layering: { type: 'unknown' },
    testing: { framework: 'unknown', testPattern: '**/*.test.*' },
    schema: { sources: [] },
    glossary: { entities: [], enums: [], constants: [], commonAbbreviations: {} },
    naming: { variables: 'camelCase', types: 'PascalCase', constants: 'UPPER_SNAKE_CASE', files: 'kebab-case', examples: [] },
    apis: { publicExports: [] },
    doNotTouch: [],
  };

  // Detect language and versions
  await detectLanguageAndVersions(root, brief);

  // Detect style rules
  await detectStyleRules(root, brief);

  // Detect layering and boundaries
  await detectLayering(root, brief);

  // Detect testing patterns
  await detectTesting(root, brief);

  // Detect schemas
  await detectSchemasForBrief(root, brief);

  // Detect do-not-touch directories
  await detectDoNotTouch(root, brief);

  // Build symbol index and extract glossary/naming/APIs
  await buildGlossaryAndNaming(root, brief);

  return brief;
}

/**
 * Detect language and versions from package.json, pyproject.toml, go.mod, etc.
 */
async function detectLanguageAndVersions(root: string, brief: ProjectBrief): Promise<void> {
  // Try package.json (Node.js/TypeScript)
  const pkgPath = path.join(root, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      brief.language = pkg.type === 'module' ? 'esm' : 'commonjs';
      brief.versions.node = pkg.engines?.node;
      
      // Check for TypeScript
      if (pkg.devDependencies?.typescript || pkg.dependencies?.typescript) {
        brief.language = 'typescript';
        const tsconfigPath = path.join(root, 'tsconfig.json');
        if (fs.existsSync(tsconfigPath)) {
          const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));
          brief.versions.typescript = pkg.devDependencies?.typescript || pkg.dependencies?.typescript;
          brief.style.tsconfig = tsconfig.compilerOptions;
        }
      }
    } catch (error) {
      console.warn('Failed to parse package.json:', error);
    }
  }

  // Try pyproject.toml (Python)
  const pyprojectPath = path.join(root, 'pyproject.toml');
  if (fs.existsSync(pyprojectPath)) {
    brief.language = 'python';
    // TODO: Parse TOML to get Python version
  }

  // Try go.mod (Go)
  const gomodPath = path.join(root, 'go.mod');
  if (fs.existsSync(gomodPath)) {
    brief.language = 'go';
    try {
      const gomod = fs.readFileSync(gomodPath, 'utf-8');
      const match = gomod.match(/^go\s+(\d+\.\d+)/m);
      if (match) {
        brief.versions.go = match[1];
      }
    } catch (error) {
      console.warn('Failed to parse go.mod:', error);
    }
  }
}

/**
 * Detect style rules from .editorconfig, .prettierrc, .eslintrc, tsconfig.json
 */
async function detectStyleRules(root: string, brief: ProjectBrief): Promise<void> {
  // .editorconfig
  const editorconfigPath = path.join(root, '.editorconfig');
  if (fs.existsSync(editorconfigPath)) {
    brief.style.editorconfig = fs.readFileSync(editorconfigPath, 'utf-8');
  }

  // .prettierrc (JSON, JS, YAML)
  const prettierPaths = ['.prettierrc', '.prettierrc.json', '.prettierrc.js', 'prettier.config.js'];
  for (const p of prettierPaths) {
    const fullPath = path.join(root, p);
    if (fs.existsSync(fullPath)) {
      try {
        if (p.endsWith('.json') || p === '.prettierrc') {
          brief.style.prettier = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
        }
        // TODO: Handle .js files (require them)
      } catch (error) {
        console.warn(`Failed to parse ${p}:`, error);
      }
      break;
    }
  }

  // .eslintrc (JSON, JS, YAML)
  const eslintPaths = ['.eslintrc', '.eslintrc.json', '.eslintrc.js', 'eslint.config.js'];
  for (const p of eslintPaths) {
    const fullPath = path.join(root, p);
    if (fs.existsSync(fullPath)) {
      try {
        if (p.endsWith('.json') || p === '.eslintrc') {
          brief.style.eslint = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
        }
        // TODO: Handle .js files (require them)
      } catch (error) {
        console.warn(`Failed to parse ${p}:`, error);
      }
      break;
    }
  }
}

/**
 * Detect layering and boundaries from folder structure
 */
async function detectLayering(root: string, brief: ProjectBrief): Promise<void> {
  // Check for monorepo
  const packagesDir = path.join(root, 'packages');
  const appsDir = path.join(root, 'apps');
  
  if (fs.existsSync(packagesDir) || fs.existsSync(appsDir)) {
    brief.layering.type = 'monorepo';
    brief.layering.packages = [];
    
    if (fs.existsSync(packagesDir)) {
      const packages = fs.readdirSync(packagesDir).filter(p => {
        const stat = fs.statSync(path.join(packagesDir, p));
        return stat.isDirectory();
      });
      brief.layering.packages.push(...packages.map(p => `packages/${p}`));
    }
    
    if (fs.existsSync(appsDir)) {
      const apps = fs.readdirSync(appsDir).filter(p => {
        const stat = fs.statSync(path.join(appsDir, p));
        return stat.isDirectory();
      });
      brief.layering.packages.push(...apps.map(p => `apps/${p}`));
    }
  } else {
    brief.layering.type = 'single';
  }

  // Detect common layer patterns
  const srcDir = path.join(root, 'src');
  if (fs.existsSync(srcDir)) {
    const layers: Array<{ name: string; pattern: string; canImport: string[] }> = [];
    
    // Check for common patterns
    const commonLayers = ['features', 'domain', 'infra', 'utils', 'lib', 'core'];
    for (const layer of commonLayers) {
      const layerPath = path.join(srcDir, layer);
      if (fs.existsSync(layerPath)) {
        layers.push({
          name: layer,
          pattern: `src/${layer}/**/*`,
          canImport: inferCanImport(layer),
        });
      }
    }
    
    if (layers.length > 0) {
      brief.layering.layers = layers;
    }
  }

  // Check for eslint-plugin-boundaries config
  if (brief.style.eslint?.settings?.['boundaries/elements']) {
    brief.layering.boundaries = 'eslint-plugin-boundaries';
  }
}

/**
 * Infer what a layer can import based on common patterns
 */
function inferCanImport(layer: string): string[] {
  const rules: Record<string, string[]> = {
    features: ['domain', 'infra', 'utils', 'lib', 'core'],
    domain: ['domain', 'infra', 'utils', 'lib', 'core'],
    infra: ['infra', 'utils', 'lib', 'core'],
    utils: ['utils', 'lib', 'core'],
    lib: ['lib', 'core'],
    core: ['core'],
  };
  return rules[layer] || [];
}

/**
 * Detect testing patterns
 */
async function detectTesting(root: string, brief: ProjectBrief): Promise<void> {
  const pkgPath = path.join(root, 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      
      // Detect framework
      if (pkg.devDependencies?.jest || pkg.dependencies?.jest) {
        brief.testing.framework = 'jest';
        brief.testing.testPattern = '**/*.test.{ts,tsx,js,jsx}';
      } else if (pkg.devDependencies?.vitest || pkg.dependencies?.vitest) {
        brief.testing.framework = 'vitest';
        brief.testing.testPattern = '**/*.test.{ts,tsx,js,jsx}';
      } else if (pkg.devDependencies?.mocha || pkg.dependencies?.mocha) {
        brief.testing.framework = 'mocha';
        brief.testing.testPattern = '**/*.test.{ts,js}';
      }
    } catch (error) {
      console.warn('Failed to detect testing framework:', error);
    }
  }
}

/**
 * Detect schemas (OpenAPI, GraphQL, Prisma, DB migrations)
 */
async function detectSchemasForBrief(root: string, brief: ProjectBrief): Promise<void> {
  const schemas = await detectSchemas(root);

  for (const schema of schemas) {
    brief.schema.sources.push({
      type: schema.source,
      path: schema.path,
      entities: schema.entities,
    });

    // Add schema types to generated types list
    if (!brief.schema.generatedTypes) {
      brief.schema.generatedTypes = [];
    }
    brief.schema.generatedTypes.push(...schema.types);
  }
}

/**
 * Detect do-not-touch directories (generated code)
 */
async function detectDoNotTouch(root: string, brief: ProjectBrief): Promise<void> {
  const commonGenerated = [
    'node_modules',
    'dist',
    'build',
    '.next',
    '.nuxt',
    'out',
    'coverage',
    '.turbo',
    'src/gen',
    'src/generated',
    'prisma/client',
    '__generated__',
  ];

  for (const dir of commonGenerated) {
    const fullPath = path.join(root, dir);
    if (fs.existsSync(fullPath)) {
      brief.doNotTouch.push(dir);
    }
  }
}

/**
 * Format brief as a concise string for LLM prompts (~1-2k tokens)
 */
export function formatBriefForPrompt(brief: ProjectBrief): string {
  const sections: string[] = [];

  sections.push(`# Project Brief\n`);

  // Language & Versions
  sections.push(`## Language & Versions`);
  sections.push(`- Language: ${brief.language}`);
  if (brief.versions.node) sections.push(`- Node: ${brief.versions.node}`);
  if (brief.versions.typescript) sections.push(`- TypeScript: ${brief.versions.typescript}`);
  if (brief.versions.python) sections.push(`- Python: ${brief.versions.python}`);
  if (brief.versions.go) sections.push(`- Go: ${brief.versions.go}`);
  sections.push('');

  // Style Rules
  sections.push(`## Style Rules`);
  if (brief.style.prettier) {
    sections.push(`- Prettier: ${JSON.stringify(brief.style.prettier, null, 2).slice(0, 200)}...`);
  }
  if (brief.style.eslint?.rules) {
    const topRules = Object.keys(brief.style.eslint.rules).slice(0, 10);
    sections.push(`- ESLint rules: ${topRules.join(', ')}`);
  }
  if (brief.style.tsconfig) {
    sections.push(`- TypeScript: strict=${brief.style.tsconfig.strict}, target=${brief.style.tsconfig.target}`);
  }
  sections.push('');

  // Layering
  sections.push(`## Layering & Boundaries`);
  sections.push(`- Type: ${brief.layering.type}`);
  if (brief.layering.layers) {
    for (const layer of brief.layering.layers) {
      sections.push(`- ${layer.name}: can import ${layer.canImport.join(', ')}`);
    }
  }
  sections.push('');

  // Testing
  sections.push(`## Testing`);
  sections.push(`- Framework: ${brief.testing.framework}`);
  sections.push(`- Pattern: ${brief.testing.testPattern}`);
  sections.push('');

  // Naming
  sections.push(`## Naming Conventions`);
  sections.push(`- Variables: ${brief.naming.variables}`);
  sections.push(`- Types: ${brief.naming.types}`);
  sections.push(`- Constants: ${brief.naming.constants}`);
  sections.push(`- Files: ${brief.naming.files}`);
  sections.push('');

  // Schema Types
  if (brief.schema.generatedTypes && brief.schema.generatedTypes.length > 0) {
    sections.push(`## Schema Types (Use These!)`);
    sections.push(`- ${brief.schema.generatedTypes.slice(0, 20).join(', ')}`);
    sections.push('');
  }

  // Do Not Touch
  if (brief.doNotTouch.length > 0) {
    sections.push(`## Do Not Touch`);
    sections.push(`- ${brief.doNotTouch.join(', ')}`);
    sections.push('');
  }

  return sections.join('\n');
}

/**
 * Build glossary, naming examples, and APIs from symbol index
 */
async function buildGlossaryAndNaming(root: string, brief: ProjectBrief): Promise<void> {
  try {
    // Build symbol index
    const index = await buildSymbolIndex(root, {
      exts: ['.ts', '.tsx', '.js', '.jsx'],
      maxFiles: 2000,
      maxPerFileIds: 200,
      exclude: ['node_modules', 'dist', 'build', '.next', 'coverage', '__generated__'],
    });

    // Extract top frequency identifiers for glossary
    const topIds = topFrequencyIdentifiers(index, {
      minLen: 3,
      byDir: ['/domain', '/models', '/entities', '/types'],
      limit: 50,
    });

    // Categorize into entities, enums, constants
    brief.glossary.entities = topIds.filter(id => /^[A-Z]/.test(id) && !/^[A-Z_]+$/.test(id));
    brief.glossary.enums = topIds.filter(id => /^[A-Z][a-z]+[A-Z]/.test(id));
    brief.glossary.constants = topIds.filter(id => /^[A-Z_]+$/.test(id));

    // Extract public APIs
    brief.apis.publicExports = publicExports(index, [
      'src/**/index.ts',
      'src/**/api/**/*.ts',
      'src/lib/**/*.ts',
    ]).slice(0, 20);

    // Collect naming examples
    brief.naming.examples = collectNamingExamples(index);

    // Infer naming conventions
    const conventions = inferNamingConvention(index);
    brief.naming.variables = conventions.variables;
    brief.naming.types = conventions.types;
    brief.naming.constants = conventions.constants;
    brief.naming.files = conventions.files;
  } catch (error) {
    console.warn('Failed to build glossary and naming:', error);
  }
}

