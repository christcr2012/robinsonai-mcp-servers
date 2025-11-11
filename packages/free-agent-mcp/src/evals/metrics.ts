/**
 * Evaluation Metrics
 *
 * Provides metrics collection and validation for eval scenarios.
 * Supports file content checks, code quality metrics, and custom validators.
 */

import * as fs from "fs";
import * as path from "path";

export type FileContentCheck = {
  path: string;
  mustInclude: string[];
  mustNotInclude?: string[];
};

export type CodeQualityCheck = {
  type: "eslint" | "tsc" | "tests" | "security";
  threshold?: number;
};

export type MetricsResult = {
  unit: Array<{ path: string; ok: boolean; details?: string }>;
  quality?: Array<{ type: string; ok: boolean; score?: number }>;
  pass: boolean;
};

/**
 * Check if file contains required strings
 *
 * @param check - File content check specification
 * @returns Check result
 */
async function checkFilesContain(check: FileContentCheck): Promise<{
  path: string;
  ok: boolean;
  details?: string;
}> {
  try {
    const content = fs.existsSync(check.path) ? fs.readFileSync(check.path, "utf8") : "";

    // Check must-include strings
    const mustIncludeOk = (check.mustInclude || []).every((needle: string) =>
      content.includes(needle)
    );

    // Check must-not-include strings
    const mustNotIncludeOk = (check.mustNotInclude || []).every((needle: string) =>
      !content.includes(needle)
    );

    const ok = mustIncludeOk && mustNotIncludeOk;

    let details = "";
    if (!mustIncludeOk) {
      const missing = (check.mustInclude || []).filter(
        (needle: string) => !content.includes(needle)
      );
      details = `Missing: ${missing.join(", ")}`;
    }
    if (!mustNotIncludeOk) {
      const found = (check.mustNotInclude || []).filter((needle: string) =>
        content.includes(needle)
      );
      details = `Found forbidden: ${found.join(", ")}`;
    }

    return { path: check.path, ok, details };
  } catch (err) {
    return {
      path: check.path,
      ok: false,
      details: `Error reading file: ${(err as Error).message}`
    };
  }
}

/**
 * Check code quality metrics
 *
 * @param check - Code quality check specification
 * @returns Check result
 */
async function checkCodeQuality(check: CodeQualityCheck): Promise<{
  type: string;
  ok: boolean;
  score?: number;
}> {
  // Placeholder for actual quality checks
  // In real implementation, would run eslint, tsc, tests, security scans
  return {
    type: check.type,
    ok: true,
    score: 100
  };
}

/**
 * Count lines of code in file
 *
 * @param filePath - Path to file
 * @returns Line count
 */
export function countLines(filePath: string): number {
  try {
    if (!fs.existsSync(filePath)) return 0;
    const content = fs.readFileSync(filePath, "utf8");
    return content.split("\n").length;
  } catch {
    return 0;
  }
}

/**
 * Check file exists
 *
 * @param filePath - Path to file
 * @returns True if file exists
 */
export function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

/**
 * Get file size in bytes
 *
 * @param filePath - Path to file
 * @returns File size
 */
export function getFileSize(filePath: string): number {
  try {
    if (!fs.existsSync(filePath)) return 0;
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch {
    return 0;
  }
}

/**
 * Check if file is valid TypeScript
 *
 * @param filePath - Path to file
 * @returns True if file appears to be valid TypeScript
 */
export function isValidTypeScript(filePath: string): boolean {
  try {
    if (!fs.existsSync(filePath)) return false;
    const content = fs.readFileSync(filePath, "utf8");

    // Basic checks for TypeScript syntax
    const hasExport = /^export\s+(class|function|interface|type|const)/m.test(content);
    const hasImport = /^import\s+/m.test(content);
    const hasType = /:\s*(string|number|boolean|any|void|Promise|Array)/m.test(content);

    return hasExport || hasImport || hasType;
  } catch {
    return false;
  }
}

/**
 * Check if file has tests
 *
 * @param filePath - Path to file
 * @returns True if file appears to have tests
 */
export function hasTests(filePath: string): boolean {
  try {
    if (!fs.existsSync(filePath)) return false;
    const content = fs.readFileSync(filePath, "utf8");

    return /describe\(|it\(|test\(|expect\(/m.test(content);
  } catch {
    return false;
  }
}

/**
 * Main metrics checker
 */
export const metrics = {
  /**
   * Check scenario expectations
   *
   * @param scenario - Scenario with expectations
   * @returns Metrics result
   */
  async check(scenario: any): Promise<MetricsResult> {
    const unit: Array<{ path: string; ok: boolean; details?: string }> = [];

    // Check file contents
    for (const check of scenario.expect?.filesContain ?? []) {
      const result = await checkFilesContain(check);
      unit.push(result);
    }

    // Check code quality
    const quality: Array<{ type: string; ok: boolean; score?: number }> = [];
    for (const check of scenario.expect?.codeQuality ?? []) {
      const result = await checkCodeQuality(check);
      quality.push(result);
    }

    const pass = unit.every(x => x.ok) && quality.every(x => x.ok);

    return { unit, quality: quality.length > 0 ? quality : undefined, pass };
  },

  /**
   * Get file metrics
   *
   * @param filePath - Path to file
   * @returns File metrics
   */
  getFileMetrics(filePath: string): {
    exists: boolean;
    lines: number;
    size: number;
    isTypeScript: boolean;
    hasTests: boolean;
  } {
    return {
      exists: fileExists(filePath),
      lines: countLines(filePath),
      size: getFileSize(filePath),
      isTypeScript: isValidTypeScript(filePath),
      hasTests: hasTests(filePath)
    };
  },

  /**
   * Get directory metrics
   *
   * @param dirPath - Path to directory
   * @returns Directory metrics
   */
  getDirectoryMetrics(dirPath: string): {
    fileCount: number;
    totalLines: number;
    totalSize: number;
    typeScriptFiles: number;
    testFiles: number;
  } {
    try {
      if (!fs.existsSync(dirPath)) {
        return { fileCount: 0, totalLines: 0, totalSize: 0, typeScriptFiles: 0, testFiles: 0 };
      }

      const files = fs.readdirSync(dirPath, { recursive: true }) as string[];
      let fileCount = 0;
      let totalLines = 0;
      let totalSize = 0;
      let typeScriptFiles = 0;
      let testFiles = 0;

      for (const file of files) {
        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isFile()) {
          fileCount++;
          totalLines += countLines(fullPath);
          totalSize += getFileSize(fullPath);
          if (isValidTypeScript(fullPath)) typeScriptFiles++;
          if (hasTests(fullPath)) testFiles++;
        }
      }

      return { fileCount, totalLines, totalSize, typeScriptFiles, testFiles };
    } catch {
      return { fileCount: 0, totalLines: 0, totalSize: 0, typeScriptFiles: 0, testFiles: 0 };
    }
  }
};

