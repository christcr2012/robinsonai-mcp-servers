/**
 * Capability Registry Repository
 * Manages high-level capabilities that agents can perform
 */

import { Pool } from 'pg';
import { Capability } from './types.js';

export class CapabilitiesRepo {
  constructor(private pool: Pool) {}

  /**
   * Find capabilities by category
   */
  async findByCategory(category: string, limit: number = 10): Promise<Capability[]> {
    const result = await this.pool.query(
      `
      SELECT 
        id, name, description, category, required_tools, required_env_vars,
        workflow_id, complexity, estimated_duration_minutes, success_rate,
        usage_count, created_at, updated_at, metadata
      FROM capability_registry
      WHERE category = $1
      ORDER BY success_rate DESC, usage_count DESC
      LIMIT $2
      `,
      [category, limit]
    );

    return result.rows.map(this.mapRow);
  }

  /**
   * Find capabilities by complexity
   */
  async findByComplexity(
    complexity: 'simple' | 'medium' | 'complex' | 'expert',
    limit: number = 10
  ): Promise<Capability[]> {
    const result = await this.pool.query(
      `
      SELECT 
        id, name, description, category, required_tools, required_env_vars,
        workflow_id, complexity, estimated_duration_minutes, success_rate,
        usage_count, created_at, updated_at, metadata
      FROM capability_registry
      WHERE complexity = $1
      ORDER BY success_rate DESC, usage_count DESC
      LIMIT $2
      `,
      [complexity, limit]
    );

    return result.rows.map(this.mapRow);
  }

  /**
   * Get capability by ID
   */
  async getById(id: string): Promise<Capability | null> {
    const result = await this.pool.query(
      `
      SELECT 
        id, name, description, category, required_tools, required_env_vars,
        workflow_id, complexity, estimated_duration_minutes, success_rate,
        usage_count, created_at, updated_at, metadata
      FROM capability_registry
      WHERE id = $1
      `,
      [id]
    );

    return result.rows.length > 0 ? this.mapRow(result.rows[0]) : null;
  }

  /**
   * Get capability by name
   */
  async getByName(name: string): Promise<Capability | null> {
    const result = await this.pool.query(
      `
      SELECT 
        id, name, description, category, required_tools, required_env_vars,
        workflow_id, complexity, estimated_duration_minutes, success_rate,
        usage_count, created_at, updated_at, metadata
      FROM capability_registry
      WHERE name = $1
      `,
      [name]
    );

    return result.rows.length > 0 ? this.mapRow(result.rows[0]) : null;
  }

  /**
   * Create a new capability
   */
  async create(capability: Omit<Capability, 'id' | 'createdAt' | 'updatedAt'>): Promise<Capability> {
    const result = await this.pool.query(
      `
      INSERT INTO capability_registry (
        name, description, category, required_tools, required_env_vars,
        workflow_id, complexity, estimated_duration_minutes, success_rate,
        usage_count, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING 
        id, name, description, category, required_tools, required_env_vars,
        workflow_id, complexity, estimated_duration_minutes, success_rate,
        usage_count, created_at, updated_at, metadata
      `,
      [
        capability.name,
        capability.description,
        capability.category,
        capability.requiredTools,
        capability.requiredEnvVars,
        capability.workflowId || null,
        capability.complexity,
        capability.estimatedDurationMinutes || null,
        capability.successRate,
        capability.usageCount,
        JSON.stringify(capability.metadata),
      ]
    );

    return this.mapRow(result.rows[0]);
  }

  /**
   * Update capability usage stats
   */
  async recordUsage(id: string, success: boolean): Promise<void> {
    await this.pool.query(
      `
      UPDATE capability_registry
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
   * List all capabilities
   */
  async listAll(): Promise<Capability[]> {
    const result = await this.pool.query(
      `
      SELECT 
        id, name, description, category, required_tools, required_env_vars,
        workflow_id, complexity, estimated_duration_minutes, success_rate,
        usage_count, created_at, updated_at, metadata
      FROM capability_registry
      ORDER BY category, success_rate DESC
      `
    );

    return result.rows.map(this.mapRow);
  }

  /**
   * Map database row to Capability
   */
  private mapRow(row: any): Capability {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      category: row.category,
      requiredTools: row.required_tools || [],
      requiredEnvVars: row.required_env_vars || [],
      workflowId: row.workflow_id,
      complexity: row.complexity,
      estimatedDurationMinutes: row.estimated_duration_minutes,
      successRate: parseFloat(row.success_rate),
      usageCount: row.usage_count,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      metadata: row.metadata || {},
    };
  }
}

