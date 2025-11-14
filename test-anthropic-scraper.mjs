#!/usr/bin/env node
/**
 * Test Anthropic pricing scraper
 */

// Import directly from source since it's bundled
import { scrapeAnthropicPricing } from './packages/paid-agent-mcp/src/utils/pricing-scraper.js';

console.log('🔍 Testing Anthropic Pricing Scraper...\n');

let pricing;
try {
  pricing = await scrapeAnthropicPricing();
} catch (error) {
  console.error('Error during scraping:', error);
  process.exit(1);
}

console.log('Pricing result:', pricing);

if (pricing && Object.keys(pricing).length > 0) {
  console.log('✅ Successfully scraped pricing:\n');
  
  for (const [modelId, data] of Object.entries(pricing)) {
    console.log(`${modelId}:`);
    console.log(`  Input:  $${data.cost_per_1k_input.toFixed(6)} / 1K tokens`);
    console.log(`  Output: $${data.cost_per_1k_output.toFixed(6)} / 1K tokens`);
    console.log(`  Source: ${data.source}`);
    console.log(`  Updated: ${new Date(data.last_updated).toISOString()}`);
    console.log();
  }
} else {
  console.log('❌ Failed to scrape pricing');
  process.exit(1);
}

