/**
 * RAD Crawler Core Implementation
 * Crawls repositories and filesystems, indexes documents and chunks
 */

import { Pool, type PoolClient } from 'pg';
import { createHash } from 'crypto';
import fg from 'fast-glob';
import { simpleGit, type SimpleGit } from 'simple-git';
import { readFileSync, mkdirSync, existsSync } from 'fs';
import { join, relative, extname, basename } from 'path';
import { tmpdir } from 'os';
import type {
  RadCrawlerConfig,
  RunCrawlOptions,
  CrawlResult,
  RadSource,
  RadCrawl,
  DiscoveredFile,
  ParsedDocument,
  DocumentChunk,
  CrawlStats,
} from './types.js';

const DEFAULT_RAD_DATABASE_URL = 'postgresql://neondb_owner:npg_dMv0ArX1TGYP@ep-broad-recipe-ae1wjh66.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require';

export class RadCrawlerCore {
  private pool: Pool;
  private config: RadCrawlerConfig;

  constructor(config?: Partial<RadCrawlerConfig>) {
    this.config = {
      databaseUrl: config?.databaseUrl || process.env.RAD_DATABASE_URL || DEFAULT_RAD_DATABASE_URL,
      tempDir: config?.tempDir || join(tmpdir(), 'rad-crawler'),
      maxConcurrency: config?.maxConcurrency || 10,
      chunkSize: config?.chunkSize || 100, // lines per chunk
      chunkOverlap: config?.chunkOverlap || 10, // lines of overlap
    };

    this.pool = new Pool({
      connectionString: this.config.databaseUrl,
    });
  }

  /**
   * Run a crawl for a given source
   */
  async runCrawl(options: RunCrawlOptions): Promise<CrawlResult> {
    const client = await this.pool.connect();

    try {
      // Get source
      const source = await this.getSource(client, options.sourceId);
      if (!source) {
        throw new Error(`Source ${options.sourceId} not found`);
      }

      if (!source.enabled) {
        throw new Error(`Source ${options.sourceId} is disabled`);
      }

      // Create crawl record
      const crawl = await this.createCrawl(client, options.sourceId);
      const stats: CrawlStats = {
        discovered: 0,
        processed: 0,
        failed: 0,
        chunks: 0,
      };

      try {
        // Update status to running
        await this.updateCrawlStatus(client, crawl.id, 'running');

        // Discover files
        const files = await this.discoverFiles(source, options);
        stats.discovered = files.length;
        await this.updateCrawlStats(client, crawl.id, stats);

        // Process files
        for (const file of files) {
          try {
            const doc = await this.parseDocument(file, source);
            const chunks = await this.chunkDocument(doc);

            await this.persistDocument(client, doc, crawl.id, source.id);
            await this.persistChunks(client, doc.externalId, chunks, source.id);

            stats.processed++;
            stats.chunks += chunks.length;
          } catch (error) {
            console.error(`Failed to process ${file.path}:`, error);
            stats.failed++;
          }

          // Update stats periodically
          if (stats.processed % 10 === 0) {
            await this.updateCrawlStats(client, crawl.id, stats);
          }
        }

        // Mark as completed
        await this.updateCrawlStatus(client, crawl.id, 'completed', stats);

        return {
          crawlId: crawl.id,
          status: 'completed',
          startedAt: crawl.startedAt,
          completedAt: new Date(),
          documentsDiscovered: stats.discovered,
          documentsProcessed: stats.processed,
          documentsFailed: stats.failed,
          chunksCreated: stats.chunks,
        };

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        await this.updateCrawlStatus(client, crawl.id, 'failed', stats, errorMessage);

        return {
          crawlId: crawl.id,
          status: 'failed',
          startedAt: crawl.startedAt,
          completedAt: new Date(),
          documentsDiscovered: stats.discovered,
          documentsProcessed: stats.processed,
          documentsFailed: stats.failed,
          chunksCreated: stats.chunks,
          errorMessage,
        };
      }

    } finally {
      client.release();
    }
  }

  /**
   * Get crawl status
   */
  async getCrawlStatus(crawlId: string): Promise<CrawlResult> {
    const result = await this.pool.query(
      `SELECT * FROM rad_crawls WHERE id = $1`,
      [crawlId]
    );

    if (result.rows.length === 0) {
      throw new Error(`Crawl ${crawlId} not found`);
    }

    const row = result.rows[0];
    return {
      crawlId: row.id,
      status: row.status,
      startedAt: row.started_at,
      completedAt: row.completed_at,
      documentsDiscovered: row.documents_discovered,
      documentsProcessed: row.documents_processed,
      documentsFailed: row.documents_failed,
      chunksCreated: row.chunks_created,
      errorMessage: row.error_message,
    };
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    await this.pool.end();
  }

  // ============================================================================
  // Private helper methods
  // ============================================================================

  private async getSource(client: PoolClient, sourceId: string): Promise<RadSource | null> {
    const result = await client.query(
      `SELECT * FROM rad_sources WHERE id = $1`,
      [sourceId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      name: row.name,
      sourceType: row.source_type,
      config: row.config,
      enabled: row.enabled,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      metadata: row.metadata,
    };
  }

  private async createCrawl(client: PoolClient, sourceId: string): Promise<RadCrawl> {
    const result = await client.query(
      `INSERT INTO rad_crawls (source_id, status) VALUES ($1, $2) RETURNING *`,
      [sourceId, 'pending']
    );

    const row = result.rows[0];
    return {
      id: row.id,
      sourceId: row.source_id,
      status: row.status,
      startedAt: row.started_at,
      completedAt: row.completed_at,
      documentsDiscovered: row.documents_discovered,
      documentsProcessed: row.documents_processed,
      documentsFailed: row.documents_failed,
      chunksCreated: row.chunks_created,
      errorMessage: row.error_message,
      metadata: row.metadata,
    };
  }

  private async updateCrawlStatus(
    client: PoolClient,
    crawlId: string,
    status: RadCrawl['status'],
    stats?: CrawlStats,
    errorMessage?: string
  ): Promise<void> {
    const updates: string[] = ['status = $2'];
    const values: any[] = [crawlId, status];
    let paramIndex = 3;

    if (status === 'completed' || status === 'failed') {
      updates.push(`completed_at = NOW()`);
    }

    if (stats) {
      updates.push(`documents_discovered = $${paramIndex++}`);
      values.push(stats.discovered);
      updates.push(`documents_processed = $${paramIndex++}`);
      values.push(stats.processed);
      updates.push(`documents_failed = $${paramIndex++}`);
      values.push(stats.failed);
      updates.push(`chunks_created = $${paramIndex++}`);
      values.push(stats.chunks);
    }

    if (errorMessage) {
      updates.push(`error_message = $${paramIndex++}`);
      values.push(errorMessage);
    }

    await client.query(
      `UPDATE rad_crawls SET ${updates.join(', ')} WHERE id = $1`,
      values
    );
  }

  private async updateCrawlStats(
    client: PoolClient,
    crawlId: string,
    stats: CrawlStats
  ): Promise<void> {
    await client.query(
      `UPDATE rad_crawls SET
        documents_discovered = $2,
        documents_processed = $3,
        documents_failed = $4,
        chunks_created = $5
      WHERE id = $1`,
      [crawlId, stats.discovered, stats.processed, stats.failed, stats.chunks]
    );
  }


  private async discoverFiles(source: RadSource, options: RunCrawlOptions): Promise<DiscoveredFile[]> {
    const { discoverFiles } = await import('./file-processor.js');
    return discoverFiles(source, options);
  }

  private async parseDocument(file: DiscoveredFile, source: RadSource): Promise<ParsedDocument> {
    const { parseDocument } = await import('./file-processor.js');
    return parseDocument(file, source);
  }

  private async chunkDocument(doc: ParsedDocument): Promise<DocumentChunk[]> {
    const { chunkDocument } = await import('./file-processor.js');
    return chunkDocument(doc, this.config.chunkSize, this.config.chunkOverlap);
  }

  private async persistDocument(
    client: PoolClient,
    doc: ParsedDocument,
    crawlId: string,
    sourceId: string
  ): Promise<void> {
    await client.query(
      `
      INSERT INTO rad_documents (source_id, crawl_id, external_id, doc_type, language, content_hash, size_bytes)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (source_id, external_id)
      DO UPDATE SET
        crawl_id = EXCLUDED.crawl_id,
        doc_type = EXCLUDED.doc_type,
        language = EXCLUDED.language,
        content_hash = EXCLUDED.content_hash,
        size_bytes = EXCLUDED.size_bytes,
        last_crawled_at = NOW(),
        metadata = EXCLUDED.metadata
      `,
      [sourceId, crawlId, doc.externalId, doc.docType, doc.language, doc.contentHash, doc.sizeBytes]
    );
  }

  private async persistChunks(
    client: PoolClient,
    externalId: string,
    chunks: DocumentChunk[],
    sourceId: string
  ): Promise<void> {
    // Get document ID
    const docResult = await client.query(
      `SELECT id FROM rad_documents WHERE source_id = $1 AND external_id = $2`,
      [sourceId, externalId]
    );

    if (docResult.rows.length === 0) {
      throw new Error(`Document not found: ${externalId}`);
    }

    const documentId = docResult.rows[0].id;

    // Delete existing chunks
    await client.query(
      `DELETE FROM rad_chunks WHERE document_id = $1`,
      [documentId]
    );

    // Insert new chunks
    for (const chunk of chunks) {
      await client.query(
        `
        INSERT INTO rad_chunks (document_id, chunk_index, content, start_line, end_line, token_count, metadata)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        `,
        [
          documentId,
          chunk.chunkIndex,
          chunk.content,
          chunk.startLine,
          chunk.endLine,
          chunk.tokenCount,
          JSON.stringify(chunk.metadata || {}),
        ]
      );
    }
  }
}
