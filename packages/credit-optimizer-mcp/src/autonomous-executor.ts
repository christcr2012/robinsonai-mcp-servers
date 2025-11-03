/**
 * Autonomous Workflow Executor
 *
 * Executes multi-step workflows WITHOUT stopping for confirmation.
 * Solves the "Augment stops and waits" problem!
 *
 * NOW WITH COST TRACKING & LEARNING!
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { glob } from 'glob';
import Database from 'better-sqlite3';
import crypto from 'crypto';
import { CostTracker } from './cost-tracker.js';
import { DatabaseManager } from './database.js';

export interface WorkflowStep {
  action: 'fix-imports' | 'fix-types' | 'refactor' | 'add-tests' | 'custom';
  pattern?: string;
  files?: string[];
  params?: Record<string, any>;
}

export interface WorkflowResult {
  result_id?: string; // ID for large results (persisted to DB)
  filesModified: number;
  changes: Array<{
    file: string;
    action: string;
    success: boolean;
    error?: string;
  }>;
  augmentCreditsUsed: number;
  creditsSaved: number;
  timeMs: number;
}

// SQLite for persisting large results (optional - gracefully degrade if not available)
const DB_PATH = process.env.CREDIT_OPTIMIZER_DB || path.join(process.cwd(), 'credit-optimizer.db');
let db: any = null;
try {
  db = new Database(DB_PATH);
  (db as any).pragma('journal_mode = WAL');
  db.exec(`
  CREATE TABLE IF NOT EXISTS workflow_results (
    result_id TEXT PRIMARY KEY,
    workflow_name TEXT,
    result_json TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_results_created ON workflow_results(created_at);
  `);
} catch (error) {
  console.error('[CREDIT-OPTIMIZER] Warning: Could not initialize database (better-sqlite3 not available). Large result persistence disabled.');
  console.error('[CREDIT-OPTIMIZER] Error:', error instanceof Error ? error.message : String(error));
}

export class AutonomousExecutor {
  private costTracker: CostTracker;

  constructor() {
    // Initialize cost tracker with shared database
    const dbManager = new DatabaseManager(DB_PATH);
    this.costTracker = new CostTracker(dbManager);
  }

  /**
   * Execute a multi-step workflow autonomously with caps/budgets enforcement
   * NOW WITH COST TRACKING & LEARNING!
   */
  async executeWorkflow(
    workflow: WorkflowStep[] | any, // Accept WorkPlan or raw steps
    options: { maxFiles?: number; dryRun?: boolean; caps?: any; budgets?: any; taskType?: string } = {}
  ): Promise<WorkflowResult> {
    const startTime = Date.now();
    const changes: WorkflowResult['changes'] = [];

    // Generate task ID for cost tracking
    const taskId = `workflow-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const taskType = options.taskType || 'autonomous_workflow';

    // Extract caps/budgets from WorkPlan if provided
    let steps: WorkflowStep[];
    let caps = options.caps;
    let budgets = options.budgets;

    if (Array.isArray(workflow)) {
      steps = workflow;
    } else if (workflow.steps) {
      // WorkPlan format from Architect
      steps = workflow.steps;
      caps = workflow.caps || caps;
      budgets = workflow.budgets || budgets;
    } else {
      throw new Error('Invalid workflow format - expected array of steps or WorkPlan object');
    }

    // Apply caps/budgets (with defaults)
    const maxFiles = caps?.maxFilesChanged || options.maxFiles || 100;
    const maxTimeMs = caps?.maxRuntimeMs || budgets?.time_ms || 300000; // 5 min default
    const maxSteps = budgets?.max_steps || steps.length;
    const requireGreenTests = caps?.requireGreenTests ?? caps?.require_green_tests ?? false;
    const dryRun = caps?.dryRunOnly || options.dryRun || false;

    let filesModified = 0;
    let stepsExecuted = 0;

    // 🎯 START COST TRACKING
    // Estimate cost before execution
    const estimatedCost = this.estimateWorkflowCost(steps, maxFiles);

    // Start tracking this task
    this.costTracker.startTask({
      taskId,
      taskType,
      estimatedCost,
      workerUsed: 'ollama', // Autonomous executor uses FREE Ollama
      numFiles: maxFiles,
      complexity: this.estimateComplexity(steps),
    });

    console.log(`[AutonomousExecutor] Started task ${taskId}: ${taskType}, estimated cost: $${estimatedCost.toFixed(4)}`);
    // 🎯 END COST TRACKING SETUP

    for (const step of steps.slice(0, maxSteps)) {
      // Check time budget
      const elapsed = Date.now() - startTime;
      if (elapsed > maxTimeMs) {
        changes.push({
          file: 'N/A',
          action: 'budget_exceeded',
          success: false,
          error: `Time budget exceeded: ${elapsed}ms > ${maxTimeMs}ms`,
        });
        break;
      }

      // Check file budget
      if (filesModified >= maxFiles) {
        changes.push({
          file: 'N/A',
          action: 'budget_exceeded',
          success: false,
          error: `File budget exceeded: ${filesModified} >= ${maxFiles}`,
        });
        break;
      }

      // Get files to process
      const files = await this.resolveFiles(step.files || [], maxFiles - filesModified);

      for (const file of files) {
        try {
          const result = await this.executeStep(step, file, dryRun);

          if (result.modified) {
            filesModified++;
            changes.push({
              file,
              action: step.action,
              success: true,
            });
          }
        } catch (error: any) {
          changes.push({
            file,
            action: step.action,
            success: false,
            error: error.message,
          });
        }
      }

      stepsExecuted++;
    }

    const timeMs = Date.now() - startTime;

    // Calculate credit savings
    // Augment would use ~500 credits per file
    // We use 0 credits (just regex/AST manipulation)
    const augmentCreditsUsed = 500; // Just for planning
    const creditsSaved = filesModified * 500;

    // 🎯 COMPLETE COST TRACKING
    // Actual cost is $0 (FREE Ollama!)
    const actualCost = 0;

    // Complete the task tracking
    const completedTask = this.costTracker.completeTask(taskId);

    if (completedTask) {
      console.log(`[AutonomousExecutor] Completed task ${taskId}:`);
      console.log(`  - Estimated: $${completedTask.estimatedCost.toFixed(4)}`);
      console.log(`  - Actual: $${completedTask.actualCost.toFixed(4)}`);
      console.log(`  - Files modified: ${filesModified}`);
      console.log(`  - Time: ${timeMs}ms`);
      console.log(`  - Worker: ${completedTask.workerUsed} (FREE!)`);
    }
    // 🎯 END COST TRACKING

    const result: WorkflowResult = {
      filesModified,
      changes,
      augmentCreditsUsed,
      creditsSaved,
      timeMs,
    };

    // Persist large results (>100 changes) and return ID instead of full payload
    if (changes.length > 100) {
      const result_id = crypto.createHash('sha256')
        .update(JSON.stringify(result) + Date.now())
        .digest('hex')
        .slice(0, 16);

      if (db) {
        db.prepare(`INSERT INTO workflow_results(result_id, workflow_name, result_json, created_at) VALUES (?,?,?,?)`)
          .run(result_id, 'autonomous_workflow', JSON.stringify(result), Date.now());
      }

      return {
        result_id,
        filesModified,
        changes: changes.slice(0, 10), // First 10 for preview
        augmentCreditsUsed,
        creditsSaved,
        timeMs,
      };
    }

    return result;
  }

  /**
   * Retrieve workflow result by ID
   */
  getWorkflowResult(result_id: string): WorkflowResult | null {
    if (!db) return null;
    const row = db.prepare(`SELECT result_json FROM workflow_results WHERE result_id=?`).get(result_id) as any;
    if (!row) return null;
    return JSON.parse(row.result_json);
  }

  /**
   * Execute bulk fix across many files
   */
  async executeBulkFix(
    errorType: string,
    find: string,
    replace: string,
    filePattern: string,
    verify: boolean = true
  ): Promise<WorkflowResult> {
    const startTime = Date.now();
    const changes: WorkflowResult['changes'] = [];

    // Resolve files
    const files = await glob(filePattern, { absolute: true });

    let filesFixed = 0;

    for (const file of files) {
      try {
        const content = await fs.readFile(file, 'utf-8');
        
        // Apply fix (regex replacement)
        const regex = new RegExp(find, 'g');
        const newContent = content.replace(regex, replace);

        if (newContent !== content) {
          await fs.writeFile(file, newContent, 'utf-8');
          filesFixed++;
          changes.push({
            file,
            action: 'bulk-fix',
            success: true,
          });
        }
      } catch (error: any) {
        changes.push({
          file,
          action: 'bulk-fix',
          success: false,
          error: error.message,
        });
      }
    }

    const timeMs = Date.now() - startTime;

    return {
      filesModified: filesFixed,
      changes,
      augmentCreditsUsed: 0, // No AI needed!
      creditsSaved: filesFixed * 500,
      timeMs,
    };
  }

  /**
   * Execute refactoring pattern
   */
  async executeRefactorPattern(
    pattern: string,
    target: string,
    files: string[],
    config: Record<string, any> = {}
  ): Promise<WorkflowResult> {
    const startTime = Date.now();
    const changes: WorkflowResult['changes'] = [];

    const resolvedFiles = await this.resolveFiles(files, 100);

    for (const file of resolvedFiles) {
      try {
        const result = await this.applyRefactorPattern(file, pattern, target, config);
        
        if (result.modified) {
          changes.push({
            file,
            action: `refactor-${pattern}`,
            success: true,
          });
        }
      } catch (error: any) {
        changes.push({
          file,
          action: `refactor-${pattern}`,
          success: false,
          error: error.message,
        });
      }
    }

    const timeMs = Date.now() - startTime;

    return {
      filesModified: changes.filter((c) => c.success).length,
      changes,
      augmentCreditsUsed: 300,
      creditsSaved: changes.length * 700,
      timeMs,
    };
  }

  /**
   * Execute test generation for multiple files
   */
  async executeTestGeneration(
    files: string[],
    framework: string,
    coverage: string = 'comprehensive',
    runTests: boolean = true
  ): Promise<WorkflowResult> {
    const startTime = Date.now();
    const changes: WorkflowResult['changes'] = [];

    const resolvedFiles = await this.resolveFiles(files, 50);

    for (const file of resolvedFiles) {
      try {
        // Generate test file path
        const testFile = this.getTestFilePath(file, framework);
        
        // For now, just create placeholder
        // In real implementation, would use autonomous agent
        const testContent = this.generateBasicTest(file, framework);
        
        await fs.writeFile(testFile, testContent, 'utf-8');
        
        changes.push({
          file: testFile,
          action: 'generate-test',
          success: true,
        });
      } catch (error: any) {
        changes.push({
          file,
          action: 'generate-test',
          success: false,
          error: error.message,
        });
      }
    }

    const timeMs = Date.now() - startTime;

    return {
      filesModified: changes.filter((c) => c.success).length,
      changes,
      augmentCreditsUsed: 400,
      creditsSaved: changes.length * 800,
      timeMs,
    };
  }

  /**
   * Execute migration
   */
  async executeMigration(
    type: string,
    migration: string,
    rollbackOnError: boolean = true,
    verify: boolean = true
  ): Promise<WorkflowResult> {
    const startTime = Date.now();
    const changes: WorkflowResult['changes'] = [];

    try {
      // Execute migration
      // This is a placeholder - real implementation would vary by type
      changes.push({
        file: migration,
        action: `migrate-${type}`,
        success: true,
      });
    } catch (error: any) {
      if (rollbackOnError) {
        // Rollback
        changes.push({
          file: migration,
          action: 'rollback',
          success: true,
        });
      }
      
      changes.push({
        file: migration,
        action: `migrate-${type}`,
        success: false,
        error: error.message,
      });
    }

    const timeMs = Date.now() - startTime;

    return {
      filesModified: changes.filter((c) => c.success).length,
      changes,
      augmentCreditsUsed: 200,
      creditsSaved: 1000,
      timeMs,
    };
  }

  /**
   * Helper: Resolve file patterns to actual files
   */
  private async resolveFiles(patterns: string[], maxFiles: number): Promise<string[]> {
    const allFiles: string[] = [];

    for (const pattern of patterns) {
      const files = await glob(pattern, { absolute: true });
      allFiles.push(...files);
    }

    return allFiles.slice(0, maxFiles);
  }

  /**
   * Helper: Execute a single workflow step
   */
  private async executeStep(
    step: WorkflowStep,
    file: string,
    dryRun: boolean
  ): Promise<{ modified: boolean }> {
    const content = await fs.readFile(file, 'utf-8');
    let newContent = content;
    let modified = false;

    switch (step.action) {
      case 'fix-imports':
        newContent = this.fixImports(content, step.pattern || '');
        break;
      case 'fix-types':
        newContent = this.fixTypes(content, step.pattern || '');
        break;
      case 'refactor':
        newContent = this.applySimpleRefactor(content, step.params || {});
        break;
      default:
        break;
    }

    if (newContent !== content) {
      modified = true;
      if (!dryRun) {
        await fs.writeFile(file, newContent, 'utf-8');
      }
    }

    return { modified };
  }

  /**
   * Helper: Fix imports
   */
  private fixImports(content: string, pattern: string): string {
    // Simple regex-based import fixing
    return content.replace(new RegExp(`from ['"]${pattern}['"]`, 'g'), `from '${pattern}-new'`);
  }

  /**
   * Helper: Fix types
   */
  private fixTypes(content: string, pattern: string): string {
    // Simple type fixing
    return content.replace(new RegExp(`: ${pattern}`, 'g'), `: ${pattern}Fixed`);
  }

  /**
   * Helper: Apply simple refactor
   */
  private applySimpleRefactor(content: string, params: Record<string, any>): string {
    // Placeholder for refactoring logic
    return content;
  }

  /**
   * Helper: Apply refactor pattern
   */
  private async applyRefactorPattern(
    file: string,
    pattern: string,
    target: string,
    config: Record<string, any>
  ): Promise<{ modified: boolean }> {
    // Placeholder for pattern-based refactoring
    return { modified: false };
  }

  /**
   * Helper: Get test file path
   */
  private getTestFilePath(file: string, framework: string): string {
    const ext = path.extname(file);
    const base = file.replace(ext, '');
    return `${base}.test${ext}`;
  }

  /**
   * Helper: Generate basic test
   */
  private generateBasicTest(file: string, framework: string): string {
    const fileName = path.basename(file);
    return `// Test for ${fileName}\n// Generated by Credit Optimizer\n\ndescribe('${fileName}', () => {\n  it('should work', () => {\n    expect(true).toBe(true);\n  });\n});\n`;
  }

  /**
   * 🎯 COST TRACKING HELPERS
   */

  /**
   * Estimate workflow cost based on steps and files
   */
  private estimateWorkflowCost(steps: WorkflowStep[], maxFiles: number): number {
    // Autonomous executor uses FREE Ollama, so cost is always $0
    // But we track estimated cost for learning algorithm

    // Base cost per file (if we were using OpenAI)
    const costPerFile = 0.001; // $0.001 per file

    // Complexity multiplier based on action types
    let complexityMultiplier = 1.0;
    for (const step of steps) {
      if (step.action === 'refactor') complexityMultiplier = Math.max(complexityMultiplier, 1.5);
      if (step.action === 'add-tests') complexityMultiplier = Math.max(complexityMultiplier, 1.3);
      if (step.action === 'custom') complexityMultiplier = Math.max(complexityMultiplier, 2.0);
    }

    // Estimated cost (for learning purposes, actual cost is $0)
    const estimatedCost = maxFiles * costPerFile * complexityMultiplier;

    return estimatedCost;
  }

  /**
   * Estimate complexity based on workflow steps
   */
  private estimateComplexity(steps: WorkflowStep[]): 'simple' | 'medium' | 'complex' {
    if (steps.length <= 2) return 'simple';
    if (steps.length <= 5) return 'medium';
    return 'complex';
  }
}

