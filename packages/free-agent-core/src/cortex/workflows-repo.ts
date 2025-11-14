/**
 * Tool Workflows Repository
 * Manages multi-step workflows that combine Toolkit tools
 */

import { Pool } from 'pg';
import { ToolWorkflow, WorkflowStep } from './types.js';
import { generateEmbedding } from './embeddings.js';

export class WorkflowsRepo {
  constructor(private pool: Pool) {}

  /**
   * Find workflows by category
   */
  async findByCategory(category: string, limit: number = 10): Promise<ToolWorkflow[]> {
    const result = await this.pool.query(
      `
      SELECT 
        id, name, description, category, steps, prerequisites,
        success_rate, usage_count, created_at, updated_at, metadata
      FROM tool_workflows
      WHERE category = $1
      ORDER BY success_rate DESC, usage_count DESC
      LIMIT $2
      `,
      [category, limit]
    );

    return result.rows.map(this.mapRow);
  }

  /**
   * Get workflow by ID
   */
  async getById(id: string): Promise<ToolWorkflow | null> {
    const result = await this.pool.query(
      `
      SELECT 
        id, name, description, category, steps, prerequisites,
        success_rate, usage_count, created_at, updated_at, metadata
      FROM tool_workflows
      WHERE id = $1
      `,
      [id]
    );

    return result.rows.length > 0 ? this.mapRow(result.rows[0]) : null;
  }

  /**
   * Get workflow by name
   */
  async getByName(name: string): Promise<ToolWorkflow | null> {
    const result = await this.pool.query(
      `
      SELECT 
        id, name, description, category, steps, prerequisites,
        success_rate, usage_count, created_at, updated_at, metadata
      FROM tool_workflows
      WHERE name = $1
      `,
      [name]
    );

    return result.rows.length > 0 ? this.mapRow(result.rows[0]) : null;
  }

  /**
   * Create a new workflow
   */
  async create(workflow: Omit<ToolWorkflow, 'id' | 'createdAt' | 'updatedAt'>): Promise<ToolWorkflow> {
    const result = await this.pool.query(
      `
      INSERT INTO tool_workflows (
        name, description, category, steps, prerequisites,
        success_rate, usage_count, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING 
        id, name, description, category, steps, prerequisites,
        success_rate, usage_count, created_at, updated_at, metadata
      `,
      [
        workflow.name,
        workflow.description,
        workflow.category,
        JSON.stringify(workflow.steps),
        JSON.stringify(workflow.prerequisites),
        workflow.successRate,
        workflow.usageCount,
        JSON.stringify(workflow.metadata),
      ]
    );

    return this.mapRow(result.rows[0]);
  }

  /**
   * Update workflow usage stats
   */
  async recordUsage(id: string, success: boolean): Promise<void> {
    await this.pool.query(
      `
      UPDATE tool_workflows
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
   * List all workflows
   */
  async listAll(): Promise<ToolWorkflow[]> {
    const result = await this.pool.query(
      `
      SELECT 
        id, name, description, category, steps, prerequisites,
        success_rate, usage_count, created_at, updated_at, metadata
      FROM tool_workflows
      ORDER BY category, success_rate DESC
      `
    );

    return result.rows.map(this.mapRow);
  }

  /**
   * List all categories
   */
  async listCategories(): Promise<string[]> {
    const result = await this.pool.query(
      `
      SELECT DISTINCT category
      FROM tool_workflows
      ORDER BY category
      `
    );

    return result.rows.map(row => row.category);
  }

  /**
   * Find workflows similar to a task using semantic search
   */
  async findSimilarToTask(
    taskDescription: string,
    limit: number = 5
  ): Promise<ToolWorkflow[]> {
    const embedding = await generateEmbedding(taskDescription);
    if (!embedding) {
      // Fall back to category-based search
      return this.listAll();
    }

    const result = await this.pool.query(
      `
      SELECT
        id, name, description, category, steps, prerequisites,
        success_rate, usage_count, created_at, updated_at, metadata,
        (embedding <=> $1::vector) as distance
      FROM tool_workflows
      WHERE embedding IS NOT NULL
      ORDER BY distance ASC, success_rate DESC
      LIMIT $2
      `,
      [JSON.stringify(embedding), limit]
    );

    return result.rows.map(this.mapRow);
  }

  /**
   * Generate and store embedding for a workflow
   */
  async generateEmbedding(id: string): Promise<void> {
    const workflow = await this.getById(id);
    if (!workflow) {
      throw new Error(`Workflow ${id} not found`);
    }

    const text = `${workflow.name}\n${workflow.description}\n${workflow.category}`;
    const embedding = await generateEmbedding(text);

    if (!embedding) {
      throw new Error('Failed to generate embedding');
    }

    await this.pool.query(
      `UPDATE tool_workflows SET embedding = $1::vector WHERE id = $2`,
      [JSON.stringify(embedding), id]
    );
  }

  /**
   * Generate embeddings for all workflows
   */
  async generateAllEmbeddings(): Promise<number> {
    const result = await this.pool.query(
      `SELECT id FROM tool_workflows WHERE embedding IS NULL`
    );

    let count = 0;
    for (const row of result.rows) {
      try {
        await this.generateEmbedding(row.id);
        count++;
      } catch (error) {
        console.error(`Failed to generate embedding for workflow ${row.id}:`, error);
      }
    }

    return count;
  }

  /**
   * Map database row to ToolWorkflow
   */
  private mapRow(row: any): ToolWorkflow {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      category: row.category,
      steps: row.steps as WorkflowStep[],
      prerequisites: row.prerequisites || [],
      successRate: parseFloat(row.success_rate),
      usageCount: row.usage_count,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      metadata: row.metadata || {},
    };
  }
}

