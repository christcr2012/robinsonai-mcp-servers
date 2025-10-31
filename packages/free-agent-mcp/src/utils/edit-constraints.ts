/**
 * Constrained Edit Surface
 * 
 * Prevent style drift by limiting what can be touched:
 * 1. Only allow changes in paths the task owns
 * 2. All other files are read-only
 * 3. Require minimal diffs (no renaming public symbols unless judge approves)
 */

import * as path from 'path';
import { buildSymbolIndex, type Symbol } from './symbol-indexer.js';

export interface EditConstraints {
  allowedPaths: string[];
  readOnlyPaths: string[];
  allowPublicRenames: boolean;
}

export interface EditViolation {
  file: string;
  violation: string;
  severity: 'error' | 'warning';
}

/**
 * Check if edits violate constraints
 */
export async function checkEditConstraints(
  root: string,
  files: Array<{ path: string; content: string }>,
  constraints: EditConstraints
): Promise<EditViolation[]> {
  const violations: EditViolation[] = [];

  for (const file of files) {
    // Check if file is in allowed paths
    const isAllowed = constraints.allowedPaths.some(allowed => 
      file.path.startsWith(allowed) || matchesGlob(file.path, allowed)
    );

    if (!isAllowed) {
      const isReadOnly = constraints.readOnlyPaths.some(readonly => 
        file.path.startsWith(readonly) || matchesGlob(file.path, readonly)
      );

      if (isReadOnly) {
        violations.push({
          file: file.path,
          violation: 'File is read-only and cannot be modified',
          severity: 'error',
        });
        continue;
      }
    }

    // Check for public symbol renames
    if (!constraints.allowPublicRenames) {
      const renameViolations = await checkPublicRenames(root, file);
      violations.push(...renameViolations);
    }
  }

  return violations;
}

/**
 * Check if file path matches glob pattern
 */
function matchesGlob(filePath: string, pattern: string): boolean {
  // Simple glob matching (supports * and **)
  const regexPattern = pattern
    .replace(/\*\*/g, '.*')
    .replace(/\*/g, '[^/]*')
    .replace(/\./g, '\\.');
  
  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(filePath);
}

/**
 * Check for public symbol renames
 */
async function checkPublicRenames(
  root: string,
  file: { path: string; content: string }
): Promise<EditViolation[]> {
  const violations: EditViolation[] = [];

  try {
    // Build symbol index for the new file
    const newSymbols = extractSymbolsFromContent(file.content, file.path);
    
    // Check if original file exists
    const fs = await import('fs');
    const fullPath = path.join(root, file.path);
    
    if (!fs.existsSync(fullPath)) {
      return violations; // New file, no renames to check
    }

    // Get original symbols
    const originalContent = fs.readFileSync(fullPath, 'utf-8');
    const originalSymbols = extractSymbolsFromContent(originalContent, file.path);

    // Find renamed public symbols
    const originalPublic = originalSymbols.filter(s => s.isPublic);
    const newPublic = newSymbols.filter(s => s.isPublic);

    const originalNames = new Set(originalPublic.map(s => s.name));
    const newNames = new Set(newPublic.map(s => s.name));

    // Check for removed public symbols
    for (const name of originalNames) {
      if (!newNames.has(name)) {
        violations.push({
          file: file.path,
          violation: `Public symbol '${name}' was removed or renamed. This is a breaking change.`,
          severity: 'error',
        });
      }
    }
  } catch (error) {
    // Skip if we can't check
  }

  return violations;
}

/**
 * Extract symbols from content
 */
function extractSymbolsFromContent(content: string, filePath: string): Symbol[] {
  const symbols: Symbol[] = [];
  const lines = content.split('\n');
  
  // Patterns for different symbol types
  const patterns = [
    // export function/const/class/interface/type
    { regex: /export\s+(async\s+)?function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g, type: 'function' as const, isPublic: true },
    { regex: /export\s+const\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g, type: 'const' as const, isPublic: true },
    { regex: /export\s+class\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g, type: 'class' as const, isPublic: true },
    { regex: /export\s+interface\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g, type: 'interface' as const, isPublic: true },
    { regex: /export\s+type\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g, type: 'type' as const, isPublic: true },
    { regex: /export\s+enum\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g, type: 'enum' as const, isPublic: true },
  ];
  
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.regex.exec(content)) !== null) {
      const name = match[2] || match[1];
      if (!name) continue;
      
      // Find line number
      const lineNumber = content.substring(0, match.index).split('\n').length;
      
      symbols.push({
        name,
        type: pattern.type,
        file: filePath,
        line: lineNumber,
        isPublic: pattern.isPublic,
      });
    }
  }
  
  return symbols;
}

/**
 * Infer allowed paths from task spec
 */
export function inferAllowedPaths(spec: string, root: string): string[] {
  const allowedPaths: string[] = [];

  // Extract file paths mentioned in spec
  const pathMatches = spec.matchAll(/(?:^|\s)([a-zA-Z0-9_\-/]+\.[a-zA-Z]+)/g);
  for (const match of pathMatches) {
    allowedPaths.push(match[1]);
  }

  // Extract directory paths
  const dirMatches = spec.matchAll(/(?:^|\s)([a-zA-Z0-9_\-/]+\/)/g);
  for (const match of dirMatches) {
    allowedPaths.push(match[1] + '**/*');
  }

  // If no paths found, allow src/**
  if (allowedPaths.length === 0) {
    allowedPaths.push('src/**/*');
  }

  return allowedPaths;
}

/**
 * Get default read-only paths
 */
export function getDefaultReadOnlyPaths(): string[] {
  return [
    'node_modules/**/*',
    'dist/**/*',
    'build/**/*',
    '.next/**/*',
    'coverage/**/*',
    '__generated__/**/*',
    'src/gen/**/*',
    'src/generated/**/*',
    'prisma/client/**/*',
  ];
}

/**
 * Calculate diff size (number of changed lines)
 */
export function calculateDiffSize(
  originalContent: string,
  newContent: string
): number {
  const originalLines = originalContent.split('\n');
  const newLines = newContent.split('\n');

  let changes = 0;

  // Simple line-by-line diff
  const maxLines = Math.max(originalLines.length, newLines.length);
  for (let i = 0; i < maxLines; i++) {
    const originalLine = originalLines[i] || '';
    const newLine = newLines[i] || '';

    if (originalLine !== newLine) {
      changes++;
    }
  }

  return changes;
}

/**
 * Check if diff is minimal (< 50% of file changed)
 */
export function isMinimalDiff(
  originalContent: string,
  newContent: string
): boolean {
  const diffSize = calculateDiffSize(originalContent, newContent);
  const totalLines = originalContent.split('\n').length;

  if (totalLines === 0) return true; // New file

  const changePercentage = (diffSize / totalLines) * 100;
  return changePercentage < 50;
}

/**
 * Enforce minimal diffs
 */
export async function enforceMinimalDiffs(
  root: string,
  files: Array<{ path: string; content: string }>
): Promise<EditViolation[]> {
  const violations: EditViolation[] = [];
  const fs = await import('fs');

  for (const file of files) {
    const fullPath = path.join(root, file.path);
    
    if (!fs.existsSync(fullPath)) {
      continue; // New file, no diff to check
    }

    const originalContent = fs.readFileSync(fullPath, 'utf-8');
    
    if (!isMinimalDiff(originalContent, file.content)) {
      const diffSize = calculateDiffSize(originalContent, file.content);
      const totalLines = originalContent.split('\n').length;
      const changePercentage = ((diffSize / totalLines) * 100).toFixed(1);

      violations.push({
        file: file.path,
        violation: `Diff is too large (${changePercentage}% of file changed). Prefer minimal, targeted changes.`,
        severity: 'warning',
      });
    }
  }

  return violations;
}

