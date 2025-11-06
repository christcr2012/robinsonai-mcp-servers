import { createTwoFilesPatch } from 'diff';

export interface OutputFile {
  path: string;
  content: string;
  originalContent?: string;
  deleted?: boolean;
}

/**
 * Strip markdown code fences from text.
 * Handles nested fences, optional newlines, and inline fences.
 *
 * Examples:
 * - "```ts\ncode\n```" → "code"
 * - "```typescript code```" → "code"
 * - "text ```js\ncode\n``` more" → "text code more"
 */
export function stripCodeFences(text: string): string {
  if (!text) {
    return text;
  }

  let result = text.trim();

  // Strip outer fences first (most common case - handles optional newlines)
  const outerFencePattern = /^```[\w+-]*\n?([\s\S]*?)\n?```$/;
  while (outerFencePattern.test(result)) {
    result = result.replace(outerFencePattern, '$1').trim();
  }

  // Also strip any remaining inline or embedded fences
  // This handles cases like "text ```js code``` more text"
  result = result.replace(/```[\w+-]*\n?([\s\S]*?)\n?```/g, '$1');

  return result.trim();
}

export function formatGMCode(files: OutputFile[]): string {
  const blocks = files
    .filter(file => !file.deleted)
    .map(file => [
      '```gmcode',
      `path: ${file.path}`,
      stripCodeFences(file.content),
      '```'
    ].join('\n'));

  return blocks.join('\n\n');
}

/**
 * Build unified diff output for a collection of files.
 */
export function formatUnifiedDiffs(files: OutputFile[]): string {
  const patches = files
    .map(file => {
      const before = file.originalContent ?? '';
      const after = file.deleted ? '' : file.content;

      if (before === after) {
        return '';
      }

      const patch = createTwoFilesPatch(
        file.path,
        file.path,
        before,
        after,
        '',
        '',
        { context: 3 }
      ).trim();

      return patch;
    })
    .filter(Boolean);

  return patches.join('\n\n');
}

/**
 * Convenience helper to normalize raw generated files into OutputFile entries.
 */
export function normalizeOutputFiles(files: Array<{ path: string; content: string }>): OutputFile[] {
  return files.map(file => ({ ...file }));
}
