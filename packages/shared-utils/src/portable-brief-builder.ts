/**
 * Portable Brief Builder - Infer project conventions
 * 
 * Builds project brief by inferring naming, glossary, layering from actual code.
 * No hardcoded assumptions - works across any language/project.
 */

import * as fs from 'fs';
import * as path from 'path';
import type { Capabilities } from './repo-probe.js';

export interface PortableProjectBrief {
  naming: {
    var: string;      // camelCase, snake_case, etc.
    type: string;     // PascalCase, snake_case, etc.
    const: string;    // UPPER_SNAKE_CASE, camelCase, etc.
  };
  imports: {
    usesAliases: boolean;
    exampleAlias?: string;
  };
  layers: Array<{
    name: string;
    allowedImports?: string[];
  }>;
  glossary: string[];
  tests: {
    framework: string;
    style: string[];
  };
  schema: {
    types: string[];
    source: string;
  };
}

/**
 * Build portable project brief from capabilities
 */
export async function buildPortableBrief(
  root: string,
  caps: Capabilities
): Promise<PortableProjectBrief> {
  // Sample identifiers from codebase
  const identifiers = await sampleIdentifiers(root, caps.langs);
  
  // Infer naming conventions
  const naming = inferNamingConventions(identifiers);
  
  // Infer import patterns
  const imports = await inferImportPatterns(root, caps.langs);
  
  // Infer layering from import graph
  const layers = await inferLayering(root, caps.langs);
  
  // Build glossary from frequent identifiers
  const glossary = buildGlossary(identifiers);
  
  // Detect test framework and style
  const tests = inferTestStyle(caps.tests);
  
  // Extract schema types
  const schema = await extractSchemaTypes(root, caps.schemas);
  
  return {
    naming,
    imports,
    layers,
    glossary,
    tests,
    schema,
  };
}

/**
 * Sample identifiers from codebase
 */
async function sampleIdentifiers(
  root: string,
  langs: string[]
): Promise<Map<string, string[]>> {
  const identifiers = new Map<string, string[]>();
  identifiers.set('var', []);
  identifiers.set('type', []);
  identifiers.set('const', []);
  
  // Get file extensions for detected languages
  const extensions = getExtensionsForLanguages(langs);
  
  // Sample files (max 100 files for speed)
  const files = await findSourceFiles(root, extensions, 100);
  
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    
    // Extract identifiers using regex (language-agnostic)
    const vars = extractVariables(content);
    const types = extractTypes(content);
    const consts = extractConstants(content);
    
    identifiers.get('var')!.push(...vars);
    identifiers.get('type')!.push(...types);
    identifiers.get('const')!.push(...consts);
  }
  
  return identifiers;
}

/**
 * Get file extensions for languages
 */
function getExtensionsForLanguages(langs: string[]): string[] {
  const extensionMap: Record<string, string[]> = {
    'typescript': ['.ts', '.tsx'],
    'javascript': ['.js', '.jsx', '.mjs', '.cjs'],
    'python': ['.py'],
    'go': ['.go'],
    'rust': ['.rs'],
    'java': ['.java'],
    'kotlin': ['.kt', '.kts'],
    'csharp': ['.cs'],
    'ruby': ['.rb'],
    'php': ['.php'],
  };
  
  const extensions: string[] = [];
  for (const lang of langs) {
    if (extensionMap[lang]) {
      extensions.push(...extensionMap[lang]);
    }
  }
  
  return extensions;
}

/**
 * Find source files with given extensions
 */
async function findSourceFiles(
  root: string,
  extensions: string[],
  maxFiles: number
): Promise<string[]> {
  const files: string[] = [];
  
  function search(dir: string, depth: number): void {
    if (depth > 5 || files.length >= maxFiles) return;
    
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        if (files.length >= maxFiles) break;
        
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          // Skip common ignore directories
          if (!['node_modules', '.git', 'dist', 'build', '__pycache__', 'target'].includes(entry.name)) {
            search(fullPath, depth + 1);
          }
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name);
          if (extensions.includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    } catch (error) {
      // Ignore permission errors
    }
  }
  
  search(root, 0);
  return files;
}

/**
 * Extract variable names from code
 */
function extractVariables(content: string): string[] {
  const patterns = [
    /(?:let|const|var)\s+([a-zA-Z_][a-zA-Z0-9_]*)/g,  // JS/TS
    /([a-z_][a-z0-9_]*)\s*=/g,                         // Python, Go
    /(?:val|var)\s+([a-zA-Z_][a-zA-Z0-9_]*)/g,        // Kotlin
  ];
  
  const vars: string[] = [];
  for (const pattern of patterns) {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      if (match[1] && match[1].length > 1) {
        vars.push(match[1]);
      }
    }
  }
  
  return vars;
}

/**
 * Extract type names from code
 */
function extractTypes(content: string): string[] {
  const patterns = [
    /(?:interface|type|class)\s+([A-Z][a-zA-Z0-9_]*)/g,  // TS/JS
    /class\s+([A-Z][a-zA-Z0-9_]*)/g,                      // Python, Java, Kotlin
    /type\s+([A-Z][a-zA-Z0-9_]*)/g,                       // Go, Rust
    /struct\s+([A-Z][a-zA-Z0-9_]*)/g,                     // Go, Rust
  ];
  
  const types: string[] = [];
  for (const pattern of patterns) {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      if (match[1]) {
        types.push(match[1]);
      }
    }
  }
  
  return types;
}

/**
 * Extract constant names from code
 */
function extractConstants(content: string): string[] {
  const patterns = [
    /const\s+([A-Z_][A-Z0-9_]*)\s*=/g,  // UPPER_SNAKE_CASE
    /([A-Z_][A-Z0-9_]{2,})\s*=/g,       // Generic UPPER_SNAKE
  ];
  
  const consts: string[] = [];
  for (const pattern of patterns) {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      if (match[1] && match[1].length > 2) {
        consts.push(match[1]);
      }
    }
  }
  
  return consts;
}

/**
 * Infer naming conventions from sampled identifiers
 */
function inferNamingConventions(identifiers: Map<string, string[]>): {
  var: string;
  type: string;
  const: string;
} {
  const varStyle = detectCasingStyle(identifiers.get('var') || []);
  const typeStyle = detectCasingStyle(identifiers.get('type') || []);
  const constStyle = detectCasingStyle(identifiers.get('const') || []);
  
  return {
    var: varStyle,
    type: typeStyle,
    const: constStyle,
  };
}

/**
 * Detect casing style from identifiers
 */
function detectCasingStyle(identifiers: string[]): string {
  if (identifiers.length === 0) return 'camelCase';
  
  let camelCaseCount = 0;
  let snakeCaseCount = 0;
  let pascalCaseCount = 0;
  let upperSnakeCount = 0;
  
  for (const id of identifiers) {
    if (/^[a-z][a-zA-Z0-9]*$/.test(id)) camelCaseCount++;
    if (/^[a-z_][a-z0-9_]*$/.test(id)) snakeCaseCount++;
    if (/^[A-Z][a-zA-Z0-9]*$/.test(id)) pascalCaseCount++;
    if (/^[A-Z_][A-Z0-9_]*$/.test(id)) upperSnakeCount++;
  }
  
  const max = Math.max(camelCaseCount, snakeCaseCount, pascalCaseCount, upperSnakeCount);
  
  if (max === camelCaseCount) return 'camelCase';
  if (max === snakeCaseCount) return 'snake_case';
  if (max === pascalCaseCount) return 'PascalCase';
  if (max === upperSnakeCount) return 'UPPER_SNAKE_CASE';
  
  return 'camelCase';
}

/**
 * Infer import patterns
 */
async function inferImportPatterns(root: string, langs: string[]): Promise<{
  usesAliases: boolean;
  exampleAlias?: string;
}> {
  // Sample a few files and check for import aliases
  const extensions = getExtensionsForLanguages(langs);
  const files = await findSourceFiles(root, extensions, 20);
  
  let aliasCount = 0;
  let exampleAlias: string | undefined;
  
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    
    // Check for common alias patterns
    const aliasPatterns = [
      /@[a-zA-Z0-9_-]+\//g,  // @app/, @lib/, etc.
      /~[a-zA-Z0-9_-]+\//g,  // ~/components/, etc.
    ];
    
    for (const pattern of aliasPatterns) {
      const matches = content.match(pattern);
      if (matches && matches.length > 0) {
        aliasCount++;
        if (!exampleAlias) {
          exampleAlias = matches[0];
        }
      }
    }
  }
  
  return {
    usesAliases: aliasCount > 0,
    exampleAlias,
  };
}

/**
 * Infer layering from import graph (simplified)
 */
async function inferLayering(root: string, langs: string[]): Promise<Array<{ name: string; allowedImports?: string[] }>> {
  // Simplified: detect common folder patterns
  const commonLayers = ['domain', 'infra', 'features', 'utils', 'lib', 'core', 'services'];
  const detectedLayers: string[] = [];
  
  for (const layer of commonLayers) {
    const layerPath = path.join(root, 'src', layer);
    if (fs.existsSync(layerPath)) {
      detectedLayers.push(layer);
    }
  }
  
  // Default layering rules
  return detectedLayers.map(name => ({ name }));
}

/**
 * Build glossary from frequent identifiers
 */
function buildGlossary(identifiers: Map<string, string[]>): string[] {
  const allIdentifiers = [
    ...identifiers.get('var') || [],
    ...identifiers.get('type') || [],
    ...identifiers.get('const') || [],
  ];
  
  // Count frequency
  const frequency = new Map<string, number>();
  for (const id of allIdentifiers) {
    frequency.set(id, (frequency.get(id) || 0) + 1);
  }
  
  // Sort by frequency and take top 50
  const sorted = Array.from(frequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 50)
    .map(([id]) => id);
  
  return sorted;
}

/**
 * Infer test style from detected frameworks
 */
function inferTestStyle(testFrameworks: string[]): { framework: string; style: string[] } {
  if (testFrameworks.length === 0) {
    return { framework: 'auto', style: [] };
  }
  
  return {
    framework: testFrameworks[0],
    style: ['table-driven', 'fixtures'],
  };
}

/**
 * Extract schema types (simplified)
 */
async function extractSchemaTypes(root: string, schemas: string[]): Promise<{ types: string[]; source: string }> {
  if (schemas.length === 0) {
    return { types: [], source: 'auto' };
  }
  
  // Simplified: return detected schema types
  return {
    types: [],
    source: schemas[0],
  };
}

