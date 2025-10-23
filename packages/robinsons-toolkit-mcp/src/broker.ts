/**
 * MCP Broker - Spawns and manages integration MCP servers on demand
 * 
 * Architecture:
 * - Lazy worker spawning (only start when needed)
 * - Connection pooling (max 6 active workers)
 * - Idle eviction (kill workers after 5 min idle)
 * - Timeout protection (60s per tool call)
 * - Auto-restart on crash
 * 
 * Cost Optimization:
 * - Workers only consume memory when active
 * - Idle workers are killed to free resources
 * - Virtual catalog available instantly (no spawning needed)
 */

import { spawn, ChildProcess } from 'child_process';
import { createInterface } from 'readline';

interface WorkerConfig {
  name: string;
  command: string;
  args: string[];
  env?: Record<string, string>;
  toolCount: number;
  categories: string[];
}

interface ActiveWorker {
  name: string;
  process: ChildProcess;
  lastUsed: number;
  tools: any[];
  requestId: number;
  pendingRequests: Map<number, { resolve: Function; reject: Function; timeout: NodeJS.Timeout }>;
  stdin: any;
  stdout: any;
}

export class MCPBroker {
  private workers: Map<string, ActiveWorker> = new Map();
  private workerConfigs: Map<string, WorkerConfig> = new Map();
  private maxActive: number;
  private idleSeconds: number;
  private toolTimeout: number;
  private prewarmServers: string[];
  private evictionTimer?: NodeJS.Timeout;

  constructor() {
    this.maxActive = parseInt(process.env.RTK_MAX_ACTIVE || '6', 10);
    this.idleSeconds = parseInt(process.env.RTK_IDLE_SECS || '300', 10);
    this.toolTimeout = parseInt(process.env.RTK_TOOL_TIMEOUT_MS || '60000', 10);
    this.prewarmServers = (process.env.RTK_PREWARM || '').split(',').filter(Boolean);

    this.loadWorkerConfigs();
    this.startEvictionTimer();
  }

  /**
   * Load worker configurations for all integration servers
   */
  private loadWorkerConfigs(): void {
    // GitHub MCP
    this.workerConfigs.set('github-mcp', {
      name: 'github-mcp',
      command: 'npx',
      args: ['github-mcp'],
      env: { GITHUB_TOKEN: process.env.GITHUB_TOKEN || '' },
      toolCount: 199,
      categories: ['repositories', 'branches', 'commits', 'issues', 'pull-requests', 'workflows', 'releases'],
    });

    // Vercel MCP
    this.workerConfigs.set('vercel-mcp', {
      name: 'vercel-mcp',
      command: 'npx',
      args: ['vercel-mcp'],
      env: { VERCEL_TOKEN: process.env.VERCEL_TOKEN || '' },
      toolCount: 150,
      categories: ['projects', 'deployments', 'domains', 'env-vars', 'logs', 'analytics'],
    });

    // Neon MCP
    this.workerConfigs.set('neon-mcp', {
      name: 'neon-mcp',
      command: 'npx',
      args: ['neon-mcp'],
      env: { NEON_API_KEY: process.env.NEON_API_KEY || '' },
      toolCount: 145,
      categories: ['projects', 'branches', 'sql', 'databases', 'roles', 'endpoints'],
    });

    // Playwright MCP
    this.workerConfigs.set('playwright-mcp', {
      name: 'playwright-mcp',
      command: 'npx',
      args: ['playwright-mcp'],
      toolCount: 42,
      categories: ['browser', 'navigation', 'screenshots', 'testing'],
    });

    // Stripe MCP
    this.workerConfigs.set('stripe-mcp', {
      name: 'stripe-mcp',
      command: 'npx',
      args: ['stripe-mcp'],
      env: { STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '' },
      toolCount: 105,
      categories: ['customers', 'subscriptions', 'payments', 'products', 'invoices'],
    });

    // Supabase MCP
    this.workerConfigs.set('supabase-mcp', {
      name: 'supabase-mcp',
      command: 'npx',
      args: ['supabase-mcp'],
      env: {
        SUPABASE_URL: process.env.SUPABASE_URL || '',
        SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || '',
      },
      toolCount: 80,
      categories: ['auth', 'database', 'storage', 'realtime', 'functions'],
    });

    // Twilio MCP
    this.workerConfigs.set('twilio-mcp', {
      name: 'twilio-mcp',
      command: 'npx',
      args: ['twilio-mcp'],
      env: {
        TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID || '',
        TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN || '',
      },
      toolCount: 60,
      categories: ['sms', 'voice', 'messaging', 'phone-numbers'],
    });

    // Resend MCP
    this.workerConfigs.set('resend-mcp', {
      name: 'resend-mcp',
      command: 'npx',
      args: ['resend-mcp'],
      env: { RESEND_API_KEY: process.env.RESEND_API_KEY || '' },
      toolCount: 15,
      categories: ['email'],
    });

    // Cloudflare MCP
    this.workerConfigs.set('cloudflare-mcp', {
      name: 'cloudflare-mcp',
      command: 'npx',
      args: ['cloudflare-mcp'],
      env: { CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN || '' },
      toolCount: 78,
      categories: ['dns', 'workers', 'kv', 'r2', 'pages'],
    });

    // OpenAI MCP
    this.workerConfigs.set('openai-mcp', {
      name: 'openai-mcp',
      command: 'npx',
      args: ['openai-mcp'],
      env: { OPENAI_API_KEY: process.env.OPENAI_API_KEY || '' },
      toolCount: 40,
      categories: ['chat', 'completions', 'embeddings', 'models'],
    });

    // Redis MCP
    this.workerConfigs.set('redis-mcp', {
      name: 'redis-mcp',
      command: 'npx',
      args: ['redis-mcp'],
      env: { REDIS_URL: process.env.REDIS_URL || '' },
      toolCount: 80,
      categories: ['cache', 'strings', 'hashes', 'lists', 'sets', 'sorted-sets'],
    });

    // Google Workspace MCP
    this.workerConfigs.set('google-workspace-mcp', {
      name: 'google-workspace-mcp',
      command: 'npx',
      args: ['google-workspace-mcp'],
      env: {
        GOOGLE_SERVICE_ACCOUNT_KEY: process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '',
        GOOGLE_USER_EMAIL: process.env.GOOGLE_USER_EMAIL || '',
      },
      toolCount: 120,
      categories: ['gmail', 'calendar', 'drive', 'sheets', 'docs'],
    });

    // Fly.io MCP
    this.workerConfigs.set('fly-mcp', {
      name: 'fly-mcp',
      command: 'npx',
      args: ['fly-mcp'],
      env: { FLY_API_TOKEN: process.env.FLY_API_TOKEN || '' },
      toolCount: 83,
      categories: ['apps', 'deployments', 'secrets', 'volumes', 'machines'],
    });
  }

  /**
   * Get full virtual tool catalog (instant - no spawning)
   */
  getVirtualCatalog(): any[] {
    const catalog: any[] = [];

    for (const [serverName, config] of this.workerConfigs.entries()) {
      for (let i = 0; i < config.toolCount; i++) {
        catalog.push({
          server: serverName,
          name: `${serverName}_tool_${i + 1}`,
          description: `Tool from ${config.name}`,
          categories: config.categories,
        });
      }
    }

    return catalog;
  }

  /**
   * Diagnose which servers have credentials configured
   */
  diagnoseEnvironment(): any {
    const available: any[] = [];
    const missing: any[] = [];

    for (const [serverName, config] of this.workerConfigs.entries()) {
      const envVars = config.env || {};
      const missingVars = Object.entries(envVars)
        .filter(([_, value]) => !value)
        .map(([key, _]) => key);

      if (missingVars.length === 0) {
        available.push({
          name: serverName,
          toolCount: config.toolCount,
          categories: config.categories,
        });
      } else {
        missing.push({
          name: serverName,
          toolCount: config.toolCount,
          missingVars,
        });
      }
    }

    return {
      available,
      missing,
      availableTools: available.reduce((sum, s) => sum + s.toolCount, 0),
      totalTools: Array.from(this.workerConfigs.values()).reduce((sum, c) => sum + c.toolCount, 0),
    };
  }

  /**
   * Get broker statistics
   */
  getBrokerStats(): any {
    const activeWorkers = Array.from(this.workers.entries()).map(([name, worker]) => ({
      name,
      idleSeconds: Math.floor((Date.now() - worker.lastUsed) / 1000),
      toolCount: worker.tools.length,
    }));

    return {
      maxActive: this.maxActive,
      activeCount: this.workers.size,
      idleTimeout: this.idleSeconds,
      toolTimeout: this.toolTimeout,
      activeWorkers,
      totalServers: this.workerConfigs.size,
    };
  }

  /**
   * Start eviction timer to kill idle workers
   */
  private startEvictionTimer(): void {
    this.evictionTimer = setInterval(() => {
      const now = Date.now();
      const idleThreshold = this.idleSeconds * 1000;

      for (const [name, worker] of this.workers.entries()) {
        if (now - worker.lastUsed > idleThreshold) {
          console.error(`[Broker] Evicting idle worker: ${name}`);
          this.killWorker(name);
        }
      }
    }, 60000); // Check every minute
  }

  /**
   * Kill a worker process
   */
  private killWorker(name: string): void {
    const worker = this.workers.get(name);
    if (worker) {
      worker.process.kill();
      this.workers.delete(name);
    }
  }

  /**
   * Ensure a server is running (spawn if needed)
   */
  private async ensureServer(serverName: string): Promise<ActiveWorker> {
    // If already running, update last used and return
    if (this.workers.has(serverName)) {
      const worker = this.workers.get(serverName)!;
      worker.lastUsed = Date.now();
      return worker;
    }

    // Check if we need to evict LRU worker
    if (this.workers.size >= this.maxActive) {
      this.evictLRU();
    }

    // Spawn new worker
    return this.spawnWorker(serverName);
  }

  /**
   * Evict least recently used worker
   */
  private evictLRU(): void {
    let oldestName: string | null = null;
    let oldestTime = Date.now();

    for (const [name, worker] of this.workers.entries()) {
      if (worker.lastUsed < oldestTime) {
        oldestTime = worker.lastUsed;
        oldestName = name;
      }
    }

    if (oldestName) {
      console.error(`[Broker] Evicting LRU worker: ${oldestName}`);
      this.killWorker(oldestName);
    }
  }

  /**
   * Spawn a new worker process
   */
  private async spawnWorker(serverName: string): Promise<ActiveWorker> {
    const config = this.workerConfigs.get(serverName);
    if (!config) {
      throw new Error(`Unknown server: ${serverName}`);
    }

    console.error(`[Broker] Spawning worker: ${serverName}`);

    const childProcess = spawn(config.command, config.args, {
      env: { ...process.env, ...config.env },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    const worker: ActiveWorker = {
      name: serverName,
      process: childProcess,
      lastUsed: Date.now(),
      tools: [],
      requestId: 1,
      pendingRequests: new Map(),
      stdin: childProcess.stdin,
      stdout: childProcess.stdout,
    };

    // Set up stdout reader
    const readline = createInterface({ input: childProcess.stdout });
    readline.on('line', (line) => {
      try {
        const response = JSON.parse(line);
        if (response.id && worker.pendingRequests.has(response.id)) {
          const pending = worker.pendingRequests.get(response.id)!;
          clearTimeout(pending.timeout);
          worker.pendingRequests.delete(response.id);
          pending.resolve(response.result);
        }
      } catch (err) {
        // Ignore non-JSON lines (stderr, logs, etc.)
      }
    });

    // Handle process exit
    childProcess.on('exit', (code: number | null) => {
      console.error(`[Broker] Worker ${serverName} exited with code ${code}`);
      this.workers.delete(serverName);
    });

    this.workers.set(serverName, worker);

    // Initialize the worker (send initialize request)
    await this.sendRequest(worker, 'initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'robinsons-toolkit-broker', version: '1.0.0' },
    });

    // List tools
    const toolsResponse = await this.sendRequest(worker, 'tools/list', {});
    worker.tools = toolsResponse.tools || [];

    return worker;
  }

  /**
   * Send JSON-RPC request to worker
   */
  private async sendRequest(worker: ActiveWorker, method: string, params: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const id = worker.requestId++;
      const request = {
        jsonrpc: '2.0',
        id,
        method,
        params,
      };

      const timeout = setTimeout(() => {
        worker.pendingRequests.delete(id);
        reject(new Error(`Request timeout: ${method}`));
      }, this.toolTimeout);

      worker.pendingRequests.set(id, { resolve, reject, timeout });

      worker.stdin.write(JSON.stringify(request) + '\n');
    });
  }

  /**
   * Route a tool call to the appropriate worker
   */
  async brokerCall(params: { server: string; tool: string; args: any }): Promise<any> {
    const worker = await this.ensureServer(params.server);

    const result = await this.sendRequest(worker, 'tools/call', {
      name: params.tool,
      arguments: params.args,
    });

    return result;
  }

  /**
   * Shutdown all workers
   */
  shutdown(): void {
    if (this.evictionTimer) {
      clearInterval(this.evictionTimer);
    }

    for (const name of this.workers.keys()) {
      this.killWorker(name);
    }
  }
}

