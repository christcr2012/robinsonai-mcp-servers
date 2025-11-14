/**
 * Evidence Gathering for Agent Core
 * Integrates Context Engine, Robinson's Toolkit, RAD, Web Search, and Evidence Cache
 */

import { getCortexClient } from './cortex/index.js';

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
  webSnippets?: Array<{
    title: string;
    url: string;
    snippet: string;
  }>;
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
 * Gather web snippets (placeholder for now)
 */
async function gatherWebSnippets(
  task: string,
  web: any,
  maxResults: number
): Promise<Array<{ title: string; url: string; snippet: string }>> {
  try {
    // Call context_web_search_and_import
    const result = await web.call('context_web_search_and_import', {
      query: task,
      k: maxResults,
    });

    if (result?.results) {
      return result.results.map((r: any) => ({
        title: r.title || '',
        url: r.url || '',
        snippet: r.snippet || r.description || '',
      }));
    }
  } catch (error) {
    console.warn('Web search failed:', error);
  }

  return [];
}

