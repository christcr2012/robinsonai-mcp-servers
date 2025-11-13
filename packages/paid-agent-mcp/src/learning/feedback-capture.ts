/**
 * Feedback Capture System
 * 
 * Captures feedback from primary coding agents (Augment, Cursor, Copilot, etc.)
 * when they edit agent-generated code. This feedback is used to improve the agent.
 * 
 * Flow:
 * 1. Agent generates code
 * 2. User/Primary agent edits the code
 * 3. Feedback capture detects the edit
 * 4. Diff is analyzed and categorized
 * 5. Feedback is stored in experience database
 * 6. Learning system uses feedback to improve
 */

import { diffLines } from 'diff';
import { createHash } from 'crypto';

// Type for diff change
interface Change {
  value: string;
  added?: boolean;
  removed?: boolean;
}

export interface FeedbackEvent {
  timestamp: number;
  runId: string;
  agentOutput: string;
  userEdit: string;
  diff: string;
  feedbackType: FeedbackType;
  source: FeedbackSource;
  severity: FeedbackSeverity;
  category: FeedbackCategory;
  metadata?: Record<string, any>;
}

export type FeedbackType = 
  | 'bug_fix'           // Fixed a bug in agent code
  | 'style'             // Style/formatting improvement
  | 'logic'             // Logic/algorithm improvement
  | 'refactor'          // Code refactoring
  | 'performance'       // Performance optimization
  | 'security'          // Security fix
  | 'type_safety'       // Type safety improvement
  | 'error_handling'    // Error handling improvement
  | 'documentation'     // Documentation improvement
  | 'other';            // Other improvements

export type FeedbackSource =
  | 'augment'           // Augment Code
  | 'cursor'            // Cursor
  | 'copilot'           // GitHub Copilot
  | 'windsurf'          // Windsurf
  | 'manual'            // Manual edit by user
  | 'unknown';          // Unknown source

export type FeedbackSeverity =
  | 'critical'          // Critical issue (code doesn't work)
  | 'major'             // Major issue (significant improvement)
  | 'minor'             // Minor issue (small improvement)
  | 'cosmetic';         // Cosmetic change (style only)

export type FeedbackCategory =
  | 'correctness'       // Code correctness
  | 'quality'           // Code quality
  | 'maintainability'   // Code maintainability
  | 'readability'       // Code readability
  | 'efficiency';       // Code efficiency

export interface FeedbackAnalysis {
  feedbackType: FeedbackType;
  severity: FeedbackSeverity;
  category: FeedbackCategory;
  linesAdded: number;
  linesRemoved: number;
  linesModified: number;
  patterns: string[];
  suggestions: string[];
}

export interface TrainingExample {
  prompt: string;
  agentOutput: string;
  correctedOutput: string;
  feedback: string;
  quality: number;
}

export class FeedbackCapture {
  private db: any;

  constructor(db: any) {
    this.db = db;
    this.initializeTables();
  }

  private initializeTables(): void {
    // Create feedback table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS feedback_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp INTEGER NOT NULL,
        run_id TEXT NOT NULL,
        agent_output TEXT NOT NULL,
        user_edit TEXT NOT NULL,
        diff TEXT NOT NULL,
        feedback_type TEXT NOT NULL,
        source TEXT NOT NULL,
        severity TEXT NOT NULL,
        category TEXT NOT NULL,
        metadata TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      );

      CREATE INDEX IF NOT EXISTS idx_feedback_run_id ON feedback_events(run_id);
      CREATE INDEX IF NOT EXISTS idx_feedback_type ON feedback_events(feedback_type);
      CREATE INDEX IF NOT EXISTS idx_feedback_source ON feedback_events(source);
      CREATE INDEX IF NOT EXISTS idx_feedback_severity ON feedback_events(severity);
    `);

    // Create training examples table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS training_examples (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        feedback_id INTEGER NOT NULL,
        prompt TEXT NOT NULL,
        agent_output TEXT NOT NULL,
        corrected_output TEXT NOT NULL,
        feedback TEXT NOT NULL,
        quality REAL NOT NULL,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (feedback_id) REFERENCES feedback_events(id)
      );

      CREATE INDEX IF NOT EXISTS idx_training_quality ON training_examples(quality);
    `);
  }

  /**
   * Capture feedback from a code edit
   */
  async captureEdit(
    runId: string,
    before: string,
    after: string,
    source: FeedbackSource = 'unknown',
    metadata?: Record<string, any>
  ): Promise<FeedbackEvent> {
    const timestamp = Date.now();
    
    // Generate diff
    const diff = this.generateDiff(before, after);
    
    // Analyze feedback
    const analysis = await this.analyzeFeedback(before, after, diff);
    
    // Create feedback event
    const event: FeedbackEvent = {
      timestamp,
      runId,
      agentOutput: before,
      userEdit: after,
      diff,
      feedbackType: analysis.feedbackType,
      source,
      severity: analysis.severity,
      category: analysis.category,
      metadata,
    };
    
    // Store in database
    this.storeFeedback(event);
    
    // Update reward for the run
    await this.updateReward(runId, event);
    
    // Generate training example
    await this.generateCorrectionExample(event);
    
    return event;
  }

  /**
   * Generate unified diff between before and after
   */
  private generateDiff(before: string, after: string): string {
    const changes = diffLines(before, after);
    return changes
      .map((change: Change) => {
        const prefix = change.added ? '+' : change.removed ? '-' : ' ';
        return change.value
          .split('\n')
          .filter((line: string) => line.length > 0)
          .map((line: string) => `${prefix} ${line}`)
          .join('\n');
      })
      .join('\n');
  }

  /**
   * Analyze feedback to determine type, severity, and category
   */
  private async analyzeFeedback(
    before: string,
    after: string,
    diff: string
  ): Promise<FeedbackAnalysis> {
    const changes = diffLines(before, after);
    
    let linesAdded = 0;
    let linesRemoved = 0;
    let linesModified = 0;
    
    for (const change of changes) {
      const lineCount = change.value.split('\n').filter((l: string) => l.length > 0).length;
      if (change.added) {
        linesAdded += lineCount;
      } else if (change.removed) {
        linesRemoved += lineCount;
      }
    }
    
    // If lines were both added and removed, they were modified
    linesModified = Math.min(linesAdded, linesRemoved);
    linesAdded -= linesModified;
    linesRemoved -= linesModified;
    
    // Detect patterns
    const patterns: string[] = [];
    const suggestions: string[] = [];
    
    // Bug fix patterns
    if (diff.includes('throw new Error') || diff.includes('catch')) {
      patterns.push('error_handling');
      suggestions.push('Add more comprehensive error handling');
    }
    
    // Type safety patterns
    if (diff.includes(': any') || diff.includes('as unknown')) {
      patterns.push('type_safety');
      suggestions.push('Use more specific types instead of any');
    }
    
    // Performance patterns
    if (diff.includes('for (') || diff.includes('.map(') || diff.includes('.filter(')) {
      patterns.push('performance');
      suggestions.push('Consider performance implications of loops');
    }
    
    // Security patterns
    if (diff.includes('eval(') || diff.includes('innerHTML') || diff.includes('dangerouslySetInnerHTML')) {
      patterns.push('security');
      suggestions.push('Avoid potentially unsafe operations');
    }
    
    // Determine feedback type
    let feedbackType: FeedbackType = 'other';
    if (patterns.includes('error_handling')) feedbackType = 'error_handling';
    else if (patterns.includes('type_safety')) feedbackType = 'type_safety';
    else if (patterns.includes('performance')) feedbackType = 'performance';
    else if (patterns.includes('security')) feedbackType = 'security';
    else if (linesAdded === 0 && linesRemoved === 0) feedbackType = 'style';
    else if (linesAdded > linesRemoved * 2) feedbackType = 'bug_fix';
    else if (linesRemoved > linesAdded * 2) feedbackType = 'refactor';
    else feedbackType = 'logic';
    
    // Determine severity
    let severity: FeedbackSeverity = 'minor';
    if (patterns.includes('security') || patterns.includes('error_handling')) {
      severity = 'critical';
    } else if (linesAdded + linesRemoved > 20) {
      severity = 'major';
    } else if (linesAdded + linesRemoved < 5) {
      severity = 'cosmetic';
    }
    
    // Determine category
    let category: FeedbackCategory = 'quality';
    if (feedbackType === 'bug_fix' || feedbackType === 'error_handling') {
      category = 'correctness';
    } else if (feedbackType === 'refactor') {
      category = 'maintainability';
    } else if (feedbackType === 'style') {
      category = 'readability';
    } else if (feedbackType === 'performance') {
      category = 'efficiency';
    }
    
    return {
      feedbackType,
      severity,
      category,
      linesAdded,
      linesRemoved,
      linesModified,
      patterns,
      suggestions,
    };
  }

  /**
   * Store feedback in database
   */
  private storeFeedback(event: FeedbackEvent): void {
    const stmt = this.db.prepare(`
      INSERT INTO feedback_events (
        timestamp, run_id, agent_output, user_edit, diff,
        feedback_type, source, severity, category, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      event.timestamp,
      event.runId,
      event.agentOutput,
      event.userEdit,
      event.diff,
      event.feedbackType,
      event.source,
      event.severity,
      event.category,
      event.metadata ? JSON.stringify(event.metadata) : null
    );
  }

  /**
   * Update reward for the run based on feedback
   */
  private async updateReward(runId: string, event: FeedbackEvent): Promise<void> {
    try {
      // Calculate feedback penalty based on severity
      const penalties = {
        critical: -0.5,
        major: -0.3,
        minor: -0.1,
        cosmetic: -0.05,
      };

      const penalty = penalties[event.severity];

      // Update experience database (if run exists)
      const stmt = this.db.prepare(`
        UPDATE experience
        SET
          reward = MAX(0, reward + ?),
          human_feedback = ?
        WHERE run_id = ?
      `);

      stmt.run(penalty, event.feedbackType, runId);
    } catch (error) {
      // Silently ignore if experience table doesn't exist or run not found
      console.error(`[FeedbackCapture] Could not update reward for ${runId}:`, error);
    }
  }

  /**
   * Generate training example from feedback
   */
  private async generateCorrectionExample(event: FeedbackEvent): Promise<TrainingExample> {
    try {
      // Get original prompt from experience database
      const row = this.db.prepare(`
        SELECT prompt FROM experience WHERE run_id = ?
      `).get(event.runId) as { prompt: string } | undefined;

      if (!row) {
        console.error(`[FeedbackCapture] No experience found for run_id: ${event.runId}, using generic prompt`);
        // Use a generic prompt if not found
        const genericPrompt = `Task: Generate code\nContext: ${event.metadata?.context || 'Unknown'}`;
        return this.createTrainingExample(event, genericPrompt);
      }

      return this.createTrainingExample(event, row.prompt);
    } catch (error) {
      console.error(`[FeedbackCapture] Error generating correction example:`, error);
      // Return a basic training example
      const genericPrompt = `Task: Generate code\nContext: ${event.metadata?.context || 'Unknown'}`;
      return this.createTrainingExample(event, genericPrompt);
    }
  }

  private createTrainingExample(event: FeedbackEvent, prompt: string): TrainingExample {
    // Calculate quality based on severity
    const qualityScores = {
      critical: 0.3,
      major: 0.5,
      minor: 0.7,
      cosmetic: 0.9,
    };

    const quality = qualityScores[event.severity];

    // Create training example
    const example: TrainingExample = {
      prompt,
      agentOutput: event.agentOutput,
      correctedOutput: event.userEdit,
      feedback: `Feedback type: ${event.feedbackType}, Severity: ${event.severity}, Category: ${event.category}`,
      quality,
    };
    
    // Store in database
    const feedbackId = this.db.prepare(`
      SELECT id FROM feedback_events WHERE run_id = ? ORDER BY id DESC LIMIT 1
    `).get(event.runId) as { id: number };
    
    this.db.prepare(`
      INSERT INTO training_examples (
        feedback_id, prompt, agent_output, corrected_output, feedback, quality
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      feedbackId.id,
      example.prompt,
      example.agentOutput,
      example.correctedOutput,
      example.feedback,
      example.quality
    );
    
    return example;
  }

  /**
   * Get feedback statistics
   */
  getFeedbackStats(): Record<string, any> {
    const total = this.db.prepare('SELECT COUNT(*) as count FROM feedback_events').get() as { count: number };
    
    const byType = this.db.prepare(`
      SELECT feedback_type, COUNT(*) as count
      FROM feedback_events
      GROUP BY feedback_type
      ORDER BY count DESC
    `).all();
    
    const bySeverity = this.db.prepare(`
      SELECT severity, COUNT(*) as count
      FROM feedback_events
      GROUP BY severity
      ORDER BY count DESC
    `).all();
    
    const bySource = this.db.prepare(`
      SELECT source, COUNT(*) as count
      FROM feedback_events
      GROUP BY source
      ORDER BY count DESC
    `).all();
    
    return {
      total: total.count,
      byType,
      bySeverity,
      bySource,
    };
  }
}

