#!/usr/bin/env node
/**
 * RAD Crawler Worker - Processes crawl and repo ingest jobs
 */

import { db } from './db.js';
import { webCrawler } from './crawler.js';
import { contentExtractor } from './extractor.js';
import { ollamaClient } from './ollama-client.js';
import type { Job, Policy, CrawlContext } from './types.js';

const POLL_INTERVAL_MS = 5000;
const MAX_ERRORS_PER_JOB = 10;

class Worker {
  private running = false;

  async start(): Promise<void> {
    this.running = true;
    console.log('RAD Crawler Worker started');

    while (this.running) {
      try {
        const job = await db.claimJob();
        if (job) {
          await this.processJob(job);
        } else {
          // No jobs, wait before polling again
          await this.sleep(POLL_INTERVAL_MS);
        }
      } catch (error: any) {
        console.error('Worker error:', error.message);
        await this.sleep(POLL_INTERVAL_MS);
      }
    }
  }

  stop(): void {
    this.running = false;
    console.log('RAD Crawler Worker stopped');
  }

  private async processJob(job: Job): Promise<void> {
    console.log(`Processing job ${job.job_id} (${job.kind})`);

    try {
      if (job.kind === 'crawl') {
        await this.processCrawlJob(job);
      } else if (job.kind === 'repo_ingest') {
        await this.processRepoJob(job);
      }

      await db.completeJob(job.job_id);
      console.log(`Job ${job.job_id} completed`);
    } catch (error: any) {
      console.error(`Job ${job.job_id} failed:`, error.message);
      await db.failJob(job.job_id, error.message);
    }
  }

  private async processCrawlJob(job: Job): Promise<void> {
    const params = job.params;
    const policy = await db.getActivePolicy();
    
    if (!policy) {
      throw new Error('No active policy found');
    }

    // Initialize crawl context
    const context: CrawlContext = {
      job,
      policy,
      visitedUrls: new Set(),
      urlQueue: params.seedUrls.map((url: string) => ({ url, depth: 0 })),
      pagesCrawled: 0,
      rateLimiters: new Map(),
    };

    const maxPages = params.maxPages || policy.budgets.max_pages_per_job;
    const maxDepth = params.maxDepth || policy.budgets.max_depth;
    const errors: string[] = [];

    // Create source
    const domain = new URL(params.seedUrls[0]).hostname;
    const source = await db.createSource('web', params.seedUrls[0], domain);

    while (context.urlQueue.length > 0 && context.pagesCrawled < maxPages) {
      const { url, depth } = context.urlQueue.shift()!;

      // Skip if already visited
      const normalizedUrl = webCrawler.normalizeUrl(url);
      if (context.visitedUrls.has(normalizedUrl)) continue;
      context.visitedUrls.add(normalizedUrl);

      // Skip if max depth exceeded
      if (depth > maxDepth) continue;

      // Fetch and process page
      try {
        const content = await webCrawler.fetchPage(url, policy);
        if (!content) continue;

        // Check for duplicates
        const hash = contentExtractor.computeHash(content.text);
        const existingDoc = await db.getDocumentByHash(source.source_id, url, hash);
        
        if (existingDoc) {
          console.log(`Skipping duplicate: ${url}`);
          continue;
        }

        // Create document
        const doc = await db.createDocument(
          source.source_id,
          url,
          content.title,
          content.lang,
          hash
        );

        // Save full content in blobs
        await db.saveDocBlob(doc.doc_id, 0, content.text);

        // Chunk and embed
        const chunks = contentExtractor.chunkText(content.text, content.h2Path);
        
        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          
          // Generate embedding
          const embedding = await ollamaClient.embed(chunk.text);
          
          // Save chunk
          await db.createChunk(doc.doc_id, i, chunk.text, embedding, chunk.meta);
        }

        context.pagesCrawled++;

        // Update progress
        await db.updateJobProgress(job.job_id, {
          pages_crawled: context.pagesCrawled,
          pages_total: maxPages,
          current_url: url,
          chunks_created: chunks.length,
        });

        // Extract and queue links
        if (depth < maxDepth) {
          const links = webCrawler.extractLinks(content, url);
          for (const link of links) {
            context.urlQueue.push({ url: link, depth: depth + 1 });
          }
        }

        console.log(`Crawled ${url} (${chunks.length} chunks, depth ${depth})`);
      } catch (error: any) {
        console.error(`Error crawling ${url}:`, error.message);
        errors.push(`${url}: ${error.message}`);
        
        if (errors.length >= MAX_ERRORS_PER_JOB) {
          throw new Error(`Too many errors: ${errors.slice(0, 5).join('; ')}`);
        }
      }
    }

    console.log(`Crawl complete: ${context.pagesCrawled} pages, ${context.visitedUrls.size} URLs visited`);
  }

  private async processRepoJob(job: Job): Promise<void> {
    const params = job.params;
    
    // For now, this is a stub - full implementation would:
    // 1. Use GitHub API (via Toolkit) to fetch repo archive
    // 2. Extract files matching include/exclude patterns
    // 3. Analyze directory structure
    // 4. Chunk and embed code files
    // 5. Store in database
    
    console.log(`Repo ingest not yet implemented: ${params.repoUrl}`);
    throw new Error('Repo ingest not yet implemented');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run worker if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const worker = new Worker();
  
  process.on('SIGINT', () => {
    console.log('Received SIGINT, shutting down...');
    worker.stop();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('Received SIGTERM, shutting down...');
    worker.stop();
    process.exit(0);
  });

  worker.start().catch(error => {
    console.error('Worker failed:', error);
    process.exit(1);
  });
}

export { Worker };

// Export functions for integration
let workerInstance: Worker | null = null;

export async function startWorker(): Promise<void> {
  if (!workerInstance) {
    workerInstance = new Worker();
    // Start in background (don't await)
    workerInstance.start().catch((error) => {
      console.error('[RAD Worker] Fatal error:', error);
    });
  }
}

export async function stopWorker(): Promise<void> {
  if (workerInstance) {
    workerInstance.stop();
    workerInstance = null;
  }
}

