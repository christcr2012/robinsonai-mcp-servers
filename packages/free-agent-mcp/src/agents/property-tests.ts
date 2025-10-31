#!/usr/bin/env node
/**
 * Property & Fuzz Tests Generator
 * 
 * Auto-generate property-based tests for pure functions.
 * Uses fast-check (JS/TS) or Hypothesis (Python) patterns.
 * Catches "passes unit, fails edge" bugs.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

export interface PropertyTestConfig {
  functionName: string;
  functionSignature: string;
  domain: 'parser' | 'math' | 'transform' | 'validator' | 'serializer';
  language: 'typescript' | 'javascript' | 'python';
  framework?: 'fast-check' | 'hypothesis' | 'auto';
}

export interface PropertyTest {
  path: string;
  content: string;
  properties: string[];
  framework: string;
}

/**
 * Generate property-based tests for a pure function
 */
export function generatePropertyTests(config: PropertyTestConfig): PropertyTest {
  const framework = config.framework === 'auto' || !config.framework
    ? detectFramework(config.language)
    : config.framework;

  const properties = detectProperties(config.domain, config.functionSignature);
  const content = generateTestContent(config, properties, framework);
  const testPath = generateTestPath(config);

  return {
    path: testPath,
    content,
    properties,
    framework,
  };
}

/**
 * Detect appropriate testing framework based on language
 */
function detectFramework(language: string): string {
  switch (language) {
    case 'typescript':
    case 'javascript':
      return 'fast-check';
    case 'python':
      return 'hypothesis';
    default:
      return 'fast-check';
  }
}

/**
 * Detect properties to test based on function domain
 */
function detectProperties(domain: string, signature: string): string[] {
  const baseProperties = ['idempotence', 'determinism'];
  
  switch (domain) {
    case 'parser':
      return [...baseProperties, 'round-trip', 'error-handling', 'empty-input'];
    case 'math':
      return [...baseProperties, 'commutativity', 'associativity', 'identity'];
    case 'transform':
      return [...baseProperties, 'reversibility', 'composition', 'type-preservation'];
    case 'validator':
      return [...baseProperties, 'consistency', 'boundary-cases', 'invalid-input'];
    case 'serializer':
      return [...baseProperties, 'round-trip', 'encoding-preservation', 'size-bounds'];
    default:
      return baseProperties;
  }
}

/**
 * Generate test file path
 */
function generateTestPath(config: PropertyTestConfig): string {
  const ext = config.language === 'python' ? '.py' : '.test.ts';
  return `${config.functionName}.property${ext}`;
}

/**
 * Generate test file content
 */
function generateTestContent(
  config: PropertyTestConfig,
  properties: string[],
  framework: string
): string {
  if (framework === 'fast-check') {
    return generateFastCheckTests(config, properties);
  } else if (framework === 'hypothesis') {
    return generateHypothesisTests(config, properties);
  }
  throw new Error(`Unsupported framework: ${framework}`);
}

/**
 * Generate fast-check tests (TypeScript/JavaScript)
 */
function generateFastCheckTests(config: PropertyTestConfig, properties: string[]): string {
  const imports = `import * as fc from 'fast-check';
import { ${config.functionName} } from './${config.functionName}';

describe('${config.functionName} - Property Tests', () => {`;

  const tests = properties.map(prop => generateFastCheckProperty(config, prop)).join('\n\n');

  return `${imports}
${tests}
});
`;
}

/**
 * Generate individual fast-check property test
 */
function generateFastCheckProperty(config: PropertyTestConfig, property: string): string {
  switch (property) {
    case 'idempotence':
      return `  it('should be idempotent (f(f(x)) === f(x))', () => {
    fc.assert(
      fc.property(fc.anything(), (input) => {
        const once = ${config.functionName}(input);
        const twice = ${config.functionName}(once);
        expect(twice).toEqual(once);
      })
    );
  });`;

    case 'determinism':
      return `  it('should be deterministic (same input → same output)', () => {
    fc.assert(
      fc.property(fc.anything(), (input) => {
        const result1 = ${config.functionName}(input);
        const result2 = ${config.functionName}(input);
        expect(result2).toEqual(result1);
      })
    );
  });`;

    case 'round-trip':
      return `  it('should round-trip (parse(serialize(x)) === x)', () => {
    fc.assert(
      fc.property(fc.anything(), (input) => {
        try {
          const serialized = ${config.functionName}(input);
          const deserialized = reverse${config.functionName}(serialized);
          expect(deserialized).toEqual(input);
        } catch (e) {
          // Expected for invalid inputs
        }
      })
    );
  });`;

    case 'error-handling':
      return `  it('should handle errors gracefully', () => {
    fc.assert(
      fc.property(fc.anything(), (input) => {
        try {
          ${config.functionName}(input);
          return true;
        } catch (e) {
          // Should throw specific error types, not generic Error
          expect(e).toBeInstanceOf(Error);
          expect(e.message).toBeTruthy();
          return true;
        }
      })
    );
  });`;

    case 'empty-input':
      return `  it('should handle empty input', () => {
    const emptyInputs = [null, undefined, '', [], {}];
    emptyInputs.forEach(input => {
      expect(() => ${config.functionName}(input)).not.toThrow();
    });
  });`;

    case 'commutativity':
      return `  it('should be commutative (f(a, b) === f(b, a))', () => {
    fc.assert(
      fc.property(fc.anything(), fc.anything(), (a, b) => {
        const result1 = ${config.functionName}(a, b);
        const result2 = ${config.functionName}(b, a);
        expect(result2).toEqual(result1);
      })
    );
  });`;

    case 'associativity':
      return `  it('should be associative (f(f(a, b), c) === f(a, f(b, c)))', () => {
    fc.assert(
      fc.property(fc.anything(), fc.anything(), fc.anything(), (a, b, c) => {
        const left = ${config.functionName}(${config.functionName}(a, b), c);
        const right = ${config.functionName}(a, ${config.functionName}(b, c));
        expect(right).toEqual(left);
      })
    );
  });`;

    case 'identity':
      return `  it('should have identity element (f(x, identity) === x)', () => {
    fc.assert(
      fc.property(fc.anything(), (x) => {
        const identity = getIdentity();
        const result = ${config.functionName}(x, identity);
        expect(result).toEqual(x);
      })
    );
  });`;

    default:
      return `  it('should satisfy ${property}', () => {
    fc.assert(
      fc.property(fc.anything(), (input) => {
        // TODO: Implement ${property} property test
        expect(true).toBe(true);
      })
    );
  });`;
  }
}

/**
 * Generate Hypothesis tests (Python)
 */
function generateHypothesisTests(config: PropertyTestConfig, properties: string[]): string {
  const imports = `from hypothesis import given, strategies as st
import pytest
from ${config.functionName} import ${config.functionName}

class Test${capitalize(config.functionName)}Properties:`;

  const tests = properties.map(prop => generateHypothesisProperty(config, prop)).join('\n\n');

  return `${imports}
${tests}
`;
}

/**
 * Generate individual Hypothesis property test
 */
function generateHypothesisProperty(config: PropertyTestConfig, property: string): string {
  switch (property) {
    case 'idempotence':
      return `    @given(st.text())
    def test_idempotence(self, input_data):
        """f(f(x)) === f(x)"""
        once = ${config.functionName}(input_data)
        twice = ${config.functionName}(once)
        assert twice == once`;

    case 'determinism':
      return `    @given(st.text())
    def test_determinism(self, input_data):
        """Same input → same output"""
        result1 = ${config.functionName}(input_data)
        result2 = ${config.functionName}(input_data)
        assert result2 == result1`;

    case 'round-trip':
      return `    @given(st.text())
    def test_round_trip(self, input_data):
        """parse(serialize(x)) === x"""
        try:
            serialized = ${config.functionName}(input_data)
            deserialized = reverse_${config.functionName}(serialized)
            assert deserialized == input_data
        except ValueError:
            # Expected for invalid inputs
            pass`;

    default:
      return `    @given(st.text())
    def test_${property.replace('-', '_')}(self, input_data):
        """${property}"""
        # TODO: Implement ${property} property test
        assert True`;
  }
}

/**
 * Capitalize first letter
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Scan codebase for pure functions and suggest property tests
 */
export async function suggestPropertyTests(root: string): Promise<PropertyTestConfig[]> {
  const suggestions: PropertyTestConfig[] = [];
  
  // Scan for pure functions (heuristic: no side effects, deterministic)
  const files = await findSourceFiles(root);
  
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const functions = extractPureFunctions(content, file);
    suggestions.push(...functions);
  }
  
  return suggestions;
}

/**
 * Find source files in directory
 */
async function findSourceFiles(root: string): Promise<string[]> {
  const files: string[] = [];
  
  function walk(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        walk(fullPath);
      } else if (entry.isFile() && /\.(ts|js|py)$/.test(entry.name)) {
        files.push(fullPath);
      }
    }
  }
  
  walk(root);
  return files;
}

/**
 * Extract pure functions from source file (heuristic)
 */
function extractPureFunctions(content: string, filePath: string): PropertyTestConfig[] {
  const configs: PropertyTestConfig[] = [];
  const language = filePath.endsWith('.py') ? 'python' : 'typescript';
  
  // Simple heuristic: look for function declarations
  const functionRegex = language === 'python'
    ? /def\s+(\w+)\s*\([^)]*\)\s*->\s*\w+:/g
    : /(?:export\s+)?function\s+(\w+)\s*\([^)]*\):\s*\w+/g;
  
  let match;
  while ((match = functionRegex.exec(content)) !== null) {
    const functionName = match[1];
    
    // Skip if already has tests
    const testPath = filePath.replace(/\.(ts|js|py)$/, language === 'python' ? '.test.py' : '.test.ts');
    if (fs.existsSync(testPath)) {
      const testContent = fs.readFileSync(testPath, 'utf-8');
      if (testContent.includes(functionName)) {
        continue;
      }
    }
    
    // Detect domain based on function name
    const domain = detectDomain(functionName);
    
    configs.push({
      functionName,
      functionSignature: match[0],
      domain,
      language: language as 'typescript' | 'python',
    });
  }
  
  return configs;
}

/**
 * Detect function domain based on name
 */
function detectDomain(functionName: string): PropertyTestConfig['domain'] {
  const name = functionName.toLowerCase();
  
  if (name.includes('parse') || name.includes('lex') || name.includes('tokenize')) {
    return 'parser';
  }
  if (name.includes('add') || name.includes('multiply') || name.includes('calculate')) {
    return 'math';
  }
  if (name.includes('transform') || name.includes('map') || name.includes('convert')) {
    return 'transform';
  }
  if (name.includes('validate') || name.includes('check') || name.includes('verify')) {
    return 'validator';
  }
  if (name.includes('serialize') || name.includes('encode') || name.includes('stringify')) {
    return 'serializer';
  }
  
  return 'transform'; // Default
}

