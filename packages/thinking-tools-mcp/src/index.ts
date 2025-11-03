#!/usr/bin/env node

/**
 * @robinsonai/thinking-tools-mcp
 * Unified Thinking Tools MCP with Robinson's Context Engine
 * Centralized registry pattern - every tool Augment sees is callable
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';

import { buildServerContext } from './lib/context.js';

// ---- DO NOT WRITE TO STDOUT BEFORE HANDSHAKE ----
const log = (...a: any[]) => console.error('[ttmcp]', ...a);
console.log = (...a: any[]) => console.error('[ttmcp]', ...a); // force logs to stderr

process.on('unhandledRejection', e => console.error('[unhandledRejection]', e));
process.on('uncaughtException', e => console.error('[uncaughtException]', e));

// Import context tools
import { contextIndexRepoTool, contextIndexRepoDescriptor } from './tools/context_index_repo.js';
import { contextQueryTool, contextQueryDescriptor } from './tools/context_query.js';
import { contextStatsTool, contextStatsDescriptor } from './tools/context_stats.js';

// Import all other tool modules (keeping existing imports)
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
  [contextQueryDescriptor.name]: {
    ...contextQueryDescriptor,
    handler: contextQueryTool,
  },
  [contextStatsDescriptor.name]: {
    ...contextStatsDescriptor,
    handler: contextStatsTool,
  },
  
  // Healthcheck
  healthcheck: {
    description: 'Return ok + workspace root (server wiring test)',
    inputSchema: { type: 'object', properties: {} },
    handler: async (_args, ctx) => ({ ok: true, workspaceRoot: ctx.workspaceRoot }),
  },
  
  // Cognitive framework tools (existing pattern)
  devils_advocate: {
    description: 'Challenge assumptions and find flaws in plans',
    inputSchema: {
      type: 'object',
      properties: {
        context: { type: 'string', description: 'The plan or idea to challenge' },
        goal: { type: 'string', description: 'What you\'re trying to achieve' },
        depth: { type: 'string', enum: ['quick', 'deep'] },
      },
      required: ['context'],
    },
    handler: async (args, ctx) => devilsAdvocate(args),
  },
  
  first_principles: {
    description: 'Break down complex problems to fundamental truths',
    inputSchema: {
      type: 'object',
      properties: {
        problem: { type: 'string', description: 'The problem to analyze' },
        domain: { type: 'string', description: 'Problem domain' },
      },
      required: ['problem'],
    },
    handler: async (args, ctx) => firstPrinciples(args),
  },
  
  root_cause: {
    description: 'Use 5 Whys technique to find underlying causes',
    inputSchema: {
      type: 'object',
      properties: {
        problem: { type: 'string', description: 'The problem to analyze' },
        context: { type: 'string', description: 'Additional context' },
      },
      required: ['problem'],
    },
    handler: async (args, ctx) => rootCauseAnalysis(args),
  },
  
  swot_analysis: {
    description: 'Analyze Strengths, Weaknesses, Opportunities, Threats',
    inputSchema: {
      type: 'object',
      properties: {
        subject: { type: 'string', description: 'What to analyze' },
        context: { type: 'string', description: 'Additional context' },
        perspective: { type: 'string', enum: ['technical', 'business', 'product', 'team'] },
      },
      required: ['subject'],
    },
    handler: async (args, ctx) => swotAnalysis(args),
  },
  
  premortem_analysis: {
    description: 'Imagine project failure and work backward',
    inputSchema: {
      type: 'object',
      properties: {
        project: { type: 'string', description: 'The project or initiative' },
        context: { type: 'string', description: 'Additional context' },
      },
      required: ['project'],
    },
    handler: async (args, ctx) => premortemAnalysis(args),
  },
  
  critical_thinking: {
    description: 'Evaluate arguments, evidence, and logical reasoning',
    inputSchema: {
      type: 'object',
      properties: {
        argument: { type: 'string', description: 'The argument to evaluate' },
        context: { type: 'string', description: 'Additional context' },
        depth: { type: 'string', enum: ['quick', 'deep'] },
      },
      required: ['argument'],
    },
    handler: async (args, ctx) => criticalThinking(args),
  },
  
  lateral_thinking: {
    description: 'Generate creative, non-obvious solutions',
    inputSchema: {
      type: 'object',
      properties: {
        problem: { type: 'string', description: 'The problem to solve creatively' },
        context: { type: 'string', description: 'Additional context' },
        constraints: { type: 'array', items: { type: 'string' } },
      },
      required: ['problem'],
    },
    handler: async (args, ctx) => lateralThinking(args),
  },
  
  red_team: {
    description: 'Attack the plan/design to find vulnerabilities',
    inputSchema: {
      type: 'object',
      properties: {
        plan: { type: 'string', description: 'The plan or design to attack' },
        context: { type: 'string', description: 'Additional context' },
        focus: { type: 'string', enum: ['security', 'reliability', 'performance', 'all'] },
      },
      required: ['plan'],
    },
    handler: async (args, ctx) => redTeam(args),
  },
  
  blue_team: {
    description: 'Defend against attacks and strengthen the plan',
    inputSchema: {
      type: 'object',
      properties: {
        plan: { type: 'string', description: 'The plan or design to defend' },
        threats: { type: 'array', items: { type: 'string' } },
        context: { type: 'string', description: 'Additional context' },
      },
      required: ['plan'],
    },
    handler: async (args, ctx) => blueTeam(args),
  },
  
  decision_matrix: {
    description: 'Weighted decision-making for comparing options',
    inputSchema: {
      type: 'object',
      properties: {
        options: { type: 'array', items: { type: 'string' } },
        criteria: { type: 'array', items: { type: 'string' } },
        context: { type: 'string', description: 'Additional context' },
      },
      required: ['options'],
    },
    handler: async (args, ctx) => decisionMatrix(args),
  },
  
  socratic_questioning: {
    description: 'Deep inquiry through probing questions',
    inputSchema: {
      type: 'object',
      properties: {
        topic: { type: 'string', description: 'The topic to explore' },
        context: { type: 'string', description: 'Additional context' },
        depth: { type: 'string', enum: ['quick', 'deep'] },
      },
      required: ['topic'],
    },
    handler: async (args, ctx) => socratic(args),
  },
  
  systems_thinking: {
    description: 'Understand interconnections and feedback loops',
    inputSchema: {
      type: 'object',
      properties: {
        system: { type: 'string', description: 'The system to analyze' },
        context: { type: 'string', description: 'Additional context' },
      },
      required: ['system'],
    },
    handler: async (args, ctx) => systemsThinking(args),
  },
  
  scenario_planning: {
    description: 'Explore multiple possible futures',
    inputSchema: {
      type: 'object',
      properties: {
        situation: { type: 'string', description: 'The current situation' },
        timeframe: { type: 'string', description: 'Time horizon' },
        context: { type: 'string', description: 'Additional context' },
      },
      required: ['situation'],
    },
    handler: async (args, ctx) => scenarioPlanning(args),
  },
  
  brainstorming: {
    description: 'Generate many ideas quickly without judgment',
    inputSchema: {
      type: 'object',
      properties: {
        prompt: { type: 'string', description: 'What to brainstorm about' },
        context: { type: 'string', description: 'Additional context' },
        quantity: { type: 'number', description: 'Number of ideas' },
      },
      required: ['prompt'],
    },
    handler: async (args, ctx) => brainstorming(args),
  },
  
  mind_mapping: {
    description: 'Visual organization of ideas and concepts',
    inputSchema: {
      type: 'object',
      properties: {
        topic: { type: 'string', description: 'Central topic' },
        context: { type: 'string', description: 'Additional context' },
      },
      required: ['topic'],
    },
    handler: async (args, ctx) => mindMapping(args),
  },
};

// Sequential thinking tools
registry.sequential_thinking = {
  description: 'Step-by-step reasoning with state tracking',
  inputSchema: {
    type: 'object',
    properties: {
      problem: { type: 'string', description: 'Problem to solve' },
      steps: { type: 'number', description: 'Number of steps' },
    },
    required: ['problem'],
  },
  handler: async (args, ctx) => sequentialThinkingTool(args),
};

registry.parallel_thinking = {
  description: 'Explore multiple solution paths simultaneously',
  inputSchema: {
    type: 'object',
    properties: {
      problem: { type: 'string', description: 'Problem to solve' },
      paths: { type: 'number', description: 'Number of parallel paths' },
    },
    required: ['problem'],
  },
  handler: async (args, ctx) => parallelThinkingTool(args),
};

registry.reflective_thinking = {
  description: 'Review and critique previous reasoning',
  inputSchema: {
    type: 'object',
    properties: {
      reasoning: { type: 'string', description: 'Previous reasoning to reflect on' },
    },
    required: ['reasoning'],
  },
  handler: async (args, ctx) => reflectiveThinkingTool(args),
};

// Context7 tools
registry.context7_resolve_library_id = {
  description: 'Resolve library name to Context7 ID',
  inputSchema: {
    type: 'object',
    properties: {
      library: { type: 'string', description: 'Library name' },
    },
    required: ['library'],
  },
  handler: async (args, ctx) => context7ResolveLibraryId(args),
};

registry.context7_get_library_docs = {
  description: 'Get documentation for a library',
  inputSchema: {
    type: 'object',
    properties: {
      library: { type: 'string', description: 'Library name or ID' },
      version: { type: 'string', description: 'Version' },
    },
    required: ['library'],
  },
  handler: async (args, ctx) => context7GetLibraryDocs(args),
};

registry.context7_search_libraries = {
  description: 'Search across library documentation',
  inputSchema: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Search query' },
      libraries: { type: 'array', items: { type: 'string' } },
    },
    required: ['query'],
  },
  handler: async (args, ctx) => context7SearchLibraries(args),
};

registry.context7_compare_versions = {
  description: 'Compare library versions',
  inputSchema: {
    type: 'object',
    properties: {
      library: { type: 'string', description: 'Library name' },
      from: { type: 'string', description: 'From version' },
      to: { type: 'string', description: 'To version' },
    },
    required: ['library', 'from', 'to'],
  },
  handler: async (args, ctx) => context7CompareVersions(args),
};

registry.context7_get_examples = {
  description: 'Get code examples for a library',
  inputSchema: {
    type: 'object',
    properties: {
      library: { type: 'string', description: 'Library name' },
      topic: { type: 'string', description: 'Topic or feature' },
    },
    required: ['library'],
  },
  handler: async (args, ctx) => context7GetExamples(args),
};

registry.context7_get_migration_guide = {
  description: 'Get migration guide between versions',
  inputSchema: {
    type: 'object',
    properties: {
      library: { type: 'string', description: 'Library name' },
      from: { type: 'string', description: 'From version' },
      to: { type: 'string', description: 'To version' },
    },
    required: ['library', 'from', 'to'],
  },
  handler: async (args, ctx) => context7GetMigrationGuide(args),
};

// Additional context tools
registry.context_reset = {
  description: 'Reset context engine index',
  inputSchema: { type: 'object', properties: {} },
  handler: async (args, ctx) => {
    await ctx.ctx.reset();
    return { ok: true };
  },
};

registry.context_web_search = {
  description: 'Search the web with DuckDuckGo',
  inputSchema: {
    type: 'object',
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
    type: 'object',
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
    type: 'object',
    properties: {
      range: { type: 'string', description: 'Git range (e.g., HEAD~1..HEAD)' },
    },
  },
  handler: async (args, ctx) => summarizeDiff(args.range || 'HEAD~1..HEAD'),
};

registry.context_neighborhood = {
  description: 'Get code neighborhood for a file',
  inputSchema: {
    type: 'object',
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
    type: 'object',
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
    type: 'object',
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
    type: 'object',
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
const server = new Server({
  name: 'thinking-tools-mcp',
  version: '1.8.2',
  capabilities: {
    tools: {}  // REQUIRED for tools/list
  }
});

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

