/**
 * Context Smart Query Tool
 * Unified "front door" for context queries that intelligently routes to the appropriate tool
 */

import type { ServerContext } from '../lib/context.js';
import { contextQueryTool } from './context_query.js';
import { contextFindSymbolTool } from './context_find_symbol.js';
import { contextNeighborhoodTool } from './context_neighborhood.js';
import { context7SearchLibraries } from './context7.js';
import { ctxImportEvidenceTool } from './ctx_import_evidence.js';

export const contextSmartQueryDescriptor = {
  name: 'context_smart_query',
  description: 'Unified context query tool that intelligently routes to context_query, context_find_symbol, or context_neighborhood based on the question type. Returns structured results with top hits, snippets, file paths, and recommended next steps.',
  inputSchema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      question: { 
        type: 'string', 
        description: 'Natural language question about the codebase (e.g., "where is X?", "how does Y work?", "what files handle Z?")' 
      },
      file_hint: { 
        type: 'string', 
        description: 'Optional file path hint to narrow the search' 
      },
      symbol_hint: { 
        type: 'string', 
        description: 'Optional symbol name hint (function, class, variable)' 
      },
      search_mode: { 
        type: 'string', 
        enum: ['auto', 'semantic', 'symbol', 'neighborhood'],
        description: 'Search mode: auto (default, intelligently routes), semantic (full-text search), symbol (find specific symbol), neighborhood (get file context)' 
      },
      top_k: { 
        type: 'number', 
        description: 'Number of results to return (default: 12, max: 50)' 
      },
    },
    required: ['question'],
  },
};

export async function contextSmartQueryTool(args: any, ctx: ServerContext) {
  const question = typeof args?.question === 'string' ? args.question.trim() : '';
  if (!question) {
    return { error: 'Question is required', recommended_next_steps: [] };
  }

  const fileHint = typeof args?.file_hint === 'string' ? args.file_hint.trim() : '';
  const symbolHint = typeof args?.symbol_hint === 'string' ? args.symbol_hint.trim() : '';
  const searchMode = args?.search_mode || 'auto';
  const topK = Math.min(Math.max(Math.floor(Number(args?.top_k) || 12), 1), 50);

  // Determine the best routing strategy
  const route = determineRoute(question, fileHint, symbolHint, searchMode);

  let result: any;
  let usedTool: string;
  let externalDocs: any[] = [];

  try {
    // Phase FA-2 Step 3: Check if question references a library/framework
    const libraryMatch = detectLibraryQuery(question);
    if (libraryMatch) {
      console.log(`[context_smart_query] Detected library query: ${libraryMatch.library}`);
      try {
        // Call Context7 to get official documentation
        const context7Result = await context7SearchLibraries({
          query: `${libraryMatch.library} ${libraryMatch.topic || ''}`.trim(),
          limit: 5,
        });

        if (context7Result && !context7Result.isError) {
          const context7Data = JSON.parse(context7Result.content[0].text);

          // Import Context7 results as evidence
          if (context7Data.results && context7Data.results.length > 0) {
            const evidenceItems = context7Data.results.map((item: any) => ({
              source: 'context7',
              title: item.title || item.name || '',
              snippet: item.snippet || item.summary || '',
              uri: item.url || item.link || '',
              score: item.score || 0.9,
              tags: ['external', 'context7', libraryMatch.library],
              raw: item,
            }));

            await ctxImportEvidenceTool({
              items: evidenceItems,
              group: `external/context7/${libraryMatch.library}`,
              upsert: true,
            }, ctx);

            externalDocs = evidenceItems;
            console.log(`[context_smart_query] Imported ${evidenceItems.length} Context7 results as evidence`);
          }
        }
      } catch (error: any) {
        console.warn(`[context_smart_query] Context7 query failed:`, error.message);
        // Continue without external docs - don't fail the whole query
      }
    }

    switch (route.type) {
      case 'symbol':
        usedTool = 'context_find_symbol';
        const symbolResult = await contextFindSymbolTool({ symbolName: route.symbolName! }, ctx);
        result = parseSymbolResult(symbolResult, question);
        break;

      case 'neighborhood':
        usedTool = 'context_neighborhood';
        const neighborhoodResult = await contextNeighborhoodTool({ file: route.filePath! }, ctx);
        result = parseNeighborhoodResult(neighborhoodResult, question);
        break;

      case 'semantic':
      default:
        usedTool = 'context_query';
        const queryResult = await contextQueryTool({ query: question, top_k: topK }, ctx);
        result = parseQueryResult(queryResult, question);
        break;
    }

    return {
      question,
      route: {
        type: route.type,
        reason: route.reason,
        tool_used: usedTool,
      },
      ...result,
      external_docs: externalDocs,
      recommended_next_steps: generateNextSteps(result, route.type, externalDocs),
    };
  } catch (error: any) {
    return {
      question,
      error: error.message || 'Unknown error occurred',
      recommended_next_steps: ['Try running context_index_repo to build the index', 'Simplify your question'],
    };
  }
}

interface RouteDecision {
  type: 'symbol' | 'neighborhood' | 'semantic';
  reason: string;
  symbolName?: string;
  filePath?: string;
}

interface LibraryMatch {
  library: string;
  topic?: string;
}

/**
 * Detect if a question references a library or framework
 */
function detectLibraryQuery(question: string): LibraryMatch | null {
  const lowerQuestion = question.toLowerCase();

  // Common libraries and frameworks
  const libraries = [
    'nextauth', 'next-auth', 'prisma', 'supabase', 'vercel', 'react', 'next.js', 'nextjs',
    'express', 'fastify', 'nestjs', 'typescript', 'tailwind', 'shadcn', 'radix',
    'trpc', 'graphql', 'apollo', 'redux', 'zustand', 'jotai', 'recoil',
    'vitest', 'jest', 'playwright', 'cypress', 'testing-library',
    'zod', 'yup', 'joi', 'valibot',
    'drizzle', 'kysely', 'typeorm', 'sequelize',
    'stripe', 'clerk', 'auth0', 'firebase',
    'aws', 'azure', 'gcp', 'cloudflare',
    'docker', 'kubernetes', 'terraform',
  ];

  for (const lib of libraries) {
    const libPattern = new RegExp(`\\b${lib.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (libPattern.test(question)) {
      // Extract topic if present
      const topicPatterns = [
        new RegExp(`${lib}\\s+(authentication|auth|setup|configuration|migration|deployment|testing|api|hooks|components)`, 'i'),
        new RegExp(`how\\s+to\\s+use\\s+${lib}\\s+for\\s+(.+?)(?:\\?|$)`, 'i'),
        new RegExp(`${lib}\\s+(.+?)\\s+example`, 'i'),
      ];

      for (const pattern of topicPatterns) {
        const match = question.match(pattern);
        if (match && match[1]) {
          return { library: lib, topic: match[1] };
        }
      }

      return { library: lib };
    }
  }

  return null;
}

function determineRoute(question: string, fileHint: string, symbolHint: string, searchMode: string): RouteDecision {
  const lowerQuestion = question.toLowerCase();

  // Explicit mode override
  if (searchMode === 'symbol' && symbolHint) {
    return { type: 'symbol', reason: 'Explicit symbol mode with hint', symbolName: symbolHint };
  }
  if (searchMode === 'neighborhood' && fileHint) {
    return { type: 'neighborhood', reason: 'Explicit neighborhood mode with file hint', filePath: fileHint };
  }
  if (searchMode === 'semantic') {
    return { type: 'semantic', reason: 'Explicit semantic mode' };
  }

  // Auto-detect based on question patterns
  
  // Symbol lookup patterns: "where is X defined?", "find function X", "what is class Y?"
  const symbolPatterns = [
    /where\s+is\s+(\w+)\s+(defined|declared|implemented)/i,
    /find\s+(function|class|method|variable|const|interface|type)\s+(\w+)/i,
    /what\s+is\s+(function|class|method|variable|const|interface|type)\s+(\w+)/i,
    /definition\s+of\s+(\w+)/i,
  ];

  for (const pattern of symbolPatterns) {
    const match = question.match(pattern);
    if (match) {
      const symbolName = symbolHint || match[match.length - 1];
      return { type: 'symbol', reason: `Detected symbol lookup pattern: "${match[0]}"`, symbolName };
    }
  }

  // Neighborhood patterns: "what imports X?", "what uses file Y?", "dependencies of Z"
  const neighborhoodPatterns = [
    /what\s+(imports|uses|depends\s+on)\s+(.+)/i,
    /dependencies\s+of\s+(.+)/i,
    /files?\s+that\s+(import|use|depend\s+on)\s+(.+)/i,
    /context\s+(of|for|around)\s+(.+)/i,
  ];

  for (const pattern of neighborhoodPatterns) {
    const match = question.match(pattern);
    if (match && fileHint) {
      return { type: 'neighborhood', reason: `Detected neighborhood pattern: "${match[0]}"`, filePath: fileHint };
    }
  }

  // Default to semantic search for general questions
  return { type: 'semantic', reason: 'General question - using semantic search' };
}

function parseSymbolResult(symbolResult: any, question: string): any {
  const content = symbolResult.content?.[0]?.text;
  if (!content) return { error: 'No symbol result' };

  const parsed = JSON.parse(content);
  if (parsed.error) return { error: parsed.error };
  if (!parsed.found) return { error: parsed.message || 'Symbol not found' };

  return {
    top_hits: [{
      rank: 1,
      score: 1.0,
      path: parsed.symbol.file,
      title: `${parsed.symbol.type} ${parsed.symbol.name}`,
      snippet: `Found ${parsed.symbol.type} "${parsed.symbol.name}" at line ${parsed.symbol.line}`,
      provider: 'symbol_index',
      metadata: parsed.symbol,
    }],
    total_results: 1,
    summary: `Found ${parsed.symbol.type} "${parsed.symbol.name}" in ${parsed.symbol.file} at line ${parsed.symbol.line}`,
  };
}

function parseNeighborhoodResult(neighborhoodResult: any, question: string): any {
  const content = neighborhoodResult.content?.[0]?.text;
  if (!content) return { error: 'No neighborhood result' };

  const parsed = JSON.parse(content);
  if (parsed.error) return { error: parsed.error };

  const hits = [];
  if (parsed.imports?.length) {
    hits.push(...parsed.imports.map((imp: string, i: number) => ({
      rank: i + 1,
      score: 0.9 - (i * 0.1),
      path: imp,
      title: `Import: ${imp}`,
      snippet: `File "${parsed.file}" imports "${imp}"`,
      provider: 'symbol_index',
    })));
  }

  return {
    top_hits: hits,
    total_results: hits.length,
    summary: `File "${parsed.file}" has ${parsed.imports?.length || 0} imports, ${parsed.importedBy?.length || 0} importers, and ${parsed.symbols?.length || 0} symbols`,
    file_context: {
      file: parsed.file,
      imports: parsed.imports,
      imported_by: parsed.importedBy,
      symbols: parsed.symbols,
    },
  };
}

function parseQueryResult(queryResult: any, question: string): any {
  if (queryResult.error) return { error: queryResult.error };

  return {
    top_hits: queryResult.hits || [],
    total_results: queryResult.totalResults || 0,
    summary: queryResult.summary || `Found ${queryResult.hits?.length || 0} results`,
  };
}

function generateNextSteps(result: any, routeType: string, externalDocs?: any[]): string[] {
  if (result.error) {
    return [
      'Try running context_index_repo to build/refresh the index',
      'Check if the file/symbol name is correct',
      'Try a more general semantic search',
    ];
  }

  const steps: string[] = [];

  // Add external docs recommendations first
  if (externalDocs && externalDocs.length > 0) {
    steps.push(`Review official documentation from Context7 (${externalDocs.length} results)`);
    const topDoc = externalDocs[0];
    if (topDoc.uri) {
      steps.push(`Check official docs: ${topDoc.title || topDoc.uri}`);
    }
  }

  if (routeType === 'symbol' && result.top_hits?.length) {
    const hit = result.top_hits[0];
    steps.push(`View the file: ${hit.path}`);
    steps.push(`Get neighborhood context: context_neighborhood with file="${hit.path}"`);
  }

  if (routeType === 'neighborhood' && result.file_context) {
    if (result.file_context.imports?.length) {
      steps.push(`Explore imports: ${result.file_context.imports.slice(0, 3).join(', ')}`);
    }
    if (result.file_context.symbols?.length) {
      steps.push(`Examine symbols: ${result.file_context.symbols.slice(0, 3).map((s: any) => s.name).join(', ')}`);
    }
  }

  if (routeType === 'semantic' && result.top_hits?.length) {
    const topPaths = result.top_hits.slice(0, 3).map((h: any) => h.path);
    steps.push(`Review top matches: ${topPaths.join(', ')}`);
    if (result.top_hits.length > 3) {
      steps.push(`Explore ${result.top_hits.length - 3} more results`);
    }
  }

  return steps.length ? steps : ['No specific next steps - review the results'];
}

