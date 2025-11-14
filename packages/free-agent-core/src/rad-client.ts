/**
 * RAD (Repository Agent Database) Client
 * Provides long-term memory for agents via Postgres
 */

import { Pool, type PoolClient } from 'pg';

export interface TaskRecord {
  repoId: string;
  taskDescription: string;
  taskKind: 'feature' | 'bugfix' | 'refactor' | 'research';
  agentTier: 'free' | 'paid';
  success: boolean;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

export interface DecisionRecord {
  decisionType: 'approach' | 'technology' | 'architecture';
  chosenOption: string;
  alternatives: string[];
  reasoning: string;
  confidence: number; // 0-1
}

export interface LessonRecord {
  lessonType: 'success' | 'failure' | 'optimization' | 'warning';
  title: string;
  description: string;
  tags: string[];
}

export interface KnowledgeQuery {
  taskDescription: string;
  repoId?: string;
  taskKind?: string;
  limit?: number;
}

export interface RelatedKnowledge {
  similarTasks: Array<{
    id: string;
    description: string;
    success: boolean;
    similarity: number;
  }>;
  relevantDecisions: Array<{
    chosenOption: string;
    reasoning: string;
    confidence: number;
  }>;
  applicableLessons: Array<{
    title: string;
    description: string;
    lessonType: string;
  }>;
}

/**
 * Default shared RAD database (Neon)
 * This is used by all published MCP packages for system-wide agent memory
 * Users can override with RAD_DATABASE_URL environment variable
 */
const DEFAULT_RAD_DATABASE_URL = 'postgresql://neondb_owner:npg_dMv0ArX1TGYP@ep-broad-recipe-ae1wjh66.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require';

/**
 * RAD Client for agent memory operations
 */
export class RadClient {
  private pool: Pool | null = null;
  private enabled: boolean;

  constructor() {
    // RAD is enabled by default, can be disabled with RAD_ENABLED=false
    this.enabled = process.env.RAD_ENABLED !== 'false';

    if (this.enabled) {
      // Use custom database URL if provided, otherwise use shared default
      const databaseUrl = process.env.RAD_DATABASE_URL || DEFAULT_RAD_DATABASE_URL;

      this.pool = new Pool({
        connectionString: databaseUrl,
      });
    }
  }

  /**
   * Check if RAD is enabled and connected
   */
  isEnabled(): boolean {
    return this.enabled && this.pool !== null;
  }

  /**
   * Record a completed task with decisions and lessons
   */
  async recordEvent(
    task: TaskRecord,
    decisions: DecisionRecord[] = [],
    lessons: LessonRecord[] = []
  ): Promise<{ taskId: string } | null> {
    if (!this.isEnabled() || !this.pool) {
      return null;
    }

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // Insert task
      const taskResult = await client.query(
        `INSERT INTO tasks (repo_id, task_description, task_kind, agent_tier, success, error_message, metadata, completed_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
         RETURNING id`,
        [
          task.repoId,
          task.taskDescription,
          task.taskKind,
          task.agentTier,
          task.success,
          task.errorMessage || null,
          JSON.stringify(task.metadata || {}),
        ]
      );

      const taskId = taskResult.rows[0].id;

      // Insert decisions
      for (const decision of decisions) {
        await client.query(
          `INSERT INTO decisions (task_id, decision_type, chosen_option, alternatives, reasoning, confidence)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            taskId,
            decision.decisionType,
            decision.chosenOption,
            decision.alternatives,
            decision.reasoning,
            decision.confidence,
          ]
        );
      }

      // Insert lessons
      for (const lesson of lessons) {
        await client.query(
          `INSERT INTO lessons (task_id, lesson_type, title, description, tags)
           VALUES ($1, $2, $3, $4, $5)`,
          [taskId, lesson.lessonType, lesson.title, lesson.description, lesson.tags]
        );
      }

      await client.query('COMMIT');
      return { taskId };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Failed to record RAD event:', error);
      return null;
    } finally {
      client.release();
    }
  }

  /**
   * Get related knowledge for a task
   */
  async getRelatedKnowledge(query: KnowledgeQuery): Promise<RelatedKnowledge | null> {
    if (!this.isEnabled() || !this.pool) {
      return null;
    }

    try {
      // For now, use simple text matching
      // TODO: Implement semantic search with embeddings
      const limit = query.limit || 5;

      // Find similar tasks
      const tasksResult = await this.pool.query(
        `SELECT id, task_description, success
         FROM tasks
         WHERE ($1::text IS NULL OR repo_id = $1)
           AND ($2::text IS NULL OR task_kind = $2)
           AND task_description ILIKE $3
         ORDER BY created_at DESC
         LIMIT $4`,
        [query.repoId || null, query.taskKind || null, `%${query.taskDescription}%`, limit]
      );

      const similarTasks = tasksResult.rows.map((row) => ({
        id: row.id,
        description: row.task_description,
        success: row.success,
        similarity: 0.5, // Placeholder - implement proper similarity scoring
      }));

      // Get decisions from similar tasks
      const taskIds = similarTasks.map((t) => t.id);
      const decisionsResult =
        taskIds.length > 0
          ? await this.pool.query(
              `SELECT chosen_option, reasoning, confidence
               FROM decisions
               WHERE task_id = ANY($1)
               ORDER BY confidence DESC
               LIMIT $2`,
              [taskIds, limit]
            )
          : { rows: [] };

      const relevantDecisions = decisionsResult.rows;

      // Get lessons from similar tasks
      const lessonsResult =
        taskIds.length > 0
          ? await this.pool.query(
              `SELECT title, description, lesson_type
               FROM lessons
               WHERE task_id = ANY($1)
               ORDER BY created_at DESC
               LIMIT $2`,
              [taskIds, limit]
            )
          : { rows: [] };

      const applicableLessons = lessonsResult.rows.map((row) => ({
        title: row.title,
        description: row.description,
        lessonType: row.lesson_type,
      }));

      return {
        similarTasks,
        relevantDecisions,
        applicableLessons,
      };
    } catch (error) {
      console.error('Failed to query RAD knowledge:', error);
      return null;
    }
  }

  /**
   * Close the connection pool
   */
  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
    }
  }
}

// Singleton instance
let radClientInstance: RadClient | null = null;

/**
 * Get the RAD client singleton
 */
export function getRadClient(): RadClient {
  if (!radClientInstance) {
    radClientInstance = new RadClient();
  }
  return radClientInstance;
}

