/**
 * Universal File Editor
 * 
 * Provides file editing capabilities that work across ANY MCP-compatible system:
 * - Augment Code
 * - Cline
 * - Cursor
 * - Claude Desktop
 * - Any other MCP client
 * 
 * This module uses Node.js fs APIs directly, making it universal and not dependent
 * on any specific IDE's tools.
 */

import * as fs from 'fs';
import * as path from 'path';

export interface FileEditResult {
  success: boolean;
  message: string;
  path?: string;
  linesChanged?: number;
  error?: string;
}

export interface StrReplaceParams {
  path: string;
  old_str: string;
  new_str: string;
  old_str_start_line?: number;
  old_str_end_line?: number;
}

export interface InsertParams {
  path: string;
  insert_line: number;
  new_str: string;
}

export interface SaveFileParams {
  path: string;
  content: string;
  add_last_line_newline?: boolean;
}

export interface DeleteFileParams {
  path: string;
}

/**
 * Universal file editor class
 */
export class FileEditor {
  private workspaceRoot: string;

  constructor(workspaceRoot?: string) {
    // Auto-detect workspace root from environment or current directory
    this.workspaceRoot = workspaceRoot || process.env.WORKSPACE_ROOT || process.cwd();
  }

  /**
   * Resolve relative path to absolute path
   */
  private resolvePath(filePath: string): string {
    if (path.isAbsolute(filePath)) {
      return filePath;
    }
    return path.join(this.workspaceRoot, filePath);
  }

  /**
   * Read file content
   */
  async readFile(filePath: string): Promise<string> {
    const absolutePath = this.resolvePath(filePath);
    return fs.promises.readFile(absolutePath, 'utf-8');
  }

  /**
   * Write file content
   */
  async writeFile(filePath: string, content: string): Promise<void> {
    const absolutePath = this.resolvePath(filePath);
    
    // Ensure directory exists
    const dir = path.dirname(absolutePath);
    await fs.promises.mkdir(dir, { recursive: true });
    
    await fs.promises.writeFile(absolutePath, content, 'utf-8');
  }

  /**
   * String replace operation (like Augment's str-replace-editor)
   */
  async strReplace(params: StrReplaceParams): Promise<FileEditResult> {
    try {
      const content = await this.readFile(params.path);
      const lines = content.split('\n');

      // Find the old string
      let startLine = params.old_str_start_line ? params.old_str_start_line - 1 : 0;
      let endLine = params.old_str_end_line ? params.old_str_end_line - 1 : lines.length - 1;

      // Extract the section to replace
      const sectionToReplace = lines.slice(startLine, endLine + 1).join('\n');

      // Check if old_str matches
      if (!sectionToReplace.includes(params.old_str)) {
        return {
          success: false,
          message: `Could not find old_str in specified range (lines ${startLine + 1}-${endLine + 1})`,
          error: 'String not found',
        };
      }

      // Replace the old string with new string
      const newSection = sectionToReplace.replace(params.old_str, params.new_str);
      const newSectionLines = newSection.split('\n');

      // Reconstruct the file
      const newLines = [
        ...lines.slice(0, startLine),
        ...newSectionLines,
        ...lines.slice(endLine + 1),
      ];

      const newContent = newLines.join('\n');
      await this.writeFile(params.path, newContent);

      return {
        success: true,
        message: `Successfully replaced text in ${params.path}`,
        path: params.path,
        linesChanged: newSectionLines.length - (endLine - startLine + 1),
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to replace text: ${error.message}`,
        error: error.message,
      };
    }
  }

  /**
   * Insert operation (like Augment's str-replace-editor insert)
   */
  async insert(params: InsertParams): Promise<FileEditResult> {
    try {
      const content = await this.readFile(params.path);
      const lines = content.split('\n');

      // Insert after the specified line (0-based indexing)
      const insertIndex = params.insert_line;
      const newLines = params.new_str.split('\n');

      const result = [
        ...lines.slice(0, insertIndex),
        ...newLines,
        ...lines.slice(insertIndex),
      ];

      const newContent = result.join('\n');
      await this.writeFile(params.path, newContent);

      return {
        success: true,
        message: `Successfully inserted ${newLines.length} lines at line ${params.insert_line} in ${params.path}`,
        path: params.path,
        linesChanged: newLines.length,
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to insert text: ${error.message}`,
        error: error.message,
      };
    }
  }

  /**
   * Save new file (like Augment's save-file)
   */
  async saveFile(params: SaveFileParams): Promise<FileEditResult> {
    try {
      // Validate content parameter
      if (params.content === undefined || params.content === null) {
        return {
          success: false,
          message: `Failed to save file: content parameter is required`,
          error: 'Missing content parameter',
        };
      }

      let content = params.content;

      // Add newline at end if requested (default: true)
      if (params.add_last_line_newline !== false && !content.endsWith('\n')) {
        content += '\n';
      }

      await this.writeFile(params.path, content);

      const lines = content.split('\n').length;

      return {
        success: true,
        message: `Successfully created ${params.path} (${lines} lines)`,
        path: params.path,
        linesChanged: lines,
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to save file: ${error.message}`,
        error: error.message,
      };
    }
  }

  /**
   * Delete file (like Augment's remove-files)
   */
  async deleteFile(params: DeleteFileParams): Promise<FileEditResult> {
    try {
      const absolutePath = this.resolvePath(params.path);
      await fs.promises.unlink(absolutePath);

      return {
        success: true,
        message: `Successfully deleted ${params.path}`,
        path: params.path,
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to delete file: ${error.message}`,
        error: error.message,
      };
    }
  }

  /**
   * Check if file exists
   */
  async fileExists(filePath: string): Promise<boolean> {
    try {
      const absolutePath = this.resolvePath(filePath);
      await fs.promises.access(absolutePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get file stats
   */
  async getFileStats(filePath: string): Promise<fs.Stats | null> {
    try {
      const absolutePath = this.resolvePath(filePath);
      return await fs.promises.stat(absolutePath);
    } catch {
      return null;
    }
  }
}

/**
 * Singleton instance for shared use
 */
let sharedFileEditor: FileEditor | null = null;

export function getSharedFileEditor(workspaceRoot?: string): FileEditor {
  if (!sharedFileEditor) {
    sharedFileEditor = new FileEditor(workspaceRoot);
  }
  return sharedFileEditor;
}

