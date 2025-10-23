/**
 * Supabase Client Wrapper
 * Handles authentication and API calls to Supabase
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

export class SupabaseClientWrapper {
  private supabase: SupabaseClient | null = null;
  private supabaseUrl: string | null = null;
  private supabaseKey: string | null = null;

  constructor() {
    this.supabaseUrl = process.env.SUPABASE_URL || null;
    this.supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || null;
    
    if (this.supabaseUrl && this.supabaseKey) {
      this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
      console.error('[Supabase MCP] ✅ Initialized with URL and key');
    } else {
      console.error('[Supabase MCP] ⚠️  No SUPABASE_URL or SUPABASE_ANON_KEY found - tools will be disabled');
      console.error('[Supabase MCP] ℹ️  Set SUPABASE_URL and SUPABASE_ANON_KEY (or SUPABASE_SERVICE_ROLE_KEY) environment variables');
    }
  }

  isConfigured(): boolean {
    return this.supabase !== null;
  }

  getClient(): SupabaseClient {
    if (!this.supabase) {
      throw new Error('Supabase client not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables.');
    }
    return this.supabase;
  }

  /**
   * Helper to handle Supabase API errors gracefully
   */
  async handleSupabaseCall<T>(operation: () => Promise<{ data: T | null; error: any }>): Promise<T> {
    if (!this.supabase) {
      throw new Error('Supabase client not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables.');
    }

    try {
      const { data, error } = await operation();
      
      if (error) {
        throw new Error(`Supabase error: ${error.message || JSON.stringify(error)}`);
      }
      
      if (data === null) {
        throw new Error('Supabase returned null data');
      }
      
      return data;
    } catch (error: any) {
      throw new Error(`Supabase operation failed: ${error.message || 'Unknown error'}`);
    }
  }
}

