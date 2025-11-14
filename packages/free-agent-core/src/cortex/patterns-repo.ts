/**
 * Code Patterns Repository
 * Manages reusable code templates and patterns
 */

import { Pool } from 'pg';
import { CodePattern, PatternVariable } from './types.js';

export class PatternsRepo {
  constructor(private pool: Pool) {}

  /**
   * Find patterns by type and language
   */
  async findByTypeAndLanguage(
    patternType: string,
    language: string,
    limit: number = 10
  ): Promise<CodePattern[]> {
    const result = await this.pool.query(
      `
      SELECT 
        id, name, description, pattern_type, language, template,
        variables, tags, usage_count, created_at, updated_at, metadata
      FROM code_patterns
      WHERE pattern_type = $1 AND language = $2
      ORDER BY usage_count DESC
      LIMIT $3
      `,
      [patternType, language, limit]
    );

    return result.rows.map(this.mapRow);
  }

  /**
   * Find patterns by tags
   */
  async findByTags(tags: string[], limit: number = 10): Promise<CodePattern[]> {
    const result = await this.pool.query(
      `
      SELECT 
        id, name, description, pattern_type, language, template,
        variables, tags, usage_count, created_at, updated_at, metadata
      FROM code_patterns
      WHERE tags && $1::text[]
      ORDER BY usage_count DESC
      LIMIT $2
      `,
      [tags, limit]
    );

    return result.rows.map(this.mapRow);
  }

  /**
   * Get pattern by ID
   */
  async getById(id: string): Promise<CodePattern | null> {
    const result = await this.pool.query(
      `
      SELECT 
        id, name, description, pattern_type, language, template,
        variables, tags, usage_count, created_at, updated_at, metadata
      FROM code_patterns
      WHERE id = $1
      `,
      [id]
    );

    return result.rows.length > 0 ? this.mapRow(result.rows[0]) : null;
  }

  /**
   * Get pattern by name
   */
  async getByName(name: string): Promise<CodePattern | null> {
    const result = await this.pool.query(
      `
      SELECT 
        id, name, description, pattern_type, language, template,
        variables, tags, usage_count, created_at, updated_at, metadata
      FROM code_patterns
      WHERE name = $1
      `,
      [name]
    );

    return result.rows.length > 0 ? this.mapRow(result.rows[0]) : null;
  }

  /**
   * Create a new pattern
   */
  async create(pattern: Omit<CodePattern, 'id' | 'createdAt' | 'updatedAt'>): Promise<CodePattern> {
    const result = await this.pool.query(
      `
      INSERT INTO code_patterns (
        name, description, pattern_type, language, template,
        variables, tags, usage_count, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING 
        id, name, description, pattern_type, language, template,
        variables, tags, usage_count, created_at, updated_at, metadata
      `,
      [
        pattern.name,
        pattern.description,
        pattern.patternType,
        pattern.language,
        pattern.template,
        JSON.stringify(pattern.variables),
        pattern.tags,
        pattern.usageCount,
        JSON.stringify(pattern.metadata),
      ]
    );

    return this.mapRow(result.rows[0]);
  }

  /**
   * Update pattern usage count
   */
  async recordUsage(id: string): Promise<void> {
    await this.pool.query(
      `
      UPDATE code_patterns
      SET 
        usage_count = usage_count + 1,
        updated_at = NOW()
      WHERE id = $1
      `,
      [id]
    );
  }

  /**
   * List all patterns
   */
  async listAll(): Promise<CodePattern[]> {
    const result = await this.pool.query(
      `
      SELECT 
        id, name, description, pattern_type, language, template,
        variables, tags, usage_count, created_at, updated_at, metadata
      FROM code_patterns
      ORDER BY pattern_type, language, usage_count DESC
      `
    );

    return result.rows.map(this.mapRow);
  }

  /**
   * Map database row to CodePattern
   */
  private mapRow(row: any): CodePattern {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      patternType: row.pattern_type,
      language: row.language,
      template: row.template,
      variables: row.variables as PatternVariable[],
      tags: row.tags || [],
      usageCount: row.usage_count,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      metadata: row.metadata || {},
    };
  }
}

