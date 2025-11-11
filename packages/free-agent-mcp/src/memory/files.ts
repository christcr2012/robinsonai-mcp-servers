/**
 * File Memory
 *
 * Artifact and file recall system.
 * Stores and retrieves generated artifacts.
 */

import * as fs from "fs";
import * as path from "path";

/**
 * Remember (read) a file
 *
 * @param filePath - Path to file
 * @returns File content or undefined
 *
 * @example
 * ```typescript
 * const content = rememberFile("src/services/auth.ts");
 * ```
 */
export function rememberFile(filePath: string): string | undefined {
  try {
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, "utf8");
    }
  } catch (err) {
    console.error("[Files] Failed to read file:", filePath, err);
  }
  return undefined;
}

/**
 * Write an artifact to disk
 *
 * @param filePath - Path to write to
 * @param content - Content to write
 *
 * @example
 * ```typescript
 * writeArtifact("src/components/MyComponent.tsx", componentCode);
 * ```
 */
export function writeArtifact(filePath: string, content: string): void {
  try {
    const dir = path.dirname(filePath);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(filePath, content, "utf8");
  } catch (err) {
    console.error("[Files] Failed to write artifact:", filePath, err);
  }
}

/**
 * Check if file exists
 *
 * @param filePath - Path to check
 * @returns True if file exists
 */
export function fileExists(filePath: string): boolean {
  try {
    return fs.existsSync(filePath);
  } catch (err) {
    console.error("[Files] Failed to check file:", filePath, err);
    return false;
  }
}

/**
 * Delete a file
 *
 * @param filePath - Path to delete
 */
export function deleteFile(filePath: string): void {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    console.error("[Files] Failed to delete file:", filePath, err);
  }
}

/**
 * Get file stats
 *
 * @param filePath - Path to file
 * @returns File stats or undefined
 */
export function getFileStats(filePath: string): fs.Stats | undefined {
  try {
    if (fs.existsSync(filePath)) {
      return fs.statSync(filePath);
    }
  } catch (err) {
    console.error("[Files] Failed to get stats:", filePath, err);
  }
  return undefined;
}

/**
 * List files in directory
 *
 * @param dirPath - Directory path
 * @returns Array of file names
 */
export function listFiles(dirPath: string): string[] {
  try {
    if (fs.existsSync(dirPath)) {
      return fs.readdirSync(dirPath);
    }
  } catch (err) {
    console.error("[Files] Failed to list files:", dirPath, err);
  }
  return [];
}

/**
 * Create directory
 *
 * @param dirPath - Directory path
 */
export function createDirectory(dirPath: string): void {
  try {
    fs.mkdirSync(dirPath, { recursive: true });
  } catch (err) {
    console.error("[Files] Failed to create directory:", dirPath, err);
  }
}

/**
 * Append to file
 *
 * @param filePath - Path to file
 * @param content - Content to append
 */
export function appendToFile(filePath: string, content: string): void {
  try {
    const dir = path.dirname(filePath);
    fs.mkdirSync(dir, { recursive: true });
    fs.appendFileSync(filePath, content, "utf8");
  } catch (err) {
    console.error("[Files] Failed to append to file:", filePath, err);
  }
}

/**
 * Copy file
 *
 * @param source - Source path
 * @param dest - Destination path
 */
export function copyFile(source: string, dest: string): void {
  try {
    const dir = path.dirname(dest);
    fs.mkdirSync(dir, { recursive: true });
    fs.copyFileSync(source, dest);
  } catch (err) {
    console.error("[Files] Failed to copy file:", source, "->", dest, err);
  }
}

/**
 * Move file
 *
 * @param source - Source path
 * @param dest - Destination path
 */
export function moveFile(source: string, dest: string): void {
  try {
    const dir = path.dirname(dest);
    fs.mkdirSync(dir, { recursive: true });
    fs.renameSync(source, dest);
  } catch (err) {
    console.error("[Files] Failed to move file:", source, "->", dest, err);
  }
}

/**
 * Get file size
 *
 * @param filePath - Path to file
 * @returns File size in bytes or -1 if error
 */
export function getFileSize(filePath: string): number {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (err) {
    console.error("[Files] Failed to get file size:", filePath, err);
    return -1;
  }
}

/**
 * Get directory size
 *
 * @param dirPath - Directory path
 * @returns Total size in bytes
 */
export function getDirectorySize(dirPath: string): number {
  try {
    let size = 0;
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);
      if (stats.isDirectory()) {
        size += getDirectorySize(filePath);
      } else {
        size += stats.size;
      }
    }
    return size;
  } catch (err) {
    console.error("[Files] Failed to get directory size:", dirPath, err);
    return 0;
  }
}

/**
 * Find files by pattern
 *
 * @param dirPath - Directory to search
 * @param pattern - File name pattern (regex)
 * @returns Matching file paths
 */
export function findFiles(dirPath: string, pattern: RegExp): string[] {
  const results: string[] = [];

  try {
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);

      if (pattern.test(file)) {
        results.push(filePath);
      }

      if (stats.isDirectory()) {
        results.push(...findFiles(filePath, pattern));
      }
    }
  } catch (err) {
    console.error("[Files] Failed to find files:", dirPath, err);
  }

  return results;
}

/**
 * Get file info
 *
 * @param filePath - Path to file
 * @returns File info object
 */
export function getFileInfo(filePath: string): {
  exists: boolean;
  size: number;
  modified: number | null;
  isDirectory: boolean;
} {
  try {
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      return {
        exists: true,
        size: stats.size,
        modified: stats.mtimeMs,
        isDirectory: stats.isDirectory()
      };
    }
  } catch (err) {
    console.error("[Files] Failed to get file info:", filePath, err);
  }

  return {
    exists: false,
    size: 0,
    modified: null,
    isDirectory: false
  };
}

