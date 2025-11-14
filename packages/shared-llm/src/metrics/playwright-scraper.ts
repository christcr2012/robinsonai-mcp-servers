/**
 * Playwright-based pricing scraper for JavaScript-rendered pages
 * Handles dynamic content that traditional fetch() cannot access
 */

import type { Browser, Page } from 'playwright';

interface ScrapedPricing {
  [model: string]: {
    inputCost: number;
    outputCost: number;
  };
}

export class PlaywrightPricingScraper {
  private browser: Browser | null = null;
  private page: Page | null = null;

  async init(): Promise<void> {
    if (this.browser) return;
    
    const { chromium } = await import('playwright');
    this.browser = await chromium.launch({ headless: true });
    this.page = await this.browser.newPage();
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }

  async scrapeAnthropicPricing(): Promise<ScrapedPricing | null> {
    try {
      await this.init();
      if (!this.page) return null;

      await this.page.goto('https://www.anthropic.com/pricing', {
        waitUntil: 'networkidle',
        timeout: 30000,
      });

      // Wait for pricing content to load
      await this.page.waitForTimeout(2000);

      // Extract pricing data from the rendered page
      const pricing = await this.page.evaluate(() => {
        const result: ScrapedPricing = {};
        
        // Look for pricing tables or sections
        const text = document.body.innerText;
        
        // Claude 3.5 Sonnet: $3 / MTok input, $15 / MTok output
        const sonnetMatch = text.match(/Sonnet.*?\$3.*?\$15/is) || 
                           text.match(/\$3.*?MTok.*?input.*?\$15.*?MTok.*?output/is);
        if (sonnetMatch) {
          result['claude-3-5-sonnet-20241022'] = {
            inputCost: 0.003,  // $3 / 1M tokens = $0.003 / 1K tokens
            outputCost: 0.015, // $15 / 1M tokens = $0.015 / 1K tokens
          };
        }

        // Claude 3.5 Haiku: $1 / MTok input, $5 / MTok output
        const haikuMatch = text.match(/Haiku.*?\$1.*?\$5/is) ||
                          text.match(/\$1.*?MTok.*?input.*?\$5.*?MTok.*?output/is);
        if (haikuMatch) {
          result['claude-3-5-haiku-20241022'] = {
            inputCost: 0.001,  // $1 / 1M tokens = $0.001 / 1K tokens
            outputCost: 0.005, // $5 / 1M tokens = $0.005 / 1K tokens
          };
        }

        // Claude 3 Opus: $15 / MTok input, $75 / MTok output
        const opusMatch = text.match(/Opus.*?\$15.*?\$75/is) ||
                         text.match(/\$15.*?MTok.*?input.*?\$75.*?MTok.*?output/is);
        if (opusMatch) {
          result['claude-3-opus-20240229'] = {
            inputCost: 0.015,  // $15 / 1M tokens = $0.015 / 1K tokens
            outputCost: 0.075, // $75 / 1M tokens = $0.075 / 1K tokens
          };
        }

        return result;
      });

      return Object.keys(pricing).length > 0 ? pricing : null;
    } catch (error) {
      console.error('[PLAYWRIGHT-SCRAPER] Anthropic scrape error:', error);
      return null;
    }
  }

  async scrapeMoonshotPricing(): Promise<ScrapedPricing | null> {
    try {
      await this.init();
      if (!this.page) return null;

      await this.page.goto('https://platform.moonshot.ai/', {
        waitUntil: 'networkidle',
        timeout: 30000,
      });

      await this.page.waitForTimeout(2000);

      const pricing = await this.page.evaluate(() => {
        const result: ScrapedPricing = {};
        const text = document.body.innerText;
        const CNY_TO_USD = 1 / 7.2;

        // Look for pricing in CNY (¥) or USD ($)
        // Moonshot v1-8k: typically ¥0.012 / 1K tokens
        const v1_8kMatch = text.match(/8k.*?[\$¥]0\.012/i) ||
                          text.match(/[\$¥]0\.012.*?8k/i);
        if (v1_8kMatch) {
          const costCNY = 0.012;
          const costUSD = costCNY * CNY_TO_USD;
          result['moonshot-v1-8k'] = {
            inputCost: costUSD,
            outputCost: costUSD,
          };
        }

        return result;
      });

      return Object.keys(pricing).length > 0 ? pricing : null;
    } catch (error) {
      console.error('[PLAYWRIGHT-SCRAPER] Moonshot scrape error:', error);
      return null;
    }
  }

  async scrapeVoyagePricing(): Promise<ScrapedPricing | null> {
    try {
      await this.init();
      if (!this.page) return null;

      await this.page.goto('https://docs.voyageai.com/docs/pricing', {
        waitUntil: 'networkidle',
        timeout: 30000,
      });

      await this.page.waitForTimeout(2000);

      const pricing = await this.page.evaluate(() => {
        const result: ScrapedPricing = {};
        const text = document.body.innerText;

        // Voyage-3: Look for pricing per million tokens
        const voyage3Match = text.match(/voyage-3[^-].*?\$0\.60/i) ||
                            text.match(/\$0\.60.*?voyage-3[^-]/i);
        if (voyage3Match) {
          result['voyage-3'] = {
            inputCost: 0.0006,  // $0.60 / 1M = $0.0006 / 1K
            outputCost: 0.0012, // Typically 2x for output
          };
        }

        return result;
      });

      return Object.keys(pricing).length > 0 ? pricing : null;
    } catch (error) {
      console.error('[PLAYWRIGHT-SCRAPER] Voyage scrape error:', error);
      return null;
    }
  }
}

