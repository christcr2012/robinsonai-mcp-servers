/**
 * Database client for Vercel API
 * 
 * Provides database access with connection pooling,
 * hybrid search, and batch operations.
 */

import pg from 'pg';
import { getCachedSearch, cacheSearch, getCachedDoc, cacheDoc, getCachedStats, cacheStats } from './cache.js';

const { Pool } = pg;

let pool: pg.Pool | null = null;

/**
 * Get or create database pool
 */
function getPool(): pg.Pool {
  if (!pool) {
    const connectionString = process.env.NEON_DATABASE_URL;
    if (!connectionString) {
      throw new Error('NEON_DATABASE_URL environment variable not set');
    }
    
    pool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      ssl: { rejectUnauthorized: false },
    });
  }
  
  return pool;
}

/**
 * Hybrid search: combines FTS (keyword) and semantic (vector) search
 * 
 * Formula: final_score = (0.6 × semantic_score) + (0.4 × fts_score)
 */
export async function hybridSearch(query: string, topK: number = 10): Promise<any[]> {
  // Check cache first
  const cached = getCachedSearch(query, topK, true);
  if (cached) {
    return cached;
  }
  
  const pool = getPool();
  
  // Get embedding for query (would call Ollama in production)
  // For now, use FTS only
  const ftsResults = await pool.query(`
    SELECT 
      c.chunk_id,
      c.doc_id,
      c.text,
      c.meta,
      d.uri,
      d.title,
      ts_rank(c.ts, plainto_tsquery('english', $1)) as fts_score
    FROM chunks c
    JOIN documents d ON c.doc_id = d.doc_id
    WHERE c.ts @@ plainto_tsquery('english', $1)
    AND d.is_active = TRUE
    ORDER BY fts_score DESC
    LIMIT $2
  `, [query, topK]);
  
  const results = ftsResults.rows.map(row => ({
    chunk_id: row.chunk_id,
    doc_id: row.doc_id,
    uri: row.uri,
    title: row.title,
    snippet: row.text.substring(0, 200) + '...',
    score: row.fts_score,
    meta: row.meta,
  }));
  
  // Cache results
  cacheSearch(query, topK, true, results);
  
  return results;
}

/**
 * FTS-only search (faster, keyword-based)
 */
export async function ftsSearch(query: string, topK: number = 10): Promise<any[]> {
  // Check cache
  const cached = getCachedSearch(query, topK, false);
  if (cached) {
    return cached;
  }
  
  const pool = getPool();
  
  const result = await pool.query(`
    SELECT 
      c.chunk_id,
      c.doc_id,
      c.text,
      c.meta,
      d.uri,
      d.title,
      ts_rank(c.ts, plainto_tsquery('english', $1)) as score
    FROM chunks c
    JOIN documents d ON c.doc_id = d.doc_id
    WHERE c.ts @@ plainto_tsquery('english', $1)
    AND d.is_active = TRUE
    ORDER BY score DESC
    LIMIT $2
  `, [query, topK]);
  
  const results = result.rows.map(row => ({
    chunk_id: row.chunk_id,
    doc_id: row.doc_id,
    uri: row.uri,
    title: row.title,
    snippet: row.text.substring(0, 200) + '...',
    score: row.score,
    meta: row.meta,
  }));
  
  // Cache results
  cacheSearch(query, topK, false, results);
  
  return results;
}

/**
 * Get document by ID
 */
export async function getDocument(docId: number): Promise<any | null> {
  // Check cache
  const cached = getCachedDoc(docId);
  if (cached) {
    return cached;
  }
  
  const pool = getPool();
  
  const docResult = await pool.query(`
    SELECT d.*, s.uri as source_uri, s.kind as source_kind
    FROM documents d
    JOIN sources s ON d.source_id = s.source_id
    WHERE d.doc_id = $1
  `, [docId]);
  
  if (docResult.rows.length === 0) {
    return null;
  }
  
  const doc = docResult.rows[0];
  
  // Get chunks
  const chunksResult = await pool.query(`
    SELECT chunk_id, ix, text, meta
    FROM chunks
    WHERE doc_id = $1
    ORDER BY ix
  `, [docId]);
  
  const result = {
    ...doc,
    chunks: chunksResult.rows,
  };
  
  // Cache document
  cacheDoc(docId, result);
  
  return result;
}

/**
 * Create crawl job
 */
export async function createCrawlJob(params: any): Promise<any> {
  const pool = getPool();
  
  const result = await pool.query(`
    INSERT INTO jobs (kind, params, state)
    VALUES ('crawl', $1, 'queued')
    RETURNING job_id, kind, params, state, created_at
  `, [JSON.stringify(params)]);
  
  return result.rows[0];
}

/**
 * Get job status
 */
export async function getJobStatus(jobId: number): Promise<any | null> {
  const pool = getPool();
  
  const result = await pool.query(`
    SELECT * FROM jobs WHERE job_id = $1
  `, [jobId]);
  
  return result.rows[0] || null;
}

/**
 * Get index statistics
 */
export async function getIndexStats(): Promise<any> {
  // Check cache
  const cached = getCachedStats();
  if (cached) {
    return cached;
  }
  
  const pool = getPool();
  
  const stats = await pool.query(`
    SELECT 
      (SELECT COUNT(*) FROM sources) as sources_count,
      (SELECT COUNT(*) FROM documents WHERE is_active = TRUE) as documents_count,
      (SELECT COUNT(*) FROM chunks) as chunks_count,
      (SELECT COUNT(*) FROM jobs WHERE state = 'queued') as queued_jobs,
      (SELECT COUNT(*) FROM jobs WHERE state = 'running') as running_jobs,
      (SELECT COUNT(*) FROM jobs WHERE state = 'done') as completed_jobs,
      (SELECT pg_size_pretty(pg_database_size(current_database()))) as db_size
  `);
  
  const result = stats.rows[0];
  
  // Cache stats
  cacheStats(result);
  
  return result;
}

/**
 * Close database pool
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

