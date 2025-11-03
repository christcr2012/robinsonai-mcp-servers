/**
 * GET /api/stats
 * 
 * Get index statistics and cache performance
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getIndexStats } from '../lib/db-client.js';
import { getCacheStats } from '../lib/cache.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const [indexStats, cacheStats] = await Promise.all([
      getIndexStats(),
      Promise.resolve(getCacheStats()),
    ]);
    
    return res.status(200).json({
      index: indexStats,
      cache: cacheStats,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error: any) {
    console.error('Stats error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
    });
  }
}

