/**
 * Smart Caching Layer for RAD Crawler
 * 
 * Caches search results and frequently accessed data
 * to reduce database queries and improve response times.
 */

import NodeCache from 'node-cache';

// Cache instances
const searchCache = new NodeCache({ stdTTL: 300, checkperiod: 60 }); // 5 min TTL
const docCache = new NodeCache({ stdTTL: 600, checkperiod: 120 }); // 10 min TTL
const statsCache = new NodeCache({ stdTTL: 60, checkperiod: 30 }); // 1 min TTL

export interface CacheStats {
  searchHits: number;
  searchMisses: number;
  docHits: number;
  docMisses: number;
  statsHits: number;
  statsMisses: number;
}

const stats: CacheStats = {
  searchHits: 0,
  searchMisses: 0,
  docHits: 0,
  docMisses: 0,
  statsHits: 0,
  statsMisses: 0,
};

/**
 * Generate cache key for search query
 */
function searchKey(query: string, topK: number, semantic: boolean): string {
  return `search:${query}:${topK}:${semantic}`;
}

/**
 * Get cached search results
 */
export function getCachedSearch(query: string, topK: number, semantic: boolean): any | null {
  const key = searchKey(query, topK, semantic);
  const cached = searchCache.get(key);
  
  if (cached) {
    stats.searchHits++;
    return cached;
  }
  
  stats.searchMisses++;
  return null;
}

/**
 * Cache search results
 */
export function cacheSearch(query: string, topK: number, semantic: boolean, results: any): void {
  const key = searchKey(query, topK, semantic);
  searchCache.set(key, results);
}

/**
 * Get cached document
 */
export function getCachedDoc(docId: number): any | null {
  const key = `doc:${docId}`;
  const cached = docCache.get(key);
  
  if (cached) {
    stats.docHits++;
    return cached;
  }
  
  stats.docMisses++;
  return null;
}

/**
 * Cache document
 */
export function cacheDoc(docId: number, doc: any): void {
  const key = `doc:${docId}`;
  docCache.set(key, doc);
}

/**
 * Get cached stats
 */
export function getCachedStats(): any | null {
  const cached = statsCache.get('stats');
  
  if (cached) {
    stats.statsHits++;
    return cached;
  }
  
  stats.statsMisses++;
  return null;
}

/**
 * Cache stats
 */
export function cacheStats(data: any): void {
  statsCache.set('stats', data);
}

/**
 * Clear all caches
 */
export function clearAllCaches(): void {
  searchCache.flushAll();
  docCache.flushAll();
  statsCache.flushAll();
}

/**
 * Get cache statistics
 */
export function getCacheStats(): CacheStats & {
  searchCacheSize: number;
  docCacheSize: number;
  statsCacheSize: number;
  hitRate: number;
} {
  const totalHits = stats.searchHits + stats.docHits + stats.statsHits;
  const totalMisses = stats.searchMisses + stats.docMisses + stats.statsMisses;
  const total = totalHits + totalMisses;
  
  return {
    ...stats,
    searchCacheSize: searchCache.keys().length,
    docCacheSize: docCache.keys().length,
    statsCacheSize: statsCache.keys().length,
    hitRate: total > 0 ? (totalHits / total) * 100 : 0,
  };
}

