/**
 * Lazy Loader for Robinson's Toolkit
 * 
 * Only loads integrations when their env vars are present
 * Exposes meta-tools by default, loads 900+ tools on demand
 */

export interface Integration {
  name: string;
  envVars: string[];
  toolCount: number;
  status: 'available' | 'missing_credentials' | 'disabled';
  missingVars?: string[];
}

export class LazyLoader {
  private loadedIntegrations: Set<string> = new Set();
  
  /**
   * Get all available integrations and their status
   */
  getIntegrations(): Integration[] {
    return [
      {
        name: 'github',
        envVars: ['GITHUB_TOKEN'],
        toolCount: 200,
        status: this.checkEnvVars(['GITHUB_TOKEN']),
        missingVars: this.getMissingVars(['GITHUB_TOKEN'])
      },
      {
        name: 'vercel',
        envVars: ['VERCEL_TOKEN'],
        toolCount: 150,
        status: this.checkEnvVars(['VERCEL_TOKEN']),
        missingVars: this.getMissingVars(['VERCEL_TOKEN'])
      },
      {
        name: 'neon',
        envVars: ['NEON_API_KEY'],
        toolCount: 100,
        status: this.checkEnvVars(['NEON_API_KEY']),
        missingVars: this.getMissingVars(['NEON_API_KEY'])
      },
      {
        name: 'stripe',
        envVars: ['STRIPE_SECRET_KEY'],
        toolCount: 80,
        status: this.checkEnvVars(['STRIPE_SECRET_KEY']),
        missingVars: this.getMissingVars(['STRIPE_SECRET_KEY'])
      },
      {
        name: 'supabase',
        envVars: ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'],
        toolCount: 70,
        status: this.checkEnvVars(['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']),
        missingVars: this.getMissingVars(['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'])
      },
      {
        name: 'twilio',
        envVars: ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN'],
        toolCount: 60,
        status: this.checkEnvVars(['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN']),
        missingVars: this.getMissingVars(['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN'])
      },
      {
        name: 'redis',
        envVars: ['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN'],
        toolCount: 50,
        status: this.checkEnvVars(['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN']),
        missingVars: this.getMissingVars(['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN'])
      },
      {
        name: 'openai',
        envVars: ['OPENAI_API_KEY'],
        toolCount: 40,
        status: this.checkEnvVars(['OPENAI_API_KEY']),
        missingVars: this.getMissingVars(['OPENAI_API_KEY'])
      },
      {
        name: 'playwright',
        envVars: [], // No env vars needed
        toolCount: 50,
        status: 'available',
        missingVars: []
      },
      {
        name: 'context7',
        envVars: [], // No env vars needed
        toolCount: 30,
        status: 'available',
        missingVars: []
      },
      {
        name: 'sequential-thinking',
        envVars: [], // No env vars needed
        toolCount: 4,
        status: 'available',
        missingVars: []
      },
      {
        name: 'cloudflare',
        envVars: ['CLOUDFLARE_API_TOKEN'],
        toolCount: 78,
        status: this.checkEnvVars(['CLOUDFLARE_API_TOKEN']),
        missingVars: this.getMissingVars(['CLOUDFLARE_API_TOKEN'])
      }
    ];
  }

  /**
   * Check if all required env vars are present
   */
  private checkEnvVars(vars: string[]): 'available' | 'missing_credentials' {
    if (vars.length === 0) return 'available';
    return vars.every(v => process.env[v]) ? 'available' : 'missing_credentials';
  }

  /**
   * Get list of missing env vars
   */
  private getMissingVars(vars: string[]): string[] {
    return vars.filter(v => !process.env[v]);
  }

  /**
   * Get only available integrations (with credentials)
   */
  getAvailableIntegrations(): Integration[] {
    return this.getIntegrations().filter(i => i.status === 'available');
  }

  /**
   * Load an integration's tools
   */
  loadIntegration(name: string): boolean {
    const integration = this.getIntegrations().find(i => i.name === name);
    
    if (!integration) {
      return false;
    }

    if (integration.status !== 'available') {
      return false;
    }

    this.loadedIntegrations.add(name);
    return true;
  }

  /**
   * Check if integration is loaded
   */
  isLoaded(name: string): boolean {
    return this.loadedIntegrations.has(name);
  }

  /**
   * Get diagnostic report
   */
  diagnoseEnvironment(): {
    available: Integration[];
    missing: Integration[];
    totalTools: number;
    availableTools: number;
  } {
    const integrations = this.getIntegrations();
    const available = integrations.filter(i => i.status === 'available');
    const missing = integrations.filter(i => i.status === 'missing_credentials');

    return {
      available,
      missing,
      totalTools: integrations.reduce((sum, i) => sum + i.toolCount, 0),
      availableTools: available.reduce((sum, i) => sum + i.toolCount, 0)
    };
  }
}

