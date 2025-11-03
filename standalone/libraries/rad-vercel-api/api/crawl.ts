/**
 * POST /api/crawl
 * 
 * Create a new crawl job
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createCrawlJob } from '../lib/db-client.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { urls, max_depth = 3, max_pages = 200, allow = [], deny = [] } = req.body;
    
    // Validate URLs
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({ error: 'urls array is required and must not be empty' });
    }
    
    // Validate each URL
    for (const url of urls) {
      try {
        new URL(url);
      } catch {
        return res.status(400).json({ error: `Invalid URL: ${url}` });
      }
    }
    
    // Validate max_depth
    if (typeof max_depth !== 'number' || max_depth < 1 || max_depth > 10) {
      return res.status(400).json({ error: 'max_depth must be between 1 and 10' });
    }
    
    // Validate max_pages
    if (typeof max_pages !== 'number' || max_pages < 1 || max_pages > 5000) {
      return res.status(400).json({ error: 'max_pages must be between 1 and 5000' });
    }
    
    // Create job
    const job = await createCrawlJob({
      seedUrls: urls,
      maxDepth: max_depth,
      maxPages: max_pages,
      allowedDomains: allow,
      deniedPatterns: deny,
    });
    
    return res.status(201).json({
      job_id: job.job_id,
      status: job.state,
      created_at: job.created_at,
      params: job.params,
    });
    
  } catch (error: any) {
    console.error('Crawl error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
    });
  }
}

