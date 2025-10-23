#!/usr/bin/env node

/**
 * Autonomous AI Agent MCP Server
 * 
 * Offloads heavy AI work from Augment Code to FREE local LLMs (Ollama).
 * 
 * Features:
 * - Code generation using local LLMs (0 Augment credits!)
 * - Code analysis (0 Augment credits!)
 * - Code refactoring (0 Augment credits!)
 * - Test generation (0 Augment credits!)
 * - Documentation generation (0 Augment credits!)
 * 
 * Savings: 90%+ reduction in Augment Code credits!
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  InitializeRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { OllamaClient } from './ollama-client.js';
import { CodeGenerator } from './agents/code-generator.js';
import { CodeAnalyzer } from './agents/code-analyzer.js';
import { CodeRefactor } from './agents/code-refactor.js';
import { StatsTracker } from './utils/stats-tracker.js';
import { getTokenTracker } from './token-tracker.js';

/**
 * Main Autonomous Agent MCP Server
 */
class AutonomousAgentServer {
  private server: Server;
  private ollama: OllamaClient;
  private codeGenerator: CodeGenerator;
  private codeAnalyzer: CodeAnalyzer;
  private codeRefactor: CodeRefactor;
  private stats: StatsTracker;
  private maxConcurrency: number;
  private activeJobs: number = 0;
  private jobQueue: Array<{ resolve: Function; reject: Function }> = [];

  constructor() {
    this.server = new Server(
      {
        name: 'autonomous-agent-mcp',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Initialize components
    this.ollama = new OllamaClient();
    this.codeGenerator = new CodeGenerator(this.ollama);
    this.codeAnalyzer = new CodeAnalyzer(this.ollama);
    this.codeRefactor = new CodeRefactor(this.ollama);
    this.stats = new StatsTracker();

    // Configurable concurrency: 1-5 concurrent Ollama jobs
    // Default: 1 (safe), Max: 5 (if your PC can handle it)
    // Set MAX_OLLAMA_CONCURRENCY=5 to enable parallel processing
    this.maxConcurrency = parseInt(process.env.MAX_OLLAMA_CONCURRENCY || '1', 10);
    if (this.maxConcurrency < 1) this.maxConcurrency = 1;
    if (this.maxConcurrency > 5) this.maxConcurrency = 5;

    console.error(`[Autonomous Agent] Max concurrency: ${this.maxConcurrency}`);

    this.setupHandlers();
  }

  /**
   * Acquire a job slot (with queueing if at max concurrency)
   */
  private async acquireJobSlot(): Promise<void> {
    if (this.activeJobs < this.maxConcurrency) {
      this.activeJobs++;
      return Promise.resolve();
    }

    // Queue the job
    return new Promise((resolve, reject) => {
      this.jobQueue.push({ resolve, reject });
    });
  }

  /**
   * Release a job slot and process queue
   */
  private releaseJobSlot(): void {
    this.activeJobs--;

    // Process next job in queue
    if (this.jobQueue.length > 0) {
      const next = this.jobQueue.shift();
      if (next) {
        this.activeJobs++;
        next.resolve();
      }
    }
  }

  private setupHandlers(): void {
    // Handle initialize request
    this.server.setRequestHandler(InitializeRequestSchema, async (request) => ({
      protocolVersion: "2024-11-05",
      capabilities: {
        tools: {},
      },
      serverInfo: {
        name: "autonomous-agent-mcp",
        version: "0.1.1",
      },
    }));

    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      console.error('[DEBUG] ListTools called');
      const tools = this.getTools();
      console.error(`[DEBUG] Returning ${tools.length} tools`);
      return { tools };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        // Acquire job slot (queues if at max concurrency)
        await this.acquireJobSlot();

        const startTime = Date.now();
        let result: any;

        try {
          switch (name) {
            case 'delegate_code_generation':
              result = await this.codeGenerator.generate(args as any);
              break;

            case 'delegate_code_analysis':
              result = await this.codeAnalyzer.analyze(args as any);
              break;

            case 'delegate_code_refactoring':
              result = await this.codeRefactor.refactor(args as any);
              break;

          case 'delegate_test_generation':
            result = await this.codeGenerator.generateTests(args as any);
            break;

          case 'delegate_documentation':
            result = await this.codeGenerator.generateDocs(args as any);
            break;

          case 'get_agent_stats':
            result = await this.stats.getStats(args as any);
            break;

          case 'get_token_analytics':
            const tracker = getTokenTracker();
            const period = (args as any)?.period || 'all';
            const stats = tracker.getStats(period);
            result = {
              ...stats,
              database_path: tracker.getDatabasePath(),
              note: 'All Ollama operations are FREE - $0.00 cost'
            };
            break;

          case 'diagnose_autonomous_agent':
            result = {
              ok: true,
              ollama: { base_url: process.env.OLLAMA_BASE_URL || 'http://localhost:11434', auto_start: true },
              models: { fast: 'qwen2.5:3b', medium: 'codellama:34b', complex: 'deepseek-coder:33b' },
              stats_db: process.env.AGENT_STATS_DB || 'agent-stats.db',
              concurrency: {
                max: this.maxConcurrency,
                active: this.activeJobs,
                queued: this.jobQueue.length,
                available: this.maxConcurrency - this.activeJobs,
                config: `Set MAX_OLLAMA_CONCURRENCY=1-5 (current: ${this.maxConcurrency})`
              },
              cost: {
                per_job: 0,
                currency: 'USD',
                note: 'FREE - runs on local Ollama, no API costs!'
              }
            };
            break;

            default:
              throw new Error(`Unknown tool: ${name}`);
          }

          // Track stats
          const timeMs = Date.now() - startTime;
          await this.stats.recordUsage(name, result.augmentCreditsUsed || 0, result.creditsSaved || 0, timeMs);

          // Track token usage if available
          if (result.tokens) {
            const tracker = getTokenTracker();
            tracker.record({
              timestamp: new Date().toISOString(),
              agent_type: name.replace('delegate_', '') as any,
              model: result.model || 'unknown',
              task_type: name,
              tokens_input: result.tokens.input || 0,
              tokens_output: result.tokens.output || 0,
              tokens_total: result.tokens.total || 0,
              cost_usd: result.cost?.total || 0,
              time_ms: timeMs,
              success: true
            });
          }

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        } finally {
          // Always release job slot
          this.releaseJobSlot();
        }
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

  private getTools(): Tool[] {
    return [
      {
        name: 'delegate_code_generation',
        description: 'Generate code using local LLM (0 Augment credits!). Saves 90%+ credits vs Augment generating code.',
        inputSchema: {
          type: 'object',
          properties: {
            task: {
              type: 'string',
              description: 'What to build (e.g., "notifications feature", "user authentication")',
            },
            context: {
              type: 'string',
              description: 'Project context (e.g., "Next.js, TypeScript, Supabase")',
            },
            template: {
              type: 'string',
              description: 'Optional template to use',
              enum: ['react-component', 'api-endpoint', 'database-schema', 'test-suite', 'none'],
            },
            model: {
              type: 'string',
              description: 'Which model to use (auto selects based on complexity)',
              enum: ['deepseek-coder', 'qwen-coder', 'codellama', 'auto'],
            },
            complexity: {
              type: 'string',
              description: 'Task complexity (affects model selection)',
              enum: ['simple', 'medium', 'complex'],
            },
          },
          required: ['task', 'context'],
        },
      },
      {
        name: 'delegate_code_analysis',
        description: 'Analyze code using local LLM (0 Augment credits!). Find issues, performance problems, security vulnerabilities.',
        inputSchema: {
          type: 'object',
          properties: {
            code: {
              type: 'string',
              description: 'Code to analyze',
            },
            files: {
              type: 'array',
              description: 'Multiple files to analyze',
              items: { type: 'string' },
            },
            question: {
              type: 'string',
              description: 'What to analyze (e.g., "find performance issues", "check security")',
            },
            model: {
              type: 'string',
              enum: ['deepseek-coder', 'qwen-coder', 'codellama', 'auto'],
            },
          },
          required: ['question'],
        },
      },
      {
        name: 'delegate_code_refactoring',
        description: 'Refactor code using local LLM (0 Augment credits!). Extract components, improve structure, apply patterns.',
        inputSchema: {
          type: 'object',
          properties: {
            code: {
              type: 'string',
              description: 'Code to refactor',
            },
            instructions: {
              type: 'string',
              description: 'How to refactor (e.g., "extract into components", "apply SOLID principles")',
            },
            style: {
              type: 'string',
              description: 'Code style to follow',
              enum: ['functional', 'oop', 'minimal', 'verbose'],
            },
            model: {
              type: 'string',
              enum: ['deepseek-coder', 'qwen-coder', 'codellama', 'auto'],
            },
          },
          required: ['code', 'instructions'],
        },
      },
      {
        name: 'delegate_test_generation',
        description: 'Generate tests using local LLM (0 Augment credits!). Create comprehensive test suites.',
        inputSchema: {
          type: 'object',
          properties: {
            code: {
              type: 'string',
              description: 'Code to test',
            },
            framework: {
              type: 'string',
              description: 'Test framework',
              enum: ['jest', 'vitest', 'mocha', 'pytest', 'go-test'],
            },
            coverage: {
              type: 'string',
              description: 'Coverage level',
              enum: ['basic', 'comprehensive', 'edge-cases'],
            },
            model: {
              type: 'string',
              enum: ['deepseek-coder', 'qwen-coder', 'codellama', 'auto'],
            },
          },
          required: ['code', 'framework'],
        },
      },
      {
        name: 'delegate_documentation',
        description: 'Generate documentation using local LLM (0 Augment credits!). Create JSDoc, TSDoc, or README files.',
        inputSchema: {
          type: 'object',
          properties: {
            code: {
              type: 'string',
              description: 'Code to document',
            },
            style: {
              type: 'string',
              description: 'Documentation style',
              enum: ['jsdoc', 'tsdoc', 'markdown', 'readme'],
            },
            detail: {
              type: 'string',
              enum: ['brief', 'detailed', 'comprehensive'],
            },
          },
          required: ['code'],
        },
      },
      {
        name: 'get_agent_stats',
        description: 'Get usage statistics for the autonomous agent. See how many credits you\'ve saved!',
        inputSchema: {
          type: 'object',
          properties: {
            period: {
              type: 'string',
              enum: ['today', 'week', 'month', 'all'],
            },
          },
        },
      },
      {
        name: 'get_token_analytics',
        description: 'Get detailed token usage analytics. Shows tokens used, costs (always $0 for Ollama), and patterns over time.',
        inputSchema: {
          type: 'object',
          properties: {
            period: {
              type: 'string',
              description: 'Time period to analyze',
              enum: ['today', 'week', 'month', 'all'],
            },
          },
        },
      },
      {
        name: 'diagnose_autonomous_agent',
        description: 'Diagnose Autonomous Agent environment - check Ollama connection, models, stats DB',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ];
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Autonomous Agent MCP server running on stdio');
    console.error('Ready to offload heavy AI work to FREE local LLMs!');
  }
}

// Start the server
const server = new AutonomousAgentServer();
server.run().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

