#!/usr/bin/env node

/**
 * Free Agent MCP Server
 *
 * Purpose: Execute tasks with PREFERENCE for FREE models (Ollama)
 *          but CAN use PAID models (OpenAI, Claude) if requested
 *
 * Supported Providers (ALL):
 * - FREE: Ollama (qwen, deepseek, codellama) - $0.00 (PREFERRED)
 * - PAID: OpenAI (gpt-4o-mini, gpt-4o, o1-mini) - $0.15-$15/1M tokens
 * - PAID: Claude (haiku, sonnet, opus) - $0.25-$75/1M tokens
 *
 * Default Behavior:
 * - preferFree=true (prefers FREE models by default)
 * - Can be overridden per request
 *
 * Features:
 * - Code generation using local LLMs (0 Augment credits!)
 * - Code analysis (0 Augment credits!)
 * - Code refactoring (0 Augment credits!)
 * - Test generation (0 Augment credits!)
 * - Documentation generation (0 Augment credits!)
 * - Can escalate to PAID models when needed
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
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { OllamaClient } from './ollama-client.js';
import { CodeGenerator } from './agents/code-generator.js';
import { CodeAnalyzer } from './agents/code-analyzer.js';
import { CodeRefactor } from './agents/code-refactor.js';
import { StatsTracker } from './utils/stats-tracker.js';
import { getSharedToolkitClient, type ToolkitCallParams, getSharedFileEditor, getSharedThinkingClient, type ThinkingToolCallParams } from '@robinson_ai_systems/shared-llm';
import { getTokenTracker } from './token-tracker.js';
import { selectBestModel, getModelConfig, estimateTaskCost } from './model-catalog.js';
import { warmupAvailableModels } from './utils/model-warmup.js';
import { FeedbackCapture, FeedbackSource } from './learning/feedback-capture.js';
import Database from 'better-sqlite3';
import { join } from 'path';
import { homedir } from 'os';

/**
 * Main Autonomous Agent MCP Server
 */
class AutonomousAgentServer {
  private server: Server;
  private ollama: OllamaClient;
  private openai?: OpenAI;
  private anthropic?: Anthropic;
  private codeGenerator: CodeGenerator;
  private codeAnalyzer: CodeAnalyzer;
  private codeRefactor: CodeRefactor;
  private stats: StatsTracker;
  private feedbackCapture: FeedbackCapture;
  private maxConcurrency: number;
  private activeJobs: number = 0;
  private jobQueue: Array<{ resolve: Function; reject: Function }> = [];

  constructor() {
    this.server = new Server(
      {
        name: 'free-agent-mcp',
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

    // Initialize PAID clients only if API keys are provided
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
    }

    this.codeGenerator = new CodeGenerator(this.ollama);
    this.codeAnalyzer = new CodeAnalyzer(this.ollama);
    this.codeRefactor = new CodeRefactor(this.ollama);
    this.stats = new StatsTracker();

    // Initialize feedback capture with learning database (optional - gracefully degrade if SQLite fails)
    try {
      const learningDbPath = join(homedir(), '.robinsonai', 'free-agent-learning.db');
      const learningDb = new Database(learningDbPath);
      this.feedbackCapture = new FeedbackCapture(learningDb);
    } catch (error) {
      console.error('[FREE-AGENT] Warning: Could not initialize learning database (better-sqlite3 not available). Learning features disabled.');
      console.error('[FREE-AGENT] Error:', error instanceof Error ? error.message : String(error));
      // Create a no-op feedback capture
      this.feedbackCapture = {
        recordFeedback: () => {},
        recordTaskCompletion: () => {},
        getRecentFeedback: () => [],
      } as any;
    }

    // Configurable concurrency: 1-15 concurrent Ollama jobs
    // Default: 1 (safe), Max: 15 (if your PC can handle it)
    // Set MAX_OLLAMA_CONCURRENCY=15 to enable parallel processing
    this.maxConcurrency = parseInt(process.env.MAX_OLLAMA_CONCURRENCY || '1', 10);
    if (this.maxConcurrency < 1) this.maxConcurrency = 1;
    if (this.maxConcurrency > 15) this.maxConcurrency = 15;

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
        name: "free-agent-mcp",
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
              // Add runId for feedback tracking
              result.runId = `run_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
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

          case 'execute_versatile_task_autonomous-agent-mcp':
            result = await this.executeVersatileTask(args as any);
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
                config: `Set MAX_OLLAMA_CONCURRENCY=1-15 (current: ${this.maxConcurrency})`
              },
              cost: {
                per_job: 0,
                currency: 'USD',
                note: 'FREE - runs on local Ollama, no API costs!'
              },
              toolkit: {
                connected: getSharedToolkitClient().isConnected(),
                tools_available: 906,
                note: 'Can access all Robinson\'s Toolkit tools for DB setup, deployment, etc.'
              }
            };
            break;

          case 'discover_toolkit_tools_autonomous-agent-mcp':
            const toolkitClient = getSharedToolkitClient();
            const discoverResult = await toolkitClient.discoverTools(
              (args as any)?.query || '',
              (args as any)?.limit || 10
            );
            if (!discoverResult.success) {
              throw new Error(`Tool discovery failed: ${discoverResult.error}`);
            }
            result = discoverResult.result;
            break;

          case 'list_toolkit_categories_autonomous-agent-mcp':
            const categoriesResult = await getSharedToolkitClient().listCategories();
            if (!categoriesResult.success) {
              throw new Error(`Failed to list categories: ${categoriesResult.error}`);
            }
            result = categoriesResult.result;
            break;

          case 'list_toolkit_tools_autonomous-agent-mcp':
            const toolsResult = await getSharedToolkitClient().listTools((args as any)?.category || '');
            if (!toolsResult.success) {
              throw new Error(`Failed to list tools: ${toolsResult.error}`);
            }
            result = toolsResult.result;
            break;

          // Universal file editing tools (work in ANY MCP client!)
          case 'file_str_replace':
            const fileEditor = getSharedFileEditor();
            result = await fileEditor.strReplace(args as any);
            break;

          case 'file_insert':
            result = await getSharedFileEditor().insert(args as any);
            break;

          case 'file_save':
            result = await getSharedFileEditor().saveFile(args as any);
            break;

          case 'file_delete':
            result = await getSharedFileEditor().deleteFile(args as any);
            break;

          case 'file_read':
            const content = await getSharedFileEditor().readFile((args as any).path);
            result = { success: true, content, path: (args as any).path };
            break;

          case 'submit_feedback':
            const feedbackArgs = args as any;
            const feedbackEvent = await this.feedbackCapture.captureEdit(
              feedbackArgs.runId,
              feedbackArgs.agentOutput,
              feedbackArgs.userEdit,
              feedbackArgs.source as FeedbackSource || 'unknown',
              feedbackArgs.metadata
            );
            result = {
              success: true,
              feedbackId: feedbackEvent.timestamp,
              feedbackType: feedbackEvent.feedbackType,
              severity: feedbackEvent.severity,
              category: feedbackEvent.category,
              message: 'Feedback captured successfully. This will be used to improve the agent.',
            };
            break;

          case 'get_feedback_stats':
            result = this.feedbackCapture.getFeedbackStats();
            break;

          // NEW: Quality Gates Pipeline Tools
          case 'free_agent_execute_with_quality_gates':
            result = await this.executeWithQualityGates(args as any);
            break;

          case 'free_agent_judge_code_quality':
            result = await this.judgeCodeQuality(args as any);
            break;

          case 'free_agent_refine_code':
            result = await this.refineCode(args as any);
            break;

          case 'free_agent_generate_project_brief':
            result = await this.generateProjectBrief(args as any);
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

  /**
   * Execute versatile task - routes to appropriate handler based on taskType
   */
  private async executeVersatileTask(args: {
    task: string;
    taskType: 'code_generation' | 'code_analysis' | 'refactoring' | 'test_generation' | 'documentation' | 'toolkit_call' | 'thinking_tool_call' | 'file_editing';
    params?: any;
    forcePaid?: boolean;  // NEW: If true, return error (Autonomous Agent is FREE only)
  }): Promise<any> {
    const { task, taskType, params = {}, forcePaid = false } = args;

    console.error(`[AutonomousAgent] Executing versatile task: ${taskType} - ${task}`);

    // Autonomous Agent is FREE only - if forcePaid=true, reject the request
    if (forcePaid) {
      console.error(`[AutonomousAgent] ERROR: forcePaid=true but Autonomous Agent only supports FREE Ollama!`);
      return {
        success: false,
        error: 'WRONG_AGENT',
        message: 'Autonomous Agent only supports FREE Ollama. Use execute_versatile_task_openai-worker-mcp with forcePaid=true instead.',
        suggestion: 'Call execute_versatile_task_openai-worker-mcp({ ...args, forcePaid: true })',
        augmentCreditsUsed: 0,
        creditsSaved: 0,
      };
    }

    switch (taskType) {
      case 'code_generation':
        return await this.codeGenerator.generate({
          task,
          context: params.context || '',
          template: params.template,
          model: params.model,
          complexity: params.complexity,
        });

      case 'code_analysis':
        return await this.codeAnalyzer.analyze({
          code: params.code,
          files: params.files,
          question: task,
          model: params.model,
        });

      case 'refactoring':
        return await this.codeRefactor.refactor({
          code: params.code || '',
          instructions: task,
          style: params.style,
          model: params.model,
        });

      case 'test_generation':
        return await this.codeGenerator.generateTests({
          code: params.code || '',
          framework: params.framework || 'jest',
          coverage: params.coverage,
          model: params.model,
        });

      case 'documentation':
        return await this.codeGenerator.generateDocs({
          code: params.code || '',
          style: params.style,
          detail: params.detail,
        });

      case 'file_editing':
        // NEW: Direct file editing using universal file tools
        return await this.handleFileEditing(task, params);

      case 'toolkit_call':
        // Call Robinson's Toolkit for DB setup, deployment, account management, etc.
        const toolkitClient = getSharedToolkitClient();

        const toolkitParams: ToolkitCallParams = {
          category: params.category || '',
          tool_name: params.tool_name || '',
          arguments: params.arguments || {},
        };

        const toolkitResult = await toolkitClient.callTool(toolkitParams);

        if (!toolkitResult.success) {
          throw new Error(`Toolkit call failed: ${toolkitResult.error}`);
        }

        return {
          success: true,
          result: toolkitResult.result,
          augmentCreditsUsed: 100, // Just for orchestration
          creditsSaved: 500, // Saved by using toolkit instead of AI
          cost: {
            total: 0,
            currency: 'USD',
            note: 'FREE - Robinson\'s Toolkit call',
          },
        };

      case 'thinking_tool_call':
        // Call Thinking Tools MCP for cognitive frameworks, context engine, etc.
        const thinkingClient = getSharedThinkingClient();

        const thinkingParams: ThinkingToolCallParams = {
          tool_name: params.tool_name || '',
          arguments: params.arguments || {},
        };

        const thinkingResult = await thinkingClient.callTool(thinkingParams);

        if (!thinkingResult.success) {
          throw new Error(`Thinking tool call failed: ${thinkingResult.error}`);
        }

        return {
          success: true,
          result: thinkingResult.result,
          augmentCreditsUsed: 50, // Just for orchestration
          creditsSaved: 300, // Saved by using thinking tools instead of AI
          cost: {
            total: 0,
            currency: 'USD',
            note: 'FREE - Thinking Tools MCP call',
          },
        };

      default:
        throw new Error(`Unknown task type: ${taskType}`);
    }
  }

  /**
   * Handle file editing tasks using LLM to determine operations, then execute them
   */
  private async handleFileEditing(task: string, params: any): Promise<any> {
    console.error(`[AutonomousAgent] File editing task: ${task}`);

    const fileEditor = getSharedFileEditor();
    const results: any[] = [];

    // STEP 1: Detect task complexity and choose strategy
    // Simple tasks: Small, targeted changes (fix typo, change variable name, update version)
    // Complex tasks: Large-scale changes (convert format, standardize, refactor, redesign)
    const isSimpleTask = /fix typo|change variable|update version|add comment|remove comment/i.test(task);
    const isComplexTask = /convert|standardize|format|single-line|multi-line|refactor|redesign|rewrite|restructure/i.test(task);

    // HYBRID APPROACH (Option C):
    // - Simple tasks: Use file operations (precise, targeted changes)
    // - Complex tasks: Generate full code and replace entire sections
    const useFileOperations = isSimpleTask && !isComplexTask;

    console.error(`[AutonomousAgent] Strategy: ${useFileOperations ? 'FILE_OPERATIONS' : 'FULL_CODE_GENERATION'} (simple=${isSimpleTask}, complex=${isComplexTask})`);

    // STEP 2: Read the file first to get actual content
    // Try multiple patterns to extract file path
    let filePath = params?.path || params?.file;
    if (!filePath) {
      // Pattern 1: "in packages/..." or "file packages/..."
      const match1 = task.match(/(?:in|file|path:?)\s+([\w\-\/\.]+\.(?:ts|js|tsx|jsx|json|md))/i);
      if (match1) filePath = match1[1];
    }
    if (!filePath) {
      // Pattern 2: Just look for any path with file extension
      const match2 = task.match(/([\w\-\/\.]+\.(?:ts|js|tsx|jsx|json|md))/i);
      if (match2) filePath = match2[1];
    }

    let fileContent = '';
    if (filePath) {
      try {
        fileContent = await fileEditor.readFile(filePath);
        console.error(`[AutonomousAgent] Read ${filePath}: ${fileContent.length} chars`);
      } catch (e: any) {
        console.error(`[AutonomousAgent] Could not read ${filePath}: ${e.message}`);
      }
    }

    // If complex task, use full code generation approach
    if (!useFileOperations) {
      return await this.handleComplexFileEditing(task, params, filePath, fileContent, fileEditor);
    }

    // STEP 2: Use LLM to analyze the task and determine file operations
    const analysisPrompt = `You are a file editing assistant. Analyze this task and determine what file operations are needed.

Task: ${task}

Parameters: ${JSON.stringify(params, null, 2)}

${fileContent ? `Current file content (${fileContent.split('\n').length} lines):\n\`\`\`\n${fileContent.slice(0, 5000)}\n\`\`\`\n` : ''}

IMPORTANT RULES:
1. ALWAYS read the file first if you need to see its content
2. For str_replace: You MUST provide the EXACT old_str from the file (copy it exactly!)
3. For save: You MUST provide the complete content field
4. Use line numbers only if you're sure they're correct
5. Prefer smaller, targeted changes over large replacements

Respond with a JSON array of file operations. Each operation should have:
- operation: "read" | "str_replace" | "insert" | "save" | "delete"
- path: file path (REQUIRED for all operations)
- For read: (just path)
- For str_replace: old_str (REQUIRED, exact match), new_str (REQUIRED), old_str_start_line (optional), old_str_end_line (optional)
- For insert: insert_line (REQUIRED), new_str (REQUIRED)
- For save: content (REQUIRED, complete file content)
- For delete: (just path)

GOOD EXAMPLES:
[
  {
    "operation": "read",
    "path": "src/index.ts"
  },
  {
    "operation": "str_replace",
    "path": "src/index.ts",
    "old_str": "export const foo = 'bar';",
    "new_str": "export const foo = 'baz';",
    "old_str_start_line": 10,
    "old_str_end_line": 10
  }
]

BAD EXAMPLES (DO NOT DO THIS):
[
  {
    "operation": "save",
    "path": "src/index.ts"
    // ❌ Missing content field!
  },
  {
    "operation": "str_replace",
    "path": "src/index.ts",
    "old_str": "// approximate code",
    // ❌ old_str must be EXACT match from file!
    "new_str": "new code"
  }
]

Respond ONLY with the JSON array, no other text.`;

    try {
      // Use Ollama to analyze and plan file operations
      const { ollamaGenerate } = await import('@robinson_ai_systems/shared-llm');
      const response = await ollamaGenerate({
        model: process.env.DEFAULT_OLLAMA_MODEL || 'qwen2.5-coder:7b',
        prompt: analysisPrompt,
      });

      // Parse the response
      let operations: any[];
      try {
        // Extract JSON from response (handle markdown code blocks)
        let jsonStr = response.trim();
        if (jsonStr.startsWith('```json')) {
          jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        } else if (jsonStr.startsWith('```')) {
          jsonStr = jsonStr.replace(/```\n?/g, '');
        }
        operations = JSON.parse(jsonStr);
      } catch (parseError: any) {
        console.error(`[AutonomousAgent] Failed to parse LLM response as JSON:`, response);
        throw new Error(`Failed to parse file operations: ${parseError.message}`);
      }

      // Execute each operation
      for (const op of operations) {
        console.error(`[AutonomousAgent] Executing ${op.operation} on ${op.path}`);

        let result: any;
        switch (op.operation) {
          case 'str_replace':
            result = await fileEditor.strReplace({
              path: op.path,
              old_str: op.old_str,
              new_str: op.new_str,
              old_str_start_line: op.old_str_start_line,
              old_str_end_line: op.old_str_end_line,
            });
            break;

          case 'insert':
            result = await fileEditor.insert({
              path: op.path,
              insert_line: op.insert_line,
              new_str: op.new_str,
            });
            break;

          case 'save':
            result = await fileEditor.saveFile({
              path: op.path,
              content: op.content,
              add_last_line_newline: op.add_last_line_newline,
            });
            break;

          case 'delete':
            result = await fileEditor.deleteFile({
              path: op.path,
            });
            break;

          case 'read':
            const content = await fileEditor.readFile(op.path);
            result = { success: true, content, path: op.path };
            break;

          default:
            result = { success: false, error: `Unknown operation: ${op.operation}` };
        }

        results.push(result);

        if (!result.success) {
          console.error(`[AutonomousAgent] Operation failed:`, result);
        }
      }

      // Return summary
      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;

      return {
        success: failCount === 0,
        message: `Executed ${results.length} file operations: ${successCount} succeeded, ${failCount} failed`,
        operations: results,
        augmentCreditsUsed: 0,
        creditsSaved: 1000, // Saved by using FREE Ollama + direct file ops
        cost: {
          total: 0,
          currency: 'USD',
          note: 'FREE - Ollama + file operations',
        },
      };
    } catch (error: any) {
      console.error(`[AutonomousAgent] File editing failed:`, error);
      return {
        success: false,
        error: error.message,
        augmentCreditsUsed: 0,
        creditsSaved: 0,
      };
    }
  }

  /**
   * Handle complex file editing using full code generation
   * (Option C: Hybrid Approach)
   */
  private async handleComplexFileEditing(
    task: string,
    params: any,
    filePath: string,
    fileContent: string,
    fileEditor: any
  ): Promise<any> {
    console.error(`[AutonomousAgent] Using FULL CODE GENERATION approach for complex task`);

    try {
      // Extract line range if specified
      const lineRangeMatch = task.match(/lines?\s+(\d+)[-–](\d+)/i);
      const startLine = lineRangeMatch ? parseInt(lineRangeMatch[1]) : 1;
      const endLine = lineRangeMatch ? parseInt(lineRangeMatch[2]) : fileContent.split('\n').length;

      // Extract the section to modify
      const lines = fileContent.split('\n');
      const sectionToModify = lines.slice(startLine - 1, endLine).join('\n');
      const beforeSection = lines.slice(0, startLine - 1).join('\n');
      const afterSection = lines.slice(endLine).join('\n');

      console.error(`[AutonomousAgent] Modifying lines ${startLine}-${endLine} (${sectionToModify.length} chars)`);

      // Use LLM to generate the complete new code
      const codeGenPrompt = `You are a TypeScript code generation assistant. Your task is to modify a specific section of a file.

TASK: ${task}

CONTEXT:
- File: ${filePath}
- Lines to modify: ${startLine}-${endLine}
- Total file lines: ${lines.length}

SECTION TO MODIFY (lines ${startLine}-${endLine}):
\`\`\`typescript
${sectionToModify.slice(0, 10000)}
\`\`\`

${beforeSection ? `BEFORE THIS SECTION (for context):\n\`\`\`typescript\n${beforeSection.slice(-500)}\n\`\`\`\n` : ''}

${afterSection ? `AFTER THIS SECTION (for context):\n\`\`\`typescript\n${afterSection.slice(0, 500)}\n\`\`\`\n` : ''}

INSTRUCTIONS:
1. Generate ONLY the modified section (lines ${startLine}-${endLine})
2. Maintain the EXACT same structure and format as the original
3. Keep all TypeScript syntax valid
4. Do NOT include the before/after sections
5. Do NOT add markdown code blocks
6. Do NOT add explanations or comments
7. The output should be valid TypeScript that can directly replace lines ${startLine}-${endLine}

Generate the modified section now:`;

      const { ollamaGenerate } = await import('@robinson_ai_systems/shared-llm');
      let newCode = await ollamaGenerate({
        model: process.env.DEFAULT_OLLAMA_MODEL || 'qwen2.5-coder:7b',
        prompt: codeGenPrompt,
      });

      // Clean up the generated code (remove markdown if present)
      newCode = newCode.trim();
      if (newCode.startsWith('```')) {
        // Remove markdown code blocks
        newCode = newCode.replace(/^```[\w]*\n?/gm, '').replace(/```$/gm, '').trim();
      }

      // Reconstruct the full file
      const fullFileContent = [
        beforeSection,
        newCode,
        afterSection
      ].filter(s => s).join('\n');

      console.error(`[AutonomousAgent] Reconstructed file: ${fullFileContent.split('\n').length} lines (was ${lines.length} lines)`);

      // Validate the generated code is not garbage
      if (fullFileContent.length < fileContent.length * 0.5) {
        throw new Error(`Generated code is too short (${fullFileContent.length} chars vs original ${fileContent.length} chars). Refusing to save.`);
      }

      if (!fullFileContent.includes('export') && fileContent.includes('export')) {
        throw new Error('Generated code is missing exports. Refusing to save.');
      }

      // Save the new code
      const result = await fileEditor.saveFile({
        path: filePath,
        content: fullFileContent,
        add_last_line_newline: true,
      });

      if (result.success) {
        console.error(`[AutonomousAgent] ✅ Successfully generated and saved new code`);
        return {
          success: true,
          message: `Generated and saved new code for ${filePath} (modified lines ${startLine}-${endLine})`,
          operations: [result],
          augmentCreditsUsed: 0,
          creditsSaved: 2000, // Saved by using FREE Ollama for complex task
          cost: {
            total: 0,
            currency: 'USD',
            note: 'FREE - Ollama full code generation',
          },
        };
      } else {
        throw new Error(result.error || 'Failed to save generated code');
      }
    } catch (error: any) {
      console.error(`[AutonomousAgent] Complex file editing failed:`, error);
      return {
        success: false,
        error: error.message,
        augmentCreditsUsed: 0,
        creditsSaved: 0,
      };
    }
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
            quality: {
              type: 'string',
              description: 'Quality vs speed tradeoff: fast (no sandbox, <5s), balanced (sandbox, ~30s), best (full validation, ~60s)',
              enum: ['fast', 'balanced', 'best'],
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
        name: 'execute_versatile_task_autonomous-agent-mcp',
        description: 'Execute ANY task - coding, DB setup, deployment, account management, thinking/planning, etc. This agent is VERSATILE and can handle all types of work using FREE Ollama + Robinson\'s Toolkit (1165 tools) + Thinking Tools (64 cognitive frameworks).',
        inputSchema: {
          type: 'object',
          properties: {
            task: {
              type: 'string',
              description: 'What to do (e.g., "Generate user profile component", "Set up Neon database", "Deploy to Vercel", "Analyze with SWOT", "Use devils advocate")',
            },
            taskType: {
              type: 'string',
              enum: ['code_generation', 'code_analysis', 'refactoring', 'test_generation', 'documentation', 'toolkit_call', 'thinking_tool_call', 'file_editing'],
              description: 'Type of task to execute',
            },
            params: {
              type: 'object',
              description: 'Task-specific parameters (varies by taskType)',
            },
          },
          required: ['task', 'taskType'],
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
      {
        name: 'discover_toolkit_tools_autonomous-agent-mcp',
        description: 'Search for tools in Robinson\'s Toolkit by keyword. Dynamically discovers tools as new ones are added to the toolkit.',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query (e.g., "database", "deploy", "email")',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of results (default: 10)',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'list_toolkit_categories_autonomous-agent-mcp',
        description: 'List all available categories in Robinson\'s Toolkit (github, vercel, neon, upstash, google, etc.). Dynamically updates as new categories are added.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'list_toolkit_tools_autonomous-agent-mcp',
        description: 'List all tools in a specific category. Dynamically updates as new tools are added to Robinson\'s Toolkit.',
        inputSchema: {
          type: 'object',
          properties: {
            category: {
              type: 'string',
              description: 'Category name (github, vercel, neon, upstash, google)',
            },
          },
          required: ['category'],
        },
      },
      // Universal file editing tools (work in ANY MCP client: Augment, Cline, Cursor, etc.)
      {
        name: 'file_str_replace',
        description: 'Replace text in a file (universal - works in any MCP client). Like Augment\'s str-replace-editor but works everywhere.',
        inputSchema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'File path relative to workspace root',
            },
            old_str: {
              type: 'string',
              description: 'Text to find and replace',
            },
            new_str: {
              type: 'string',
              description: 'Replacement text',
            },
            old_str_start_line: {
              type: 'number',
              description: 'Optional: Start line number (1-based) to narrow search',
            },
            old_str_end_line: {
              type: 'number',
              description: 'Optional: End line number (1-based) to narrow search',
            },
          },
          required: ['path', 'old_str', 'new_str'],
        },
      },
      // NEW: Quality Gates Pipeline Tools (namespaced to avoid conflicts)
      {
        name: 'free_agent_execute_with_quality_gates',
        description: 'Execute code generation with FULL quality gates pipeline (Synthesize-Execute-Critique-Refine). Runs formatter, linter, type checker, tests, coverage, security checks. Returns code that ACTUALLY WORKS with structured verdict.',
        inputSchema: {
          type: 'object',
          properties: {
            task: {
              type: 'string',
              description: 'What to build (e.g., "Create user login function", "Add notification system")',
            },
            context: {
              type: 'string',
              description: 'Project context (e.g., "Node.js, Express, JWT", "React, TypeScript, Tailwind")',
            },
            designCard: {
              type: 'object',
              description: 'Optional Design Card with goals, acceptance criteria, constraints',
              properties: {
                name: { type: 'string' },
                goals: { type: 'array', items: { type: 'string' } },
                acceptance: { type: 'array', items: { type: 'string' } },
                constraints: { type: 'array', items: { type: 'string' } },
                allowedPaths: { type: 'array', items: { type: 'string' } },
              },
            },
            maxAttempts: {
              type: 'number',
              description: 'Maximum refinement attempts (default: 3)',
            },
            acceptThreshold: {
              type: 'number',
              description: 'Minimum weighted score to accept (0-1, default: 0.9)',
            },
            minCoverage: {
              type: 'number',
              description: 'Minimum code coverage percentage (default: 80)',
            },
            useProjectBrief: {
              type: 'boolean',
              description: 'Auto-generate and use Project Brief for repo-native code (default: true)',
            },
          },
          required: ['task', 'context'],
        },
      },
      {
        name: 'free_agent_judge_code_quality',
        description: 'Evaluate code quality using LLM Judge with structured rubric. Returns scores for compilation, tests, types, style, security, and conventions. Uses Ollama (0 credits).',
        inputSchema: {
          type: 'object',
          properties: {
            code: {
              type: 'string',
              description: 'Code to evaluate',
            },
            spec: {
              type: 'string',
              description: 'Problem specification or requirements',
            },
            signals: {
              type: 'object',
              description: 'Optional execution signals (lint errors, type errors, test results, etc.)',
            },
          },
          required: ['code', 'spec'],
        },
      },
      {
        name: 'free_agent_refine_code',
        description: 'Fix code issues based on judge feedback. Applies fixes from structured fix plan. Uses Ollama (0 credits).',
        inputSchema: {
          type: 'object',
          properties: {
            code: {
              type: 'string',
              description: 'Code to refine',
            },
            filePath: {
              type: 'string',
              description: 'Optional file path (default: code.ts)',
            },
            verdict: {
              type: 'object',
              description: 'Judge verdict with fix plan (from free_agent_judge_code_quality)',
            },
          },
          required: ['code', 'verdict'],
        },
      },
      {
        name: 'free_agent_generate_project_brief',
        description: 'Auto-generate Project Brief from repository. Analyzes naming conventions, import patterns, architecture, testing patterns, and builds domain glossary. Use this for repo-native code generation.',
        inputSchema: {
          type: 'object',
          properties: {
            repoPath: {
              type: 'string',
              description: 'Repository root path (default: current working directory)',
            },
            cache: {
              type: 'boolean',
              description: 'Cache the brief for future use (default: true)',
            },
          },
        },
      },
      {
        name: 'file_insert',
        description: 'Insert text at a specific line in a file (universal - works in any MCP client)',
        inputSchema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'File path relative to workspace root',
            },
            insert_line: {
              type: 'number',
              description: 'Line number to insert after (0 = beginning of file)',
            },
            new_str: {
              type: 'string',
              description: 'Text to insert',
            },
          },
          required: ['path', 'insert_line', 'new_str'],
        },
      },
      {
        name: 'file_save',
        description: 'Create a new file (universal - works in any MCP client). Like Augment\'s save-file but works everywhere.',
        inputSchema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'File path relative to workspace root',
            },
            content: {
              type: 'string',
              description: 'File content',
            },
            add_last_line_newline: {
              type: 'boolean',
              description: 'Add newline at end of file (default: true)',
            },
          },
          required: ['path', 'content'],
        },
      },
      {
        name: 'file_delete',
        description: 'Delete a file (universal - works in any MCP client)',
        inputSchema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'File path relative to workspace root',
            },
          },
          required: ['path'],
        },
      },
      {
        name: 'file_read',
        description: 'Read file content (universal - works in any MCP client)',
        inputSchema: {
          type: 'object',
          properties: {
            path: {
              type: 'string',
              description: 'File path relative to workspace root',
            },
          },
          required: ['path'],
        },
      },
      {
        name: 'submit_feedback',
        description: 'Submit feedback on agent-generated code. Used by primary coding agents (Augment, Cursor, Copilot, etc.) to teach the FREE agent from their edits. This feedback is used to improve the agent over time.',
        inputSchema: {
          type: 'object',
          properties: {
            runId: {
              type: 'string',
              description: 'Run ID from the original code generation (found in the generation result)',
            },
            agentOutput: {
              type: 'string',
              description: 'The original code generated by the agent',
            },
            userEdit: {
              type: 'string',
              description: 'The edited code after user/primary agent modifications',
            },
            source: {
              type: 'string',
              enum: ['augment', 'cursor', 'copilot', 'windsurf', 'manual', 'unknown'],
              description: 'Source of the feedback (which primary agent made the edit)',
            },
            metadata: {
              type: 'object',
              description: 'Optional metadata about the feedback (e.g., file path, language, task type)',
            },
          },
          required: ['runId', 'agentOutput', 'userEdit'],
        },
      },
      {
        name: 'get_feedback_stats',
        description: 'Get statistics about feedback received from primary coding agents. Shows what types of edits are most common and helps identify areas for improvement.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ];
  }

  /**
   * Execute code generation with full quality gates pipeline
   */
  private async executeWithQualityGates(args: any): Promise<any> {
    try {
      const { iterateTask } = await import('./pipeline/index.js');
      const { makeProjectBrief } = await import('./utils/project-brief.js');
      const { parseDesignCard, designCardToTaskSpec } = await import('./agents/design-card.js');

      // Build task specification
      let spec = `Task: ${args.task}\nContext: ${args.context}`;

      // Add Design Card if provided
      if (args.designCard) {
        const card = args.designCard;
        spec = designCardToTaskSpec(card, null);
      }

      // Generate Project Brief if requested
      let brief = null;
      if (args.useProjectBrief !== false) {
        const repoPath = process.cwd();
        brief = await makeProjectBrief(repoPath);
        spec += `\n\nProject Brief:\n${JSON.stringify(brief, null, 2)}`;
      }

      // Run pipeline
      const config = {
        maxAttempts: args.maxAttempts || 3,
        acceptThreshold: args.acceptThreshold || 0.9,
        minCoverage: args.minCoverage || 80,
      };

      const result = await iterateTask(spec, config);

      return {
        success: result.ok,
        files: result.files,
        score: result.score,
        attempts: result.attempts,
        verdict: result.verdict,
        execReport: result.execReport,
        augmentCreditsUsed: 0,
        creditsSaved: 5000, // Saved by using FREE Ollama + quality gates
        cost: {
          total: 0,
          currency: 'USD',
          note: 'FREE - Ollama with quality gates pipeline',
        },
      };
    } catch (error: any) {
      console.error('[executeWithQualityGates] Error:', error);
      return {
        success: false,
        error: error.message,
        augmentCreditsUsed: 0,
        creditsSaved: 0,
      };
    }
  }

  /**
   * Judge code quality using LLM Judge
   */
  private async judgeCodeQuality(args: any): Promise<any> {
    try {
      const { judgeCode } = await import('./pipeline/judge.js');

      // Build signals from provided data or create empty signals
      const signals = args.signals || {
        compiled: true,
        lintErrors: [],
        typeErrors: [],
        test: { passed: 0, failed: 0, details: [] },
        security: { violations: [] },
        logsTail: [],
      };

      const verdict = await judgeCode({
        spec: args.spec,
        signals,
        patchSummary: args.patchSummary || {
          filesChanged: [],
          diffStats: { additions: 0, deletions: 0 },
        },
        modelNotes: args.modelNotes || '',
      });

      return {
        success: true,
        verdict,
        code: args.code, // Return code for reference
        augmentCreditsUsed: 0,
        creditsSaved: 500,
        cost: {
          total: 0,
          currency: 'USD',
          note: 'FREE - Ollama judge',
        },
      };
    } catch (error: any) {
      console.error('[judgeCodeQuality] Error:', error);
      return {
        success: false,
        error: error.message,
        augmentCreditsUsed: 0,
        creditsSaved: 0,
      };
    }
  }

  /**
   * Refine code based on judge feedback
   */
  private async refineCode(args: any): Promise<any> {
    try {
      const { applyFixPlan } = await import('./pipeline/refine.js');

      // Convert code string to file structure
      const currentFiles = [{
        path: args.filePath || 'code.ts',
        content: args.code,
      }];

      // Build minimal ExecReport from verdict scores
      const report = {
        compiled: args.verdict.scores.compilation === 1,
        lintErrors: [],
        typeErrors: [],
        test: {
          passed: 0,
          failed: 0,
          details: [],
        },
        security: {
          violations: [],
        },
        logsTail: [],
      };

      // Apply fix plan
      const result = await applyFixPlan(
        args.verdict,
        currentFiles,
        report
      );

      return {
        success: true,
        files: result.files,
        tests: result.tests,
        notes: result.notes,
        augmentCreditsUsed: 0,
        creditsSaved: 500,
        cost: {
          total: 0,
          currency: 'USD',
          note: 'FREE - Ollama refine',
        },
      };
    } catch (error: any) {
      console.error('[refineCode] Error:', error);
      return {
        success: false,
        error: error.message,
        augmentCreditsUsed: 0,
        creditsSaved: 0,
      };
    }
  }

  /**
   * Generate Project Brief from repository
   */
  private async generateProjectBrief(args: any): Promise<any> {
    try {
      const { makeProjectBrief } = await import('./utils/project-brief.js');

      const repoPath = args.repoPath || process.cwd();
      const brief = await makeProjectBrief(repoPath);

      return {
        success: true,
        brief,
        augmentCreditsUsed: 0,
        creditsSaved: 200,
        cost: {
          total: 0,
          currency: 'USD',
          note: 'FREE - Static analysis',
        },
      };
    } catch (error: any) {
      console.error('[generateProjectBrief] Error:', error);
      return {
        success: false,
        error: error.message,
        augmentCreditsUsed: 0,
        creditsSaved: 0,
      };
    }
  }

  async run(): Promise<void> {
    // Warm up models on startup to avoid cold start delays (disabled for now - causes timeouts)
    // warmupAvailableModels().catch(error => {
    //   console.error('⚠️  Model warmup failed (non-fatal):', error);
    // });

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

// Cleanup on shutdown
process.on('SIGINT', async () => {
  console.error('\n🛑 Shutting down Free Agent MCP...');
  await server['ollama'].cleanup();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.error('\n🛑 Shutting down Free Agent MCP...');
  await server['ollama'].cleanup();
  process.exit(0);
});

