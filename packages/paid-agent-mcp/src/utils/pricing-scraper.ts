/**
 * Live Pricing Scraper for Anthropic Claude
 * 
 * Uses Playwright to scrape https://claude.com/pricing#api
 * Returns pricing in the format expected by AnthropicMetricsAdapter
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

/**
 * Scrape live Anthropic pricing using Playwright
 * 
 * Avoids common gotchas:
 * - Uses waitUntil: 'networkidle' (not 'domcontentloaded')
 * - Text-driven selectors (not brittle CSS classes)
 * - No network intercepts needed (prices are in HTML)
 */
export async function scrapeAnthropicPricing(): Promise<PricingCache | null> {
  try {
    const { chromium } = await import('playwright');
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
    });

    try {
      // Navigate to pricing page with API section
      await page.goto('https://claude.com/pricing#api', {
        waitUntil: 'networkidle', // Wait for all network requests
        timeout: 15000,
      });

      // Wait for content to render (avoid domcontentloaded gotcha)
      await page.waitForTimeout(2000);

      // Parse DOM to extract pricing (text-driven, not brittle CSS selectors)
      const models = await page.evaluate(() => {
        const results: any[] = [];
        const headings = Array.from(document.querySelectorAll('h3'));

        for (const h of headings) {
          const modelName = h.textContent?.trim() ?? '';

          // Gather all sibling elements until next h3
          let textBlock = '';
          let node = h.nextElementSibling;
          while (node && node.tagName.toLowerCase() !== 'h3') {
            textBlock += '\n' + (node as HTMLElement).innerText;
            node = node.nextElementSibling;
          }

          // Only process if it has Input and Output (API model card)
          if (!/Input/i.test(textBlock) || !/Output/i.test(textBlock)) continue;

          const inputMatch = textBlock.match(/Input\s+([\$0-9.,]+\s*\/\s*MTok)/i);
          const outputMatch = textBlock.match(/Output\s+([\$0-9.,]+\s*\/\s*MTok)/i);

          results.push({
            model: modelName,
            input: inputMatch?.[1] ?? null,
            output: outputMatch?.[1] ?? null,
          });
        }

        return results;
      });

      await browser.close();

      // Convert to PricingCache format
      const pricing: PricingCache = {};

      for (const model of models) {
        const inputMatch = model.input?.match(/\$([0-9.]+)/);
        const outputMatch = model.output?.match(/\$([0-9.]+)/);

        if (!inputMatch || !outputMatch) continue;

        const inputCostPerMTok = parseFloat(inputMatch[1]);
        const outputCostPerMTok = parseFloat(outputMatch[1]);
        const inputCostPer1K = inputCostPerMTok / 1000; // Convert from per MTok to per 1K
        const outputCostPer1K = outputCostPerMTok / 1000;

        // Map model names to internal IDs
        if (model.model.includes('Sonnet 4')) {
          pricing['claude-3-5-sonnet-20241022'] = {
            cost_per_1k_input: inputCostPer1K,
            cost_per_1k_output: outputCostPer1K,
            last_updated: Date.now(),
            source: 'live',
          };
        } else if (model.model.includes('Haiku 4')) {
          pricing['claude-3-5-haiku-20241022'] = {
            cost_per_1k_input: inputCostPer1K,
            cost_per_1k_output: outputCostPer1K,
            last_updated: Date.now(),
            source: 'live',
          };
        } else if (model.model.includes('Opus 4')) {
          pricing['claude-3-opus-20240229'] = {
            cost_per_1k_input: inputCostPer1K,
            cost_per_1k_output: outputCostPer1K,
            last_updated: Date.now(),
            source: 'live',
          };
        }
      }

      return Object.keys(pricing).length > 0 ? pricing : null;
    } finally {
      await browser.close();
    }
  } catch (error) {
    console.error('[PRICING-SCRAPER] Failed to scrape Anthropic pricing:', error);
    return null;
  }
}

