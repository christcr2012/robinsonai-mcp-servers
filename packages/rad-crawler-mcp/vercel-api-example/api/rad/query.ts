/**
 * Vercel API Route: /api/rad/query
 * Query the RAD index from anywhere
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import pg from 'pg';

const { Pool } = pg;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { q, top_k = 10, semantic = false } = req.body;

  if (!q || typeof q !== 'string') {
    return res.status(400).json({ error: 'Query (q) is required' });
  }

  const pool = new Pool({
    connectionString: process.env.NEON_DATABASE_URL,
    max: 1,
  });

  try {
    let results;

    if (semantic) {
      // For semantic search, you'd need to generate embedding first
      // This is a simplified version using FTS
      const { rows } = await pool.query(
        `SELECT 
           c.chunk_id, c.doc_id, c.text, c.meta,
           d.uri, d.title,
           ts_rank(c.ts, plainto_tsquery('english', $1)) AS score
         FROM chunks c
         JOIN documents d ON c.doc_id = d.doc_id
         WHERE c.ts @@ plainto_tsquery('english', $1)
         ORDER BY score DESC
         LIMIT $2`,
        [q, top_k]
      );

      results = rows.map(row => ({
        doc_id: row.doc_id,
        chunk_id: row.chunk_id,
        uri: row.uri,
        title: row.title,
        snippet: row.text.substring(0, 300),
        score: parseFloat(row.score),
      }));
    } else {
      // Full-text search
      const { rows } = await pool.query(
        `SELECT 
           c.chunk_id, c.doc_id, c.text, c.meta,
           d.uri, d.title,
           ts_rank(c.ts, plainto_tsquery('english', $1)) AS score
         FROM chunks c
         JOIN documents d ON c.doc_id = d.doc_id
         WHERE c.ts @@ plainto_tsquery('english', $1)
         ORDER BY score DESC
         LIMIT $2`,
        [q, top_k]
      );

      results = rows.map(row => ({
        doc_id: row.doc_id,
        chunk_id: row.chunk_id,
        uri: row.uri,
        title: row.title,
        snippet: row.text.substring(0, 300),
        score: parseFloat(row.score),
      }));
    }

    res.status(200).json({
      results,
      count: results.length,
      query: q,
      semantic,
    });
  } catch (error: any) {
    console.error('Query error:', error);
    res.status(500).json({ error: error.message });
  } finally {
    await pool.end();
  }
}

