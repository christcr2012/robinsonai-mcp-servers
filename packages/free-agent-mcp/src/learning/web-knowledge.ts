#!/usr/bin/env node
/**
 * Web Knowledge Access - Safe, useful web access for agents
 * 
 * Features:
 * 1. Whitelist domains (official docs, standards, vendor SDKs)
 * 2. Cache fetched pages (SQLite web_cache table)
 * 3. Summarize + cite (store 1-3 paragraph extracts)
 * 4. Integration with Design Card web:on flag
 * 
 * When to use:
 * - New library/framework is referenced
 * - Repo imports a symbol that isn't defined locally
 * - Design Card explicitly permits "web:on"
 */

import { ExperienceDB } from './experience-db.js';
import { JSDOM } from 'jsdom';

export interface WebKnowledgeConfig {
  whitelistedDomains: string[];
  maxCacheAgeDays: number;
  summarizeLength: number; // Target paragraph count
}

export interface WebPage {
  url: string;
  title: string;
  summary: string;
  fullText: string;
  fetchedAt: Date;
}

export class WebKnowledge {
  private db: ExperienceDB;
  private config: WebKnowledgeConfig;

  // Default whitelist: official docs, standards, vendor SDKs
  private static readonly DEFAULT_WHITELIST = [
    // JavaScript/TypeScript
    'developer.mozilla.org',
    'www.typescriptlang.org',
    'nodejs.org',
    'react.dev',
    'nextjs.org',
    'vuejs.org',
    'angular.io',
    'svelte.dev',

    // Python
    'docs.python.org',
    'docs.djangoproject.com',
    'flask.palletsprojects.com',
    'fastapi.tiangolo.com',
    'numpy.org',
    'pandas.pydata.org',

    // Go
    'go.dev',
    'pkg.go.dev',

    // Rust
    'doc.rust-lang.org',
    'docs.rs',

    // Java
    'docs.oracle.com',
    'spring.io',

    // Databases
    'www.postgresql.org',
    'dev.mysql.com',
    'www.mongodb.com',
    'redis.io',

    // Cloud/Infrastructure
    'docs.aws.amazon.com',
    'cloud.google.com',
    'learn.microsoft.com',
    'vercel.com',

    // Standards
    'www.w3.org',
    'tc39.es',
    'github.com', // For official repos only
  ];

  constructor(repoRoot: string, config?: Partial<WebKnowledgeConfig>) {
    this.db = new ExperienceDB(repoRoot);
    this.config = {
      whitelistedDomains: config?.whitelistedDomains || WebKnowledge.DEFAULT_WHITELIST,
      maxCacheAgeDays: config?.maxCacheAgeDays || 7,
      summarizeLength: config?.summarizeLength || 3, // 3 paragraphs
    };
  }

  /**
   * Check if URL is whitelisted
   */
  isWhitelisted(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return this.config.whitelistedDomains.some(domain => 
        urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`)
      );
    } catch {
      return false;
    }
  }

  /**
   * Fetch and cache a web page
   */
  async fetchPage(url: string, forceRefresh = false): Promise<WebPage | null> {
    // Check whitelist
    if (!this.isWhitelisted(url)) {
      console.warn(`⚠️  URL not whitelisted: ${url}`);
      return null;
    }

    // Check cache
    if (!forceRefresh) {
      const cached = this.db.getCachedWebPage(url);
      if (cached) {
        const age = Date.now() - new Date(cached.fetched_at!).getTime();
        const maxAge = this.config.maxCacheAgeDays * 24 * 60 * 60 * 1000;
        if (age < maxAge) {
          console.log(`✅ Using cached page: ${url}`);
          return this.parseHTML(url, cached.html);
        }
      }
    }

    // Fetch from web
    console.log(`🌐 Fetching: ${url}`);
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; AgentBot/1.0)',
        },
      });

      if (!response.ok) {
        console.error(`❌ Failed to fetch ${url}: ${response.status} ${response.statusText}`);
        return null;
      }

      const html = await response.text();

      // Cache the page
      this.db.cacheWebPage(url, html);

      return this.parseHTML(url, html);
    } catch (error) {
      console.error(`❌ Error fetching ${url}:`, error);
      return null;
    }
  }

  /**
   * Parse HTML and extract text
   */
  private parseHTML(url: string, html: string): WebPage {
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // Extract title
    const title = document.querySelector('title')?.textContent || url;

    // Extract main content (try common selectors)
    const contentSelectors = [
      'main',
      'article',
      '.content',
      '.documentation',
      '.docs',
      '#content',
      'body',
    ];

    let contentElement: Element | null = null;
    for (const selector of contentSelectors) {
      contentElement = document.querySelector(selector);
      if (contentElement) break;
    }

    // Extract text
    const fullText = contentElement?.textContent || document.body.textContent || '';

    // Clean up whitespace
    const cleanText = fullText
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .trim();

    // Generate summary (first N paragraphs)
    const paragraphs = cleanText.split('\n').filter(p => p.trim().length > 50);
    const summary = paragraphs.slice(0, this.config.summarizeLength).join('\n\n');

    return {
      url,
      title,
      summary,
      fullText: cleanText,
      fetchedAt: new Date(),
    };
  }

  /**
   * Search for documentation about a symbol/library
   */
  async searchDocs(query: string, library?: string): Promise<WebPage[]> {
    const results: WebPage[] = [];

    // Build search URLs based on library
    const searchUrls: string[] = [];

    if (library) {
      // Library-specific searches
      const libraryUrls: Record<string, string> = {
        'react': 'https://react.dev/reference/react',
        'next': 'https://nextjs.org/docs',
        'vue': 'https://vuejs.org/guide/',
        'typescript': 'https://www.typescriptlang.org/docs/',
        'node': 'https://nodejs.org/api/',
        'python': 'https://docs.python.org/3/',
        'django': 'https://docs.djangoproject.com/',
        'flask': 'https://flask.palletsprojects.com/',
        'go': 'https://pkg.go.dev/',
        'rust': 'https://doc.rust-lang.org/',
      };

      const baseUrl = libraryUrls[library.toLowerCase()];
      if (baseUrl) {
        searchUrls.push(baseUrl);
      }
    }

    // Fetch pages
    for (const url of searchUrls) {
      const page = await this.fetchPage(url);
      if (page) {
        results.push(page);
      }
    }

    return results;
  }

  /**
   * Format web knowledge for inclusion in prompt
   */
  formatForPrompt(pages: WebPage[]): string {
    if (pages.length === 0) {
      return '';
    }

    const parts: string[] = [];
    parts.push('# Web Knowledge (Official Documentation)');
    parts.push('');

    pages.forEach((page, i) => {
      parts.push(`## ${i + 1}. ${page.title}`);
      parts.push(`Source: ${page.url}`);
      parts.push('');
      parts.push(page.summary);
      parts.push('');
    });

    return parts.join('\n');
  }

  /**
   * Check if Design Card permits web access
   */
  isWebEnabled(designCard: any): boolean {
    return designCard.web === 'on' || designCard.web === true;
  }

  close(): void {
    this.db.close();
  }
}

// Example usage
if (require.main === module) {
  (async () => {
    const web = new WebKnowledge(process.cwd());

    // Test fetching React docs
    const page = await web.fetchPage('https://react.dev/reference/react/useState');
    if (page) {
      console.log('\n📄 Page:', page.title);
      console.log('📝 Summary:');
      console.log(page.summary);
      console.log('\n✅ Cached for future use');
    }

    // Test search
    const results = await web.searchDocs('hooks', 'react');
    console.log(`\n🔍 Found ${results.length} pages`);
    console.log(web.formatForPrompt(results));

    web.close();
  })();
}

