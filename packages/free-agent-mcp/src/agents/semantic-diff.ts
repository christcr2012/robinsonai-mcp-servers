#!/usr/bin/env node
/**
 * Semantic Diff
 * 
 * Diff by symbols (add/remove/rename) instead of lines.
 * Color risky ops (public API, schema, concurrency).
 * Show in PR Quality Pack.
 */

import * as fs from 'node:fs';

export interface SemanticDiff {
  added: SymbolChange[];
  removed: SymbolChange[];
  renamed: RenameChange[];
  modified: SymbolChange[];
  risk: 'low' | 'medium' | 'high';
  riskFactors: string[];
}

export interface SymbolChange {
  name: string;
  type: 'function' | 'class' | 'interface' | 'type' | 'const' | 'variable';
  visibility: 'public' | 'private' | 'protected';
  file: string;
  line: number;
  signature?: string;
}

export interface RenameChange {
  from: string;
  to: string;
  type: 'function' | 'class' | 'interface' | 'type' | 'const' | 'variable';
  file: string;
  confidence: number; // 0-1, based on signature similarity
}

/**
 * Generate semantic diff between two versions of code
 */
export async function semanticDiff(
  oldContent: string,
  newContent: string,
  filePath: string
): Promise<SemanticDiff> {
  // Parse both versions
  const oldSymbols = await parseSymbols(oldContent, filePath);
  const newSymbols = await parseSymbols(newContent, filePath);

  // Compare symbol tables
  const added: SymbolChange[] = [];
  const removed: SymbolChange[] = [];
  const modified: SymbolChange[] = [];
  const renamed: RenameChange[] = [];

  // Find added symbols
  for (const newSym of newSymbols) {
    const oldSym = oldSymbols.find(s => s.name === newSym.name && s.type === newSym.type);
    if (!oldSym) {
      added.push(newSym);
    } else if (oldSym.signature !== newSym.signature) {
      modified.push(newSym);
    }
  }

  // Find removed symbols
  for (const oldSym of oldSymbols) {
    const newSym = newSymbols.find(s => s.name === oldSym.name && s.type === oldSym.type);
    if (!newSym) {
      removed.push(oldSym);
    }
  }

  // Detect renames (removed + added with similar signatures)
  for (const rem of removed) {
    for (const add of added) {
      if (rem.type === add.type && areSimilarSignatures(rem.signature, add.signature)) {
        renamed.push({
          from: rem.name,
          to: add.name,
          type: rem.type,
          file: filePath,
          confidence: calculateSignatureSimilarity(rem.signature, add.signature),
        });
      }
    }
  }

  // Remove detected renames from added/removed
  for (const rename of renamed) {
    const remIdx = removed.findIndex(s => s.name === rename.from);
    const addIdx = added.findIndex(s => s.name === rename.to);
    if (remIdx >= 0) removed.splice(remIdx, 1);
    if (addIdx >= 0) added.splice(addIdx, 1);
  }

  // Assess risk
  const { risk, riskFactors } = assessRisk(added, removed, renamed, modified);

  return {
    added,
    removed,
    renamed,
    modified,
    risk,
    riskFactors,
  };
}

/**
 * Parse symbols from code content
 */
async function parseSymbols(content: string, filePath: string): Promise<SymbolChange[]> {
  const symbols: SymbolChange[] = [];
  const lines = content.split('\n');

  // Simple regex-based symbol extraction (since lightweightSymbolIndexer expects a directory)
  // Extract function/class/interface/type declarations
  const patterns = [
    /(?:export\s+)?(?:async\s+)?function\s+(\w+)/g,
    /(?:export\s+)?class\s+(\w+)/g,
    /(?:export\s+)?interface\s+(\w+)/g,
    /(?:export\s+)?type\s+(\w+)/g,
    /(?:export\s+)?const\s+(\w+)/g,
  ];

  for (let lineNum = 0; lineNum < lines.length; lineNum++) {
    const line = lines[lineNum];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(line)) !== null) {
        const name = match[1];
        const type = detectSymbolType(line);

        symbols.push({
          name,
          type,
          visibility: detectVisibility(name, content),
          file: filePath,
          line: lineNum + 1,
          signature: extractSignature(name, content, lineNum + 1),
        });
      }
    }
  }

  return symbols;
}

/**
 * Detect symbol type from line content
 */
function detectSymbolType(line: string): SymbolChange['type'] {
  if (line.includes('function')) return 'function';
  if (line.includes('class')) return 'class';
  if (line.includes('interface')) return 'interface';
  if (line.includes('type')) return 'type';
  if (line.includes('const')) return 'const';
  return 'variable';
}

/**
 * Detect symbol visibility (public/private/protected)
 */
function detectVisibility(name: string, content: string): 'public' | 'private' | 'protected' {
  // Heuristic: private if starts with _, protected if starts with __, public otherwise
  if (name.startsWith('__')) return 'protected';
  if (name.startsWith('_')) return 'private';
  
  // Check for export keyword
  const exportRegex = new RegExp(`export\\s+(?:const|function|class|interface|type)\\s+${name}\\b`);
  if (exportRegex.test(content)) return 'public';
  
  return 'private';
}

/**
 * Extract function/class signature
 */
function extractSignature(name: string, content: string, line: number): string | undefined {
  const lines = content.split('\n');
  const startLine = Math.max(0, line - 1);
  
  // Look for signature in next 5 lines
  for (let i = startLine; i < Math.min(lines.length, startLine + 5); i++) {
    const lineContent = lines[i];
    
    // Function signature
    const funcMatch = lineContent.match(new RegExp(`function\\s+${name}\\s*\\([^)]*\\)(?::\\s*[^{]+)?`));
    if (funcMatch) return funcMatch[0];
    
    // Class signature
    const classMatch = lineContent.match(new RegExp(`class\\s+${name}(?:\\s+extends\\s+\\w+)?(?:\\s+implements\\s+[^{]+)?`));
    if (classMatch) return classMatch[0];
    
    // Interface/Type signature
    const typeMatch = lineContent.match(new RegExp(`(?:interface|type)\\s+${name}(?:\\s*=\\s*[^;]+)?`));
    if (typeMatch) return typeMatch[0];
  }
  
  return undefined;
}

/**
 * Check if two signatures are similar (for rename detection)
 */
function areSimilarSignatures(sig1?: string, sig2?: string): boolean {
  if (!sig1 || !sig2) return false;
  
  // Remove names and whitespace for comparison
  const normalize = (sig: string) => sig.replace(/\w+/g, '').replace(/\s+/g, '');
  
  const norm1 = normalize(sig1);
  const norm2 = normalize(sig2);
  
  return norm1 === norm2;
}

/**
 * Calculate signature similarity (0-1)
 */
function calculateSignatureSimilarity(sig1?: string, sig2?: string): number {
  if (!sig1 || !sig2) return 0;
  
  // Simple Levenshtein distance
  const distance = levenshteinDistance(sig1, sig2);
  const maxLen = Math.max(sig1.length, sig2.length);
  
  return 1 - (distance / maxLen);
}

/**
 * Levenshtein distance between two strings
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Assess risk level of changes
 */
function assessRisk(
  added: SymbolChange[],
  removed: SymbolChange[],
  renamed: RenameChange[],
  modified: SymbolChange[]
): { risk: 'low' | 'medium' | 'high'; riskFactors: string[] } {
  const riskFactors: string[] = [];
  let riskScore = 0;

  // Public API changes are risky
  const publicRemoved = removed.filter(s => s.visibility === 'public');
  const publicModified = modified.filter(s => s.visibility === 'public');
  
  if (publicRemoved.length > 0) {
    riskFactors.push(`Removed ${publicRemoved.length} public API(s): ${publicRemoved.map(s => s.name).join(', ')}`);
    riskScore += publicRemoved.length * 3;
  }
  
  if (publicModified.length > 0) {
    riskFactors.push(`Modified ${publicModified.length} public API(s): ${publicModified.map(s => s.name).join(', ')}`);
    riskScore += publicModified.length * 2;
  }

  // Schema changes are risky
  const schemaChanges = [...added, ...removed, ...modified].filter(s =>
    s.name.toLowerCase().includes('schema') ||
    s.name.toLowerCase().includes('migration') ||
    s.type === 'interface' ||
    s.type === 'type'
  );
  
  if (schemaChanges.length > 0) {
    riskFactors.push(`Schema/type changes: ${schemaChanges.length} symbols`);
    riskScore += schemaChanges.length;
  }

  // Concurrency changes are risky
  const concurrencyChanges = [...added, ...removed, ...modified].filter(s =>
    s.name.toLowerCase().includes('lock') ||
    s.name.toLowerCase().includes('mutex') ||
    s.name.toLowerCase().includes('async') ||
    s.name.toLowerCase().includes('promise')
  );
  
  if (concurrencyChanges.length > 0) {
    riskFactors.push(`Concurrency changes: ${concurrencyChanges.length} symbols`);
    riskScore += concurrencyChanges.length * 2;
  }

  // Renames are medium risk
  if (renamed.length > 0) {
    riskFactors.push(`Renamed ${renamed.length} symbol(s): ${renamed.map(r => `${r.from} → ${r.to}`).join(', ')}`);
    riskScore += renamed.length;
  }

  // Large number of changes is risky
  const totalChanges = added.length + removed.length + modified.length;
  if (totalChanges > 20) {
    riskFactors.push(`Large changeset: ${totalChanges} symbols changed`);
    riskScore += Math.floor(totalChanges / 10);
  }

  // Determine risk level
  let risk: 'low' | 'medium' | 'high';
  if (riskScore >= 10) {
    risk = 'high';
  } else if (riskScore >= 5) {
    risk = 'medium';
  } else {
    risk = 'low';
  }

  return { risk, riskFactors };
}

/**
 * Render semantic diff as markdown
 */
export function renderSemanticDiff(diff: SemanticDiff): string {
  let md = `## Semantic Diff\n\n`;
  md += `**Risk Level:** ${diff.risk.toUpperCase()}\n\n`;

  if (diff.riskFactors.length > 0) {
    md += `**Risk Factors:**\n`;
    for (const factor of diff.riskFactors) {
      md += `- ⚠️ ${factor}\n`;
    }
    md += `\n`;
  }

  if (diff.added.length > 0) {
    md += `### ✅ Added (${diff.added.length})\n\n`;
    for (const sym of diff.added) {
      md += `- \`${sym.name}\` (${sym.type}, ${sym.visibility}) at ${sym.file}:${sym.line}\n`;
    }
    md += `\n`;
  }

  if (diff.removed.length > 0) {
    md += `### ❌ Removed (${diff.removed.length})\n\n`;
    for (const sym of diff.removed) {
      md += `- \`${sym.name}\` (${sym.type}, ${sym.visibility}) at ${sym.file}:${sym.line}\n`;
    }
    md += `\n`;
  }

  if (diff.renamed.length > 0) {
    md += `### 🔄 Renamed (${diff.renamed.length})\n\n`;
    for (const rename of diff.renamed) {
      md += `- \`${rename.from}\` → \`${rename.to}\` (${rename.type}, confidence: ${(rename.confidence * 100).toFixed(0)}%)\n`;
    }
    md += `\n`;
  }

  if (diff.modified.length > 0) {
    md += `### 📝 Modified (${diff.modified.length})\n\n`;
    for (const sym of diff.modified) {
      md += `- \`${sym.name}\` (${sym.type}, ${sym.visibility}) at ${sym.file}:${sym.line}\n`;
    }
    md += `\n`;
  }

  return md;
}

/**
 * Generate semantic diff for multiple files
 */
export async function semanticDiffMultiFile(
  oldFiles: Map<string, string>,
  newFiles: Map<string, string>
): Promise<SemanticDiff> {
  const allDiffs: SemanticDiff[] = [];

  // Diff each file
  for (const [filePath, newContent] of newFiles) {
    const oldContent = oldFiles.get(filePath) || '';
    const diff = await semanticDiff(oldContent, newContent, filePath);
    allDiffs.push(diff);
  }

  // Merge all diffs
  return mergeDiffs(allDiffs);
}

/**
 * Merge multiple semantic diffs
 */
function mergeDiffs(diffs: SemanticDiff[]): SemanticDiff {
  const merged: SemanticDiff = {
    added: [],
    removed: [],
    renamed: [],
    modified: [],
    risk: 'low',
    riskFactors: [],
  };

  for (const diff of diffs) {
    merged.added.push(...diff.added);
    merged.removed.push(...diff.removed);
    merged.renamed.push(...diff.renamed);
    merged.modified.push(...diff.modified);
    merged.riskFactors.push(...diff.riskFactors);
  }

  // Recalculate risk
  const { risk } = assessRisk(merged.added, merged.removed, merged.renamed, merged.modified);
  merged.risk = risk;

  return merged;
}

