/**
 * Database client for RAD Crawler
 */

import pg from 'pg';
import { config } from './config.js';
import type { Job, Source, Document, Chunk, Policy, SearchResult, IndexStats } from './types.js';

const { Pool } = pg;

export class Database {
  private pool: pg.Pool;

  constructor() {
    this.pool = new Pool({
      connectionString: config.neonDatabaseUrl,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
  }

  async query(text: string, params?: any[]): Promise<pg.QueryResult> {
    return this.pool.query(text, params);
  }

  async close(): Promise<void> {
    await this.pool.end();
  }

  // ===== SOURCES =====

  async createSource(kind: 'web' | 'repo' | 'agent-log', uri: string, domain?: string, repo?: string): Promise<Source> {
    const result = await this.query(
      `INSERT INTO sources (kind, uri, domain, repo)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (kind, uri) DO UPDATE SET domain = $3, repo = $4
       RETURNING *`,
      [kind, uri, domain, repo]
    );
    return result.rows[0] as Source;
  }

  async getSource(sourceId: number): Promise<Source | null> {
    const result = await this.query('SELECT * FROM sources WHERE source_id = $1', [sourceId]);
    return (result.rows[0] as Source) || null;
  }

  // ===== DOCUMENTS =====

  async createDocument(sourceId: number, uri: string, title: string | undefined, lang: string | undefined, hashSha1: string): Promise<Document> {
    const result = await this.query(
      `INSERT INTO documents (source_id, uri, title, lang, hash_sha1, fetched_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (source_id, uri, hash_sha1) DO UPDATE
       SET updated_at = NOW(), is_active = TRUE
       RETURNING *`,
      [sourceId, uri, title, lang, hashSha1]
    );
    return result.rows[0] as Document;
  }

  async getDocument(docId: number): Promise<Document | null> {
    const result = await this.query('SELECT * FROM documents WHERE doc_id = $1', [docId]);
    return (result.rows[0] as Document) || null;
  }

  async getDocumentByHash(sourceId: number, uri: string, hashSha1: string): Promise<Document | null> {
    const result = await this.query(
      'SELECT * FROM documents WHERE source_id = $1 AND uri = $2 AND hash_sha1 = $3',
      [sourceId, uri, hashSha1]
    );
    return (result.rows[0] as Document) || null;
  }

  async saveDocBlob(docId: number, partIx: number, content: string): Promise<void> {
    await this.query(
      `INSERT INTO doc_blobs (doc_id, part_ix, content)
       VALUES ($1, $2, $3)
       ON CONFLICT (doc_id, part_ix) DO UPDATE SET content = $3`,
      [docId, partIx, content]
    );
  }

  async getDocBlobs(docId: number): Promise<string[]> {
    const result = await this.query(
      'SELECT content FROM doc_blobs WHERE doc_id = $1 ORDER BY part_ix',
      [docId]
    );
    return result.rows.map((r: any) => r.content);
  }

  // ===== CHUNKS =====

  async createChunk(docId: number, ix: number, text: string, embedding: number[] | null, meta: any): Promise<Chunk> {
    const result = await this.query(
      `INSERT INTO chunks (doc_id, ix, text, ts, embedding, meta)
       VALUES ($1, $2, $3, to_tsvector('english', $3), $4, $5)
       RETURNING chunk_id, doc_id, ix, text, meta`,
      [docId, ix, text, embedding ? JSON.stringify(embedding) : null, JSON.stringify(meta)]
    );
    return result.rows[0] as Chunk;
  }

  async searchFTS(query: string, topK: number = 10): Promise<SearchResult[]> {
    const result = await this.query(
      `SELECT
         c.chunk_id, c.doc_id, c.text, c.meta,
         d.uri, d.title,
         ts_rank(c.ts, plainto_tsquery('english', $1)) AS score
       FROM chunks c
       JOIN documents d ON c.doc_id = d.doc_id
       WHERE c.ts @@ plainto_tsquery('english', $1)
       ORDER BY score DESC
       LIMIT $2`,
      [query, topK]
    );

    return result.rows.map((row: any) => ({
      doc_id: row.doc_id,
      chunk_id: row.chunk_id,
      uri: row.uri,
      title: row.title,
      snippet: row.text.substring(0, 300),
      score: parseFloat(row.score),
      meta: row.meta,
    }));
  }

  async searchSemantic(embedding: number[], topK: number = 10): Promise<SearchResult[]> {
    const embeddingStr = `[${embedding.join(',')}]`;
    const result = await this.query(
      `SELECT
         c.chunk_id, c.doc_id, c.text, c.meta,
         d.uri, d.title,
         1 - (c.embedding <=> $1::vector) AS score
       FROM chunks c
       JOIN documents d ON c.doc_id = d.doc_id
       WHERE c.embedding IS NOT NULL
       ORDER BY c.embedding <=> $1::vector
       LIMIT $2`,
      [embeddingStr, topK]
    );

    return result.rows.map((row: any) => ({
      doc_id: row.doc_id,
      chunk_id: row.chunk_id,
      uri: row.uri,
      title: row.title,
      snippet: row.text.substring(0, 300),
      score: parseFloat(row.score),
      meta: row.meta,
    }));
  }

  // ===== JOBS =====

  async createJob(kind: 'crawl' | 'repo_ingest', params: any): Promise<Job> {
    const result = await this.query(
      `INSERT INTO jobs (kind, params, state)
       VALUES ($1, $2, 'queued')
       RETURNING *`,
      [kind, JSON.stringify(params)]
    );
    return this.deserializeJob(result.rows[0]);
  }

  async claimJob(): Promise<Job | null> {
    const result = await this.query(
      `UPDATE jobs
       SET state = 'running', started_at = NOW()
       WHERE job_id = (
         SELECT job_id FROM jobs
         WHERE state = 'queued'
         ORDER BY created_at
         LIMIT 1
         FOR UPDATE SKIP LOCKED
       )
       RETURNING *`
    );
    return result.rows[0] ? this.deserializeJob(result.rows[0]) : null;
  }

  async updateJobProgress(jobId: number, progress: any): Promise<void> {
    await this.query(
      'UPDATE jobs SET progress = $1 WHERE job_id = $2',
      [JSON.stringify(progress), jobId]
    );
  }

  async completeJob(jobId: number): Promise<void> {
    await this.query(
      `UPDATE jobs SET state = 'done', finished_at = NOW() WHERE job_id = $1`,
      [jobId]
    );
  }

  async failJob(jobId: number, error: string): Promise<void> {
    await this.query(
      `UPDATE jobs SET state = 'error', finished_at = NOW(), error = $1 WHERE job_id = $2`,
      [error, jobId]
    );
  }

  async getJob(jobId: number): Promise<Job | null> {
    const result = await this.query('SELECT * FROM jobs WHERE job_id = $1', [jobId]);
    return result.rows[0] ? this.deserializeJob(result.rows[0]) : null;
  }

  private deserializeJob(row: any): Job {
    return {
      ...row,
      params: typeof row.params === 'string' ? JSON.parse(row.params) : row.params,
      progress: row.progress && typeof row.progress === 'string' ? JSON.parse(row.progress) : row.progress,
    };
  }

  // ===== POLICY =====

  async createPolicy(allowlist: string[], denylist: string[], budgets: any): Promise<Policy> {
    const result = await this.query(
      `INSERT INTO policy (allowlist, denylist, budgets, active)
       VALUES ($1, $2, $3, TRUE)
       RETURNING *`,
      [allowlist, denylist, JSON.stringify(budgets)]
    );
    return this.deserializePolicy(result.rows[0]);
  }

  async getActivePolicy(): Promise<Policy | null> {
    const result = await this.query(
      'SELECT * FROM policy WHERE active = TRUE ORDER BY created_at DESC LIMIT 1'
    );
    return result.rows[0] ? this.deserializePolicy(result.rows[0]) : null;
  }

  private deserializePolicy(row: any): Policy {
    return {
      ...row,
      budgets: typeof row.budgets === 'string' ? JSON.parse(row.budgets) : row.budgets,
    };
  }

  // ===== STATS =====

  async getIndexStats(): Promise<IndexStats> {
    const [pagesResult, reposResult, chunksResult, lastCrawlResult, sourcesByKindResult] = await Promise.all([
      this.query(`SELECT COUNT(*) as count FROM documents WHERE is_active = TRUE`),
      this.query(`SELECT COUNT(*) as count FROM sources WHERE kind = 'repo'`),
      this.query(`SELECT COUNT(*) as count, SUM((meta->>'tokens')::int) as tokens FROM chunks`),
      this.query(`SELECT MAX(fetched_at) as max_fetched FROM documents`),
      this.query(`SELECT kind, COUNT(*) as count FROM sources GROUP BY kind`),
    ]);

    const sourcesByKind: Record<string, number> = {};
    sourcesByKindResult.rows.forEach((row: any) => {
      sourcesByKind[row.kind] = parseInt(row.count, 10);
    });

    return {
      pages: parseInt(pagesResult.rows[0]?.count || '0', 10),
      repos: parseInt(reposResult.rows[0]?.count || '0', 10),
      chunks: parseInt(chunksResult.rows[0]?.count || '0', 10),
      tokens: parseInt(chunksResult.rows[0]?.tokens || '0', 10),
      last_crawl: lastCrawlResult.rows[0]?.max_fetched,
      storage_mb: 0, // TODO: calculate from pg_total_relation_size
      sources_by_kind: sourcesByKind,
    };
  }
}

export const db = new Database();

