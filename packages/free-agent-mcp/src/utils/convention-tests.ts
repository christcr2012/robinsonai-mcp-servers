/**
 * Repo-Aware Convention Tests
 * 
 * Generate tests that assert conventions:
 * - Import path rules
 * - Name checks
 * - No 'any' in public types
 * - Layering rules
 */

import * as fs from 'fs';
import * as path from 'path';
import type { ProjectBrief } from './project-brief.js';

export interface ConventionTest {
  name: string;
  description: string;
  code: string;
}

/**
 * Generate convention tests for generated code
 */
export function generateConventionTests(
  files: Array<{ path: string; content: string }>,
  brief: ProjectBrief
): ConventionTest[] {
  const tests: ConventionTest[] = [];

  // Test 1: Import path rules
  tests.push(generateImportPathTest(files, brief));

  // Test 2: Naming conventions
  tests.push(generateNamingConventionTest(files, brief));

  // Test 3: No 'any' in public exports
  tests.push(generateNoAnyTest(files));

  // Test 4: Layering rules
  tests.push(generateLayeringTest(files, brief));

  // Test 5: File naming
  tests.push(generateFileNamingTest(files, brief));

  return tests;
}

/**
 * Test 1: Import path rules
 */
function generateImportPathTest(
  files: Array<{ path: string; content: string }>,
  brief: ProjectBrief
): ConventionTest {
  const code = `
describe('Import Path Conventions', () => {
  it('should use correct import paths', () => {
    const files = ${JSON.stringify(files.map(f => ({ path: f.path, content: f.content })), null, 2)};

    for (const file of files) {
      const imports = extractImports(file.content);

      for (const imp of imports) {
        // Check for relative imports going up too many levels
        const upLevels = (imp.match(/\\.\\./g) || []).length;
        expect(upLevels).toBeLessThanOrEqual(2);

        // Check for absolute imports from src
        if (imp.startsWith('src/')) {
          fail(\`File \${file.path} uses absolute import '\${imp}'. Use relative imports or path aliases.\`);
        }
      }
    }
  });
});
`;

  return {
    name: 'import-paths',
    description: 'Validates import path conventions',
    code,
  };
}

/**
 * Test 2: Naming conventions
 */
function generateNamingConventionTest(
  files: Array<{ path: string; content: string }>,
  brief: ProjectBrief
): ConventionTest {
  const code = `
describe('Naming Conventions', () => {
  it('should follow repo naming conventions', () => {
    const files = ${JSON.stringify(files.map(f => ({ path: f.path, content: f.content })), null, 2)};
    const namingRules = ${JSON.stringify(brief.naming, null, 2)};
    
    for (const file of files) {
      // Check variable names (camelCase)
      const varMatches = file.content.matchAll(/(?:const|let|var)\\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g);
      for (const match of varMatches) {
        const name = match[1];
        
        // Skip UPPER_SNAKE_CASE constants
        if (name === name.toUpperCase()) continue;
        
        // Check camelCase
        if (!/^[a-z][a-zA-Z0-9]*$/.test(name)) {
          fail(\`Variable '\${name}' in \${file.path} should be camelCase\`);
        }
      }
      
      // Check type names (PascalCase)
      const typeMatches = file.content.matchAll(/(?:interface|type|class|enum)\\s+([A-Z][a-zA-Z0-9]*)/g);
      for (const match of typeMatches) {
        const name = match[1];
        
        // Check PascalCase
        if (!/^[A-Z][a-zA-Z0-9]*$/.test(name)) {
          fail(\`Type '\${name}' in \${file.path} should be PascalCase\`);
        }
      }
    }
  });
});
`;

  return {
    name: 'naming-conventions',
    description: 'Validates naming conventions (camelCase, PascalCase)',
    code,
  };
}

/**
 * Test 3: No 'any' in public exports
 */
function generateNoAnyTest(
  files: Array<{ path: string; content: string }>
): ConventionTest {
  const code = `
describe('Type Safety', () => {
  it('should not use any in public exports', () => {
    const files = ${JSON.stringify(files.map(f => ({ path: f.path, content: f.content })), null, 2)};
    
    for (const file of files) {
      // Find export statements
      const exportMatches = file.content.matchAll(/export\\s+(?:function|const|class|interface|type)\\s+[^{;]+/g);
      
      for (const match of exportMatches) {
        const exportStatement = match[0];
        
        // Check for 'any' type
        if (exportStatement.includes(': any') || exportStatement.includes('<any>')) {
          fail(\`Public export in \${file.path} uses 'any' type: \${exportStatement}\`);
        }
      }
    }
  });
});
`;

  return {
    name: 'no-any-in-exports',
    description: 'Ensures no any type in public exports',
    code,
  };
}

/**
 * Test 4: Layering rules
 */
function generateLayeringTest(
  files: Array<{ path: string; content: string }>,
  brief: ProjectBrief
): ConventionTest {
  const code = `
describe('Layering Rules', () => {
  it('should respect layer boundaries', () => {
    const files = ${JSON.stringify(files.map(f => ({ path: f.path, content: f.content })), null, 2)};
    const layers = ${JSON.stringify(brief.layering?.layers || [], null, 2)};

    // Skip if no layers defined
    if (!layers || layers.length === 0) {
      return;
    }

    for (const file of files) {
      // Determine file's layer
      const fileLayer = layers.find(layer => file.path.includes(layer.name));
      if (!fileLayer) continue;

      // Extract imports
      const imports = extractImports(file.content);

      for (const imp of imports) {
        // Skip external imports
        if (!imp.startsWith('.') && !imp.startsWith('/')) continue;

        // Check if import violates layer rules
        const importedLayer = layers.find(layer => imp.includes(layer.name));
        if (!importedLayer) continue;

        if (!fileLayer.canImport.includes(importedLayer.name)) {
          fail(\`File \${file.path} in layer '\${fileLayer.name}' cannot import from layer '\${importedLayer.name}'\`);
        }
      }
    }
  });
});
`;

  return {
    name: 'layering-rules',
    description: 'Validates layer boundary rules',
    code,
  };
}

/**
 * Test 5: File naming
 */
function generateFileNamingTest(
  files: Array<{ path: string; content: string }>,
  brief: ProjectBrief
): ConventionTest {
  const code = `
describe('File Naming', () => {
  it('should follow file naming conventions', () => {
    const files = ${JSON.stringify(files.map(f => f.path), null, 2)};
    const fileNamingPattern = ${JSON.stringify(brief.naming.files)};
    
    for (const filePath of files) {
      const fileName = filePath.split('/').pop() || '';
      const baseName = fileName.replace(/\\.(ts|tsx|js|jsx)$/, '');
      
      // Check kebab-case for files
      if (fileNamingPattern === 'kebab-case') {
        if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(baseName)) {
          fail(\`File '\${fileName}' should be kebab-case\`);
        }
      }
      
      // Check camelCase for files
      if (fileNamingPattern === 'camelCase') {
        if (!/^[a-z][a-zA-Z0-9]*$/.test(baseName)) {
          fail(\`File '\${fileName}' should be camelCase\`);
        }
      }
      
      // Check PascalCase for files
      if (fileNamingPattern === 'PascalCase') {
        if (!/^[A-Z][a-zA-Z0-9]*$/.test(baseName)) {
          fail(\`File '\${fileName}' should be PascalCase\`);
        }
      }
    }
  });
});
`;

  return {
    name: 'file-naming',
    description: 'Validates file naming conventions',
    code,
  };
}

/**
 * Generate full test file
 */
export function generateConventionTestFile(
  files: Array<{ path: string; content: string }>,
  brief: ProjectBrief
): string {
  const tests = generateConventionTests(files, brief);

  const testFile = `/**
 * Convention Tests - Auto-generated
 *
 * These tests ensure generated code follows repository conventions.
 */

import { describe, it, expect } from '@jest/globals';

// Helper function used by multiple tests
function extractImports(content: string): string[] {
  const imports: string[] = [];
  const importRegex = /import\\s+.*?from\\s+['"]([^'"]+)['"]/g;
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }
  return imports;
}

${tests.map(t => t.code).join('\n\n')}
`;

  return testFile;
}

