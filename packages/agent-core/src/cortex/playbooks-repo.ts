/**
 * Thinking Playbooks Repository
 * Manages reusable thinking tool sequences
 */

import { Pool } from 'pg';
import { ThinkingPlaybook, ThinkingToolStep } from './types.js';
import { generateEmbedding } from './embeddings.js';

export class PlaybooksRepo {
  constructor(private pool: Pool) {}

  /**
   * Find playbooks matching a task description
   */
  async findMatchingPlaybooks(
    taskDescription: string,
    limit: number = 5
  ): Promise<ThinkingPlaybook[]> {
    const result = await this.pool.query(
      `
      SELECT 
        id, name, description, task_pattern, tool_sequence, priority,
        success_rate, usage_count, created_at, updated_at, metadata
      FROM thinking_playbooks
      WHERE 
        $1 ~* task_pattern  -- Regex match
        OR $1 ILIKE '%' || task_pattern || '%'  -- Keyword match
      ORDER BY priority DESC, success_rate DESC
      LIMIT $2
      `,
      [taskDescription, limit]
    );

    return result.rows.map(this.mapRow);
  }

  /**
   * Get playbook by ID
   */
  async getById(id: string): Promise<ThinkingPlaybook | null> {
    const result = await this.pool.query(
      `
      SELECT 
        id, name, description, task_pattern, tool_sequence, priority,
        success_rate, usage_count, created_at, updated_at, metadata
      FROM thinking_playbooks
      WHERE id = $1
      `,
      [id]
    );

    return result.rows.length > 0 ? this.mapRow(result.rows[0]) : null;
  }

  /**
   * Get playbook by name
   */
  async getByName(name: string): Promise<ThinkingPlaybook | null> {
    const result = await this.pool.query(
      `
      SELECT 
        id, name, description, task_pattern, tool_sequence, priority,
        success_rate, usage_count, created_at, updated_at, metadata
      FROM thinking_playbooks
      WHERE name = $1
      `,
      [name]
    );

    return result.rows.length > 0 ? this.mapRow(result.rows[0]) : null;
  }

  /**
   * Create a new playbook
   */
  async create(playbook: Omit<ThinkingPlaybook, 'id' | 'createdAt' | 'updatedAt'>): Promise<ThinkingPlaybook> {
    const result = await this.pool.query(
      `
      INSERT INTO thinking_playbooks (
        name, description, task_pattern, tool_sequence, priority,
        success_rate, usage_count, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING 
        id, name, description, task_pattern, tool_sequence, priority,
        success_rate, usage_count, created_at, updated_at, metadata
      `,
      [
        playbook.name,
        playbook.description,
        playbook.taskPattern,
        JSON.stringify(playbook.toolSequence),
        playbook.priority,
        playbook.successRate,
        playbook.usageCount,
        JSON.stringify(playbook.metadata),
      ]
    );

    return this.mapRow(result.rows[0]);
  }

  /**
   * Update playbook usage stats
   */
  async recordUsage(id: string, success: boolean): Promise<void> {
    await this.pool.query(
      `
      UPDATE thinking_playbooks
      SET
        usage_count = usage_count + 1,
        success_rate = (
          (success_rate * usage_count + $2::int) / (usage_count + 1)
        ),
        updated_at = NOW()
      WHERE id = $1
      `,
      [id, success ? 1 : 0]
    );
  }

  /**
   * Find playbooks similar to a task using semantic search
   * Combines rule-based matching with vector similarity
   */
  async findSimilarToTask(
    taskDescription: string,
    limit: number = 5
  ): Promise<ThinkingPlaybook[]> {
    // Generate embedding for task
    const embedding = await generateEmbedding(taskDescription);
    if (!embedding) {
      // Fall back to rule-based matching if embedding fails
      return this.findMatchingPlaybooks(taskDescription, limit);
    }

    // Query using vector similarity + rule-based matching
    const result = await this.pool.query(
      `
      SELECT
        id, name, description, task_pattern, tool_sequence, priority,
        success_rate, usage_count, created_at, updated_at, metadata,
        (embedding <=> $1::vector) as distance
      FROM thinking_playbooks
      WHERE embedding IS NOT NULL
      ORDER BY
        CASE
          WHEN $2 ~* task_pattern THEN 0  -- Exact regex match gets priority
          ELSE 1
        END,
        distance ASC,  -- Then by semantic similarity
        priority DESC,  -- Then by priority
        success_rate DESC  -- Then by success rate
      LIMIT $3
      `,
      [JSON.stringify(embedding), taskDescription, limit]
    );

    return result.rows.map(this.mapRow);
  }

  /**
   * Generate and store embedding for a playbook
   */
  async generateEmbedding(id: string): Promise<void> {
    // Get playbook
    const playbook = await this.getById(id);
    if (!playbook) {
      throw new Error(`Playbook ${id} not found`);
    }

    // Generate embedding from name + description + task pattern
    const text = `${playbook.name}\n${playbook.description}\n${playbook.taskPattern}`;
    const embedding = await generateEmbedding(text);

    if (!embedding) {
      throw new Error('Failed to generate embedding');
    }

    // Store embedding
    await this.pool.query(
      `
      UPDATE thinking_playbooks
      SET embedding = $1::vector
      WHERE id = $2
      `,
      [JSON.stringify(embedding), id]
    );
  }

  /**
   * Generate embeddings for all playbooks that don't have one
   */
  async generateAllEmbeddings(): Promise<number> {
    const result = await this.pool.query(
      `
      SELECT id
      FROM thinking_playbooks
      WHERE embedding IS NULL
      `
    );

    let count = 0;
    for (const row of result.rows) {
      try {
        await this.generateEmbedding(row.id);
        count++;
      } catch (error) {
        console.error(`Failed to generate embedding for playbook ${row.id}:`, error);
      }
    }

    return count;
  }

  /**
   * List all playbooks
   */
  async listAll(): Promise<ThinkingPlaybook[]> {
    const result = await this.pool.query(
      `
      SELECT 
        id, name, description, task_pattern, tool_sequence, priority,
        success_rate, usage_count, created_at, updated_at, metadata
      FROM thinking_playbooks
      ORDER BY priority DESC, success_rate DESC
      `
    );

    return result.rows.map(this.mapRow);
  }

  /**
   * Map database row to ThinkingPlaybook
   */
  private mapRow(row: any): ThinkingPlaybook {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      taskPattern: row.task_pattern,
      toolSequence: row.tool_sequence as ThinkingToolStep[],
      priority: row.priority,
      successRate: parseFloat(row.success_rate),
      usageCount: row.usage_count,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      metadata: row.metadata || {},
    };
  }
}

