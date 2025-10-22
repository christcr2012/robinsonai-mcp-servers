/**
 * Patch Engine
 * 
 * Generates and applies unified diffs instead of full file rewrites.
 * Enables:
 * - Minimal, reviewable changes
 * - Automatic rollback on failure
 * - Isolated worktree testing
 * - Clean PR diffs
 */

import * as fs from 'fs';
import * as path from 'path';

export interface Patch {
  id: string;
  filePath: string;
  oldContent: string;
  newContent: string;
  diff: string;
  metadata?: {
    createdAt: Date;
    reason: string;
    estimatedLines: number;
  };
}

export interface PatchResult {
  success: boolean;
  patchId: string;
  filesChanged: number;
  linesChanged: number;
  errors: string[];
  rollbackAvailable: boolean;
}

export interface RollbackPoint {
  id: string;
  timestamp: Date;
  patches: Patch[];
  filesAffected: string[];
}

export class PatchEngine {
  private rollbackPoints: Map<string, RollbackPoint> = new Map();
  private appliedPatches: Map<string, Patch> = new Map();

  /**
   * Generate a unified diff between old and new content
   */
  generateDiff(oldContent: string, newContent: string, filePath: string): string {
    const oldLines = oldContent.split('\n');
    const newLines = newContent.split('\n');

    let diff = `--- a/${filePath}\n`;
    diff += `+++ b/${filePath}\n`;

    // Simple line-by-line diff (in production, use a proper diff library)
    let lineNum = 0;
    let changes: string[] = [];

    for (let i = 0; i < Math.max(oldLines.length, newLines.length); i++) {
      const oldLine = oldLines[i] || '';
      const newLine = newLines[i] || '';

      if (oldLine !== newLine) {
        if (oldLine) {
          changes.push(`-${oldLine}`);
        }
        if (newLine) {
          changes.push(`+${newLine}`);
        }
      } else {
        changes.push(` ${oldLine}`);
      }
    }

    // Group changes into hunks
    diff += `@@ -1,${oldLines.length} +1,${newLines.length} @@\n`;
    diff += changes.join('\n');

    return diff;
  }

  /**
   * Create a patch from file changes
   */
  createPatch(
    filePath: string,
    oldContent: string,
    newContent: string,
    reason?: string
  ): Patch {
    const diff = this.generateDiff(oldContent, newContent, filePath);
    const id = this.generateId();

    const patch: Patch = {
      id,
      filePath,
      oldContent,
      newContent,
      diff,
      metadata: {
        createdAt: new Date(),
        reason: reason || 'Code modification',
        estimatedLines: this.countChangedLines(diff),
      },
    };

    return patch;
  }

  /**
   * Apply a patch to a file
   */
  async applyPatch(patch: Patch, dryRun: boolean = false): Promise<PatchResult> {
    const errors: string[] = [];
    let success = false;

    try {
      // Verify file exists
      if (!fs.existsSync(patch.filePath)) {
        errors.push(`File not found: ${patch.filePath}`);
        return {
          success: false,
          patchId: patch.id,
          filesChanged: 0,
          linesChanged: 0,
          errors,
          rollbackAvailable: false,
        };
      }

      // Read current content
      const currentContent = fs.readFileSync(patch.filePath, 'utf-8');

      // Verify old content matches (safety check)
      if (currentContent !== patch.oldContent) {
        errors.push(
          `File content has changed since patch was created: ${patch.filePath}`
        );
        return {
          success: false,
          patchId: patch.id,
          filesChanged: 0,
          linesChanged: 0,
          errors,
          rollbackAvailable: false,
        };
      }

      // Apply patch (write new content)
      if (!dryRun) {
        fs.writeFileSync(patch.filePath, patch.newContent, 'utf-8');
        this.appliedPatches.set(patch.id, patch);
      }

      success = true;

      return {
        success: true,
        patchId: patch.id,
        filesChanged: 1,
        linesChanged: patch.metadata?.estimatedLines || 0,
        errors: [],
        rollbackAvailable: true,
      };
    } catch (error: any) {
      errors.push(`Failed to apply patch: ${error.message}`);
      return {
        success: false,
        patchId: patch.id,
        filesChanged: 0,
        linesChanged: 0,
        errors,
        rollbackAvailable: false,
      };
    }
  }

  /**
   * Apply multiple patches
   */
  async applyPatches(
    patches: Patch[],
    dryRun: boolean = false
  ): Promise<PatchResult> {
    const results: PatchResult[] = [];
    const rollbackId = this.generateId();

    // Create rollback point
    if (!dryRun) {
      this.createRollbackPoint(rollbackId, patches);
    }

    // Apply each patch
    for (const patch of patches) {
      const result = await this.applyPatch(patch, dryRun);
      results.push(result);

      // Stop on first failure
      if (!result.success) {
        // Rollback all applied patches
        if (!dryRun) {
          await this.rollback(rollbackId);
        }

        return {
          success: false,
          patchId: rollbackId,
          filesChanged: 0,
          linesChanged: 0,
          errors: result.errors,
          rollbackAvailable: true,
        };
      }
    }

    // All patches applied successfully
    const totalFiles = results.length;
    const totalLines = results.reduce((sum, r) => sum + r.linesChanged, 0);

    return {
      success: true,
      patchId: rollbackId,
      filesChanged: totalFiles,
      linesChanged: totalLines,
      errors: [],
      rollbackAvailable: true,
    };
  }

  /**
   * Create a rollback point
   */
  private createRollbackPoint(id: string, patches: Patch[]): void {
    const filesAffected = patches.map(p => p.filePath);

    this.rollbackPoints.set(id, {
      id,
      timestamp: new Date(),
      patches,
      filesAffected,
    });
  }

  /**
   * Rollback to a previous state
   */
  async rollback(rollbackId: string): Promise<PatchResult> {
    const rollbackPoint = this.rollbackPoints.get(rollbackId);

    if (!rollbackPoint) {
      return {
        success: false,
        patchId: rollbackId,
        filesChanged: 0,
        linesChanged: 0,
        errors: ['Rollback point not found'],
        rollbackAvailable: false,
      };
    }

    const errors: string[] = [];
    let filesChanged = 0;

    // Restore each file to its original state
    for (const patch of rollbackPoint.patches) {
      try {
        fs.writeFileSync(patch.filePath, patch.oldContent, 'utf-8');
        filesChanged++;
        this.appliedPatches.delete(patch.id);
      } catch (error: any) {
        errors.push(`Failed to rollback ${patch.filePath}: ${error.message}`);
      }
    }

    // Remove rollback point
    this.rollbackPoints.delete(rollbackId);

    return {
      success: errors.length === 0,
      patchId: rollbackId,
      filesChanged,
      linesChanged: 0,
      errors,
      rollbackAvailable: false,
    };
  }

  /**
   * Count changed lines in a diff
   */
  private countChangedLines(diff: string): number {
    const lines = diff.split('\n');
    return lines.filter(line => line.startsWith('+') || line.startsWith('-')).length;
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `patch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Format patch for display
   */
  formatPatch(patch: Patch): string {
    let output = `📝 Patch: ${patch.id}\n\n`;
    output += `File: ${patch.filePath}\n`;
    output += `Lines changed: ${patch.metadata?.estimatedLines}\n`;
    output += `Reason: ${patch.metadata?.reason}\n\n`;
    output += `Diff:\n`;
    output += patch.diff;

    return output;
  }

  /**
   * List all rollback points
   */
  listRollbackPoints(): RollbackPoint[] {
    return Array.from(this.rollbackPoints.values());
  }

  /**
   * Clear all rollback points
   */
  clearRollbackPoints(): void {
    this.rollbackPoints.clear();
  }
}

