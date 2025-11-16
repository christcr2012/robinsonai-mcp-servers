/**
 * Evidence Gathering for Agent Core
 * Integrates Context Engine, Robinson's Toolkit, RAD, Web Search, and Evidence Cache
 */

import { getCortexClient } from './cortex/index.js';
import { RadDocsClient, RadDocument } from './rad-docs-client.js';

export interface EvidenceBundle {
  repoInsights?: {
    projectType?: string;
    mainLanguages?: string[];
    frameworks?: string[];
    testingFramework?: string;
    buildTool?: string;
  };
  contextSnippets?: Array<{
    file: string;
    snippet: string;
    score: number;
  }>;
  radNotes?: Array<{
    id: string;
    content: string;
    timestamp: string;
  }>;
  radDocuments?: RadDocument[]; // NEW: RAD Crawler indexed documents
  webSnippets?: Array<{
    title: string;
    url: string;
    snippet: string;
  }>;
  agentHandbook?: {
    id: string;
    content: string;
    version?: string;
    lastUpdated?: string;
  }; // NEW: Agent Handbook for system-level context
}

export interface EvidenceOptions {
  allowWebEvidence?: boolean;
  maxContextSnippets?: number;
  maxWebResults?: number;
  useCache?: boolean; // Whether to use evidence cache (default: true)
  cacheTTLMinutes?: number; // Cache TTL in minutes (default: 60)
  constraints?: Record<string, any>; // Additional constraints for cache key
}

/**
 * Gather evidence from multiple sources for a task
 * @param task - The task description
 * @param repoPath - Path to the repository
 * @param options - Evidence gathering options
 * @param clients - Optional MCP clients (contextEngine, toolkit, rad, web)
 */
export async function gatherEvidence(
  task: string,
  repoPath: string,
  options: EvidenceOptions = {},
  clients?: {
    contextEngine?: any;
    toolkit?: any;
    rad?: any;
    web?: any;
  }
): Promise<EvidenceBundle> {
  const {
    useCache = true,
    cacheTTLMinutes = 60,
    constraints,
  } = options;

  // Check evidence cache first
  const cortex = getCortexClient();
  if (useCache && cortex.isEnabled()) {
    try {
      const cached = await cortex.evidenceCache.get(task, repoPath, constraints);
      if (cached) {
        console.log('✅ Evidence cache hit!');
        return cached;
      }
    } catch (error) {
      console.warn('Evidence cache check failed:', error);
    }
  }

  const bundle: EvidenceBundle = {};

  // 1. Gather repo insights from Robinson's Toolkit
  if (clients?.toolkit) {
    try {
      bundle.repoInsights = await gatherRepoInsights(repoPath, clients.toolkit);
    } catch (error) {
      console.warn('Failed to gather repo insights:', error);
    }
  }

  // 2. Gather context snippets from Context Engine
  if (clients?.contextEngine) {
    try {
      bundle.contextSnippets = await gatherContextSnippets(
        task,
        clients.contextEngine,
        options.maxContextSnippets || 12
      );
    } catch (error) {
      console.warn('Failed to gather context snippets:', error);
    }
  }

  // 3. Gather RAD notes (placeholder for now)
  if (clients?.rad) {
    try {
      bundle.radNotes = await gatherRadNotes(task, clients.rad);
    } catch (error) {
      console.warn('Failed to gather RAD notes:', error);
    }
  }

  // 3.5. Gather RAD documents from crawler index
  try {
    bundle.radDocuments = await gatherRadDocuments(task, repoPath);
  } catch (error) {
    console.warn('Failed to gather RAD documents:', error);
  }

  // 4. Gather web snippets (if allowed)
  if (options.allowWebEvidence && clients?.web) {
    try {
      bundle.webSnippets = await gatherWebSnippets(
        task,
        clients.web,
        options.maxWebResults || 5
      );
    } catch (error) {
      console.warn('Failed to gather web snippets:', error);
    }
  }

  // 5. Gather Agent Handbook (for long-running, high-risk, or meta/system tasks)
  if (shouldIncludeHandbook(task, options)) {
    try {
      bundle.agentHandbook = await gatherAgentHandbook();
    } catch (error) {
      console.warn('Failed to gather Agent Handbook:', error);
    }
  }

  // Cache the evidence bundle
  if (useCache && cortex.isEnabled()) {
    try {
      await cortex.evidenceCache.set(task, repoPath, bundle, cacheTTLMinutes, constraints);
      console.log('✅ Evidence cached for future use');
    } catch (error) {
      console.warn('Failed to cache evidence:', error);
    }
  }

  return bundle;
}

/**
 * Gather repository insights using Robinson's Toolkit
 */
async function gatherRepoInsights(repoPath: string, toolkit: any): Promise<any> {
  // This would call Robinson's Toolkit to analyze the repo
  // For now, return a placeholder
  return {
    projectType: 'monorepo',
    mainLanguages: ['TypeScript', 'JavaScript'],
    frameworks: ['Node.js'],
    testingFramework: 'vitest',
    buildTool: 'tsup',
  };
}

/**
 * Gather context snippets using Context Engine
 */
async function gatherContextSnippets(
  task: string,
  contextEngine: any,
  maxSnippets: number
): Promise<Array<{ file: string; snippet: string; score: number }>> {
  try {
    // Call context_smart_query to find relevant code
    const result = await contextEngine.call('context_smart_query', {
      question: task,
      top_k: maxSnippets,
    });

    if (result?.hits) {
      return result.hits.map((hit: any) => ({
        file: hit.file || hit.path || 'unknown',
        snippet: hit.snippet || hit.content || '',
        score: hit.score || 0,
      }));
    }
  } catch (error) {
    console.warn('Context Engine query failed:', error);
  }

  return [];
}

/**
 * Gather RAD notes using RAD client
 */
async function gatherRadNotes(task: string, rad: any): Promise<Array<{ id: string; content: string; timestamp: string }>> {
  try {
    const knowledge = await rad.getRelatedKnowledge({
      taskDescription: task,
      limit: 5,
    });

    if (!knowledge) {
      return [];
    }

    const notes: Array<{ id: string; content: string; timestamp: string }> = [];

    // Add similar tasks
    knowledge.similarTasks?.forEach((t: any) => {
      notes.push({
        id: t.id,
        content: `Similar task (${t.success ? 'success' : 'failed'}): ${t.description}`,
        timestamp: new Date().toISOString(),
      });
    });

    // Add relevant decisions
    knowledge.relevantDecisions?.forEach((d: any, i: number) => {
      notes.push({
        id: `decision-${i}`,
        content: `Decision: ${d.chosenOption} (confidence: ${d.confidence}) - ${d.reasoning}`,
        timestamp: new Date().toISOString(),
      });
    });

    // Add applicable lessons
    knowledge.applicableLessons?.forEach((l: any, i: number) => {
      notes.push({
        id: `lesson-${i}`,
        content: `Lesson (${l.lessonType}): ${l.title} - ${l.description}`,
        timestamp: new Date().toISOString(),
      });
    });

    return notes;
  } catch (error) {
    console.warn('Failed to gather RAD notes:', error);
    return [];
  }
}

/**
 * Gather web snippets using Thinking Tools MCP web search
 * Uses webSearchAll which tries Brave/Bing/SerpAPI first, then falls back to DuckDuckGo
 */
async function gatherWebSnippets(
  task: string,
  web: any,
  maxResults: number
): Promise<Array<{ title: string; url: string; snippet: string }>> {
  try {
    // Call context_web_search tool (uses webSearchAll from lib/websearch.ts)
    // This returns WebHit[] = { title, url, snippet, score }
    const result = await web.call({
      tool: 'context_web_search',
      args: {
        query: task, // Note: uses 'query' not 'q' for the webSearchTool
        k: maxResults,
      },
    });

    console.log('[gatherWebSnippets] Raw result:', JSON.stringify(result, null, 2));

    // The tool returns { content: [{ type: 'text', text: JSON.stringify(hits) }] }
    // We need to parse the text content
    if (result?.content && Array.isArray(result.content) && result.content[0]?.text) {
      const hits = JSON.parse(result.content[0].text);
      if (Array.isArray(hits)) {
        return hits.slice(0, maxResults).map((hit: any) => ({
          title: hit.title || '',
          url: hit.url || '',
          snippet: hit.snippet || '',
        }));
      }
    }

    // Fallback: try parsing result directly as array
    if (Array.isArray(result)) {
      return result.slice(0, maxResults).map((item: any) => ({
        title: item.title || item.url || '',
        url: item.url || item.uri || '',
        snippet: item.snippet || item.description || '',
      }));
    }

    console.warn('[gatherWebSnippets] Unexpected format:', result);
  } catch (error: any) {
    console.warn('[gatherWebSnippets] Web search failed:', error.message || error);
  }

  return [];
}

/**
 * Gather RAD documents from crawler index
 * Uses basic keyword search on task description
 */
async function gatherRadDocuments(task: string, repoPath: string): Promise<RadDocument[]> {
  try {
    const radDocs = new RadDocsClient();

    // Extract keywords from task description
    const keywords = extractKeywords(task);

    // Search for relevant documents
    const documents = await radDocs.searchDocuments({
      keywords,
      limit: 10,
    });

    await radDocs.close();

    return documents;
  } catch (error) {
    console.warn('Failed to gather RAD documents:', error);
    return [];
  }
}

/**
 * Extract keywords from task description
 * Simple implementation - can be enhanced with NLP later
 */
function extractKeywords(task: string): string[] {
  // Remove common words and extract meaningful terms
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
    'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
    'would', 'should', 'could', 'may', 'might', 'must', 'can', 'this',
    'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they',
  ]);

  const words = task
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word));

  // Return unique keywords
  return [...new Set(words)];
}

/**
 * Determine if Agent Handbook should be included in evidence
 * Include for: long-running, high-risk, or meta/system-related tasks
 */
function shouldIncludeHandbook(task: string, options: EvidenceOptions): boolean {
  const taskLower = task.toLowerCase();

  // Always include for meta/system tasks
  const metaKeywords = [
    'system', 'architecture', 'overview', 'handbook', 'capabilities',
    'workflows', 'cortex', 'rad', 'toolkit', 'agent', 'bootstrap',
    'self-orient', 'introspect', 'meta',
  ];

  if (metaKeywords.some(keyword => taskLower.includes(keyword))) {
    return true;
  }

  // Include for high-risk tasks (indicated by keywords)
  const riskKeywords = [
    'migration', 'refactor', 'delete', 'remove', 'production',
    'deploy', 'database', 'schema', 'security', 'auth',
  ];

  if (riskKeywords.some(keyword => taskLower.includes(keyword))) {
    return true;
  }

  // Include for complex/long-running tasks (indicated by keywords)
  const complexKeywords = [
    'implement', 'design', 'architect', 'plan', 'strategy',
    'comprehensive', 'complete', 'full', 'entire',
  ];

  if (complexKeywords.some(keyword => taskLower.includes(keyword))) {
    return true;
  }

  // Default: don't include for simple tasks
  return false;
}

/**
 * Gather Agent Handbook from Cortex knowledge artifacts
 */
async function gatherAgentHandbook(): Promise<{
  id: string;
  content: string;
  version?: string;
  lastUpdated?: string;
} | undefined> {
  try {
    const cortex = getCortexClient();

    if (!cortex.isEnabled()) {
      console.log('Cortex not enabled, skipping Agent Handbook retrieval');
      return undefined;
    }

    // Retrieve Agent Handbook from knowledge artifacts
    const handbook = await cortex.artifacts.getAgentHandbook();

    if (!handbook) {
      console.log('Agent Handbook not found in Cortex');
      return undefined;
    }

    return {
      id: handbook.id,
      content: handbook.content,
      version: handbook.version,
      lastUpdated: handbook.createdAt?.toISOString() || new Date().toISOString(),
    };
  } catch (error) {
    console.warn('Failed to retrieve Agent Handbook:', error);
    return undefined;
  }
}
