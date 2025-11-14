/**
 * RAD Category Handlers
 * Implements RAD source and crawl management tools
 */

import { Pool } from 'pg';
import { RadCrawlerCore } from '@robinson_ai_systems/rad-crawler-core';

const DEFAULT_RAD_DATABASE_URL = 'postgresql://neondb_owner:npg_dMv0ArX1TGYP@ep-broad-recipe-ae1wjh66.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require';

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.RAD_DATABASE_URL || DEFAULT_RAD_DATABASE_URL,
    });
  }
  return pool;
}

export async function rad_register_source(args: {
  name: string;
  sourceType: 'git_repo' | 'filesystem' | 'web' | 'api';
  config: Record<string, any>;
  enabled?: boolean;
  metadata?: Record<string, any>;
}): Promise<{ ok: boolean; sourceId: string; message: string }> {
  const pool = getPool();

  try {
    const result = await pool.query(
      `
      INSERT INTO rad_sources (name, source_type, config, enabled, metadata)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
      `,
      [
        args.name,
        args.sourceType,
        JSON.stringify(args.config),
        args.enabled ?? true,
        JSON.stringify(args.metadata || {}),
      ]
    );

    return {
      ok: true,
      sourceId: result.rows[0].id,
      message: `Source "${args.name}" registered successfully`,
    };
  } catch (error) {
    return {
      ok: false,
      sourceId: '',
      message: `Failed to register source: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

export async function rad_list_sources(args?: {
  enabled?: boolean;
  sourceType?: string;
}): Promise<{
  ok: boolean;
  sources: Array<{
    id: string;
    name: string;
    sourceType: string;
    enabled: boolean;
    createdAt: string;
    lastCrawlAt?: string;
    totalCrawls: number;
    successfulCrawls: number;
  }>;
}> {
  const pool = getPool();

  try {
    let query = `
      SELECT
        s.id,
        s.name,
        s.source_type,
        s.enabled,
        s.created_at,
        MAX(c.started_at) as last_crawl_at,
        COUNT(DISTINCT c.id) as total_crawls,
        SUM(CASE WHEN c.status = 'completed' THEN 1 ELSE 0 END) as successful_crawls
      FROM rad_sources s
      LEFT JOIN rad_crawls c ON s.id = c.source_id
    `;

    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (args?.enabled !== undefined) {
      conditions.push(`s.enabled = $${paramIndex++}`);
      values.push(args.enabled);
    }

    if (args?.sourceType) {
      conditions.push(`s.source_type = $${paramIndex++}`);
      values.push(args.sourceType);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ` GROUP BY s.id, s.name, s.source_type, s.enabled, s.created_at ORDER BY s.created_at DESC`;

    const result = await pool.query(query, values);

    return {
      ok: true,
      sources: result.rows.map(row => ({
        id: row.id,
        name: row.name,
        sourceType: row.source_type,
        enabled: row.enabled,
        createdAt: row.created_at.toISOString(),
        lastCrawlAt: row.last_crawl_at?.toISOString(),
        totalCrawls: parseInt(row.total_crawls),
        successfulCrawls: parseInt(row.successful_crawls),
      })),
    };
  } catch (error) {
    return {
      ok: false,
      sources: [],
    };
  }
}

export async function rad_trigger_crawl(args: {
  sourceId: string;
  overrides?: Record<string, any>;
}): Promise<{
  ok: boolean;
  crawlId?: string;
  status?: string;
  message: string;
}> {
  try {
    const crawler = new RadCrawlerCore();
    const result = await crawler.runCrawl({
      sourceId: args.sourceId,
      overrides: args.overrides,
    });
    await crawler.close();

    return {
      ok: result.status === 'completed',
      crawlId: result.crawlId,
      status: result.status,
      message: result.status === 'completed'
        ? `Crawl completed: ${result.documentsProcessed} documents processed, ${result.chunksCreated} chunks created`
        : `Crawl ${result.status}: ${result.errorMessage || 'Unknown error'}`,
    };
  } catch (error) {
    return {
      ok: false,
      message: `Failed to trigger crawl: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

export async function rad_get_crawl_status(args: {
  crawlId: string;
}): Promise<{
  ok: boolean;
  crawl?: {
    crawlId: string;
    status: string;
    startedAt: string;
    completedAt?: string;
    documentsDiscovered: number;
    documentsProcessed: number;
    documentsFailed: number;
    chunksCreated: number;
    errorMessage?: string;
  };
  message?: string;
}> {
  try {
    const crawler = new RadCrawlerCore();
    const result = await crawler.getCrawlStatus(args.crawlId);
    await crawler.close();

    return {
      ok: true,
      crawl: {
        crawlId: result.crawlId,
        status: result.status,
        startedAt: result.startedAt.toISOString(),
        completedAt: result.completedAt?.toISOString(),
        documentsDiscovered: result.documentsDiscovered,
        documentsProcessed: result.documentsProcessed,
        documentsFailed: result.documentsFailed,
        chunksCreated: result.chunksCreated,
        errorMessage: result.errorMessage,
      },
    };
  } catch (error) {
    return {
      ok: false,
      message: `Failed to get crawl status: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

export async function rad_get_crawl_summary(args: {
  sourceId: string;
}): Promise<{
  ok: boolean;
  summary?: {
    sourceId: string;
    sourceName: string;
    totalDocuments: number;
    totalChunks: number;
    uniqueDocTypes: number;
    uniqueLanguages: number;
    totalSizeBytes: number;
    lastCrawledAt?: string;
    docTypeBreakdown: Array<{ docType: string; count: number }>;
    languageBreakdown: Array<{ language: string; count: number }>;
  };
  message?: string;
}> {
  const pool = getPool();

  try {
    // Get source info
    const sourceResult = await pool.query(
      `SELECT id, name FROM rad_sources WHERE id = $1`,
      [args.sourceId]
    );

    if (sourceResult.rows.length === 0) {
      return {
        ok: false,
        message: `Source ${args.sourceId} not found`,
      };
    }

    const source = sourceResult.rows[0];

    // Get summary stats
    const summaryResult = await pool.query(
      `
      SELECT
        COUNT(DISTINCT d.id) as total_documents,
        COUNT(DISTINCT d.doc_type) as unique_doc_types,
        COUNT(DISTINCT d.language) as unique_languages,
        SUM(d.size_bytes) as total_size_bytes,
        MAX(d.last_crawled_at) as last_crawled_at,
        COUNT(DISTINCT c.id) as total_chunks
      FROM rad_documents d
      LEFT JOIN rad_chunks c ON d.id = c.document_id
      WHERE d.source_id = $1
      `,
      [args.sourceId]
    );

    const summary = summaryResult.rows[0];

    // Get doc type breakdown
    const docTypeResult = await pool.query(
      `
      SELECT doc_type, COUNT(*) as count
      FROM rad_documents
      WHERE source_id = $1
      GROUP BY doc_type
      ORDER BY count DESC
      `,
      [args.sourceId]
    );

    // Get language breakdown
    const languageResult = await pool.query(
      `
      SELECT language, COUNT(*) as count
      FROM rad_documents
      WHERE source_id = $1 AND language IS NOT NULL
      GROUP BY language
      ORDER BY count DESC
      `,
      [args.sourceId]
    );

    return {
      ok: true,
      summary: {
        sourceId: args.sourceId,
        sourceName: source.name,
        totalDocuments: parseInt(summary.total_documents),
        totalChunks: parseInt(summary.total_chunks),
        uniqueDocTypes: parseInt(summary.unique_doc_types),
        uniqueLanguages: parseInt(summary.unique_languages),
        totalSizeBytes: parseInt(summary.total_size_bytes || 0),
        lastCrawledAt: summary.last_crawled_at?.toISOString(),
        docTypeBreakdown: docTypeResult.rows.map(row => ({
          docType: row.doc_type,
          count: parseInt(row.count),
        })),
        languageBreakdown: languageResult.rows.map(row => ({
          language: row.language,
          count: parseInt(row.count),
        })),
      },
    };
  } catch (error) {
    return {
      ok: false,
      message: `Failed to get crawl summary: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

export async function rad_preview_documents(args: {
  sourceId: string;
  docType?: string;
  language?: string;
  limit?: number;
}): Promise<{
  ok: boolean;
  documents?: Array<{
    id: string;
    externalId: string;
    docType: string;
    language?: string;
    sizeBytes: number;
    lastCrawledAt: string;
    chunkCount: number;
    sampleChunk?: string;
  }>;
  message?: string;
}> {
  const pool = getPool();

  try {
    let query = `
      SELECT
        d.id,
        d.external_id,
        d.doc_type,
        d.language,
        d.size_bytes,
        d.last_crawled_at,
        COUNT(c.id) as chunk_count,
        (SELECT content FROM rad_chunks WHERE document_id = d.id ORDER BY chunk_index LIMIT 1) as sample_chunk
      FROM rad_documents d
      LEFT JOIN rad_chunks c ON d.id = c.document_id
      WHERE d.source_id = $1
    `;

    const values: any[] = [args.sourceId];
    let paramIndex = 2;

    if (args.docType) {
      query += ` AND d.doc_type = $${paramIndex++}`;
      values.push(args.docType);
    }

    if (args.language) {
      query += ` AND d.language = $${paramIndex++}`;
      values.push(args.language);
    }

    query += ` GROUP BY d.id, d.external_id, d.doc_type, d.language, d.size_bytes, d.last_crawled_at`;
    query += ` ORDER BY d.last_crawled_at DESC`;
    query += ` LIMIT $${paramIndex}`;
    values.push(args.limit || 10);

    const result = await pool.query(query, values);

    return {
      ok: true,
      documents: result.rows.map(row => ({
        id: row.id,
        externalId: row.external_id,
        docType: row.doc_type,
        language: row.language,
        sizeBytes: row.size_bytes,
        lastCrawledAt: row.last_crawled_at.toISOString(),
        chunkCount: parseInt(row.chunk_count),
        sampleChunk: row.sample_chunk?.substring(0, 200),
      })),
    };
  } catch (error) {
    return {
      ok: false,
      message: `Failed to preview documents: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

