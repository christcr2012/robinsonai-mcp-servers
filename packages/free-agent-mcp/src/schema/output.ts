/**
 * Output Schema for Free Agent
 * 
 * Supports both single-file and multi-file output modes.
 * Enables coordinated feature generation (UI + API + tests in one go).
 */

/**
 * Single file output
 */
export type SingleFile = {
  path: string;
  content: string;
};

/**
 * Test file output
 */
export type TestFile = {
  path: string;
  content: string;
};

/**
 * Multi-file output format
 * Supports coordinated features like:
 * - UI component + API endpoint + tests
 * - Database schema + migrations + tests
 * - Feature with frontend + backend + tests
 */
export type MultiFileOutput = {
  files: SingleFile[];
  tests?: TestFile[];
  notes?: string;
};

/**
 * Single-file output format (legacy support)
 */
export type SingleFileOutput = {
  code?: string;
  path?: string;
  content?: string;
};

/**
 * Combined output type
 */
export type Output = MultiFileOutput | SingleFileOutput;

/**
 * Normalized output (always multi-file internally)
 */
export type NormalizedOutput = {
  files: SingleFile[];
  tests: TestFile[];
  notes?: string;
};

/**
 * Normalize any output format to multi-file format
 * 
 * Handles:
 * - Multi-file output: { files: [...], tests: [...] }
 * - Single-file output: { code, path }
 * - Legacy output: { content, path }
 * - Fallback: writes to GENERATED_CODE.ts
 */
export function normalizeOutput(o: any): NormalizedOutput {
  // Already normalized multi-file format
  if (o.files && Array.isArray(o.files) && o.files.length > 0) {
    return {
      files: o.files,
      tests: o.tests || [],
      notes: o.notes
    };
  }

  // Single-file format: { code, path }
  if (o.code && o.path) {
    return {
      files: [{ path: o.path, content: o.code }],
      tests: [],
      notes: o.notes
    };
  }

  // Legacy format: { content, path }
  if (o.content && o.path) {
    return {
      files: [{ path: o.path, content: o.content }],
      tests: [],
      notes: o.notes
    };
  }

  // Just code, no path
  if (o.code) {
    return {
      files: [{ path: 'GENERATED_CODE.ts', content: o.code }],
      tests: [],
      notes: o.notes
    };
  }

  // Just content, no path
  if (o.content) {
    return {
      files: [{ path: 'GENERATED_CODE.ts', content: o.content }],
      tests: [],
      notes: o.notes
    };
  }

  // Empty fallback
  return {
    files: [{ path: 'GENERATED_CODE.ts', content: '' }],
    tests: [],
    notes: o.notes
  };
}

/**
 * Validate output format
 */
export function validateOutput(o: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check if it's a valid format
  if (!o || typeof o !== 'object') {
    errors.push('Output must be an object');
    return { valid: false, errors };
  }

  // Multi-file format
  if (o.files) {
    if (!Array.isArray(o.files)) {
      errors.push('files must be an array');
    } else {
      o.files.forEach((f: any, i: number) => {
        if (!f.path || typeof f.path !== 'string') {
          errors.push(`files[${i}].path must be a non-empty string`);
        }
        if (!f.content || typeof f.content !== 'string') {
          errors.push(`files[${i}].content must be a non-empty string`);
        }
      });
    }
  }

  // Tests format
  if (o.tests) {
    if (!Array.isArray(o.tests)) {
      errors.push('tests must be an array');
    } else {
      o.tests.forEach((t: any, i: number) => {
        if (!t.path || typeof t.path !== 'string') {
          errors.push(`tests[${i}].path must be a non-empty string`);
        }
        if (!t.content || typeof t.content !== 'string') {
          errors.push(`tests[${i}].content must be a non-empty string`);
        }
      });
    }
  }

  // Single-file format
  if (o.code || o.content) {
    if (o.code && typeof o.code !== 'string') {
      errors.push('code must be a string');
    }
    if (o.content && typeof o.content !== 'string') {
      errors.push('content must be a string');
    }
    if (o.path && typeof o.path !== 'string') {
      errors.push('path must be a string');
    }
  }

  // At least one of files, code, or content must be present
  if (!o.files && !o.code && !o.content) {
    errors.push('Output must have files, code, or content');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Get all file paths from output
 */
export function getOutputPaths(output: NormalizedOutput): string[] {
  const paths = output.files.map(f => f.path);
  if (output.tests) {
    paths.push(...output.tests.map(t => t.path));
  }
  return paths;
}

/**
 * Get file by path
 */
export function getOutputFile(
  output: NormalizedOutput,
  path: string
): SingleFile | TestFile | undefined {
  const file = output.files.find(f => f.path === path);
  if (file) return file;
  return output.tests?.find(t => t.path === path);
}

/**
 * Count files and tests
 */
export function countOutputFiles(output: NormalizedOutput): {
  files: number;
  tests: number;
  total: number;
} {
  return {
    files: output.files.length,
    tests: output.tests?.length || 0,
    total: output.files.length + (output.tests?.length || 0)
  };
}

/**
 * Format output for display
 */
export function formatOutputSummary(output: NormalizedOutput): string {
  const counts = countOutputFiles(output);
  const lines = [
    `📦 Output Summary`,
    `  Files: ${counts.files}`,
    `  Tests: ${counts.tests}`,
    `  Total: ${counts.total}`,
    ''
  ];

  if (output.files.length > 0) {
    lines.push('📄 Files:');
    output.files.forEach(f => {
      const lines_count = f.content.split('\n').length;
      lines.push(`  • ${f.path} (${lines_count} lines)`);
    });
  }

  if (output.tests && output.tests.length > 0) {
    lines.push('');
    lines.push('🧪 Tests:');
    output.tests.forEach(t => {
      const lines_count = t.content.split('\n').length;
      lines.push(`  • ${t.path} (${lines_count} lines)`);
    });
  }

  if (output.notes) {
    lines.push('');
    lines.push('📝 Notes:');
    lines.push(`  ${output.notes}`);
  }

  return lines.join('\n');
}

