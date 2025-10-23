/**
 * MCP Tools for RAD Crawler
 */

import { db } from './db.js';
import { ollamaClient } from './ollama-client.js';
import { contentExtractor } from './extractor.js';
import type { SeedParams, IngestRepoParams, GovernParams, CrawlPlan } from './types.js';
import { config } from './config.js';

/**
 * Plan a crawl job from a high-level goal
 */
export async function planCrawl(args: { goal: string; scope?: string; depth?: string }): Promise<any> {
  const { goal, scope, depth = 'fast' } = args;

  // Use Ollama to generate a crawl plan
  const prompt = `You are a web crawling planner. Given a goal, generate a crawl plan.

Goal: ${goal}
Scope: ${scope || 'general web'}
Depth: ${depth}

Generate a JSON crawl plan with:
- seedUrls: array of starting URLs (2-5 URLs)
- allowedDomains: array of domains to crawl
- maxDepth: number (1-3)
- maxPages: number (10-100)

Respond with ONLY valid JSON, no explanation:`;

  try {
    const response = await ollamaClient.generate(prompt, 'qwen2.5-coder:1.5b', { num_predict: 300 });
    
    // Parse the JSON response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse plan from LLM response');
    }

    const plan: CrawlPlan = JSON.parse(jsonMatch[0]);
    
    // Create the job
    const job = await db.createJob('crawl', {
      seedUrls: plan.seedUrls,
      allowedDomains: plan.allowedDomains || [],
      maxDepth: plan.maxDepth || config.maxDepth,
      maxPages: plan.maxPages || config.maxPages,
    });

    return {
      job_id: job.job_id,
      plan_summary: `Crawl plan created: ${plan.seedUrls.length} seed URLs, max depth ${plan.maxDepth}, max pages ${plan.maxPages}`,
    };
  } catch (error: any) {
    return {
      error: `Failed to create crawl plan: ${error.message}`,
    };
  }
}

/**
 * Seed a crawl job with explicit parameters
 */
export async function seed(args: SeedParams): Promise<any> {
  const {
    urls,
    allow = [],
    deny = [],
    max_depth = config.maxDepth,
    max_pages = config.maxPages,
    recrawl_days = 7,
  } = args;

  try {
    const job = await db.createJob('crawl', {
      seedUrls: urls,
      allowedDomains: allow,
      deniedPatterns: deny,
      maxDepth: max_depth,
      maxPages: max_pages,
      recrawlDays: recrawl_days,
    });

    return {
      job_id: job.job_id,
      status: 'queued',
    };
  } catch (error: any) {
    return {
      error: `Failed to seed crawl: ${error.message}`,
    };
  }
}

/**
 * Force start a crawl job
 */
export async function crawlNow(args: { job_id: number }): Promise<any> {
  const { job_id } = args;

  try {
    const job = await db.getJob(job_id);
    if (!job) {
      return { error: 'Job not found' };
    }

    if (job.state !== 'queued') {
      return { error: `Job is ${job.state}, cannot start` };
    }

    // The worker will pick this up
    return {
      status: 'Job will be processed by worker',
      job_id,
    };
  } catch (error: any) {
    return {
      error: `Failed to start crawl: ${error.message}`,
    };
  }
}

/**
 * Ingest a code repository
 */
export async function ingestRepo(args: IngestRepoParams): Promise<any> {
  const { repo_url, branch = 'main', include = [], exclude = [] } = args;

  try {
    const job = await db.createJob('repo_ingest', {
      repoUrl: repo_url,
      branch,
      include,
      exclude,
    });

    return {
      job_id: job.job_id,
      status: 'queued',
    };
  } catch (error: any) {
    return {
      error: `Failed to ingest repo: ${error.message}`,
    };
  }
}

/**
 * Get job status
 */
export async function status(args: { job_id: number }): Promise<any> {
  const { job_id } = args;

  try {
    const job = await db.getJob(job_id);
    if (!job) {
      return { error: 'Job not found' };
    }

    return {
      job_id: job.job_id,
      kind: job.kind,
      state: job.state,
      progress: job.progress || {},
      created_at: job.created_at,
      started_at: job.started_at,
      finished_at: job.finished_at,
      error: job.error,
    };
  } catch (error: any) {
    return {
      error: `Failed to get status: ${error.message}`,
    };
  }
}

/**
 * Search the index
 */
export async function search(args: { q: string; top_k?: number; semantic?: boolean }): Promise<any> {
  const { q, top_k = 10, semantic = false } = args;

  try {
    let results;

    if (semantic) {
      // Generate embedding for query
      const embedding = await ollamaClient.embed(q);
      results = await db.searchSemantic(embedding, top_k);
    } else {
      // Full-text search
      results = await db.searchFTS(q, top_k);
    }

    return {
      results: results.map(r => ({
        doc_id: r.doc_id,
        chunk_id: r.chunk_id,
        uri: r.uri,
        title: r.title,
        snippet: r.snippet,
        score: r.score,
      })),
      count: results.length,
      query: q,
      semantic,
    };
  } catch (error: any) {
    return {
      error: `Search failed: ${error.message}`,
    };
  }
}

/**
 * Get full document
 */
export async function getDoc(args: { doc_id: number }): Promise<any> {
  const { doc_id } = args;

  try {
    const doc = await db.getDocument(doc_id);
    if (!doc) {
      return { error: 'Document not found' };
    }

    const blobs = await db.getDocBlobs(doc_id);
    const text = blobs.join('');

    return {
      doc_id: doc.doc_id,
      uri: doc.uri,
      title: doc.title,
      lang: doc.lang,
      text: text.substring(0, 10000), // Limit to 10KB
      text_length: text.length,
      fetched_at: doc.fetched_at,
    };
  } catch (error: any) {
    return {
      error: `Failed to get document: ${error.message}`,
    };
  }
}

/**
 * Get document chunk (paged)
 */
export async function getDocChunk(args: { doc_id: number; offset: number; limit: number }): Promise<any> {
  const { doc_id, offset, limit } = args;

  try {
    const doc = await db.getDocument(doc_id);
    if (!doc) {
      return { error: 'Document not found' };
    }

    const blobs = await db.getDocBlobs(doc_id);
    const text = blobs.join('');
    const chunk = text.substring(offset, offset + limit);

    return {
      doc_id,
      offset,
      limit,
      chunk,
      total_length: text.length,
      has_more: offset + limit < text.length,
    };
  } catch (error: any) {
    return {
      error: `Failed to get document chunk: ${error.message}`,
    };
  }
}

/**
 * Update governance policy
 */
export async function govern(args: GovernParams): Promise<any> {
  const { allowlist, denylist, budgets } = args;

  try {
    // Get current policy or use defaults
    const currentPolicy = await db.getActivePolicy();
    
    const newAllowlist = allowlist || currentPolicy?.allowlist || config.allowlist;
    const newDenylist = denylist || currentPolicy?.denylist || config.denylist;
    const newBudgets = {
      max_pages_per_job: budgets?.max_pages_per_job || currentPolicy?.budgets.max_pages_per_job || config.maxPages,
      max_depth: budgets?.max_depth || currentPolicy?.budgets.max_depth || config.maxDepth,
      rate_per_domain: budgets?.rate_per_domain || currentPolicy?.budgets.rate_per_domain || config.ratePerDomainPerMin,
    };

    const policy = await db.createPolicy(newAllowlist, newDenylist, newBudgets);

    return {
      policy_id: policy.policy_id,
      allowlist: policy.allowlist,
      denylist: policy.denylist,
      budgets: policy.budgets,
    };
  } catch (error: any) {
    return {
      error: `Failed to update policy: ${error.message}`,
    };
  }
}

/**
 * Get index statistics
 */
export async function indexStats(): Promise<any> {
  try {
    const stats = await db.getIndexStats();
    return stats;
  } catch (error: any) {
    return {
      error: `Failed to get stats: ${error.message}`,
    };
  }
}

