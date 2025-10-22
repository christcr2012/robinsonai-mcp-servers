/**
 * Centralized Auth Broker
 * 
 * Manages authentication and secrets for all integrated services.
 * Provides a single interface for credential storage and retrieval.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

export interface ServiceCredentials {
  github?: {
    token: string;
  };
  vercel?: {
    token: string;
  };
  neon?: {
    apiKey: string;
  };
  google?: {
    serviceAccountKey: string;
    userEmail: string;
  };
  resend?: {
    apiKey: string;
  };
  twilio?: {
    accountSid: string;
    authToken: string;
  };
  cloudflare?: {
    apiToken: string;
  };
  redis?: {
    url: string;
  };
  openai?: {
    apiKey: string;
    budgetLimit?: number;
    budgetAlerts?: number[];
  };
  stripe?: {
    apiKey: string;
  };
  supabase?: {
    url: string;
    key: string;
  };
  context7?: {
    apiKey?: string;
  };
  rag?: {
    postgresHost?: string;
    postgresDb?: string;
    postgresUser?: string;
    postgresPassword?: string;
    postgresPort?: number;
  };
}

export class AuthBroker {
  private credentials: ServiceCredentials = {};
  private credentialsPath: string;

  constructor() {
    // Store credentials in user's home directory
    const configDir = join(homedir(), '.unified-mcp');
    this.credentialsPath = join(configDir, 'credentials.json');

    // Load credentials from environment variables (primary source)
    this.loadFromEnvironment();

    // Load from file if exists (fallback)
    if (existsSync(this.credentialsPath)) {
      try {
        const fileData = JSON.parse(readFileSync(this.credentialsPath, 'utf-8'));
        // Merge with env vars (env vars take precedence)
        this.credentials = { ...fileData, ...this.credentials };
      } catch (error) {
        console.error('Failed to load credentials file:', error);
      }
    }
  }

  /**
   * Load credentials from environment variables
   */
  private loadFromEnvironment(): void {
    // GitHub
    const githubToken = process.env.GITHUB_PERSONAL_ACCESS_TOKEN || process.env.GITHUB_TOKEN;
    if (githubToken) {
      this.credentials.github = { token: githubToken };
    }

    // Vercel
    const vercelToken = process.env.VERCEL_TOKEN || process.env.VERCEL_ACCESS_TOKEN;
    if (vercelToken) {
      this.credentials.vercel = { token: vercelToken };
    }

    // Neon
    const neonApiKey = process.env.NEON_API_KEY;
    if (neonApiKey) {
      this.credentials.neon = { apiKey: neonApiKey };
    }

    // Google Workspace
    const googleServiceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    const googleUserEmail = process.env.GOOGLE_USER_EMAIL;
    if (googleServiceAccountKey && googleUserEmail) {
      this.credentials.google = {
        serviceAccountKey: googleServiceAccountKey,
        userEmail: googleUserEmail,
      };
    }

    // Resend
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
      this.credentials.resend = { apiKey: resendApiKey };
    }

    // Twilio
    const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
    if (twilioAccountSid && twilioAuthToken) {
      this.credentials.twilio = {
        accountSid: twilioAccountSid,
        authToken: twilioAuthToken,
      };
    }

    // Cloudflare
    const cloudflareApiToken = process.env.CLOUDFLARE_API_TOKEN;
    if (cloudflareApiToken) {
      this.credentials.cloudflare = { apiToken: cloudflareApiToken };
    }

    // Redis
    const redisUrl = process.env.REDIS_URL;
    if (redisUrl) {
      this.credentials.redis = { url: redisUrl };
    }

    // OpenAI
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (openaiApiKey) {
      const budgetLimit = parseFloat(process.env.OPENAI_BUDGET_LIMIT || '0');
      const budgetAlerts = (process.env.OPENAI_BUDGET_ALERTS || '')
        .split(',')
        .map(Number)
        .filter(n => !isNaN(n));
      
      this.credentials.openai = {
        apiKey: openaiApiKey,
        budgetLimit: budgetLimit || undefined,
        budgetAlerts: budgetAlerts.length > 0 ? budgetAlerts : undefined,
      };
    }

    // Stripe
    const stripeApiKey = process.env.STRIPE_API_KEY || process.env.STRIPE_SECRET_KEY;
    if (stripeApiKey) {
      this.credentials.stripe = { apiKey: stripeApiKey };
    }

    // Supabase
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;
    if (supabaseUrl && supabaseKey) {
      this.credentials.supabase = { url: supabaseUrl, key: supabaseKey };
    }

    // Context7
    const context7ApiKey = process.env.CONTEXT7_API_KEY;
    if (context7ApiKey) {
      this.credentials.context7 = { apiKey: context7ApiKey };
    }

    // RAG PostgreSQL
    const ragDbHost = process.env.RAG_POSTGRES_HOST || process.env.NEON_HOST;
    const ragDbName = process.env.RAG_POSTGRES_DB || process.env.NEON_DATABASE;
    const ragDbUser = process.env.RAG_POSTGRES_USER || process.env.NEON_USER;
    const ragDbPassword = process.env.RAG_POSTGRES_PASSWORD || process.env.NEON_PASSWORD;
    const ragDbPort = parseInt(process.env.RAG_POSTGRES_PORT || process.env.NEON_PORT || '5432');

    if (ragDbHost && ragDbName && ragDbUser && ragDbPassword) {
      this.credentials.rag = {
        postgresHost: ragDbHost,
        postgresDb: ragDbName,
        postgresUser: ragDbUser,
        postgresPassword: ragDbPassword,
        postgresPort: ragDbPort,
      };
    }
  }

  /**
   * Get credentials for a specific service
   */
  getCredentials<K extends keyof ServiceCredentials>(service: K): ServiceCredentials[K] | null {
    return this.credentials[service] || null;
  }

  /**
   * Get a specific secret value
   */
  getSecret(service: keyof ServiceCredentials, key: string): string | number | undefined {
    const creds = this.credentials[service];
    if (!creds) return undefined;
    return (creds as any)[key];
  }

  /**
   * Check if a service has credentials configured
   */
  hasCredentials(service: keyof ServiceCredentials): boolean {
    return !!this.credentials[service];
  }

  /**
   * Set credentials for a service (runtime only, not persisted)
   */
  setCredentials<K extends keyof ServiceCredentials>(
    service: K,
    credentials: ServiceCredentials[K]
  ): void {
    this.credentials[service] = credentials;
  }

  /**
   * Save credentials to file (optional, for persistence)
   * Note: In production, use a proper secret manager instead
   */
  saveToFile(): void {
    try {
      const configDir = join(homedir(), '.unified-mcp');
      if (!existsSync(configDir)) {
        require('fs').mkdirSync(configDir, { recursive: true });
      }
      writeFileSync(this.credentialsPath, JSON.stringify(this.credentials, null, 2));
    } catch (error) {
      console.error('Failed to save credentials file:', error);
    }
  }

  /**
   * List all configured services
   */
  listConfiguredServices(): string[] {
    return Object.keys(this.credentials);
  }
}

