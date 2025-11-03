/**
 * POST /api/search
 * 
 * Search RAD index with hybrid search (FTS + semantic)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { hybridSearch, ftsSearch } from '../lib/db-client.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { q, top_k = 10, semantic = true } = req.body;
    
    // Validate query
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }
    
    if (q.trim().length === 0) {
      return res.status(400).json({ error: 'Query cannot be empty' });
    }
    
    // Validate top_k
    const topK = parseInt(top_k as string, 10);
    if (isNaN(topK) || topK < 1 || topK > 100) {
      return res.status(400).json({ error: 'top_k must be between 1 and 100' });
    }
    
    // Perform search
    const results = semantic 
      ? await hybridSearch(q, topK)
      : await ftsSearch(q, topK);
    
    return res.status(200).json({
      query: q,
      top_k: topK,
      semantic,
      results,
      count: results.length,
    });
    
  } catch (error: any) {
    console.error('Search error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
    });
  }
}

