/**
 * Tool Indexer
 * 
 * Indexes all tools from Robinson's Toolkit for fast discovery.
 */

import { DatabaseManager } from './database.js';

export interface ToolDefinition {
  name: string;
  server: string;
  category: string;
  description: string;
  keywords: string[];
  useCases: string[];
}

export class ToolIndexer {
  private db: DatabaseManager;

  constructor(db: DatabaseManager) {
    this.db = db;
  }

  /**
   * Index all tools from Robinson's Toolkit
   */
  async indexAllTools(): Promise<void> {
    // GitHub tools (199 tools)
    this.indexGitHubTools();
    
    // Vercel tools (150 tools)
    this.indexVercelTools();
    
    // Neon tools (145 tools)
    this.indexNeonTools();
    
    // Stripe tools (100 tools)
    this.indexStripeTools();
    
    // Supabase tools (80 tools)
    this.indexSupabaseTools();
    
    // Other tools
    this.indexOtherTools();
  }

  private indexGitHubTools(): void {
    const categories = [
      { category: 'repositories', count: 25, keywords: ['repo', 'create', 'delete', 'update', 'list'] },
      { category: 'branches', count: 20, keywords: ['branch', 'merge', 'protect', 'delete'] },
      { category: 'commits', count: 15, keywords: ['commit', 'compare', 'status', 'history'] },
      { category: 'issues', count: 25, keywords: ['issue', 'bug', 'feature', 'label', 'assign'] },
      { category: 'pull-requests', count: 35, keywords: ['pr', 'review', 'merge', 'approve', 'comment'] },
      { category: 'workflows', count: 25, keywords: ['action', 'workflow', 'ci', 'cd', 'deploy'] },
      { category: 'releases', count: 15, keywords: ['release', 'tag', 'publish', 'asset'] },
      { category: 'content', count: 10, keywords: ['file', 'content', 'read', 'write', 'tree'] },
      { category: 'collaborators', count: 10, keywords: ['user', 'permission', 'access', 'invite'] },
      { category: 'webhooks', count: 10, keywords: ['webhook', 'event', 'notify', 'trigger'] },
      { category: 'search', count: 9, keywords: ['search', 'find', 'query', 'filter'] },
    ];

    for (const cat of categories) {
      this.db.indexTool({
        toolName: `github_${cat.category}`,
        serverName: 'github-mcp',
        category: cat.category,
        description: `GitHub ${cat.category} operations (${cat.count} tools)`,
        keywords: cat.keywords,
        useCases: [`Manage GitHub ${cat.category}`, `Automate ${cat.category} workflows`],
      });
    }
  }

  private indexVercelTools(): void {
    const categories = [
      { category: 'projects', count: 10, keywords: ['project', 'create', 'deploy', 'settings'] },
      { category: 'deployments', count: 25, keywords: ['deploy', 'build', 'preview', 'production'] },
      { category: 'domains', count: 15, keywords: ['domain', 'dns', 'ssl', 'certificate'] },
      { category: 'env-vars', count: 10, keywords: ['environment', 'variable', 'secret', 'config'] },
      { category: 'logs', count: 10, keywords: ['log', 'error', 'debug', 'monitor'] },
      { category: 'analytics', count: 10, keywords: ['analytics', 'metrics', 'performance', 'stats'] },
      { category: 'edge-config', count: 10, keywords: ['edge', 'config', 'cache', 'kv'] },
      { category: 'storage', count: 20, keywords: ['blob', 'storage', 'upload', 'download'] },
      { category: 'database', count: 15, keywords: ['postgres', 'database', 'sql', 'query'] },
      { category: 'security', count: 25, keywords: ['firewall', 'waf', 'security', 'block', 'protect'] },
    ];

    for (const cat of categories) {
      this.db.indexTool({
        toolName: `vercel_${cat.category}`,
        serverName: 'vercel-mcp',
        category: cat.category,
        description: `Vercel ${cat.category} operations (${cat.count} tools)`,
        keywords: cat.keywords,
        useCases: [`Manage Vercel ${cat.category}`, `Deploy and monitor applications`],
      });
    }
  }

  private indexNeonTools(): void {
    const categories = [
      { category: 'projects', count: 15, keywords: ['project', 'database', 'create', 'manage'] },
      { category: 'branches', count: 25, keywords: ['branch', 'clone', 'merge', 'schema'] },
      { category: 'sql', count: 20, keywords: ['sql', 'query', 'execute', 'transaction'] },
      { category: 'databases', count: 15, keywords: ['database', 'create', 'delete', 'backup'] },
      { category: 'roles', count: 10, keywords: ['role', 'user', 'permission', 'grant'] },
      { category: 'endpoints', count: 15, keywords: ['endpoint', 'compute', 'scale', 'autoscale'] },
      { category: 'monitoring', count: 20, keywords: ['monitor', 'metrics', 'performance', 'stats'] },
      { category: 'backups', count: 10, keywords: ['backup', 'restore', 'snapshot', 'recovery'] },
      { category: 'security', count: 10, keywords: ['security', 'ssl', 'ip', 'firewall'] },
      { category: 'optimization', count: 5, keywords: ['optimize', 'index', 'query', 'performance'] },
    ];

    for (const cat of categories) {
      this.db.indexTool({
        toolName: `neon_${cat.category}`,
        serverName: 'neon-mcp',
        category: cat.category,
        description: `Neon ${cat.category} operations (${cat.count} tools)`,
        keywords: cat.keywords,
        useCases: [`Manage Neon ${cat.category}`, `Database operations and optimization`],
      });
    }
  }

  private indexStripeTools(): void {
    const categories = [
      { category: 'customers', count: 15, keywords: ['customer', 'user', 'create', 'update'] },
      { category: 'subscriptions', count: 20, keywords: ['subscription', 'plan', 'billing', 'recurring'] },
      { category: 'payments', count: 20, keywords: ['payment', 'charge', 'refund', 'invoice'] },
      { category: 'products', count: 10, keywords: ['product', 'price', 'catalog', 'sku'] },
      { category: 'webhooks', count: 10, keywords: ['webhook', 'event', 'notify', 'listen'] },
      { category: 'disputes', count: 5, keywords: ['dispute', 'chargeback', 'fraud', 'review'] },
      { category: 'payouts', count: 10, keywords: ['payout', 'transfer', 'balance', 'bank'] },
      { category: 'reporting', count: 10, keywords: ['report', 'analytics', 'revenue', 'metrics'] },
    ];

    for (const cat of categories) {
      this.db.indexTool({
        toolName: `stripe_${cat.category}`,
        serverName: 'stripe-mcp',
        category: cat.category,
        description: `Stripe ${cat.category} operations (${cat.count} tools)`,
        keywords: cat.keywords,
        useCases: [`Manage Stripe ${cat.category}`, `Payment processing and billing`],
      });
    }
  }

  private indexSupabaseTools(): void {
    const categories = [
      { category: 'auth', count: 20, keywords: ['auth', 'user', 'login', 'signup', 'session'] },
      { category: 'database', count: 25, keywords: ['database', 'table', 'query', 'rpc'] },
      { category: 'storage', count: 15, keywords: ['storage', 'bucket', 'upload', 'download'] },
      { category: 'realtime', count: 10, keywords: ['realtime', 'subscribe', 'broadcast', 'presence'] },
      { category: 'functions', count: 10, keywords: ['function', 'edge', 'serverless', 'invoke'] },
    ];

    for (const cat of categories) {
      this.db.indexTool({
        toolName: `supabase_${cat.category}`,
        serverName: 'supabase-mcp',
        category: cat.category,
        description: `Supabase ${cat.category} operations (${cat.count} tools)`,
        keywords: cat.keywords,
        useCases: [`Manage Supabase ${cat.category}`, `Backend operations`],
      });
    }
  }

  private indexOtherTools(): void {
    // Resend (60 tools)
    this.db.indexTool({
      toolName: 'resend_emails',
      serverName: 'resend-mcp',
      category: 'email',
      description: 'Resend email operations (60 tools)',
      keywords: ['email', 'send', 'template', 'smtp'],
      useCases: ['Send transactional emails', 'Email campaigns'],
    });

    // Twilio (70 tools)
    this.db.indexTool({
      toolName: 'twilio_messaging',
      serverName: 'twilio-mcp',
      category: 'messaging',
      description: 'Twilio SMS/voice operations (70 tools)',
      keywords: ['sms', 'voice', 'call', 'message'],
      useCases: ['Send SMS', 'Make phone calls', 'Voice notifications'],
    });

    // Cloudflare (50 tools)
    this.db.indexTool({
      toolName: 'cloudflare_dns',
      serverName: 'cloudflare-mcp',
      category: 'dns',
      description: 'Cloudflare DNS/domains operations (50 tools)',
      keywords: ['dns', 'domain', 'cloudflare', 'cdn'],
      useCases: ['Manage DNS records', 'Domain configuration'],
    });

    // Redis (40 tools)
    this.db.indexTool({
      toolName: 'redis_cache',
      serverName: 'redis-mcp',
      category: 'cache',
      description: 'Redis caching operations (40 tools)',
      keywords: ['redis', 'cache', 'key', 'value'],
      useCases: ['Cache data', 'Session storage', 'Pub/sub'],
    });

    // OpenAI (30 tools)
    this.db.indexTool({
      toolName: 'openai_api',
      serverName: 'openai-mcp',
      category: 'ai',
      description: 'OpenAI API operations (30 tools)',
      keywords: ['openai', 'gpt', 'ai', 'completion'],
      useCases: ['Generate text', 'AI completions'],
    });

    // Context7 (3 tools)
    this.db.indexTool({
      toolName: 'context7_docs',
      serverName: 'context7-mcp',
      category: 'documentation',
      description: 'Context7 documentation retrieval (3 tools)',
      keywords: ['docs', 'documentation', 'library', 'api'],
      useCases: ['Fetch library documentation', 'API references'],
    });

    // Playwright (78 tools)
    this.db.indexTool({
      toolName: 'playwright_browser',
      serverName: 'playwright-mcp',
      category: 'automation',
      description: 'Playwright browser automation (78 tools)',
      keywords: ['browser', 'automation', 'test', 'scrape'],
      useCases: ['Browser automation', 'Web scraping', 'E2E testing'],
    });
  }

  /**
   * Search for tools
   */
  searchTools(query: string, limit: number = 10): any[] {
    return this.db.searchTools(query, limit);
  }

  /**
   * Get tools by category
   */
  getToolsByCategory(category: string): any[] {
    return this.db.getToolsByCategory(category);
  }

  /**
   * Get tools by server
   */
  getToolsByServer(serverName: string): any[] {
    return this.db.getToolsByServer(serverName);
  }
}

