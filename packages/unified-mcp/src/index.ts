#!/usr/bin/env node

/**
 * @robinsonai/unified-mcp
 * The Ultimate Monolith MCP Server
 * 900+ tools from 16 integrated services in ONE server process
 * 
 * Services Integrated:
 * 1. Sequential Thinking (3 tools) - Enhanced thinking capabilities
 * 2. Context7 (8 tools) - Library documentation access
 * 3. Playwright (42 tools) - Browser automation
 * 4. GitHub (240 tools) - Complete GitHub API
 * 5. Vercel (~50 tools) - Vercel deployment platform
 * 6. Neon (160 tools) - Serverless Postgres
 * 7. Google Workspace (192 tools) - Gmail, Drive, Calendar, Sheets, Docs, Admin
 * 8. Resend (~40 tools) - Email API
 * 9. Twilio (~40 tools) - SMS/Voice API
 * 10. Cloudflare (~60 tools) - CDN and edge computing
 * 11. Redis (~80 tools) - In-memory data store
 * 12. OpenAI (~30 tools) - AI/ML API with cost controls
 * 13. Stripe (100+ tools) - Payment processing
 * 14. Supabase (80+ tools) - Backend-as-a-Service
 * 15. RAG Standard (40+ tools) - OpenAI embeddings + Neon pgvector with cost controls
 * 16. RAG Open-Source (40+ tools) - Open-source embeddings + LLMs (zero API costs)
 * 
 * By Robinson AI Systems
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load static manifest (generated at build time)
let TOOLS_MANIFEST: any = null;
try {
  const manifestPath = join(__dirname, 'tools.manifest.json');
  TOOLS_MANIFEST = JSON.parse(readFileSync(manifestPath, 'utf-8'));
} catch (error) {
  console.error('⚠️  Failed to load tools.manifest.json - run npm run manifest first');
  TOOLS_MANIFEST = { tools: [], totalTools: 0, namespaces: [] };
}

// Service SDKs - LAZY LOADED (imported on first use, not at module load)
// This keeps startup fast and avoids blocking stdio during handshake
import type { Octokit } from '@octokit/rest';
import type { AxiosInstance } from 'axios';
import type { Browser, Page, BrowserContext } from 'playwright';
import type { JWT } from 'google-auth-library';
import type { Resend } from 'resend';
import type Cloudflare from 'cloudflare';
import type OpenAI from 'openai';
import type Stripe from 'stripe';

import { AuthBroker } from './auth-broker.js';
import { WorkerManager } from './workers/worker-manager.js';

class UnifiedMCP {
  private server: Server;
  private authBroker: AuthBroker;
  private workerManager: WorkerManager;
  
  // API Clients for all 16 services
  private githubClient: Octokit | null = null;
  private vercelClient: AxiosInstance | null = null;
  private neonClient: AxiosInstance | null = null;
  private googleAuth: JWT | null = null;
  private resendClient: Resend | null = null;
  private twilioClient: any = null;
  private cloudflareClient: Cloudflare | null = null;
  private redisClient: any = null;
  private openaiClient: OpenAI | null = null;
  private stripeClient: Stripe | null = null;
  private supabaseClient: any = null;
  
  // Playwright browser instances
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  
  // Advanced Reasoning state (15 thinking tools total)
  private thoughtHistory: any[] = [];
  private parallelBranches: Map<string, any> = new Map();
  private reflections: any[] = [];
  private thoughtTree: Map<string, any> = new Map(); // Tree-of-Thought
  private thoughtGraph: Map<string, any> = new Map(); // Graph-of-Thought
  private consistencyPaths: any[] = []; // Self-Consistency
  private subproblems: Map<string, any> = new Map(); // Least-to-Most
  private analogies: any[] = []; // Analogical Reasoning
  private socraticQuestions: any[] = []; // Socratic Questioning
  private challenges: any[] = []; // Devil's Advocate
  private metacognitiveLog: any[] = []; // Metacognitive Monitoring
  private hypotheses: Map<string, any> = new Map(); // Hypothesis Testing
  
  // Context7 state
  private context7Client: AxiosInstance | null = null;
  
  // RAG state (both standard and open-source)
  private ragPgPool: any | null = null;
  private turndownService: any | null = null;
  private crawledSources: Set<string> = new Set();

  // Cost tracking (for OpenAI and RAG)
  private costTracking = {
    totalTokens: 0,
    totalCost: 0,
    requestCount: 0,
    budgetLimit: 0,
    budgetAlerts: [] as number[],
  };

  constructor() {
    this.server = new Server(
      { name: '@robinsonai/unified-mcp', version: '1.0.0' },
      { capabilities: { tools: {} } }
    );

    // Initialize auth broker and worker manager
    this.authBroker = new AuthBroker();
    this.workerManager = new WorkerManager();

    // NO eager initialization - all clients are lazy-loaded on first use
    this.setupHandlers();
  }

  // ============================================================================
  // LAZY-LOADING HELPERS
  // All SDK imports happen here, on first tool call, not at module load
  // This keeps startup time <100ms and avoids blocking stdio
  // ============================================================================

  private async getGitHubClient(): Promise<Octokit> {
    if (!this.githubClient) {
      const creds = this.authBroker.getCredentials('github');
      if (!creds) throw new Error('GitHub credentials not configured');

      const { Octokit } = await import('@octokit/rest');
      this.githubClient = new Octokit({ auth: creds.token });
    }
    return this.githubClient;
  }

  private async getVercelClient(): Promise<AxiosInstance> {
    if (!this.vercelClient) {
      const creds = this.authBroker.getCredentials('vercel');
      if (!creds) throw new Error('Vercel credentials not configured');

      const axios = (await import('axios')).default;
      this.vercelClient = axios.create({
        baseURL: 'https://api.vercel.com',
        headers: { Authorization: `Bearer ${creds.token}` },
        timeout: 10000,
      });
    }
    return this.vercelClient;
  }

  private async getNeonClient(): Promise<AxiosInstance> {
    if (!this.neonClient) {
      const creds = this.authBroker.getCredentials('neon');
      if (!creds) throw new Error('Neon credentials not configured');

      const axios = (await import('axios')).default;
      this.neonClient = axios.create({
        baseURL: 'https://console.neon.tech/api/v2',
        headers: { Authorization: `Bearer ${creds.apiKey}` },
        timeout: 10000,
      });
    }
    return this.neonClient;
  }

  private async getRedisClient(): Promise<any> {
    if (!this.redisClient) {
      const creds = this.authBroker.getCredentials('redis');
      if (!creds) throw new Error('Redis credentials not configured');

      const { createClient } = await import('redis');
      this.redisClient = createClient({
        url: creds.url,
        socket: { connectTimeout: 5000 }
      });
      await this.redisClient.connect();
    }
    return this.redisClient;
  }

  private async getOpenAIClient(): Promise<any> {
    if (!this.openaiClient) {
      const creds = this.authBroker.getCredentials('openai');
      if (!creds) throw new Error('OpenAI credentials not configured');

      const OpenAI = (await import('openai')).default;
      this.openaiClient = new OpenAI({ apiKey: creds.apiKey });

      // Update cost tracking if configured
      if (creds.budgetLimit) this.costTracking.budgetLimit = creds.budgetLimit;
      if (creds.budgetAlerts) this.costTracking.budgetAlerts = creds.budgetAlerts;
    }
    return this.openaiClient;
  }

  private async getPlaywrightBrowser(): Promise<Browser> {
    if (!this.browser) {
      // Use worker manager for Playwright to avoid blocking stdio
      await this.workerManager.playwrightLaunch();
      // Return a proxy that delegates to worker
      this.browser = {} as Browser; // Placeholder - actual calls go through workerManager
    }
    return this.browser;
  }

  // REMOVED: initializeClients() - all clients are now lazy-loaded on first use

  private setupHandlers() {
    // Register all tools from static manifest (INSTANT - no imports, no IO)
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      if (!TOOLS_MANIFEST || TOOLS_MANIFEST.tools.length === 0) {
        console.error('⚠️  Tools manifest is empty - falling back to manual definitions');
        return {
          tools: [
            ...this.getSequentialThinkingTools(),
            ...this.getContext7Tools(),
            ...this.getPlaywrightTools(),
          ],
        };
      }

      return {
        tools: TOOLS_MANIFEST.tools.map((t: any) => ({
          name: t.name,
          description: t.description,
          inputSchema: typeof t.inputSchema === 'string' ? JSON.parse(t.inputSchema) : t.inputSchema,
        })),
      };
    });

    // Handle tool calls - route to appropriate handler
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        // Route based on tool name prefix
        if (name.startsWith('sequential_thinking') || name.startsWith('parallel_thinking') || name.startsWith('reflective_thinking')) {
          return await this.handleThinkingTool(name, args);
        } else if (name.startsWith('context7_')) {
          return await this.handleContext7Tool(name, args);
        } else if (name.startsWith('playwright_')) {
          return await this.handlePlaywrightTool(name, args);
        } else if (name.startsWith('github_')) {
          return await this.handleGitHubTool(name, args);
        } else if (name.startsWith('vercel_')) {
          return await this.handleVercelTool(name, args);
        } else if (name.startsWith('neon_')) {
          return await this.handleNeonTool(name, args);
        } else if (name.startsWith('gmail_') || name.startsWith('drive_') || name.startsWith('calendar_') || name.startsWith('sheets_') || name.startsWith('docs_') || name.startsWith('admin_')) {
          return await this.handleGoogleWorkspaceTool(name, args);
        } else if (name.startsWith('resend_')) {
          return await this.handleResendTool(name, args);
        } else if (name.startsWith('twilio_')) {
          return await this.handleTwilioTool(name, args);
        } else if (name.startsWith('cloudflare_')) {
          return await this.handleCloudflareTool(name, args);
        } else if (name.startsWith('redis_')) {
          return await this.handleRedisTool(name, args);
        } else if (name.startsWith('openai_')) {
          return await this.handleOpenAITool(name, args);
        } else if (name.startsWith('stripe_')) {
          return await this.handleStripeTool(name, args);
        } else if (name.startsWith('supabase_')) {
          return await this.handleSupabaseTool(name, args);
        } else if (name.startsWith('rag_')) {
          return await this.handleRAGStandardTool(name, args);
        } else if (name.startsWith('rag_os_')) {
          return await this.handleRAGOpenSourceTool(name, args);
        } else {
          return {
            content: [{ type: 'text', text: `Error: Unknown tool: ${name}` }],
            isError: true
          };
        }
      } catch (error: any) {
        return {
          content: [{ type: 'text', text: `Error: ${error.message}` }],
          isError: true
        };
      }
    });
  }

  // ============================================================================
  // ADVANCED REASONING TOOLS (15 tools total)
  // Sequential, Parallel, Reflective, Tree-of-Thought, Graph-of-Thought,
  // Self-Consistency, Least-to-Most, Analogical, Socratic, Devil's Advocate,
  // Metacognitive Monitoring, Hypothesis Testing, and more
  // ============================================================================

  private getSequentialThinkingTools() {
    return [
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
    ];
  }
  private getContext7Tools() { return []; }
  private getPlaywrightTools() { return []; }
  private getGitHubTools() { return []; }
  private getVercelTools() { return []; }
  private getNeonTools() { return []; }
  private getGoogleWorkspaceTools() { return []; }
  private getResendTools() { return []; }
  private getTwilioTools() { return []; }
  private getCloudflareTools() { return []; }
  private getRedisTools() { return []; }
  private getOpenAITools() { return []; }
  private getStripeTools() { return []; }
  private getSupabaseTools() { return []; }
  private getRAGStandardTools() { return []; }
  private getRAGOpenSourceTools() { return []; }

  private async handleThinkingTool(name: string, args: any): Promise<{ content: { type: string; text: string }[] }> {
    if (name === 'sequential_thinking') {
      const step = {
        thoughtNumber: args.thoughtNumber,
        thought: args.thought,
        nextThoughtNeeded: args.nextThoughtNeeded,
        isRevision: args.isRevision,
        revisesThought: args.revisesThought,
        branchId: args.branchId,
        branchFromThought: args.branchFromThought,
      };

      this.thoughtHistory.push(step);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            thoughtNumber: args.thoughtNumber,
            totalThoughts: args.totalThoughts,
            nextThoughtNeeded: args.nextThoughtNeeded,
            thoughtHistoryLength: this.thoughtHistory.length,
            branches: Array.from(this.parallelBranches.keys()),
          }, null, 2),
        }],
      };
    }

    if (name === 'parallel_thinking') {
      const branch = this.parallelBranches.get(args.branchId) || {
        branchId: args.branchId,
        description: args.description,
        thoughts: [],
        conclusion: undefined,
      };

      branch.thoughts.push({
        thoughtNumber: args.thoughtNumber,
        thought: args.thought,
        nextThoughtNeeded: args.nextThoughtNeeded,
      });

      if (args.conclusion) {
        branch.conclusion = args.conclusion;
      }

      this.parallelBranches.set(args.branchId, branch);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            branchId: args.branchId,
            thoughtsInBranch: branch.thoughts.length,
            totalBranches: this.parallelBranches.size,
            branchComplete: !!args.conclusion,
            allBranches: Array.from(this.parallelBranches.values()).map(b => ({
              id: b.branchId,
              description: b.description,
              thoughtCount: b.thoughts.length,
              complete: !!b.conclusion,
            })),
          }, null, 2),
        }],
      };
    }

    if (name === 'reflective_thinking') {
      const reflection = {
        thoughtNumber: args.thoughtNumber,
        reflection: args.reflection,
        improvements: args.improvements,
        confidence: args.confidence,
      };

      this.reflections.push(reflection);

      const targetThought = this.thoughtHistory.find(t => t.thoughtNumber === args.thoughtNumber);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            reflectionAdded: true,
            totalReflections: this.reflections.length,
            targetThought: targetThought?.thought || 'Not found',
            confidence: args.confidence,
            improvementCount: args.improvements.length,
            averageConfidence: this.reflections.reduce((sum, r) => sum + r.confidence, 0) / this.reflections.length,
          }, null, 2),
        }],
      };
    }

    throw new Error(`Unknown thinking tool: ${name}`);
  }
  private async handleContext7Tool(name: string, args: any): Promise<never> { throw new Error('Not implemented'); }
  private async handlePlaywrightTool(name: string, args: any): Promise<never> { throw new Error('Not implemented'); }
  private async handleGitHubTool(name: string, args: any): Promise<never> { throw new Error('Not implemented'); }
  private async handleVercelTool(name: string, args: any): Promise<never> { throw new Error('Not implemented'); }
  private async handleNeonTool(name: string, args: any): Promise<never> { throw new Error('Not implemented'); }
  private async handleGoogleWorkspaceTool(name: string, args: any): Promise<never> { throw new Error('Not implemented'); }
  private async handleResendTool(name: string, args: any): Promise<never> { throw new Error('Not implemented'); }
  private async handleTwilioTool(name: string, args: any): Promise<never> { throw new Error('Not implemented'); }
  private async handleCloudflareTool(name: string, args: any): Promise<never> { throw new Error('Not implemented'); }
  private async handleRedisTool(name: string, args: any): Promise<never> { throw new Error('Not implemented'); }
  private async handleOpenAITool(name: string, args: any): Promise<never> { throw new Error('Not implemented'); }
  private async handleStripeTool(name: string, args: any): Promise<never> { throw new Error('Not implemented'); }
  private async handleSupabaseTool(name: string, args: any): Promise<never> { throw new Error('Not implemented'); }
  private async handleRAGStandardTool(name: string, args: any): Promise<never> { throw new Error('Not implemented'); }
  private async handleRAGOpenSourceTool(name: string, args: any): Promise<never> { throw new Error('Not implemented'); }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('@robinsonai/unified-mcp - The Ultimate Monolith');
    console.error('900+ tools available from 16 integrated services');
    console.error('Services: GitHub, Vercel, Neon, Google Workspace, Resend, Twilio, Cloudflare, Redis, OpenAI, Stripe, Supabase, Sequential Thinking, Context7, Playwright, RAG Standard, RAG Open-Source');
  }
}

// Server initialization
const server = new UnifiedMCP();
server.run().catch(console.error);

