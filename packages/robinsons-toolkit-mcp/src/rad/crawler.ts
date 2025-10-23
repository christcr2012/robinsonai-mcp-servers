/**
 * Web crawler with governance and rate limiting
 */

import axios from 'axios';
import robotsParser from 'robots-parser';
import Bottleneck from 'bottleneck';
import { URL } from 'url';
import type { Policy, CrawlContext, ExtractedContent } from './types.js';
import { contentExtractor } from './extractor.js';
import { config } from './config.js';

export class WebCrawler {
  private rateLimiters: Map<string, Bottleneck> = new Map();
  private robotsCache: Map<string, any> = new Map();
  private userAgent = 'RAD-Crawler/1.0 (Robinson AI; +https://github.com/robinsonai)';

  /**
   * Check if URL is allowed by policy
   */
  isAllowed(url: string, policy: Policy): boolean {
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname;
      const path = urlObj.pathname;

      // Check allowlist
      if (policy.allowlist.length > 0) {
        const allowed = policy.allowlist.some(pattern => {
          return this.matchPattern(domain, pattern);
        });
        if (!allowed) return false;
      }

      // Check denylist
      if (policy.denylist.length > 0) {
        const denied = policy.denylist.some(pattern => {
          if (pattern.includes('*')) {
            return this.matchPattern(domain + path, pattern);
          }
          return this.matchPattern(domain, pattern);
        });
        if (denied) return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Match domain/path against pattern (supports wildcards)
   */
  private matchPattern(value: string, pattern: string): boolean {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*').replace(/\./g, '\\.') + '$');
    return regex.test(value);
  }

  /**
   * Check robots.txt
   */
  async checkRobots(url: string): Promise<boolean> {
    if (!config.respectRobotsTxt) return true;

    try {
      const urlObj = new URL(url);
      const robotsUrl = `${urlObj.protocol}//${urlObj.host}/robots.txt`;

      // Check cache
      if (this.robotsCache.has(robotsUrl)) {
        const robots = this.robotsCache.get(robotsUrl);
        return robots.isAllowed(url, this.userAgent);
      }

      // Fetch robots.txt
      const response = await axios.get(robotsUrl, {
        timeout: 5000,
        validateStatus: (status) => status === 200 || status === 404,
      });

      const robotsTxt = response.status === 200 ? response.data : '';
      const robots = robotsParser(robotsUrl, robotsTxt);
      this.robotsCache.set(robotsUrl, robots);

      return robots.isAllowed(url, this.userAgent);
    } catch (error) {
      // If we can't fetch robots.txt, allow by default
      return true;
    }
  }

  /**
   * Get or create rate limiter for domain
   */
  private getRateLimiter(domain: string, policy: Policy): Bottleneck {
    if (!this.rateLimiters.has(domain)) {
      const limiter = new Bottleneck({
        maxConcurrent: 1,
        minTime: Math.floor(60000 / policy.budgets.rate_per_domain), // Convert rate/min to ms between requests
      });
      this.rateLimiters.set(domain, limiter);
    }
    return this.rateLimiters.get(domain)!;
  }

  /**
   * Fetch and extract content from URL
   */
  async fetchPage(url: string, policy: Policy): Promise<ExtractedContent | null> {
    try {
      // Check policy
      if (!this.isAllowed(url, policy)) {
        console.log(`URL blocked by policy: ${url}`);
        return null;
      }

      // Check robots.txt
      const robotsAllowed = await this.checkRobots(url);
      if (!robotsAllowed) {
        console.log(`URL blocked by robots.txt: ${url}`);
        return null;
      }

      // Rate limit
      const urlObj = new URL(url);
      const limiter = this.getRateLimiter(urlObj.hostname, policy);

      const html = await limiter.schedule(async () => {
        const response = await axios.get(url, {
          headers: {
            'User-Agent': this.userAgent,
            'Accept': 'text/html,application/xhtml+xml',
          },
          timeout: 30000,
          maxRedirects: 5,
        });
        return response.data;
      });

      // Extract content
      const content = contentExtractor.extractFromHtml(html, url);
      return content;
    } catch (error: any) {
      console.error(`Failed to fetch ${url}:`, error.message);
      return null;
    }
  }

  /**
   * Extract links from content
   */
  extractLinks(content: ExtractedContent, baseUrl: string): string[] {
    const links: string[] = [];
    const baseUrlObj = new URL(baseUrl);

    for (const anchor of content.anchors) {
      try {
        // Resolve relative URLs
        const absoluteUrl = new URL(anchor, baseUrl).href;
        const linkUrlObj = new URL(absoluteUrl);

        // Only follow links on the same domain (or allowed domains)
        if (linkUrlObj.hostname === baseUrlObj.hostname) {
          // Skip non-HTML links
          if (!this.isHtmlLink(absoluteUrl)) continue;
          
          links.push(absoluteUrl);
        }
      } catch (error) {
        // Invalid URL, skip
      }
    }

    return [...new Set(links)]; // Dedupe
  }

  /**
   * Check if URL likely points to HTML content
   */
  private isHtmlLink(url: string): boolean {
    const urlObj = new URL(url);
    const path = urlObj.pathname.toLowerCase();
    
    // Skip common non-HTML extensions
    const skipExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.svg', '.css', '.js', '.json', '.xml', '.zip', '.tar', '.gz'];
    if (skipExtensions.some(ext => path.endsWith(ext))) {
      return false;
    }

    return true;
  }

  /**
   * Normalize URL (remove fragments, sort query params)
   */
  normalizeUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      urlObj.hash = ''; // Remove fragment
      
      // Sort query params for consistency
      const params = new URLSearchParams(urlObj.search);
      const sortedParams = new URLSearchParams([...params.entries()].sort());
      urlObj.search = sortedParams.toString();

      return urlObj.href;
    } catch (error) {
      return url;
    }
  }

  /**
   * Clear rate limiters (for cleanup)
   */
  clearRateLimiters(): void {
    this.rateLimiters.clear();
    this.robotsCache.clear();
  }
}

export const webCrawler = new WebCrawler();

