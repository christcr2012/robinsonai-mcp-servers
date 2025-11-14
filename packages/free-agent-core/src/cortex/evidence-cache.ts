/**
 * Evidence Cache Repository
 * Caches evidence bundles to avoid redundant work
 */

import { Pool } from 'pg';
import { createHash } from 'crypto';
import { EvidenceCacheEntry } from './types.js';

export class EvidenceCacheRepo {
  constructor(private pool: Pool) {}

  /**
   * Generate cache key from task parameters
   */
  private generateCacheKey(
    taskDescription: string,
    repo: string,
    constraints?: Record<string, any>
  ): string {
    const data = JSON.stringify({
      task: taskDescription.toLowerCase().trim(),
      repo,
      constraints: constraints || {},
    });
    return createHash('sha256').update(data).digest('hex');
  }

  /**
   * Get cached evidence bundle
   */
  async get(
    taskDescription: string,
    repo: string,
    constraints?: Record<string, any>
  ): Promise<any | null> {
    const cacheKey = this.generateCacheKey(taskDescription, repo, constraints);

    // Clean up expired entries first
    await this.pool.query(
      `DELETE FROM evidence_cache WHERE expires_at < NOW()`
    );

    const result = await this.pool.query(
      `
      SELECT evidence_bundle, hit_count
      FROM evidence_cache
      WHERE cache_key = $1 AND expires_at > NOW()
      `,
      [cacheKey]
    );

    if (result.rows.length === 0) {
      return null;
    }

    // Update hit count and last accessed time
    await this.pool.query(
      `
      UPDATE evidence_cache
      SET 
        hit_count = hit_count + 1,
        last_accessed_at = NOW()
      WHERE cache_key = $1
      `,
      [cacheKey]
    );

    return result.rows[0].evidence_bundle;
  }

  /**
   * Set cached evidence bundle
   */
  async set(
    taskDescription: string,
    repo: string,
    evidenceBundle: any,
    ttlMinutes: number = 60,
    constraints?: Record<string, any>
  ): Promise<void> {
    const cacheKey = this.generateCacheKey(taskDescription, repo, constraints);
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

    await this.pool.query(
      `
      INSERT INTO evidence_cache (
        cache_key, evidence_bundle, expires_at
      ) VALUES ($1, $2, $3)
      ON CONFLICT (cache_key) DO UPDATE SET
        evidence_bundle = EXCLUDED.evidence_bundle,
        expires_at = EXCLUDED.expires_at,
        last_accessed_at = NOW()
      `,
      [cacheKey, JSON.stringify(evidenceBundle), expiresAt]
    );
  }

  /**
   * Clear expired entries
   */
  async clearExpired(): Promise<number> {
    const result = await this.pool.query(
      `DELETE FROM evidence_cache WHERE expires_at < NOW()`
    );
    return result.rowCount || 0;
  }

  /**
   * Clear all cache entries
   */
  async clearAll(): Promise<number> {
    const result = await this.pool.query(`DELETE FROM evidence_cache`);
    return result.rowCount || 0;
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    totalEntries: number;
    expiredEntries: number;
    totalHits: number;
    avgHitsPerEntry: number;
  }> {
    const result = await this.pool.query(
      `
      SELECT 
        COUNT(*) as total_entries,
        COUNT(*) FILTER (WHERE expires_at < NOW()) as expired_entries,
        COALESCE(SUM(hit_count), 0) as total_hits,
        COALESCE(AVG(hit_count), 0) as avg_hits
      FROM evidence_cache
      `
    );

    const row = result.rows[0];
    return {
      totalEntries: parseInt(row.total_entries),
      expiredEntries: parseInt(row.expired_entries),
      totalHits: parseInt(row.total_hits),
      avgHitsPerEntry: parseFloat(row.avg_hits),
    };
  }

  /**
   * Get most frequently accessed entries
   */
  async getTopEntries(limit: number = 10): Promise<EvidenceCacheEntry[]> {
    const result = await this.pool.query(
      `
      SELECT 
        id, cache_key, evidence_bundle, created_at, expires_at,
        hit_count, last_accessed_at
      FROM evidence_cache
      WHERE expires_at > NOW()
      ORDER BY hit_count DESC
      LIMIT $1
      `,
      [limit]
    );

    return result.rows.map(row => ({
      id: row.id,
      cacheKey: row.cache_key,
      evidenceBundle: row.evidence_bundle,
      createdAt: row.created_at,
      expiresAt: row.expires_at,
      hitCount: row.hit_count,
      lastAccessedAt: row.last_accessed_at,
    }));
  }
}

