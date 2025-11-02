#!/usr/bin/env node

/**
 * @robinsonai/thinking-tools-mcp
 * Comprehensive Thinking Tools MCP Server
 * Provides 18 cognitive frameworks for structured reasoning
 * By Robinson AI Systems
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  InitializeRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// Import all thinking tools
import { devilsAdvocate } from './tools/devils-advocate.js';
import { firstPrinciples } from './tools/first-principles.js';
import { rootCauseAnalysis } from './tools/root-cause.js';
import { swotAnalysis } from './tools/swot.js';
import { premortemAnalysis } from './tools/premortem.js';
import { criticalThinking } from './tools/critical-thinking.js';
import { lateralThinking } from './tools/lateral-thinking.js';
import { redTeam } from './tools/red-team.js';
import { blueTeam } from './tools/blue-team.js';
import { decisionMatrix } from './tools/decision-matrix.js';
import { socratic } from './tools/socratic.js';
import { systemsThinking } from './tools/systems-thinking.js';
import { scenarioPlanning } from './tools/scenario-planning.js';
import { brainstorming } from './tools/brainstorming.js';
import { mindMapping } from './tools/mind-mapping.js';
import { sequentialThinking } from './tools/sequential-thinking.js';
import { parallelThinking } from './tools/parallel-thinking.js';
import { reflectiveThinking } from './tools/reflective-thinking.js';
import {
  context7ResolveLibraryId,
  context7GetLibraryDocs,
  context7SearchLibraries,
  context7CompareVersions,
  context7GetExamples,
  context7GetMigrationGuide,
} from './tools/context7.js';

// Import Context Engine modules
import { indexRepo } from './context/indexer.js';
import { hybridQuery } from './context/search.js';
import { ingestUrls, ddg } from './context/web.js';
import { buildImportGraph } from './context/graph.js';
import { summarizeDiff } from './context/diff.js';
import { getPaths, loadChunks, loadEmbeddings } from './context/store.js';

// Import Context CLI tools
import { contextCLITools } from './context-cli-tools.js';

// Import Web Context tools
import { getWebContextTools } from './tools/context_web.js';

// Import Cognitive Tools
import { getCognitiveTools } from './tools/cognitive_tools.js';

// Import Evidence Collector
import { getCollectorTools } from './tools/collect_evidence.js';

// Import Validation Tools
import { getValidationTools } from './tools/validate_artifacts.js';

// Import LLM Rewrite Tools
import { getLlmRewriteTools } from './tools/llm_rewrite.js';

class ThinkingToolsMCP {
  private server: Server;

  constructor() {
    this.server = new Server(
      { name: '@robinsonai/thinking-tools-mcp', version: '1.0.0' },
      { capabilities: { tools: {} } }
    );

    this.setupHandlers();
  }

  private setupHandlers() {
    // Initialize handler
    this.server.setRequestHandler(InitializeRequestSchema, async (request) => ({
      protocolVersion: "2024-11-05",
      capabilities: {
        tools: {},
      },
      serverInfo: {
        name: "@robinsonai/thinking-tools-mcp",
        version: "1.0.0",
      },
    }));

    // List tools handler
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'devils_advocate',
          description: 'Challenge assumptions and find flaws in plans. Returns challenges, risks, counterarguments, and recommendations.',
          inputSchema: {
            type: 'object',
            properties: {
              context: { type: 'string', description: 'The plan or idea to challenge' },
              goal: { type: 'string', description: 'What you\'re trying to achieve' },
              depth: { type: 'string', enum: ['quick', 'deep'], description: 'How thorough to be' },
            },
            required: ['context'],
          },
        },
        {
          name: 'first_principles',
          description: 'Break down complex problems to fundamental truths. Returns fundamentals, assumptions, insights, and alternative approaches.',
          inputSchema: {
            type: 'object',
            properties: {
              problem: { type: 'string', description: 'The problem to analyze' },
              domain: { type: 'string', description: 'Problem domain (e.g., "authentication", "caching")' },
            },
            required: ['problem'],
          },
        },
        {
          name: 'root_cause',
          description: 'Use 5 Whys technique to find underlying causes. Returns why-chain, root causes, contributing factors, and solutions.',
          inputSchema: {
            type: 'object',
            properties: {
              problem: { type: 'string', description: 'The problem to analyze' },
              context: { type: 'string', description: 'Additional context' },
            },
            required: ['problem'],
          },
        },
        {
          name: 'swot_analysis',
          description: 'Analyze Strengths, Weaknesses, Opportunities, Threats. Returns SWOT breakdown and strategic recommendations.',
          inputSchema: {
            type: 'object',
            properties: {
              subject: { type: 'string', description: 'What to analyze (technology, approach, team, etc.)' },
              context: { type: 'string', description: 'Additional context' },
              perspective: { type: 'string', enum: ['technical', 'business', 'product', 'team'], description: 'Analysis perspective' },
            },
            required: ['subject'],
          },
        },
        {
          name: 'premortem_analysis',
          description: 'Imagine project failure and work backward to identify risks. Returns failure scenarios, warning signals, and mitigation strategies.',
          inputSchema: {
            type: 'object',
            properties: {
              project: { type: 'string', description: 'The project or initiative' },
              context: { type: 'string', description: 'Additional context' },
            },
            required: ['project'],
          },
        },
        {
          name: 'critical_thinking',
          description: 'Evaluate arguments, evidence, and logical reasoning. Returns claims, evidence quality, logical fallacies, and assessment.',
          inputSchema: {
            type: 'object',
            properties: {
              argument: { type: 'string', description: 'The argument to evaluate' },
              context: { type: 'string', description: 'Additional context' },
              depth: { type: 'string', enum: ['quick', 'deep'], description: 'How thorough to be' },
            },
            required: ['argument'],
          },
        },
        {
          name: 'lateral_thinking',
          description: 'Generate creative, non-obvious solutions. Returns unconventional approaches, analogies, reversals, and provocative ideas.',
          inputSchema: {
            type: 'object',
            properties: {
              problem: { type: 'string', description: 'The problem to solve creatively' },
              context: { type: 'string', description: 'Additional context' },
              constraints: { type: 'array', items: { type: 'string' }, description: 'Constraints to work within' },
            },
            required: ['problem'],
          },
        },
        {
          name: 'red_team',
          description: 'Attack the plan/design to find vulnerabilities. Returns attack vectors, exploits, edge cases, and stress tests.',
          inputSchema: {
            type: 'object',
            properties: {
              plan: { type: 'string', description: 'The plan or design to attack' },
              context: { type: 'string', description: 'Additional context' },
              focus: { type: 'string', enum: ['security', 'reliability', 'performance', 'all'], description: 'Attack focus area' },
            },
            required: ['plan'],
          },
        },
        {
          name: 'blue_team',
          description: 'Defend against attacks and strengthen the plan. Returns defenses, monitoring strategy, incident response, and hardening steps.',
          inputSchema: {
            type: 'object',
            properties: {
              plan: { type: 'string', description: 'The plan or design to defend' },
              threats: { type: 'array', items: { type: 'string' }, description: 'Known threats' },
              context: { type: 'string', description: 'Additional context' },
            },
            required: ['plan'],
          },
        },
        {
          name: 'decision_matrix',
          description: 'Weighted decision-making for comparing options. Returns scored matrix, recommendation, and tradeoffs.',
          inputSchema: {
            type: 'object',
            properties: {
              options: { type: 'array', items: { type: 'string' }, description: 'Options to compare' },
              criteria: { type: 'array', items: { type: 'string' }, description: 'Criteria to evaluate (auto-detected if not provided)' },
              context: { type: 'string', description: 'Additional context (affects weighting)' },
            },
            required: ['options'],
          },
        },
        {
          name: 'socratic_questioning',
          description: 'Deep inquiry through probing questions. Returns clarifying, assumption, reasoning, perspective, implication, and meta questions.',
          inputSchema: {
            type: 'object',
            properties: {
              topic: { type: 'string', description: 'The topic to explore' },
              context: { type: 'string', description: 'Additional context' },
              depth: { type: 'string', enum: ['quick', 'deep'], description: 'How many questions to generate' },
            },
            required: ['topic'],
          },
        },
        {
          name: 'systems_thinking',
          description: 'Understand interconnections, feedback loops, and emergent behavior. Returns components, feedback loops, leverage points, and system archetypes.',
          inputSchema: {
            type: 'object',
            properties: {
              system: { type: 'string', description: 'The system to analyze' },
              context: { type: 'string', description: 'Additional context' },
            },
            required: ['system'],
          },
        },
        {
          name: 'scenario_planning',
          description: 'Explore multiple possible futures. Returns scenarios with probability, impact, indicators, and preparations.',
          inputSchema: {
            type: 'object',
            properties: {
              situation: { type: 'string', description: 'The current situation' },
              timeframe: { type: 'string', description: 'Time horizon (e.g., "1 year", "5 years")' },
              context: { type: 'string', description: 'Additional context' },
            },
            required: ['situation'],
          },
        },
        {
          name: 'brainstorming',
          description: 'Generate many ideas quickly without judgment. Returns categorized ideas, wild ideas, and practical ideas.',
          inputSchema: {
            type: 'object',
            properties: {
              prompt: { type: 'string', description: 'What to brainstorm about' },
              context: { type: 'string', description: 'Additional context' },
              quantity: { type: 'number', description: 'How many ideas to generate (default: 20)' },
            },
            required: ['prompt'],
          },
        },
        {
          name: 'mind_mapping',
          description: 'Visual organization of ideas and concepts. Returns hierarchical structure and Mermaid diagram.',
          inputSchema: {
            type: 'object',
            properties: {
              centralIdea: { type: 'string', description: 'The central concept' },
              context: { type: 'string', description: 'Additional context' },
            },
            required: ['centralIdea'],
          },
        },
        {
          name: 'sequential_thinking',
          description: 'Break down complex problems into sequential thought steps. Supports revisions, branching, and dynamic thought adjustment.',
          inputSchema: {
            type: 'object',
            properties: {
              thought: { type: 'string', description: 'Your current thinking step' },
              nextThoughtNeeded: { type: 'boolean', description: 'Whether another thought step is needed' },
              thoughtNumber: { type: 'integer', description: 'Current thought number', minimum: 1 },
              totalThoughts: { type: 'integer', description: 'Estimated total thoughts needed (can be adjusted)', minimum: 1 },
              isRevision: { type: 'boolean', description: 'Whether this revises previous thinking' },
              revisesThought: { type: 'integer', description: 'Which thought is being reconsidered', minimum: 1 },
              branchFromThought: { type: 'integer', description: 'Branching point thought number', minimum: 1 },
              branchId: { type: 'string', description: 'Branch identifier' },
              needsMoreThoughts: { type: 'boolean', description: 'If more thoughts are needed' },
            },
            required: ['thought', 'nextThoughtNeeded', 'thoughtNumber', 'totalThoughts'],
          },
        },
        {
          name: 'parallel_thinking',
          description: 'Explore multiple solution paths simultaneously. Create branches to evaluate different approaches in parallel.',
          inputSchema: {
            type: 'object',
            properties: {
              branchId: { type: 'string', description: 'Unique identifier for this branch' },
              description: { type: 'string', description: 'Description of this solution path' },
              thought: { type: 'string', description: 'Current thought in this branch' },
              thoughtNumber: { type: 'integer', description: 'Thought number within this branch', minimum: 1 },
              nextThoughtNeeded: { type: 'boolean', description: 'Whether more thoughts needed in this branch' },
              conclusion: { type: 'string', description: 'Final conclusion for this branch (if complete)' },
            },
            required: ['branchId', 'description', 'thought', 'thoughtNumber', 'nextThoughtNeeded'],
          },
        },
        {
          name: 'reflective_thinking',
          description: 'Review and critique previous thoughts and decisions. Identify improvements and assess confidence.',
          inputSchema: {
            type: 'object',
            properties: {
              thoughtNumber: { type: 'integer', description: 'Which thought to reflect on', minimum: 1 },
              reflection: { type: 'string', description: 'Your reflection on this thought' },
              improvements: { type: 'array', items: { type: 'string' }, description: 'Suggested improvements' },
              confidence: { type: 'number', description: 'Confidence level (0-1)', minimum: 0, maximum: 1 },
            },
            required: ['thoughtNumber', 'reflection', 'improvements', 'confidence'],
          },
        },
        {
          name: 'context7_resolve_library_id',
          description: 'Resolve a package/library name to find documentation. Returns library ID and metadata.',
          inputSchema: {
            type: 'object',
            properties: {
              libraryName: { type: 'string', description: 'Library name to search for (e.g., "react", "next.js", "mongodb")' },
            },
            required: ['libraryName'],
          },
        },
        {
          name: 'context7_get_library_docs',
          description: 'Get documentation for a specific library. Use library ID from resolve_library_id.',
          inputSchema: {
            type: 'object',
            properties: {
              context7CompatibleLibraryID: { type: 'string', description: 'Library ID (e.g., "/vercel/next.js")' },
              topic: { type: 'string', description: 'Optional: specific topic to focus on' },
              tokens: { type: 'number', description: 'Optional: max tokens to retrieve (default: 5000)' },
            },
            required: ['context7CompatibleLibraryID'],
          },
        },
        {
          name: 'context7_search_libraries',
          description: 'Search across all available libraries by name or description.',
          inputSchema: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'Search query' },
              limit: { type: 'number', description: 'Max results (default: 10)' },
            },
            required: ['query'],
          },
        },
        {
          name: 'context7_compare_versions',
          description: 'Compare different versions of a library to see what changed.',
          inputSchema: {
            type: 'object',
            properties: {
              libraryId: { type: 'string', description: 'Library ID' },
              fromVersion: { type: 'string', description: 'Starting version' },
              toVersion: { type: 'string', description: 'Target version' },
            },
            required: ['libraryId', 'fromVersion', 'toVersion'],
          },
        },
        {
          name: 'context7_get_examples',
          description: 'Get code examples for specific use cases from library documentation.',
          inputSchema: {
            type: 'object',
            properties: {
              libraryId: { type: 'string', description: 'Library ID' },
              useCase: { type: 'string', description: 'Specific use case or feature' },
              language: { type: 'string', description: 'Programming language (default: "javascript")' },
            },
            required: ['libraryId', 'useCase'],
          },
        },
        {
          name: 'context7_get_migration_guide',
          description: 'Get migration guide for upgrading between library versions.',
          inputSchema: {
            type: 'object',
            properties: {
              libraryId: { type: 'string', description: 'Library ID' },
              fromVersion: { type: 'string', description: 'Current version' },
              toVersion: { type: 'string', description: 'Target version' },
            },
            required: ['libraryId', 'fromVersion', 'toVersion'],
          },
        },
        {
          name: 'context_index_repo',
          description: 'Index current repo into Context Engine (chunks + embeddings).',
          inputSchema: {
            type: 'object',
            properties: {
              repo_root: { type: 'string', description: 'Optional: repository root path' },
            },
            required: [],
          },
        },
        {
          name: 'context_query',
          description: 'Hybrid search across repo, knowledge, and web cache.',
          inputSchema: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'Search query' },
              top_k: { type: 'number', description: 'Number of results to return (default: 8)' },
            },
            required: ['query'],
          },
        },
        {
          name: 'context_web_search',
          description: 'DuckDuckGo HTML fallback search (no API key). Returns URL candidates.',
          inputSchema: {
            type: 'object',
            properties: {
              q: { type: 'string', description: 'Search query' },
              k: { type: 'number', description: 'Number of results (default: 5)' },
            },
            required: ['q'],
          },
        },
        {
          name: 'context_ingest_urls',
          description: 'Fetch URL(s), extract main content, chunk, embed, and cache.',
          inputSchema: {
            type: 'object',
            properties: {
              urls: { type: 'array', items: { type: 'string' }, description: 'URLs to ingest' },
              tags: { type: 'array', items: { type: 'string' }, description: 'Optional tags' },
            },
            required: ['urls'],
          },
        },
        {
          name: 'context_stats',
          description: 'Return basic index stats and file counts.',
          inputSchema: {
            type: 'object',
            properties: {},
            required: [],
          },
        },
        {
          name: 'context_reset',
          description: 'Delete JSONL stores (chunks/embeddings) to allow fresh rebuild.',
          inputSchema: {
            type: 'object',
            properties: {},
            required: [],
          },
        },
        {
          name: 'context_neighborhood',
          description: 'Return import/mention neighborhood for a file (quick graph).',
          inputSchema: {
            type: 'object',
            properties: {
              file: { type: 'string', description: 'File path to analyze' },
            },
            required: ['file'],
          },
        },
        {
          name: 'context_summarize_diff',
          description: 'Summarize code changes for a git range (e.g., HEAD~1..HEAD).',
          inputSchema: {
            type: 'object',
            properties: {
              range: { type: 'string', description: 'Git range (default: HEAD~1..HEAD)' },
            },
            required: [],
          },
        },
        ...contextCLITools.map(tool => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema,
        })),
        ...getWebContextTools().map(tool => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema,
        })),
        ...getCognitiveTools().map(tool => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema,
        })),
        ...getCollectorTools().map(tool => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema,
        })),
        ...getValidationTools().map(tool => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema,
        })),
        ...getLlmRewriteTools().map(tool => ({
          name: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema,
        })),
      ],
    }));

    // Call tool handler
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        let result: any;

        switch (name) {
          case 'devils_advocate':
            result = devilsAdvocate(args as any);
            break;
          case 'first_principles':
            result = firstPrinciples(args as any);
            break;
          case 'root_cause':
            result = rootCauseAnalysis(args as any);
            break;
          case 'swot_analysis':
            result = swotAnalysis(args as any);
            break;
          case 'premortem_analysis':
            result = premortemAnalysis(args as any);
            break;
          case 'critical_thinking':
            result = criticalThinking(args as any);
            break;
          case 'lateral_thinking':
            result = lateralThinking(args as any);
            break;
          case 'red_team':
            result = redTeam(args as any);
            break;
          case 'blue_team':
            result = blueTeam(args as any);
            break;
          case 'decision_matrix':
            result = decisionMatrix(args as any);
            break;
          case 'socratic_questioning':
            result = socratic(args as any);
            break;
          case 'systems_thinking':
            result = systemsThinking(args as any);
            break;
          case 'scenario_planning':
            result = scenarioPlanning(args as any);
            break;
          case 'brainstorming':
            result = brainstorming(args as any);
            break;
          case 'mind_mapping':
            result = mindMapping(args as any);
            break;
          case 'sequential_thinking':
            result = await sequentialThinking(args as any);
            break;
          case 'parallel_thinking':
            result = await parallelThinking(args as any);
            break;
          case 'reflective_thinking':
            result = await reflectiveThinking(args as any);
            break;
          case 'context7_resolve_library_id':
            result = await context7ResolveLibraryId(args as any);
            break;
          case 'context7_get_library_docs':
            result = await context7GetLibraryDocs(args as any);
            break;
          case 'context7_search_libraries':
            result = await context7SearchLibraries(args as any);
            break;
          case 'context7_compare_versions':
            result = await context7CompareVersions(args as any);
            break;
          case 'context7_get_examples':
            result = await context7GetExamples(args as any);
            break;
          case 'context7_get_migration_guide':
            result = await context7GetMigrationGuide(args as any);
            break;
          case 'context_index_repo':
            await indexRepo((args as any)?.repo_root);
            result = { ok: true, paths: getPaths() };
            break;
          case 'context_query':
            const hits = await hybridQuery((args as any).query, (args as any).top_k || parseInt(process.env.CTX_TOP_K || '8', 10));
            result = {
              hits: hits.map(h => ({
                score: h.score,
                path: h.chunk.path,
                start: h.chunk.start,
                end: h.chunk.end,
                text: h.chunk.text.slice(0, 800)
              }))
            };
            break;
          case 'context_web_search':
            const urls = await ddg((args as any).q, (args as any).k || 5);
            result = { urls };
            break;
          case 'context_ingest_urls':
            result = await ingestUrls((args as any).urls, (args as any).tags || []);
            break;
          case 'context_stats':
            const chunks = loadChunks().length;
            const embeds = loadEmbeddings().length;
            result = { chunks, embeddings: embeds, paths: getPaths() };
            break;
          case 'context_reset':
            const p = getPaths();
            const fs = await import('fs');
            for (const f of [p.chunks, p.embeds]) {
              try {
                fs.unlinkSync(f as any);
              } catch {
                // ignore if file doesn't exist
              }
            }
            result = { ok: true };
            break;
          case 'context_neighborhood':
            const g = buildImportGraph();
            const n = g.filter(e => e.from.endsWith((args as any).file) || e.to.endsWith((args as any).file));
            result = { edges: n.slice(0, 200) };
            break;
          case 'context_summarize_diff':
            result = summarizeDiff((args as any)?.range || 'HEAD~1..HEAD');
            break;
          case 'context_preview':
          case 'context_audit':
            // Find the matching CLI tool and call its handler
            const cliTool = contextCLITools.find(t => t.name === name);
            if (cliTool) {
              result = await cliTool.handler();
            } else {
              throw new Error(`CLI tool not found: ${name}`);
            }
            break;
          case 'ctx_web_search':
          case 'ctx_web_fetch':
          case 'ctx_web_crawl_step':
          case 'ctx_web_debug_url':
            // Find the matching web context tool and call its handler
            const webTool = getWebContextTools().find(t => t.name === name);
            if (webTool) {
              result = await webTool.handler(args || {});
            } else {
              throw new Error(`Web context tool not found: ${name}`);
            }
            break;
          case 'think_swot':
          case 'think_devils_advocate':
          case 'think_premortem':
          case 'think_decision_matrix':
          case 'think_critique_checklist':
          case 'think_auto_packet':
            // Find the matching cognitive tool and call its handler
            const cogTool = getCognitiveTools().find(t => t.name === name);
            if (cogTool) {
              result = await cogTool.handler(args || {});
            } else {
              throw new Error(`Cognitive tool not found: ${name}`);
            }
            break;
          case 'think_collect_evidence':
          case 'think_auto_packet':
          case 'thinking_tools_health_check':
          case 'thinking_tools_validate':
            // Find the matching collector tool and call its handler
            const collectorTool = getCollectorTools().find(t => t.name === name);
            if (collectorTool) {
              result = await collectorTool.handler(args || {});
            } else {
              throw new Error(`Collector tool not found: ${name}`);
            }
            break;
          case 'think_validate_artifacts':
            // Find the matching validation tool and call its handler
            const validationTool = getValidationTools().find(t => t.name === name);
            if (validationTool) {
              result = await validationTool.handler(args || {});
            } else {
              throw new Error(`Validation tool not found: ${name}`);
            }
            break;
          case 'think_llm_rewrite_prep':
          case 'think_llm_apply':
            // Find the matching LLM rewrite tool and call its handler
            const llmTool = getLlmRewriteTools().find(t => t.name === name);
            if (llmTool) {
              result = await llmTool.handler(args || {});
            } else {
              throw new Error(`LLM rewrite tool not found: ${name}`);
            }
            break;
          default:
            throw new Error(`Unknown tool: ${name}`);
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Thinking Tools MCP server running on stdio');
    console.error('52 tools available: 15 cognitive frameworks + 3 reasoning modes + 6 Context7 API tools + 8 Context Engine tools + 4 Web Context tools + 6 Cognitive Operators + 1 Evidence Collector + 1 Validator + 2 LLM Rewrite + 6 Thinking CLI');
    console.error(`Context7 API: ${process.env.CONTEXT7_API_KEY ? 'Authenticated' : 'Public access (no API key)'}`);
    console.error(`Context Engine: ${process.env.CTX_EMBED_PROVIDER || 'ollama'} embeddings @ ${process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434'}`);
    console.error(`Web Context: ${process.env.TAVILY_API_KEY || process.env.BING_SUBSCRIPTION_KEY || process.env.SERPAPI_KEY ? 'API keys configured' : 'No API keys (fetch/crawl only)'}`);
    console.error(`Cognitive Operators: Auto-populated SWOT, Devil's Advocate, Premortem, Decision Matrix, Critique, Auto Packet`);
    console.error(`Evidence & LLM: Collect evidence, Validate artifacts, LLM rewrite prep/apply`);
  }
}

const server = new ThinkingToolsMCP();
server.run().catch(console.error);

