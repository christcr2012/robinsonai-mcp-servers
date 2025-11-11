/**
 * Diff-based refinement
 * 
 * Generate minimal diffs instead of passing full files to the refiner.
 * This keeps style intact and prevents the model from rewriting whole files.
 */

export interface FileDiff {
  path: string;
  oldContent: string;
  newContent: string;
  diff: string;
  hunks: DiffHunk[];
}

export interface DiffHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: string[];
}

/**
 * Generate unified diff between two file versions
 */
export function generateDiff(
  path: string,
  oldContent: string,
  newContent: string
): FileDiff {
  const oldLines = oldContent.split('\n');
  const newLines = newContent.split('\n');
  
  const hunks = generateHunks(oldLines, newLines);
  const diff = formatUnifiedDiff(path, hunks, oldLines, newLines);
  
  return {
    path,
    oldContent,
    newContent,
    diff,
    hunks,
  };
}

/**
 * Generate diff hunks using simple LCS algorithm
 */
function generateHunks(oldLines: string[], newLines: string[]): DiffHunk[] {
  const hunks: DiffHunk[] = [];
  const changes = computeChanges(oldLines, newLines);
  
  let currentHunk: DiffHunk | null = null;
  const contextLines = 3; // Lines of context before/after changes
  
  for (let i = 0; i < changes.length; i++) {
    const change = changes[i];
    
    if (change.type === 'equal') {
      if (currentHunk) {
        // Add context lines after change
        const contextEnd = Math.min(i + contextLines, changes.length);
        for (let j = i; j < contextEnd && changes[j].type === 'equal'; j++) {
          currentHunk.lines.push(' ' + changes[j].line);
        }
        
        // Check if next change is far enough to close this hunk
        const nextChangeIndex = changes.findIndex((c, idx) => idx > i && c.type !== 'equal');
        if (nextChangeIndex === -1 || nextChangeIndex - i > contextLines * 2) {
          hunks.push(currentHunk);
          currentHunk = null;
        }
      }
    } else {
      // Start new hunk if needed
      if (!currentHunk) {
        const contextStart = Math.max(0, i - contextLines);
        currentHunk = {
          oldStart: change.oldIndex - (i - contextStart),
          oldLines: 0,
          newStart: change.newIndex - (i - contextStart),
          newLines: 0,
          lines: [],
        };
        
        // Add context lines before change
        for (let j = contextStart; j < i; j++) {
          if (changes[j].type === 'equal') {
            currentHunk.lines.push(' ' + changes[j].line);
          }
        }
      }
      
      // Add change line
      if (change.type === 'delete') {
        currentHunk.lines.push('-' + change.line);
        currentHunk.oldLines++;
      } else if (change.type === 'insert') {
        currentHunk.lines.push('+' + change.line);
        currentHunk.newLines++;
      }
    }
  }
  
  // Close final hunk
  if (currentHunk) {
    hunks.push(currentHunk);
  }
  
  return hunks;
}

/**
 * Compute line-by-line changes
 */
function computeChanges(
  oldLines: string[],
  newLines: string[]
): Array<{ type: 'equal' | 'delete' | 'insert'; line: string; oldIndex: number; newIndex: number }> {
  const changes: Array<{ type: 'equal' | 'delete' | 'insert'; line: string; oldIndex: number; newIndex: number }> = [];
  
  let oldIndex = 0;
  let newIndex = 0;
  
  while (oldIndex < oldLines.length || newIndex < newLines.length) {
    if (oldIndex >= oldLines.length) {
      // Remaining lines are insertions
      changes.push({ type: 'insert', line: newLines[newIndex], oldIndex, newIndex });
      newIndex++;
    } else if (newIndex >= newLines.length) {
      // Remaining lines are deletions
      changes.push({ type: 'delete', line: oldLines[oldIndex], oldIndex, newIndex });
      oldIndex++;
    } else if (oldLines[oldIndex] === newLines[newIndex]) {
      // Lines are equal
      changes.push({ type: 'equal', line: oldLines[oldIndex], oldIndex, newIndex });
      oldIndex++;
      newIndex++;
    } else {
      // Lines differ - simple heuristic: check if next line matches
      if (oldIndex + 1 < oldLines.length && oldLines[oldIndex + 1] === newLines[newIndex]) {
        // Deletion
        changes.push({ type: 'delete', line: oldLines[oldIndex], oldIndex, newIndex });
        oldIndex++;
      } else if (newIndex + 1 < newLines.length && oldLines[oldIndex] === newLines[newIndex + 1]) {
        // Insertion
        changes.push({ type: 'insert', line: newLines[newIndex], oldIndex, newIndex });
        newIndex++;
      } else {
        // Both differ - treat as delete + insert
        changes.push({ type: 'delete', line: oldLines[oldIndex], oldIndex, newIndex });
        changes.push({ type: 'insert', line: newLines[newIndex], oldIndex, newIndex });
        oldIndex++;
        newIndex++;
      }
    }
  }
  
  return changes;
}

/**
 * Format as unified diff
 */
function formatUnifiedDiff(
  path: string,
  hunks: DiffHunk[],
  oldLines: string[],
  newLines: string[]
): string {
  const lines: string[] = [];
  
  lines.push(`--- a/${path}`);
  lines.push(`+++ b/${path}`);
  
  for (const hunk of hunks) {
    lines.push(`@@ -${hunk.oldStart},${hunk.oldLines} +${hunk.newStart},${hunk.newLines} @@`);
    lines.push(...hunk.lines);
  }
  
  return lines.join('\n');
}

/**
 * Generate diffs for multiple files
 */
export function generateMultiFileDiff(
  oldFiles: Array<{ path: string; content: string }>,
  newFiles: Array<{ path: string; content: string }>
): FileDiff[] {
  const diffs: FileDiff[] = [];
  
  // Create maps for quick lookup
  const oldMap = new Map(oldFiles.map(f => [f.path, f.content]));
  const newMap = new Map(newFiles.map(f => [f.path, f.content]));
  
  // Find all unique paths
  const allPaths = new Set([...oldMap.keys(), ...newMap.keys()]);
  
  for (const path of allPaths) {
    const oldContent = oldMap.get(path) || '';
    const newContent = newMap.get(path) || '';
    
    if (oldContent !== newContent) {
      diffs.push(generateDiff(path, oldContent, newContent));
    }
  }
  
  return diffs;
}

/**
 * Format diffs for LLM prompt
 */
export function formatDiffsForPrompt(diffs: FileDiff[]): string {
  if (diffs.length === 0) {
    return 'No changes detected.';
  }
  
  const sections: string[] = [];
  
  sections.push('GIT DIFF:');
  sections.push('');
  
  for (const diff of diffs) {
    sections.push(diff.diff);
    sections.push('');
  }
  
  return sections.join('\n');
}

/**
 * Apply diff to original content
 */
export function applyDiff(originalContent: string, diff: FileDiff): string {
  // Simple implementation: just return new content
  // In production, you'd parse the diff and apply hunks
  return diff.newContent;
}

/**
 * Validate diff (ensure it can be applied)
 */
export function validateDiff(diff: FileDiff): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check if hunks are valid
  for (const hunk of diff.hunks) {
    if (hunk.oldStart < 0 || hunk.newStart < 0) {
      errors.push(`Invalid hunk: negative line numbers`);
    }
    
    if (hunk.oldLines < 0 || hunk.newLines < 0) {
      errors.push(`Invalid hunk: negative line counts`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

