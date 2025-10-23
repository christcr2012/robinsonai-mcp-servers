/**
 * GET /api/status?job_id=123
 * 
 * Get job status and progress
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getJobStatus } from '../lib/db-client.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { job_id } = req.query;
    
    // Validate job_id
    if (!job_id) {
      return res.status(400).json({ error: 'job_id query parameter is required' });
    }
    
    const jobId = parseInt(job_id as string, 10);
    if (isNaN(jobId)) {
      return res.status(400).json({ error: 'job_id must be a number' });
    }
    
    // Get job status
    const job = await getJobStatus(jobId);
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    return res.status(200).json({
      job_id: job.job_id,
      kind: job.kind,
      state: job.state,
      progress: job.progress,
      created_at: job.created_at,
      started_at: job.started_at,
      finished_at: job.finished_at,
      error: job.error,
      params: job.params,
    });
    
  } catch (error: any) {
    console.error('Status error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
    });
  }
}

