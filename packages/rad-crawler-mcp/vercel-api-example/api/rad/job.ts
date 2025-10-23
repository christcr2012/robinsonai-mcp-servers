/**
 * Vercel API Route: /api/rad/job
 * Create crawl or repo ingest jobs
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import pg from 'pg';

const { Pool } = pg;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { kind, params } = req.body;

  if (!kind || !params) {
    return res.status(400).json({ error: 'kind and params are required' });
  }

  if (!['crawl', 'repo_ingest'].includes(kind)) {
    return res.status(400).json({ error: 'kind must be crawl or repo_ingest' });
  }

  const pool = new Pool({
    connectionString: process.env.NEON_DATABASE_URL,
    max: 1,
  });

  try {
    const { rows } = await pool.query(
      `INSERT INTO jobs (kind, params, state)
       VALUES ($1, $2, 'queued')
       RETURNING job_id, kind, state, created_at`,
      [kind, JSON.stringify(params)]
    );

    const job = rows[0];

    res.status(201).json({
      job_id: job.job_id,
      kind: job.kind,
      state: job.state,
      created_at: job.created_at,
    });
  } catch (error: any) {
    console.error('Job creation error:', error);
    res.status(500).json({ error: error.message });
  } finally {
    await pool.end();
  }
}

