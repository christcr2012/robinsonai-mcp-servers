/**
 * RAD Documents Client
 * Retrieves relevant documents and chunks from RAD Crawler index
 */

import { Pool } from 'pg';

const DEFAULT_RAD_DATABASE_URL = 'postgresql://neondb_owner:npg_dMv0ArX1TGYP@ep-broad-recipe-ae1wjh66.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require';

export interface RadDocument {
  id: string;
  externalId: string;
  docType: string;
  language?: string;
  sizeBytes: number;
  lastCrawledAt: Date;
  chunks: RadChunk[];
}

export interface RadChunk {
  id: string;
  chunkIndex: number;
  content: string;
  startLine?: number;
  endLine?: number;
  tokenCount?: number;
}

export interface RadSearchOptions {
  sourceId?: string;
  keywords?: string[];
  docType?: string;
  language?: string;
  limit?: number;
}

export class RadDocsClient {
  private pool: Pool;

  constructor(databaseUrl?: string) {
    this.pool = new Pool({
      connectionString: databaseUrl || process.env.RAD_DATABASE_URL || DEFAULT_RAD_DATABASE_URL,
    });
  }

  /**
   * Search for relevant documents and chunks
   * Uses basic SQL ILIKE search (v1 - embeddings can be added later)
   */
  async searchDocuments(options: RadSearchOptions): Promise<RadDocument[]> {
    const {
      sourceId,
      keywords = [],
      docType,
      language,
      limit = 10,
    } = options;

    try {
      // Build query
      let query = `
        SELECT 
          d.id,
          d.external_id,
          d.doc_type,
          d.language,
          d.size_bytes,
          d.last_crawled_at,
          json_agg(
            json_build_object(
              'id', c.id,
              'chunkIndex', c.chunk_index,
              'content', c.content,
              'startLine', c.start_line,
              'endLine', c.end_line,
              'tokenCount', c.token_count
            ) ORDER BY c.chunk_index
          ) as chunks
        FROM rad_documents d
        LEFT JOIN rad_chunks c ON d.id = c.document_id
        WHERE 1=1
      `;

      const values: any[] = [];
      let paramIndex = 1;

      // Filter by source
      if (sourceId) {
        query += ` AND d.source_id = $${paramIndex++}`;
        values.push(sourceId);
      }

      // Filter by doc type
      if (docType) {
        query += ` AND d.doc_type = $${paramIndex++}`;
        values.push(docType);
      }

      // Filter by language
      if (language) {
        query += ` AND d.language = $${paramIndex++}`;
        values.push(language);
      }

      // Keyword search (ILIKE on external_id and chunk content)
      if (keywords.length > 0) {
        const keywordConditions = keywords.map(keyword => {
          const condition = `(d.external_id ILIKE $${paramIndex} OR EXISTS (
            SELECT 1 FROM rad_chunks c2 
            WHERE c2.document_id = d.id 
            AND c2.content ILIKE $${paramIndex}
          ))`;
          values.push(`%${keyword}%`);
          paramIndex++;
          return condition;
        });
        query += ` AND (${keywordConditions.join(' OR ')})`;
      }

      query += `
        GROUP BY d.id, d.external_id, d.doc_type, d.language, d.size_bytes, d.last_crawled_at
        ORDER BY d.last_crawled_at DESC
        LIMIT $${paramIndex}
      `;
      values.push(limit);

      const result = await this.pool.query(query, values);

      return result.rows.map(row => ({
        id: row.id,
        externalId: row.external_id,
        docType: row.doc_type,
        language: row.language,
        sizeBytes: row.size_bytes,
        lastCrawledAt: new Date(row.last_crawled_at),
        chunks: row.chunks || [],
      }));
    } catch (error) {
      console.error('[RadDocsClient] Search failed:', error);
      return [];
    }
  }

  /**
   * Get documents by source ID
   */
  async getDocumentsBySource(sourceId: string, limit: number = 50): Promise<RadDocument[]> {
    return this.searchDocuments({ sourceId, limit });
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    await this.pool.end();
  }
}

