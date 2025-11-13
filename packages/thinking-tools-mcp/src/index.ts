#!/usr/bin/env node

/**
 * @robinsonai/thinking-tools-mcp
 * Unified Thinking Tools MCP with Robinson's Context Engine
 * Centralized registry pattern - every tool Augment sees is callable
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  InitializeRequestSchema
} from '@modelcontextprotocol/sdk/types.js';

import { buildServerContext } from './lib/context.js';

// ---- DO NOT WRITE TO STDOUT BEFORE HANDSHAKE ----
const log = (...a: any[]) => console.error('[ttmcp]', ...a);
console.log = (...a: any[]) => console.error('[ttmcp]', ...a); // force logs to stderr

process.on('unhandledRejection', e => console.error('[unhandledRejection]', e));
process.on('uncaughtException', e => console.error('[uncaughtException]', e));

// Import context tools
import { contextIndexRepoTool, contextIndexRepoDescriptor } from './tools/context_index_repo.js';
import { contextQueryTool, contextQueryDescriptor } from './tools/context_query.js';
import { contextSmartQueryTool, contextSmartQueryDescriptor } from './tools/context_smart_query.js';
import { contextStatsTool, contextStatsDescriptor } from './tools/context_stats.js';
import { ensureFreshIndexTool, ensureFreshIndexDescriptor } from './tools/ensure_fresh_index.js';
import { contextIndexFullTool, contextIndexFullDescriptor } from './tools/context_index_full.js';
import { contextRefreshTool, contextRefreshDescriptor } from './tools/context_refresh.js';

// Stateful framework implementations
import { devilsAdvocateTool, devilsAdvocateDescriptor } from './tools/framework-devils-advocate.js';
import { swotTool, swotDescriptor } from './tools/framework-swot.js';
import { firstPrinciplesTool, firstPrinciplesDescriptor } from './tools/framework-first-principles.js';
import { rootCauseTool, rootCauseDescriptor } from './tools/framework-root-cause.js';
import { premortemTool, premortemDescriptor } from './tools/framework-premortem.js';
import { criticalThinkingTool, criticalThinkingDescriptor } from './tools/framework-critical-thinking.js';
import { lateralThinkingTool, lateralThinkingDescriptor } from './tools/framework-lateral-thinking.js';
import { redTeamTool, redTeamDescriptor } from './tools/framework-red-team.js';
import { blueTeamTool, blueTeamDescriptor } from './tools/framework-blue-team.js';
import { decisionMatrixTool, decisionMatrixDescriptor } from './tools/framework-decision-matrix.js';
import { socraticTool, socraticDescriptor } from './tools/framework-socratic.js';
import { systemsThinkingTool, systemsThinkingDescriptor } from './tools/framework-systems-thinking.js';
import { scenarioPlanningTool, scenarioPlanningDescriptor } from './tools/framework-scenario-planning.js';
import { brainstormingTool, brainstormingDescriptor } from './tools/framework-brainstorming.js';
import { mindMappingTool, mindMappingDescriptor } from './tools/framework-mind-mapping.js';
import { inversionTool, inversionDescriptor } from './tools/framework-inversion.js';
import { secondOrderThinkingTool, secondOrderThinkingDescriptor } from './tools/framework-second-order-thinking.js';
import { oodaLoopTool, oodaLoopDescriptor } from './tools/framework-ooda-loop.js';
import { cynefinFrameworkTool, cynefinFrameworkDescriptor } from './tools/framework-cynefin-framework.js';
import { designThinkingTool, designThinkingDescriptor } from './tools/framework-design-thinking.js';
import { probabilisticThinkingTool, probabilisticThinkingDescriptor } from './tools/framework-probabilistic-thinking.js';
import { bayesianUpdatingTool, bayesianUpdatingDescriptor } from './tools/framework-bayesian-updating.js';
import {
  sequentialThinkingTool,
  parallelThinkingTool,
  reflectiveThinkingTool,
} from './tools/sequential-thinking-impl.js';
import {
  context7ResolveLibraryId,
  context7GetLibraryDocs,
  context7SearchLibraries,
  context7CompareVersions,
  context7GetExamples,
  context7GetMigrationGuide,
} from './tools/context7.js';
import {
  bridgedContext7ResolveLibraryId,
  bridgedContext7GetLibraryDocs,
  bridgedContext7SearchLibraries,
  bridgedContext7CompareVersions,
  bridgedContext7GetExamples,
  bridgedContext7GetMigrationGuide,
} from './tools/context7_bridge.js';
import { contextCLITools } from './context-cli-tools.js';
import { getWebContextTools } from './tools/context_web.js';
import { getCognitiveTools } from './tools/cognitive_tools.js';
import { getCollectorTools } from './tools/collect_evidence.js';
import { getValidationTools } from './tools/validate_artifacts.js';
import { getLlmRewriteTools } from './tools/llm_rewrite.js';
import {
  ctxImportEvidenceTool,
  ctxImportEvidenceDescriptor,
} from './tools/ctx_import_evidence.js';
import {
  ctxMergeConfigTool,
  ctxMergeConfigDescriptor,
} from './tools/ctx_merge_config.js';
import {
  context7AdapterTool,
  context7AdapterDescriptor,
} from './tools/context7_adapter.js';
import { contextNeighborhoodTool } from './tools/context_neighborhood.js';
import { contextRetrieveCodeTool } from './tools/context_retrieve_code.js';
import { contextFindSymbolTool } from './tools/context_find_symbol.js';
import { contextFindCallersTool } from './tools/context_find_callers.js';
import { getPaths } from './context/store.js';
import { ddg, ingestUrls } from './context/web.js';
import { summarizeDiff } from './context/diff.js';

// Documentation intelligence tools
import { docsFindTool, docsFindDescriptor } from './tools/docs_find.js';
import { docsAuditTool, docsAuditDescriptor } from './tools/docs_audit_repo.js';
import { docsDupesTool, docsDupesDescriptor } from './tools/docs_duplicates.js';
import { docsMarkDeprecatedTool, docsMarkDeprecatedDescriptor } from './tools/docs_mark_deprecated.js';
import { docsGraphTool, docsGraphDescriptor } from './tools/docs_graph.js';

// New web search tools
import { webSearchTool, webSearchDescriptor, webSearchAndImportTool, webSearchAndImportDescriptor } from './tools/context_web_search.js';
import { healthTool, healthDescriptor } from './tools/health_check.js';

// Tool registry entry type
type Entry = {
  description: string;
  inputSchema: any;
  handler: (args: any, ctx: any) => Promise<any>;
};

// Centralized tool registry
const registry: Record<string, Entry> = {
  // Context Engine tools (new pattern with descriptors)
  [contextIndexRepoDescriptor.name]: {
    ...contextIndexRepoDescriptor,
    handler: contextIndexRepoTool,
  },
  [ensureFreshIndexDescriptor.name]: {
    ...ensureFreshIndexDescriptor,
    handler: ensureFreshIndexTool,
  },
  [contextIndexFullDescriptor.name]: {
    ...contextIndexFullDescriptor,
    handler: contextIndexFullTool,
  },
  [contextQueryDescriptor.name]: {
    ...contextQueryDescriptor,
    handler: contextQueryTool,
  },
  [contextSmartQueryDescriptor.name]: {
    ...contextSmartQueryDescriptor,
    handler: contextSmartQueryTool,
  },
  [contextStatsDescriptor.name]: {
    ...contextStatsDescriptor,
    handler: contextStatsTool,
  },
  [contextRefreshDescriptor.name]: {
    ...contextRefreshDescriptor,
    handler: contextRefreshTool,
  },

  // Context7 integration tools
  [ctxImportEvidenceDescriptor.name]: {
    ...ctxImportEvidenceDescriptor,
    handler: ctxImportEvidenceTool,
  },
  [ctxMergeConfigDescriptor.name]: {
    ...ctxMergeConfigDescriptor,
    handler: ctxMergeConfigTool,
  },
  [context7AdapterDescriptor.name]: {
    ...context7AdapterDescriptor,
    handler: context7AdapterTool,
  },

  // Documentation intelligence tools
  [docsFindDescriptor.name]: {
    ...docsFindDescriptor,
    handler: docsFindTool,
  },
  [docsAuditDescriptor.name]: {
    ...docsAuditDescriptor,
    handler: docsAuditTool,
  },
  [docsDupesDescriptor.name]: {
    ...docsDupesDescriptor,
    handler: docsDupesTool,
  },
  [docsMarkDeprecatedDescriptor.name]: {
    ...docsMarkDeprecatedDescriptor,
    handler: docsMarkDeprecatedTool,
  },
  [docsGraphDescriptor.name]: {
    ...docsGraphDescriptor,
    handler: docsGraphTool,
  },

  // Web search tools
  [webSearchDescriptor.name]: {
    ...webSearchDescriptor,
    handler: webSearchTool,
  },
  [webSearchAndImportDescriptor.name]: {
    ...webSearchAndImportDescriptor,
    handler: webSearchAndImportTool,
  },

  // Health check (comprehensive)
  [healthDescriptor.name]: {
    ...healthDescriptor,
    handler: async (args, ctx) => healthTool(args, ctx, Object.keys(registry)),
  },

  // Healthcheck (legacy)
  healthcheck: {
    description: 'Return ok + workspace root (server wiring test)',
    inputSchema: { type: 'object' , additionalProperties: false },
    handler: async (_args, ctx) => ({ ok: true, workspaceRoot: ctx.workspaceRoot }),
  },
  
  // Cognitive framework tools (existing pattern)
  // NEW: Stateful framework implementation
  [devilsAdvocateDescriptor.name]: {
    ...devilsAdvocateDescriptor,
    handler: devilsAdvocateTool,
  },
  
  [firstPrinciplesDescriptor.name]: {
    ...firstPrinciplesDescriptor,
    handler: firstPrinciplesTool,
  },
  
  [rootCauseDescriptor.name]: {
    ...rootCauseDescriptor,
    handler: rootCauseTool,
  },
  
  [swotDescriptor.name]: {
    ...swotDescriptor,
    handler: swotTool,
  },
  
  [premortemDescriptor.name]: {
    ...premortemDescriptor,
    handler: premortemTool,
  },
  
  [criticalThinkingDescriptor.name]: {
    ...criticalThinkingDescriptor,
    handler: criticalThinkingTool,
  },

  [lateralThinkingDescriptor.name]: {
    ...lateralThinkingDescriptor,
    handler: lateralThinkingTool,
  },
  
  [redTeamDescriptor.name]: {
    ...redTeamDescriptor,
    handler: redTeamTool,
  },

  [blueTeamDescriptor.name]: {
    ...blueTeamDescriptor,
    handler: blueTeamTool,
  },
  
  [decisionMatrixDescriptor.name]: {
    ...decisionMatrixDescriptor,
    handler: decisionMatrixTool,
  },

  [socraticDescriptor.name]: {
    ...socraticDescriptor,
    handler: socraticTool,
  },
  
  [systemsThinkingDescriptor.name]: {
    ...systemsThinkingDescriptor,
    handler: systemsThinkingTool,
  },

  [scenarioPlanningDescriptor.name]: {
    ...scenarioPlanningDescriptor,
    handler: scenarioPlanningTool,
  },
  
  [brainstormingDescriptor.name]: {
    ...brainstormingDescriptor,
    handler: brainstormingTool,
  },

  [mindMappingDescriptor.name]: {
    ...mindMappingDescriptor,
    handler: mindMappingTool,
  },

  // NEW: Missing frameworks from CognitiveCompass MCP
  [inversionDescriptor.name]: {
    ...inversionDescriptor,
    handler: inversionTool,
  },

  [secondOrderThinkingDescriptor.name]: {
    ...secondOrderThinkingDescriptor,
    handler: secondOrderThinkingTool,
  },

  [oodaLoopDescriptor.name]: {
    ...oodaLoopDescriptor,
    handler: oodaLoopTool,
  },

  [cynefinFrameworkDescriptor.name]: {
    ...cynefinFrameworkDescriptor,
    handler: cynefinFrameworkTool,
  },

  [designThinkingDescriptor.name]: {
    ...designThinkingDescriptor,
    handler: designThinkingTool,
  },

  [probabilisticThinkingDescriptor.name]: {
    ...probabilisticThinkingDescriptor,
    handler: probabilisticThinkingTool,
  },

  [bayesianUpdatingDescriptor.name]: {
    ...bayesianUpdatingDescriptor,
    handler: bayesianUpdatingTool,
  },
};

// Sequential thinking tools
registry.sequential_thinking = {
  description: 'Step-by-step reasoning with state tracking',
  inputSchema: {
    type: 'object', additionalProperties: false,
    properties: {
      problem: { type: 'string', description: 'Problem to solve' },
      steps: { type: 'number', description: 'Number of steps' },
    },
    required: ['problem'],
  },
  handler: async (args, ctx) => sequentialThinkingTool(args, ctx),
};

registry.parallel_thinking = {
  description: 'Explore multiple solution paths simultaneously',
  inputSchema: {
    type: 'object', additionalProperties: false,
    properties: {
      problem: { type: 'string', description: 'Problem to solve' },
      paths: { type: 'number', description: 'Number of parallel paths' },
    },
    required: ['problem'],
  },
  handler: async (args, ctx) => parallelThinkingTool(args, ctx),
};

registry.reflective_thinking = {
  description: 'Review and critique previous reasoning',
  inputSchema: {
    type: 'object', additionalProperties: false,
    properties: {
      reasoning: { type: 'string', description: 'Previous reasoning to reflect on' },
    },
    required: ['reasoning'],
  },
  handler: async (args, ctx) => reflectiveThinkingTool(args, ctx),
};

// Context7 tools (enhanced with caching + evidence import)
// Works in concert with Robinson's Toolkit MCP:
// - Robinson's Toolkit = Raw API access
// - Thinking Tools = API access + shared caching + auto-import to evidence
registry.context7_resolve_library_id = {
  description: 'Resolve library name to Context7 ID (with shared caching + auto-import to evidence store)',
  inputSchema: {
    type: 'object', additionalProperties: false,
    properties: {
      library: { type: 'string', description: 'Library name' },
    },
    required: ['library'],
  },
  handler: async (args, ctx) => bridgedContext7ResolveLibraryId(args, ctx),
};

registry.context7_get_library_docs = {
  description: 'Get documentation for a library (with shared caching + auto-import to evidence store)',
  inputSchema: {
    type: 'object', additionalProperties: false,
    properties: {
      library: { type: 'string', description: 'Library name or ID' },
      version: { type: 'string', description: 'Version' },
    },
    required: ['library'],
  },
  handler: async (args, ctx) => bridgedContext7GetLibraryDocs(args, ctx),
};

registry.context7_search_libraries = {
  description: 'Search across library documentation (with shared caching + auto-import to evidence store)',
  inputSchema: {
    type: 'object', additionalProperties: false,
    properties: {
      query: { type: 'string', description: 'Search query' },
      libraries: { type: 'array', items: { type: 'string' } },
    },
    required: ['query'],
  },
  handler: async (args, ctx) => bridgedContext7SearchLibraries(args, ctx),
};

registry.context7_compare_versions = {
  description: 'Compare library versions (with shared caching + auto-import to evidence store)',
  inputSchema: {
    type: 'object', additionalProperties: false,
    properties: {
      library: { type: 'string', description: 'Library name' },
      from: { type: 'string', description: 'From version' },
      to: { type: 'string', description: 'To version' },
    },
    required: ['library', 'from', 'to'],
  },
  handler: async (args, ctx) => bridgedContext7CompareVersions(args, ctx),
};

registry.context7_get_examples = {
  description: 'Get code examples for a library (with shared caching + auto-import to evidence store)',
  inputSchema: {
    type: 'object', additionalProperties: false,
    properties: {
      library: { type: 'string', description: 'Library name' },
      topic: { type: 'string', description: 'Topic or feature' },
    },
    required: ['library'],
  },
  handler: async (args, ctx) => bridgedContext7GetExamples(args, ctx),
};

registry.context7_get_migration_guide = {
  description: 'Get migration guide between versions (with shared caching + auto-import to evidence store)',
  inputSchema: {
    type: 'object', additionalProperties: false,
    properties: {
      library: { type: 'string', description: 'Library name' },
      from: { type: 'string', description: 'From version' },
      to: { type: 'string', description: 'To version' },
    },
    required: ['library', 'from', 'to'],
  },
  handler: async (args, ctx) => bridgedContext7GetMigrationGuide(args, ctx),
};

// Additional context tools
registry.context_reset = {
  description: 'Reset context engine index',
  inputSchema: { type: 'object' , additionalProperties: false },
  handler: async (args, ctx) => {
    await ctx.ctx.reset();
    return { ok: true };
  },
};

registry.context_web_search = {
  description: 'Search the web with DuckDuckGo',
  inputSchema: {
    type: 'object', additionalProperties: false,
    properties: {
      q: { type: 'string', description: 'Search query' },
      k: { type: 'number', description: 'Number of results' },
    },
    required: ['q'],
  },
  handler: async (args, ctx) => {
    const urls = await ddg(args.q, args.k || 5);
    return { urls };
  },
};

registry.context_ingest_urls = {
  description: 'Ingest URLs into context',
  inputSchema: {
    type: 'object', additionalProperties: false,
    properties: {
      urls: { type: 'array', items: { type: 'string' } },
      tags: { type: 'array', items: { type: 'string' } },
    },
    required: ['urls'],
  },
  handler: async (args, ctx) => ingestUrls(args.urls, args.tags || []),
};

registry.context_summarize_diff = {
  description: 'Summarize git diff',
  inputSchema: {
    type: 'object', additionalProperties: false,
    properties: {
      range: { type: 'string', description: 'Git range (e.g., HEAD~1..HEAD)' },
    },
  },
  handler: async (args, ctx) => summarizeDiff(args.range || 'HEAD~1..HEAD'),
};

registry.context_neighborhood = {
  description: 'Get code neighborhood for a file',
  inputSchema: {
    type: 'object', additionalProperties: false,
    properties: {
      file: { type: 'string', description: 'File path' },
    },
    required: ['file'],
  },
  handler: async (args, ctx) => contextNeighborhoodTool(args, ctx),
};

registry.context_retrieve_code = {
  description: 'Retrieve code by semantic query',
  inputSchema: {
    type: 'object', additionalProperties: false,
    properties: {
      query: { type: 'string', description: 'What code to retrieve' },
      top_k: { type: 'number', description: 'Number of results' },
    },
    required: ['query'],
  },
  handler: async (args, ctx) => contextRetrieveCodeTool(args, ctx),
};

registry.context_find_symbol = {
  description: 'Find symbol definition',
  inputSchema: {
    type: 'object', additionalProperties: false,
    properties: {
      symbol: { type: 'string', description: 'Symbol name' },
    },
    required: ['symbol'],
  },
  handler: async (args, ctx) => contextFindSymbolTool(args, ctx),
};

registry.context_find_callers = {
  description: 'Find callers of a function',
  inputSchema: {
    type: 'object', additionalProperties: false,
    properties: {
      function: { type: 'string', description: 'Function name' },
    },
    required: ['function'],
  },
  handler: async (args, ctx) => contextFindCallersTool(args, ctx),
};

// Add integration tools
registry[ctxImportEvidenceDescriptor.name] = {
  ...ctxImportEvidenceDescriptor,
  handler: ctxImportEvidenceTool,
};

registry[ctxMergeConfigDescriptor.name] = {
  ...ctxMergeConfigDescriptor,
  handler: ctxMergeConfigTool,
};

registry[context7AdapterDescriptor.name] = {
  ...context7AdapterDescriptor,
  handler: context7AdapterTool,
};

// Add dynamic tool collections
for (const tool of contextCLITools) {
  registry[tool.name] = {
    description: tool.description,
    inputSchema: tool.inputSchema,
    handler: async (args, ctx) => tool.handler(),
  };
}

for (const tool of getWebContextTools()) {
  registry[tool.name] = {
    description: tool.description,
    inputSchema: tool.inputSchema,
    handler: async (args, ctx) => tool.handler(args),
  };
}

for (const tool of getCognitiveTools()) {
  registry[tool.name] = {
    description: tool.description,
    inputSchema: tool.inputSchema,
    handler: async (args, ctx) => tool.handler(args),
  };
}

for (const tool of getCollectorTools()) {
  registry[tool.name] = {
    description: tool.description,
    inputSchema: tool.inputSchema,
    handler: async (args, ctx) => tool.handler(args),
  };
}

for (const tool of getValidationTools()) {
  registry[tool.name] = {
    description: tool.description,
    inputSchema: tool.inputSchema,
    handler: async (args, ctx) => tool.handler(args),
  };
}

for (const tool of getLlmRewriteTools()) {
  registry[tool.name] = {
    description: tool.description,
    inputSchema: tool.inputSchema,
    handler: async (args, ctx) => tool.handler(args),
  };
}

// Create and configure server WITH CAPABILITIES (fixes 'does not support tools/list')
const server = new Server(
  {
    name: 'thinking-tools-mcp',
    version: '1.10.0',
  },
  {
    capabilities: {
      tools: {}  // REQUIRED for tools/list
    }
  }
);

// Initialize handler - tells agents how this server works
server.setRequestHandler(InitializeRequestSchema, async (request) => ({
  protocolVersion: "2024-11-05",
  capabilities: {
    tools: {},
  },
  serverInfo: {
    name: "thinking-tools-mcp",
    version: "1.21.5",

    // 🎯 Server Manifest - Explains how Thinking Tools MCP works
    metadata: {
      description: "Cognitive frameworks and context engine for deep thinking and analysis",

      // Tool categories
      categories: [
        {
          name: "cognitive_frameworks",
          display_name: "Cognitive Frameworks",
          description: "Stateful thinking frameworks that guide the primary agent through structured analysis",
          tool_count: 24,
          pattern: "STATEFUL - Initialize session, then record steps",
          tools: [
            "framework_devils_advocate",
            "framework_first_principles",
            "framework_root_cause",
            "framework_swot",
            "framework_premortem",
            "framework_critical_thinking",
            "framework_lateral_thinking",
            "framework_red_team",
            "framework_blue_team",
            "framework_decision_matrix",
            "framework_socratic",
            "framework_systems_thinking",
            "framework_scenario_planning",
            "framework_brainstorming",
            "framework_mind_mapping",
            "framework_inversion",
            "framework_second_order_thinking",
            "framework_ooda_loop",
            "framework_cynefin_framework",
            "framework_design_thinking",
            "framework_probabilistic_thinking",
            "framework_bayesian_updating",
            "sequential_thinking",
            "parallel_thinking",
            "reflective_thinking"
          ]
        },
        {
          name: "context_engine",
          display_name: "Context Engine",
          description: "Semantic search and indexing for codebase context",
          tool_count: 10,
          tools: [
            "context_index_repo",
            "context_index_full",
            "context_refresh",
            "ensure_fresh_index",
            "context_query",
            "context_smart_query",
            "context_stats",
            "context_retrieve_code",
            "context_find_symbol",
            "context_find_callers"
          ]
        },
        {
          name: "context7",
          display_name: "Context7 Integration",
          description: "Library documentation access and search",
          tool_count: 6,
          tools: [
            "context7_resolve_library_id",
            "context7_get_library_docs",
            "context7_search_libraries",
            "context7_compare_versions",
            "context7_get_examples",
            "context7_get_migration_guide"
          ]
        },
        {
          name: "documentation",
          display_name: "Documentation Intelligence",
          description: "Find, analyze, and manage documentation",
          tool_count: 5,
          tools: [
            "docs_find",
            "docs_audit_repo",
            "docs_find_duplicates",
            "docs_mark_deprecated",
            "docs_graph"
          ]
        },
        {
          name: "web",
          display_name: "Web Tools",
          description: "Web search and content ingestion",
          tool_count: 3,
          tools: [
            "context_web_search",
            "context_web_search_and_import",
            "context_ingest_urls"
          ]
        },
        {
          name: "evidence",
          display_name: "Evidence Collection",
          description: "Collect and import evidence for analysis",
          tool_count: 3,
          tools: [
            "think_collect_evidence",
            "ctx_import_evidence",
            "ctx_merge_config"
          ]
        }
      ],

      // How cognitive frameworks work
      framework_pattern: {
        description: "All cognitive frameworks follow a stateful pattern based on Sequential Thinking",
        workflow: [
          "1. Initialize session with 'problem' parameter - gathers evidence and sets up state",
          "2. Record steps with 'stepNumber' and 'content' - tracks your thinking process",
          "3. Framework maintains history and provides structure",
          "4. Framework returns metadata, NOT analysis (you provide the analysis)",
          "5. Framework logs formatted output to stderr for visual feedback"
        ],
        example: {
          step1: {
            tool: "framework_devils_advocate",
            input: { problem: "Should we migrate to microservices?", totalSteps: 5 },
            output: "Session initialized with evidence from codebase"
          },
          step2: {
            tool: "framework_devils_advocate",
            input: { stepNumber: 1, content: "Assumption: Microservices will improve scalability", nextStepNeeded: true },
            output: "Step 1 recorded, ready for step 2"
          }
        }
      },

      // Standard parameters
      standard_parameters: {
        initialization: {
          problem: { type: "string", required: true, description: "The problem or question to analyze" },
          context: { type: "string", required: false, description: "Additional context" },
          totalSteps: { type: "number", required: false, default: 5, description: "Expected number of steps" }
        },
        step_recording: {
          stepNumber: { type: "number", required: true, description: "Current step number" },
          content: { type: "string", required: true, description: "Your analysis for this step" },
          nextStepNeeded: { type: "boolean", required: true, description: "Whether another step is needed" }
        }
      },

      // Quick start guide
      quick_start: {
        description: "How to use Thinking Tools MCP effectively",
        steps: [
          "1. Choose a cognitive framework (framework_devils_advocate, framework_swot, etc.)",
          "2. Initialize with your problem/question",
          "3. Framework gathers evidence from codebase using Context Engine",
          "4. Record your thinking step-by-step",
          "5. Framework tracks history and provides structure",
          "6. Complete session when analysis is done"
        ],
        best_practices: [
          "Use frameworks to structure YOUR thinking, not to generate analysis",
          "Provide detailed content in each step",
          "Review evidence gathered during initialization",
          "Use multiple frameworks for complex problems (e.g., SWOT + Premortem)",
          "Export completed sessions to Context7 for future reference"
        ]
      },

      // Key differences from other MCP servers
      unique_features: [
        "STATEFUL frameworks - maintain session state across calls",
        "Evidence gathering - automatically searches codebase for relevant context",
        "Context Engine integration - semantic search and indexing",
        "Context7 integration - access library documentation",
        "Thinking artifacts - export sessions for reuse",
        "Blended search - combines local context + imported evidence"
      ]
    }
  }
}));

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: Object.entries(registry).map(([name, meta]) => ({
    name,
    description: meta.description,
    inputSchema: meta.inputSchema
  }))
}));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const entry = registry[req.params.name];
  if (!entry) {
    throw new Error(`Unknown tool: ${req.params.name}`);
  }

  const ctx = buildServerContext(req.params.arguments || {});

  try {
    const result = await entry.handler(req.params.arguments || {}, ctx);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (e: any) {
    console.error(`[${req.params.name}]`, e?.stack || e);
    return {
      content: [
        {
          type: 'text',
          text: `ERROR: ${e?.message || String(e)}`,
        },
      ],
      isError: true,
    };
  }
});

// Start server (keep event loop alive on stdio)
log(`Starting server with ${Object.keys(registry).length} tools`);
log(`Workspace root: ${process.env.WORKSPACE_ROOT || process.cwd()}`);
await server.connect(new StdioServerTransport());
log('Server connected and ready');

