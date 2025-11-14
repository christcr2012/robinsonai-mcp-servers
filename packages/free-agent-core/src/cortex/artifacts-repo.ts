/**
 * Knowledge Artifacts Repository
 * Manages planning and execution artifacts for future reference
 */

import { Pool } from 'pg';
import { KnowledgeArtifact } from './types.js';

export class ArtifactsRepo {
  constructor(private pool: Pool) {}

  /**
   * Save a thinking artifact
   */
  async saveThinkingArtifact(
    taskId: string,
    title: string,
    content: string,
    tags: string[] = [],
    metadata: Record<string, any> = {}
  ): Promise<KnowledgeArtifact> {
    const result = await this.pool.query(
      `
      INSERT INTO knowledge_artifacts (
        task_id, artifact_type, title, content, format, tags, metadata
      ) VALUES ($1, 'thinking_output', $2, $3, 'markdown', $4, $5)
      RETURNING 
        id, task_id, artifact_type, title, content, format, tags,
        created_at, metadata
      `,
      [taskId, title, content, tags, JSON.stringify(metadata)]
    );

    return this.mapRow(result.rows[0]);
  }

  /**
   * Save a plan artifact
   */
  async savePlanArtifact(
    taskId: string,
    title: string,
    content: string,
    tags: string[] = [],
    metadata: Record<string, any> = {}
  ): Promise<KnowledgeArtifact> {
    const result = await this.pool.query(
      `
      INSERT INTO knowledge_artifacts (
        task_id, artifact_type, title, content, format, tags, metadata
      ) VALUES ($1, 'plan', $2, $3, 'markdown', $4, $5)
      RETURNING 
        id, task_id, artifact_type, title, content, format, tags,
        created_at, metadata
      `,
      [taskId, title, content, tags, JSON.stringify(metadata)]
    );

    return this.mapRow(result.rows[0]);
  }

  /**
   * Save a decision artifact
   */
  async saveDecisionArtifact(
    taskId: string,
    title: string,
    content: string,
    tags: string[] = [],
    metadata: Record<string, any> = {}
  ): Promise<KnowledgeArtifact> {
    const result = await this.pool.query(
      `
      INSERT INTO knowledge_artifacts (
        task_id, artifact_type, title, content, format, tags, metadata
      ) VALUES ($1, 'decision', $2, $3, 'markdown', $4, $5)
      RETURNING 
        id, task_id, artifact_type, title, content, format, tags,
        created_at, metadata
      `,
      [taskId, title, content, tags, JSON.stringify(metadata)]
    );

    return this.mapRow(result.rows[0]);
  }

  /**
   * Save an execution summary artifact
   */
  async saveExecutionSummary(
    taskId: string,
    title: string,
    content: string,
    tags: string[] = [],
    metadata: Record<string, any> = {}
  ): Promise<KnowledgeArtifact> {
    const result = await this.pool.query(
      `
      INSERT INTO knowledge_artifacts (
        task_id, artifact_type, title, content, format, tags, metadata
      ) VALUES ($1, 'execution_summary', $2, $3, 'markdown', $4, $5)
      RETURNING 
        id, task_id, artifact_type, title, content, format, tags,
        created_at, metadata
      `,
      [taskId, title, content, tags, JSON.stringify(metadata)]
    );

    return this.mapRow(result.rows[0]);
  }

  /**
   * Find artifacts by task ID
   */
  async findByTaskId(taskId: string): Promise<KnowledgeArtifact[]> {
    const result = await this.pool.query(
      `
      SELECT 
        id, task_id, artifact_type, title, content, format, tags,
        created_at, metadata
      FROM knowledge_artifacts
      WHERE task_id = $1
      ORDER BY created_at DESC
      `,
      [taskId]
    );

    return result.rows.map(this.mapRow);
  }

  /**
   * Find artifacts by type
   */
  async findByType(
    artifactType: 'thinking_output' | 'plan' | 'decision' | 'execution_summary',
    limit: number = 50
  ): Promise<KnowledgeArtifact[]> {
    const result = await this.pool.query(
      `
      SELECT 
        id, task_id, artifact_type, title, content, format, tags,
        created_at, metadata
      FROM knowledge_artifacts
      WHERE artifact_type = $1
      ORDER BY created_at DESC
      LIMIT $2
      `,
      [artifactType, limit]
    );

    return result.rows.map(this.mapRow);
  }

  /**
   * Find artifacts by tags
   */
  async findByTags(tags: string[], limit: number = 50): Promise<KnowledgeArtifact[]> {
    const result = await this.pool.query(
      `
      SELECT 
        id, task_id, artifact_type, title, content, format, tags,
        created_at, metadata
      FROM knowledge_artifacts
      WHERE tags && $1::text[]
      ORDER BY created_at DESC
      LIMIT $2
      `,
      [tags, limit]
    );

    return result.rows.map(this.mapRow);
  }

  /**
   * Map database row to KnowledgeArtifact
   */
  private mapRow(row: any): KnowledgeArtifact {
    return {
      id: row.id,
      taskId: row.task_id,
      artifactType: row.artifact_type,
      title: row.title,
      content: row.content,
      format: row.format,
      tags: row.tags || [],
      createdAt: row.created_at,
      metadata: row.metadata || {},
    };
  }
}

