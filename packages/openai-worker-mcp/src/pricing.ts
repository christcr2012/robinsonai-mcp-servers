/**
 * Live OpenAI Pricing Fetcher
 * 
 * Fetches current pricing from OpenAI website with fallback to hardcoded values
 * Updates pricing automatically every 24 hours
 */

interface ModelPricing {
  cost_per_1k_input: number;
  cost_per_1k_output: number;
  last_updated: number;
  source: 'live' | 'fallback';
}

interface PricingCache {
  [model: string]: ModelPricing;
}

// Fallback pricing (as of 2025-10-22) - ALWAYS WORKS
const FALLBACK_PRICING: PricingCache = {
  'gpt-4o-mini': {
    cost_per_1k_input: 0.00015,
    cost_per_1k_output: 0.0006,
    last_updated: Date.now(),
    source: 'fallback'
  },
  'gpt-4o': {
    cost_per_1k_input: 0.0025,
    cost_per_1k_output: 0.01,
    last_updated: Date.now(),
    source: 'fallback'
  },
  'o1-mini': {
    cost_per_1k_input: 0.003,
    cost_per_1k_output: 0.012,
    last_updated: Date.now(),
    source: 'fallback'
  },
  'o1': {
    cost_per_1k_input: 0.015,
    cost_per_1k_output: 0.06,
    last_updated: Date.now(),
    source: 'fallback'
  }
};

let pricingCache: PricingCache = { ...FALLBACK_PRICING };
let lastFetchTime = 0;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Fetch live pricing from OpenAI website
 * Falls back to hardcoded values if fetch fails
 */
async function fetchLivePricing(): Promise<PricingCache | null> {
  try {
    console.error('[Pricing] Attempting to fetch live pricing from OpenAI...');
    
    // Try to fetch pricing page
    const response = await fetch('https://openai.com/api/pricing/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });
    
    if (!response.ok) {
      console.error('[Pricing] Failed to fetch pricing page:', response.status);
      return null;
    }

    const html = await response.text();
    const pricing: PricingCache = {};
    
    // Simple regex-based extraction
    // Looking for patterns like: "$0.150 / 1M input tokens"
    // This converts to: $0.00015 per 1K tokens
    
    const models = [
      { name: 'gpt-4o-mini', patterns: ['gpt-4o-mini', 'GPT-4o mini'] },
      { name: 'gpt-4o', patterns: ['gpt-4o', 'GPT-4o'] },
      { name: 'o1-mini', patterns: ['o1-mini', 'O1-mini'] },
      { name: 'o1', patterns: ['o1', 'O1'] }
    ];
    
    for (const model of models) {
      // Find section for this model
      let modelSection = '';
      for (const pattern of model.patterns) {
        const idx = html.indexOf(pattern);
        if (idx !== -1) {
          modelSection = html.substring(idx, idx + 1000);
          break;
        }
      }
      
      if (!modelSection) continue;
      
      // Extract input and output pricing
      // Pattern: $X.XXX / 1M tokens
      const inputMatch = modelSection.match(/\$([0-9.]+)\s*\/\s*1M\s+input/i);
      const outputMatch = modelSection.match(/\$([0-9.]+)\s*\/\s*1M\s+output/i);
      
      if (inputMatch && outputMatch) {
        const inputCost = parseFloat(inputMatch[1]) / 1000; // Convert to per 1K
        const outputCost = parseFloat(outputMatch[1]) / 1000;
        
        // Sanity check: pricing should be reasonable
        if (inputCost > 0 && inputCost < 1 && outputCost > 0 && outputCost < 1) {
          pricing[model.name] = {
            cost_per_1k_input: inputCost,
            cost_per_1k_output: outputCost,
            last_updated: Date.now(),
            source: 'live'
          };
          console.error(`[Pricing] Found live pricing for ${model.name}: $${inputCost}/1K in, $${outputCost}/1K out`);
        }
      }
    }
    
    // Return parsed pricing if we got at least one model
    if (Object.keys(pricing).length > 0) {
      console.error(`[Pricing] Successfully fetched live pricing for ${Object.keys(pricing).length} models`);
      return pricing;
    }
    
    console.error('[Pricing] Could not parse pricing from HTML');
    return null;
    
  } catch (error: any) {
    console.error('[Pricing] Error fetching live pricing:', error.message);
    return null;
  }
}

/**
 * Get pricing for a model (with auto-refresh)
 */
export async function getModelPricing(model: string): Promise<ModelPricing> {
  const now = Date.now();
  
  // Refresh pricing if cache is stale (but don't block on it)
  if (now - lastFetchTime > CACHE_DURATION) {
    console.error('[Pricing] Cache is stale, attempting refresh...');
    
    // Try to fetch live pricing (non-blocking)
    fetchLivePricing().then(livePricing => {
      if (livePricing && Object.keys(livePricing).length > 0) {
        // Merge live pricing with fallback (keep fallback for models we didn't fetch)
        pricingCache = { ...FALLBACK_PRICING, ...livePricing };
        lastFetchTime = now;
        console.error('[Pricing] Successfully updated pricing from live source');
      } else {
        console.error('[Pricing] Live fetch failed, using fallback pricing');
        lastFetchTime = now; // Don't retry immediately
      }
    }).catch(err => {
      console.error('[Pricing] Error during async pricing fetch:', err.message);
      lastFetchTime = now;
    });
  }
  
  // Return cached pricing or fallback
  if (pricingCache[model]) {
    return pricingCache[model];
  }
  
  // Model not found, return conservative fallback
  console.error(`[Pricing] Model ${model} not found in cache, using conservative fallback`);
  return {
    cost_per_1k_input: 0.01,
    cost_per_1k_output: 0.03,
    last_updated: Date.now(),
    source: 'fallback'
  };
}

/**
 * Get all cached pricing
 */
export function getAllPricing(): PricingCache {
  return { ...pricingCache };
}

/**
 * Force refresh pricing (synchronous - waits for result)
 */
export async function refreshPricing(): Promise<boolean> {
  console.error('[Pricing] Force refreshing pricing...');
  const livePricing = await fetchLivePricing();
  
  if (livePricing && Object.keys(livePricing).length > 0) {
    pricingCache = { ...FALLBACK_PRICING, ...livePricing };
    lastFetchTime = Date.now();
    console.error('[Pricing] Successfully refreshed pricing');
    return true;
  }
  
  console.error('[Pricing] Failed to refresh pricing, keeping current cache');
  return false;
}

/**
 * Get pricing info (for diagnostics)
 */
export function getPricingInfo() {
  return {
    cache: pricingCache,
    last_updated: lastFetchTime > 0 ? new Date(lastFetchTime).toISOString() : 'never',
    cache_age_hours: lastFetchTime > 0 ? (Date.now() - lastFetchTime) / (1000 * 60 * 60) : 0,
    cache_expires_in_hours: Math.max(0, (CACHE_DURATION - (Date.now() - lastFetchTime)) / (1000 * 60 * 60)),
    models_cached: Object.keys(pricingCache).length,
    sources: Object.entries(pricingCache).reduce((acc, [model, pricing]) => {
      acc[model] = pricing.source;
      return acc;
    }, {} as { [key: string]: string })
  };
}

/**
 * Initialize pricing (fetch on startup, non-blocking)
 */
export async function initializePricing() {
  console.error('[Pricing] Initializing pricing system...');
  
  // Start with fallback
  pricingCache = { ...FALLBACK_PRICING };
  
  // Try to fetch live pricing (non-blocking)
  fetchLivePricing().then(livePricing => {
    if (livePricing && Object.keys(livePricing).length > 0) {
      pricingCache = { ...FALLBACK_PRICING, ...livePricing };
      lastFetchTime = Date.now();
      console.error('[Pricing] Initialized with live pricing');
    } else {
      console.error('[Pricing] Using fallback pricing (live fetch failed)');
    }
  }).catch(err => {
    console.error('[Pricing] Error during initialization:', err.message);
    console.error('[Pricing] Using fallback pricing');
  });
}

