import { createTwoFilesPatch } from 'diff';

export interface OutputFile {
  path: string;
  content: string;
  originalContent?: string;
  deleted?: boolean;
}

/**
 * Format files as GMCode blocks for downstream agents.
 */
export function formatGMCode(files: OutputFile[]): string {
  const blocks = files
    .filter(file => !file.deleted)
    .map(file => [
      '```gmcode',
      `path: ${file.path}`,
      file.content,
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
